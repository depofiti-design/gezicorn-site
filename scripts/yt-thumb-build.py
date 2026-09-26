# Plan + Higgsfield görsel URL manifestinden küçük resimleri üretir: youtube-backup/thumbs/<videoId>.jpg
# Kullanım: python yt-thumb-build.py [--sheet C:/yol/onizleme.jpg]
import json, os, sys, urllib.request, importlib.util
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('yt_thumb', os.path.join(here, 'yt-thumb.py')); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
plan = json.load(open('youtube-backup/thumb-plan.json', encoding='utf-8'))
imgs = json.load(open('youtube-backup/thumb-images.json'))
os.makedirs('youtube-backup/thumbs', exist_ok=True)
outs = []
for k, url in imgs.items():
    p = plan[int(k)]; vid = p['id']
    out = f'youtube-backup/thumbs/{vid}.jpg'
    if not os.path.exists(out):
        src = f'youtube-backup/thumbs/{vid}-bg.png'
        if not os.path.exists(src): urllib.request.urlretrieve(url, src)
        m.make(src, out, '|'.join(p['lines']), None)
    outs.append((out, p['lines']))
print(len(outs), 'küçük resim hazır')
if '--sheet' in sys.argv:
    from PIL import Image
    n = len(outs); cols = 3; rows = (n + cols - 1) // cols
    sh = Image.new('RGB', (cols * 640 + (cols - 1) * 8, rows * 360 + (rows - 1) * 8), (255, 255, 255))
    for i, (o, l) in enumerate(outs): sh.paste(Image.open(o).resize((640, 360)), ((i % cols) * 648, (i // cols) * 368))
    sh.save(sys.argv[sys.argv.index('--sheet') + 1], quality=85)
