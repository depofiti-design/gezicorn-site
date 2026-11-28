"""Dublaj kalite kontrolü (yt-dub2.py çıktısı için).
Kullanım: python yt-dub-qa.py <klasör> <lang> [--model small|medium]
- dub_LANG.m4a whisper ile kelime zamanlarıyla yazıya dökülür.
- Her cue için o zaman aralığında duyulan metin, hedef metinle karşılaştırılır (benzerlik < 0.55 => YUTMA/EKSİK şüphesi).
- Konuşma hızı (karakter/sn) dilin medyanının 1.35 katından fazlaysa => ÇOK HIZLI.
- Sonuç: qa_LANG.json + özet. PASS koşulu: işaretli cue oranı < %5 ve hız ihlali < %3.
"""
import difflib, json, os, re, subprocess, sys
import numpy as np

def ffmpeg():
    p = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.1-full_build', 'bin', 'ffmpeg.exe')
    return p if os.path.exists(p) else 'ffmpeg'

def norm(s):
    s = s.lower()
    s = re.sub(r'[^\w؀-ۿ一-鿿]+', '', s)
    return s

def main():
    d, lang = sys.argv[1], sys.argv[2]
    model = sys.argv[sys.argv.index('--model') + 1] if '--model' in sys.argv else 'small'
    from faster_whisper import WhisperModel
    raw = subprocess.run([ffmpeg(), '-v', 'error', '-i', os.path.join(d, f'dub_{lang}.m4a'), '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    wl = {'zh': 'zh'}.get(lang, lang)
    segs, _ = WhisperModel(model, device='cpu', compute_type='int8').transcribe(audio, language=wl, word_timestamps=True, vad_filter=True)
    words = [(w.start, w.end, w.word) for s in segs for w in (s.words or [])]
    cues = json.load(open(os.path.join(d, f'final_{lang}.json'), encoding='utf8'))
    rates = [len(norm(c['t'])) / max(0.3, c['end'] - c['start']) for c in cues]
    med = float(np.median(rates))
    flags = []
    for c, r in zip(cues, rates):
        heard = ''.join(w[2] for w in words if w[0] >= c['start'] - 0.35 and w[1] <= c['end'] + 0.35)
        sim = difflib.SequenceMatcher(None, norm(c['t']), norm(heard)).ratio()
        f = []
        if sim < 0.55: f.append(f'YUTMA/EKSİK sim={sim:.2f}')
        if r > med * 1.35: f.append(f'ÇOK HIZLI {r:.1f}c/s (medyan {med:.1f})')
        if c.get('tempo', 1) > 1.08: f.append(f'hızlandırma {c["tempo"]}x')
        if f: flags.append({'i': c['i'], 'start': c['start'], 'flags': f, 'text': c['t'][:90], 'heard': heard[:90]})
    bad = len(flags) / max(1, len(cues))
    fast = sum(1 for x in flags if any('HIZLI' in y for y in x['flags'])) / max(1, len(cues))
    res = {'lang': lang, 'cues': len(cues), 'flagged': len(flags), 'flagged_pct': round(bad * 100, 1), 'fast_pct': round(fast * 100, 1),
           'PASS': bad < 0.05 and fast < 0.03, 'flags': flags}
    json.dump(res, open(os.path.join(d, f'qa_{lang}.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in res.items() if k != 'flags'}, ensure_ascii=False))
    for x in flags[:12]: print(' ', x['start'], x['flags'], '|', x['text'][:60], '|| duyulan:', x['heard'][:60])

if __name__ == '__main__':
    main()
