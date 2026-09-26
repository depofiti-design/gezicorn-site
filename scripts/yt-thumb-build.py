# Plan + Higgsfield görsel URL manifestinden küçük resimleri üretir: youtube-backup/thumbs/<videoId>.jpg
# Kullanım: python yt-thumb-build.py [--sheet C:/yol/onizleme.jpg]
import json, os, re, sys, urllib.request, urllib.error, importlib.util
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('yt_thumb', os.path.join(here, 'yt-thumb.py')); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
def fetch(url, dest):
    # Higgsfield dosya adındaki saat bilgisi kayabilir: aday saniyeleri PARALEL dene (HEAD), bulunanı indir
    from concurrent.futures import ThreadPoolExecutor
    m2 = re.search(r'_(\d{8})_(\d{6})_', url)
    cands = [url]
    if m2:
        t = m2.group(2); sec = int(t[:2]) * 3600 + int(t[2:4]) * 60 + int(t[4:])
        for d in sorted([x for x in range(-150, 150) if x], key=lambda z: (abs(z), z)):
            n = sec + d; cands.append(url.replace('_' + t + '_', '_%02d%02d%02d_' % (n // 3600, n % 3600 // 60, n % 60)))
    def head(c):
        try:
            r = urllib.request.urlopen(urllib.request.Request(c, method='HEAD'), timeout=10)
            return c if r.status == 200 else None
        except Exception: return None
    with ThreadPoolExecutor(32) as ex:
        for c in ex.map(head, cands):
            if c: urllib.request.urlretrieve(c, dest); return
    raise SystemExit('indirilemedi: ' + url)

plan = json.load(open('youtube-backup/thumb-plan.json', encoding='utf-8'))
imgs = json.load(open('youtube-backup/thumb-images.json'))
os.makedirs('youtube-backup/thumbs', exist_ok=True)
outs = []
for k, url in imgs.items():
    p = plan[int(k)]; vid = p['id']
    out = f'youtube-backup/thumbs/{vid}.jpg'
    if not os.path.exists(out):
        src = f'youtube-backup/thumbs/{vid}-bg.png'
        try:
            if not os.path.exists(src): fetch(url, src)
        except SystemExit as e:
            print('atlandı (henüz hazır değil?):', k); continue
        m.make(src, out, '|'.join(p['lines']), None)
    outs.append((out, p['lines']))
print(len(outs), 'küçük resim hazır')
if '--sheet' in sys.argv:
    from PIL import Image
    n = len(outs); cols = 3; rows = (n + cols - 1) // cols
    sh = Image.new('RGB', (cols * 640 + (cols - 1) * 8, rows * 360 + (rows - 1) * 8), (255, 255, 255))
    for i, (o, l) in enumerate(outs): sh.paste(Image.open(o).resize((640, 360)), ((i % cols) * 648, (i // cols) * 368))
    sh.save(sys.argv[sys.argv.index('--sheet') + 1], quality=85)
