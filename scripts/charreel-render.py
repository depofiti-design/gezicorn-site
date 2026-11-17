# -*- coding: utf-8 -*-
"""Higgsfield'de uretilen animasyonlu mini karakter klibini (ornegin Pasaport Kusu) ElevenLabs
seslendirme + zamanlamali altyazi + logo rozetiyle yayinlanabilir bir reel'e cevirir.
Gorsel stil (font, altyazi konumu/rengi, logo rozeti) img/social/manual/reels/v7-src/render_v7.py
ile ayni (reuse edilir), tek fark: arka plan Ken Burns degil, dogrudan AI videosu.
Kullanim: python charreel-render.py <video.mp4> <metin.txt> <cikti.mp4>
"""
import os, sys, json, base64, subprocess, requests

HERE = os.path.dirname(os.path.abspath(__file__))
V7_SRC = os.path.join(HERE, "..", "img", "social", "manual", "reels", "v7-src")
sys.path.insert(0, V7_SRC)
import render_v7 as rv  # noqa: E402  (F, logo_layer, sub_layer, words_from_alignment, chunks_from_words, blank, W, H, FPS, FFMPEG)

from PIL import Image

KEY_FILE = os.path.join(HERE, "elevenlabs-key.local.txt")
VOICE = "g8f0cja80b2A5Qs9FNMI"
SPEED = 1.07
TTS_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128"
SUB_STYLE = dict(font="Manrope.ttf", weight=700, fill=(255, 255, 255, 255), stroke=(17, 17, 17, 255), sw=11)


def synth(text):
    key = open(KEY_FILE, encoding="utf-8").read().strip()
    body = {
        "text": text, "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.2, "use_speaker_boost": True, "speed": SPEED},
    }
    r = requests.post(TTS_URL, headers={"xi-api-key": key, "Content-Type": "application/json"}, json=body, timeout=180)
    r.raise_for_status()
    return r.json()


def ffprobe_json(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json",
                           "-show_format", "-show_streams", path], capture_output=True, text=True)
    return json.loads(out.stdout)


def build_sub_items(width, height, words):
    scale_x, scale_y = width / rv.W, height / rv.H
    sub_items = []
    for ch in rv.chunks_from_words(words):
        text = " ".join(w["text"] for w in ch)
        img, pos = rv.sub_layer(text, SUB_STYLE)
        if (width, height) != (rv.W, rv.H):
            img = img.resize((max(1, int(img.width * scale_x)), max(1, int(img.height * scale_y))), Image.LANCZOS)
            pos = (int(pos[0] * scale_x), int(pos[1] * scale_y))
        t0 = ch[0]["start"]
        t1 = ch[-1]["end"] + 0.35
        sub_items.append((t0, t1, img, pos))
    sub_items.sort(key=lambda x: x[0])
    for i in range(len(sub_items) - 1):
        t0, t1, img, pos = sub_items[i]
        nxt = sub_items[i + 1][0]
        if t1 > nxt:
            sub_items[i] = (t0, nxt, img, pos)
    return sub_items


def composite_video(src_path, width, height, fps, nframes, sub_items, out_path):
    """src_path'teki her kareyi ham RGB olarak okuyup uzerine logo+altyazi basar, yeniden kodlar.
    render_v7.py'nin frame-pipe yontemiyle ayni (alfa kanalli ayri overlay dosyasi KULLANILMAZ,
    o yontem denendi ve overlay her seyi siyaha boguyordu, dogrudan kare-kare bindirme guvenilir)."""
    logo = rv.logo_layer((11, 27, 51), None)
    if (width, height) != (rv.W, rv.H):
        logo = logo.resize((width, height), Image.LANCZOS)

    read_cmd = [rv.FFMPEG, "-y", "-loglevel", "error", "-i", src_path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    reader = subprocess.Popen(read_cmd, stdout=subprocess.PIPE)
    frame_bytes = width * height * 3

    write_cmd = [rv.FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}",
                 "-r", str(fps), "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                 "-pix_fmt", "yuv420p", out_path]
    writer = subprocess.Popen(write_cmd, stdin=subprocess.PIPE)

    for f in range(nframes):
        raw = reader.stdout.read(frame_bytes)
        if len(raw) < frame_bytes:
            break
        t = f / fps
        frame = Image.frombuffer("RGB", (width, height), raw, "raw", "RGB", 0, 1).convert("RGBA")
        frame.alpha_composite(logo)
        for (t0, t1, img, pos) in sub_items:
            if t0 <= t < t1:
                frame.alpha_composite(img, dest=pos)
                break
        writer.stdin.write(frame.convert("RGB").tobytes())
    reader.stdout.close()
    reader.wait()
    writer.stdin.close()
    writer.wait()
    assert writer.returncode == 0, "video uretilemedi"


def render(video_path, text, out_path, trim_to_audio=True):
    tmp = os.path.join(HERE, "tmp-charreel")
    os.makedirs(tmp, exist_ok=True)

    data = synth(text)
    mp3_path = os.path.join(tmp, "narration.mp3")
    open(mp3_path, "wb").write(base64.b64decode(data["audio_base64"]))
    al = data["alignment"]
    dur = al["character_end_times_seconds"][-1] + 0.4  # kisa bir kuyruk payi
    words = rv.words_from_alignment(al, 0.0)

    probe = ffprobe_json(video_path)
    vstream = next(s for s in probe["streams"] if s["codec_type"] == "video")
    width, height = int(vstream["width"]), int(vstream["height"])
    fps_n, fps_d = (int(x) for x in vstream["r_frame_rate"].split("/"))
    fps = round(fps_n / fps_d)
    src_dur = float(probe["format"]["duration"])

    trimmed_video = os.path.join(tmp, "trimmed.mp4")
    if src_dur < dur:
        # Video seslendirmeden kisaysa son kareyi donduru uzat.
        subprocess.run([rv.FFMPEG, "-y", "-loglevel", "error", "-i", video_path,
                        "-vf", f"tpad=stop_mode=clone:stop_duration={dur - src_dur:.3f}",
                        "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", trimmed_video], check=True)
    else:
        subprocess.run([rv.FFMPEG, "-y", "-loglevel", "error", "-i", video_path, "-t", f"{dur:.3f}",
                        "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", trimmed_video], check=True)

    sub_items = build_sub_items(width, height, words)
    merged_video = os.path.join(tmp, "merged.mp4")
    nframes = int(round(dur * fps))
    composite_video(trimmed_video, width, height, fps, nframes, sub_items, merged_video)

    subprocess.run([rv.FFMPEG, "-y", "-loglevel", "error", "-i", merged_video, "-i", mp3_path,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
                    "-shortest", "-movflags", "+faststart", out_path], check=True)
    return dur


if __name__ == "__main__":
    video_path, text_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    text = open(text_path, encoding="utf-8").read().strip()
    d = render(video_path, text, out_path)
    print("ok", out_path, round(d, 2), "s")
