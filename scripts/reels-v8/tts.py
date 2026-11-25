"""v8 reels seslendirme: ElevenLabs with-timestamps.
Kullanım: python tts.py [reel_n ...]   (boşsa hepsi; var olan ses dosyası atlanır, --force ile yeniden)
Çıktı: img/social/manual/reels/v8-src/audio/<n>.mp3 + <n>.json (sahne aralıkları + karakter zamanları)
"""
import base64, json, os, sys, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'img', 'social', 'manual', 'reels', 'v8-src', 'audio')
VOICE = 'g8f0cja80b2A5Qs9FNMI'  # Türkçe erkek ses, v5-v7 reels ile aynı
MODEL = 'eleven_multilingual_v2'


def key():
    k = os.environ.get('ELEVENLABS_API_KEY')
    if k:
        return k.strip()
    with open(os.path.join(ROOT, 'scripts', 'elevenlabs-key.local.txt'), encoding='utf8') as f:
        return f.read().strip()


def tts(text):
    body = json.dumps({
        'text': text, 'model_id': MODEL,
        'voice_settings': {'stability': 0.45, 'similarity_boost': 0.8, 'style': 0.2, 'use_speaker_boost': True},
    }).encode()
    req = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128',
        data=body, headers={'xi-api-key': key(), 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv
    specs = json.load(open(os.path.join(os.path.dirname(__file__), 'specs.json'), encoding='utf8'))['reels']
    os.makedirs(OUT, exist_ok=True)
    for r in specs:
        if args and str(r['n']) not in args:
            continue
        mp3 = os.path.join(OUT, f"{r['n']}.mp3")
        if os.path.exists(mp3) and not force:
            print('var', r['n']); continue
        text, ranges = '', []
        for s in r['scenes']:
            if text:
                text += ' '
            a = len(text); text += s['say']; ranges.append([a, len(text)])
        d = tts(text)
        open(mp3, 'wb').write(base64.b64decode(d['audio_base64']))
        al = d['alignment']
        json.dump({'text': text, 'ranges': ranges, 'chars': al['characters'],
                   'start': al['character_start_times_seconds'], 'end': al['character_end_times_seconds']},
                  open(os.path.join(OUT, f"{r['n']}.json"), 'w', encoding='utf8'), ensure_ascii=False)
        print('ok', r['n'], len(text), 'karakter', round(al['character_end_times_seconds'][-1], 1), 'sn')


if __name__ == '__main__':
    main()
