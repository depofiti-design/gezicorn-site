"""YouTube çok dilli ses kanalı için dublaj üretir (Studio'dan elle yüklenir, API ses kanalı kabul etmiyor).
Kullanım: python yt-dub.py <video.mp4> <segs.json> <tr_LANG.json> <lang> <çıktı.m4a> [--engine eleven|edge] [--voice ID]
- segs.json: [{i,start,end}], tr_LANG.json: [{i,t}] (Gemini çıktısı, JSON metin içinde olabilir)
- Her segment ayrı seslendirilir, segment süresine sığmazsa en fazla 1.5x hızlandırılır, yine taşarsa bir sonraki boşluğa kayar.
- Orijinal ses %12 seviyede altta kalır (ortam sesi). Ses parçaları önbelleğe alınır (tekrar çalıştırmada kredi harcanmaz).
ElevenLabs anahtarı: ELEVENLABS_API_KEY ya da scripts/elevenlabs-key.local.txt
"""
import asyncio, json, os, re, subprocess, sys, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
EDGE_VOICES = {'en': 'en-US-AndrewNeural', 'ru': 'ru-RU-DmitryNeural', 'es': 'es-MX-JorgeNeural', 'zh': 'zh-CN-YunxiNeural', 'ar': 'ar-SA-HamedNeural', 'de': 'de-DE-ConradNeural'}


def ffmpeg():
    p = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.1-full_build', 'bin', 'ffmpeg.exe')
    return p if os.path.exists(p) else 'ffmpeg'


def decode(path, tempo=1.0):
    # baş/son sessizliği kırp (biriken kaymayı önler), gerekirse hızlandır
    trim = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse'
    af = ['-af', trim + (f',atempo={tempo:.3f}' if abs(tempo - 1) > 0.01 else '')]
    raw = subprocess.run([ffmpeg(), '-v', 'error', '-i', path, *af, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def eleven(text, out, voice):
    key = os.environ.get('ELEVENLABS_API_KEY') or open(os.path.join(HERE, 'elevenlabs-key.local.txt'), encoding='utf8').read().strip()
    body = json.dumps({'text': text, 'model_id': 'eleven_flash_v2_5', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}).encode()
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128', data=body, headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    open(out, 'wb').write(urllib.request.urlopen(req, timeout=120).read())


async def edge(text, out, voice):
    import edge_tts
    for k in range(4):
        try:
            await edge_tts.Communicate(text, voice, rate='+12%').save(out)
            return
        except Exception as e:
            if k == 3:
                raise
            await asyncio.sleep(3 * (k + 1))


def main():
    video, segp, trp, lang, outp = sys.argv[1:6]
    engine = sys.argv[sys.argv.index('--engine') + 1] if '--engine' in sys.argv else 'edge'
    voice = sys.argv[sys.argv.index('--voice') + 1] if '--voice' in sys.argv else (EDGE_VOICES.get(lang) if engine == 'edge' else 'CwhRBWXzGAHq8TQ4Fs17')
    segs = json.load(open(segp, encoding='utf8'))
    tr = {x['i']: x['t'] for x in json.loads(re.search(r'\[.*\]', open(trp, encoding='utf8').read(), re.S).group(0))}
    cache = os.path.join(os.path.dirname(os.path.abspath(outp)), f'dub_{lang}_parts'); os.makedirs(cache, exist_ok=True)
    orig = decode(video)
    track = np.zeros(len(orig) + SR * 120, np.float32)
    cursor, overruns = 0.0, 0
    for idx, s in enumerate(segs):
        text = (tr.get(s['i']) or '').strip()
        if not text or not re.search(r'\w', text):
            continue
        part = os.path.join(cache, f"{s['i']:04d}.mp3")
        if not os.path.exists(part) or os.path.getsize(part) < 500:
            if engine == 'eleven':
                eleven(text, part, voice)
            else:
                asyncio.run(edge(text, part, voice))
        a = decode(part)
        start = max(s['start'], cursor + 0.05)
        nxt = segs[idx + 1]['start'] if idx + 1 < len(segs) else s['end'] + 1.0
        avail = max(0.8, nxt - start - 0.05)
        dur = len(a) / SR
        if dur > avail:
            a = decode(part, min(1.6, dur / avail))
        if start - s['start'] > 0.5:
            overruns += 1
        i0 = int(start * SR)
        track[i0:i0 + len(a)] += a
        cursor = start + len(a) / SR
    n = len(orig)
    mix = track[:n] + orig * 0.12
    mix = mix / max(1.0, np.abs(mix).max() / 0.95)
    pcm = (mix * 32767).astype(np.int16).tobytes()
    subprocess.run([ffmpeg(), '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'aac', '-b:a', '160k', outp], input=pcm, check=True)
    print(f'{lang}: {outp} ({n / SR:.0f} sn), kayan segment {overruns}')


if __name__ == '__main__':
    main()
