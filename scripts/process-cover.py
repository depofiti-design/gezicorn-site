"""Kapak görselini indirip 1200x675 JPEG olarak ../img/covers/<slug>.jpg yazar.
Kullanım: python process-cover.py <slug> <kaynak_url_veya_dosya>
Çıktı yolu sitede https://www.gezicorn.com/img/covers/<slug>.jpg olarak yayınlanır,
Firestore'da cover_image bu URL olmalı (update-post.js ile).
"""
import io
import os
import sys
import urllib.request
from PIL import Image

slug, src = sys.argv[1], sys.argv[2]
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img', 'covers')
os.makedirs(out_dir, exist_ok=True)

if src.startswith('http'):
    data = urllib.request.urlopen(urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0'})).read()
    im = Image.open(io.BytesIO(data))
else:
    im = Image.open(src)

im = im.convert('RGB')
w, h = im.size
target = 16 / 9
if w / h > target:
    nw = int(h * target)
    im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
else:
    nh = int(w / target)
    im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
im = im.resize((1200, 675), Image.LANCZOS)
# çok karanlık görselleri hafifçe aç
from PIL import ImageStat
lum = ImageStat.Stat(im.convert('L')).mean[0]
if lum < 85:
    gamma = 0.75 if lum < 60 else 0.85
    lut = [int(255 * ((i / 255) ** gamma)) for i in range(256)]
    im = im.point(lut * 3)
path = os.path.join(out_dir, slug + '.jpg')
im.save(path, 'JPEG', quality=80, optimize=True, progressive=True)
print(slug, os.path.getsize(path) // 1024, 'KB')
