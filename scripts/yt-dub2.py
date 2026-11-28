"""Kaliteli dublaj v2 (28 Kasım 2026, kullanıcı: "kayma, yutma, anlamsız hızlanma olmasın").
Kullanım: python yt-dub2.py <video.mp4> <segs.json> <tr_LANG.json> <lang> <çıktı_klasörü> [--engine edge|eleven] [--voice ID]
Akış:
  1) Her segment doğal hızda seslendirilir (baş/son sessizlik kırpılır).
  2) Kendi zaman aralığına (bir sonraki segmentin başlangıcına kadar) sığmayanlar Gemini'ye
     "anlamı ve rakamları koru, en fazla N karakter" diye TOPLU gönderilip kısaltılır (en fazla 2 tur).
  3) Hâlâ sığmayan varsa en fazla 1.12x hızlandırılır; yine taşarsa sonraki segment kayar (rapora yazılır).
  4) Çıktılar: dub_LANG.m4a (orijinal ses %10 altta), final_LANG.json (söylenen metin + gerçek zamanlar),
     sub_LANG.srt (altyazı = söylenen metin, dublajla birebir aynı zamanlama), rapor.
Kontrol için: python yt-dub-qa.py <klasör> <lang>
"""
import asyncio, hashlib, json, os, re, subprocess, sys, tempfile, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
MAX_TEMPO = 1.12
EDGE_VOICES = {'en': 'en-US-AndrewNeural', 'ru': 'ru-RU-DmitryNeural', 'es': 'es-MX-JorgeNeural', 'zh': 'zh-CN-YunxiNeural', 'ar': 'ar-SA-HamedNeural'}
LANG_NAMES = {'en': 'English', 'ru': 'Russian', 'es': 'Spanish (neutral Latin American)', 'zh': 'Simplified Chinese', 'ar': 'Modern Standard Arabic'}
GEMINI = os.path.join(os.path.expanduser('~'), '.claude', 'tools', 'gemini-ask.mjs')


def ffmpeg():
    p = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.1-full_build', 'bin', 'ffmpeg.exe')
    return p if os.path.exists(p) else 'ffmpeg'


TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse'


def decode(path, tempo=1.0):
    af = TRIM + (f',atempo={tempo:.3f}' if abs(tempo - 1) > 0.005 else '')
    raw = subprocess.run([ffmpeg(), '-v', 'error', '-i', path, '-af', af, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
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
            await edge_tts.Communicate(text, voice).save(out)
            return
        except Exception:
            if k == 3:
                raise
            await asyncio.sleep(3 * (k + 1))


def tts(text, cache, engine, voice):
    h = hashlib.md5((engine + voice + text).encode()).hexdigest()[:16]
    p = os.path.join(cache, h + '.mp3')
    if not os.path.exists(p) or os.path.getsize(p) < 500:
        if engine == 'eleven':
            eleven(text, p, voice)
        else:
            asyncio.run(edge(text, p, voice))
    return p


def shorten(lang, items):
    """items: [{i, t, max_chars, tr}] -> {i: kısa metin}"""
    if not items:
        return {}
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf8') as f:
        json.dump(items, f, ensure_ascii=False)
        fp = f.name
    prompt = (f"These are {LANG_NAMES.get(lang, lang)} dubbing lines for a Turkish travel vlog. Each line is too long to be spoken in its time slot. "
              "Rewrite each line 't' in the same language so it is at most 'max_chars' characters, as natural spoken language. "
              "Keep the core meaning and EVERY number, price and $ amount. Drop filler, repetition and minor details first. "
              "'tr' is the original Turkish for context. Output ONLY JSON: [{\"i\":0,\"t\":\"...\"}] one item per input, same order.")
    out = subprocess.run(['node', GEMINI, prompt, '--file', fp, '--json'], capture_output=True, text=True, encoding='utf8', timeout=900).stdout
    os.unlink(fp)
    try:
        return {x['i']: x['t'] for x in json.loads(re.search(r'\[.*\]', out, re.S).group(0))}
    except Exception:
        print('kısaltma yanıtı okunamadı:', out[:200])
        return {}


def srt_time(s):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{sec:02d},{ms:03d}'


def make_srt(cues, lang):
    cjk = lang in ('zh', 'ja', 'ko')
    lim = 18 if cjk else 42
    lines, n = [], 0
    for c in cues:
        text, st, en = c['t'], c['start'], c['end']
        units = list(text) if cjk else text.split()
        chunks, cur = [], []
        for u in units:
            cand = (''.join(cur + [u]) if cjk else ' '.join(cur + [u]))
            if len(cand) > lim * 2 and cur:
                chunks.append(''.join(cur) if cjk else ' '.join(cur)); cur = [u]
            else:
                cur.append(u)
        if cur:
            chunks.append(''.join(cur) if cjk else ' '.join(cur))
        tot = sum(len(x) for x in chunks) or 1
        t0 = st
        for ch in chunks:
            d = (en - st) * len(ch) / tot
            n += 1
            lines.append(f'{n}\n{srt_time(t0)} --> {srt_time(t0 + d)}\n{ch}\n')
            t0 += d
    return '\n'.join(lines)


def main():
    video, segp, trp, lang, outdir = sys.argv[1:6]
    engine = sys.argv[sys.argv.index('--engine') + 1] if '--engine' in sys.argv else 'edge'
    voice = sys.argv[sys.argv.index('--voice') + 1] if '--voice' in sys.argv else (EDGE_VOICES[lang] if engine == 'edge' else 'CwhRBWXzGAHq8TQ4Fs17')
    os.makedirs(outdir, exist_ok=True)
    cache = os.path.join(outdir, 'tts_cache'); os.makedirs(cache, exist_ok=True)
    segs = json.load(open(segp, encoding='utf8'))
    tr = {x['i']: x['t'] for x in json.loads(re.search(r'\[.*\]', open(trp, encoding='utf8').read(), re.S).group(0))}
    texts = {s['i']: (tr.get(s['i']) or '').strip() for s in segs}
    slot = {}
    for k, s in enumerate(segs):
        nxt = segs[k + 1]['start'] if k + 1 < len(segs) else s['end'] + 1.5
        slot[s['i']] = max(0.8, nxt - s['start'] - 0.12)
    shortened = 0
    for rnd in range(3):
        need = []
        for s in segs:
            t = texts[s['i']]
            if not t or not re.search(r'\w', t):
                continue
            L = len(decode(tts(t, cache, engine, voice))) / SR
            if L > slot[s['i']] * 1.08:
                need.append({'i': s['i'], 't': t, 'max_chars': max(8, int(len(t) * slot[s['i']] / L * 0.93)), 'tr': s.get('tr', '')})
        print(f'{lang} tur {rnd + 1}: sığmayan {len(need)} / {len(segs)}')
        if not need or rnd == 2:
            break
        new = shorten(lang, need)
        for i, t in new.items():
            if t and t.strip():
                texts[i] = t.strip(); shortened += 1
    raw = subprocess.run([ffmpeg(), '-v', 'error', '-i', video, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    orig = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    track = np.zeros(len(orig) + SR * 60, np.float32)
    cursor, drift, maxdrift, tempos, cues = 0.0, 0, 0.0, [], []
    for s in segs:
        t = texts[s['i']]
        if not t or not re.search(r'\w', t):
            continue
        p = tts(t, cache, engine, voice)
        a = decode(p)
        L = len(a) / SR
        tempo = 1.0
        if L > slot[s['i']]:
            tempo = min(MAX_TEMPO, L / slot[s['i']])
            a = decode(p, tempo)
        tempos.append(tempo)
        start = max(s['start'], cursor + 0.08)
        late = start - s['start']
        if late > 0.4:
            drift += 1
        maxdrift = max(maxdrift, late)
        i0 = int(start * SR)
        track[i0:i0 + len(a)] += a
        end = start + len(a) / SR
        cues.append({'i': s['i'], 'start': round(start, 3), 'end': round(end, 3), 't': t, 'tempo': round(tempo, 3)})
        cursor = end
    n = len(orig)
    mix = track[:n] + orig * 0.10
    mix = mix / max(1.0, np.abs(mix).max() / 0.95)
    out = os.path.join(outdir, f'dub_{lang}.m4a')
    subprocess.run([ffmpeg(), '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'aac', '-b:a', '160k', out], input=(mix * 32767).astype(np.int16).tobytes(), check=True)
    json.dump(cues, open(os.path.join(outdir, f'final_{lang}.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=0)
    open(os.path.join(outdir, f'sub_{lang}.srt'), 'w', encoding='utf8').write(make_srt(cues, lang))
    tp = np.array(tempos)
    rep = {'lang': lang, 'segments': len(cues), 'shortened': shortened, 'tempo_max': round(float(tp.max()), 3), 'tempo_over_1.05': int((tp > 1.05).sum()),
           'late_over_0.4s': drift, 'max_late_s': round(maxdrift, 2)}
    json.dump(rep, open(os.path.join(outdir, f'report_{lang}.json'), 'w'), indent=1)
    print(json.dumps(rep))


if __name__ == '__main__':
    main()
