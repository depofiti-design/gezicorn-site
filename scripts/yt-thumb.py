# YouTube küçük resim (1280x720): Higgsfield ile üretilen fotoğraf üzerine Türkçe doğru yazım + tasarım.
# Kullanım: python yt-thumb.py arkaplan.png cikti.jpg "SATIR1|SATIR2|SATIR3" [--badge CANLI]
# Yazı tipi Anton (Türkçe karakterleri destekler). Büyük harf dönüşümü Türkçe kurallıdır (i->İ, ı->I). Yazı sola, yüz sağa.
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, 'fonts', 'Anton.ttf')
W, H = 1280, 720
YEL = (255, 214, 10); WHITE = (255, 255, 255); RED = (230, 30, 30)

def tr_upper(s):
    return s.replace('i', 'İ').replace('ı', 'I').upper()

def fit_font(lines, maxw, maxh):
    for size in range(240, 60, -6):
        f = ImageFont.truetype(FONT, size)
        d = ImageDraw.Draw(Image.new('RGB', (10, 10)))
        ws = [d.textlength(l, font=f) for l in lines]
        lh = int(size * 1.02)
        if max(ws) <= maxw and lh * len(lines) <= maxh:
            return f, size, lh
    return ImageFont.truetype(FONT, 60), 60, 62

def make(bg, out, text, badge=None):
    im = Image.open(bg).convert('RGB').resize((W, H), Image.LANCZOS)
    # sol tarafı okunabilirlik için koyulaştır
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for x in range(W):
        a = int(150 * max(0, 1 - x / (W * 0.62)) ** 1.3)
        od.line([(x, 0), (x, H)], fill=(0, 0, 0, a))
    im = Image.alpha_composite(im.convert('RGBA'), ov)
    lines = [tr_upper(t.strip()) for t in text.split('|') if t.strip()][:3]
    f, size, lh = fit_font(lines, int(W * 0.56), int(H * 0.78))
    total = lh * len(lines)
    y = (H - total) // 2 + (40 if badge else 0)
    x = 56
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    for i, ln in enumerate(lines):
        sd.text((x + 8, y + i * lh + 10), ln, font=f, fill=(0, 0, 0, 200), stroke_width=12, stroke_fill=(0, 0, 0, 200))
    sh = sh.filter(ImageFilter.GaussianBlur(6))
    im = Image.alpha_composite(im, sh)
    d = ImageDraw.Draw(im)
    for i, ln in enumerate(lines):
        col = YEL if (len(lines) > 1 and i == 1) or (len(lines) == 1) else WHITE
        d.text((x, y + i * lh), ln, font=f, fill=col, stroke_width=10, stroke_fill=(10, 10, 10))
    if badge:
        bf = ImageFont.truetype(FONT, 64)
        b = tr_upper(badge)
        tw = d.textlength(b, font=bf)
        d.rounded_rectangle([x, 44, x + tw + 56, 132], radius=14, fill=RED, outline=(255, 255, 255), width=5)
        d.text((x + 28, 52), b, font=bf, fill=WHITE)
    im.convert('RGB').save(out, quality=90, optimize=True)
    return out

if __name__ == '__main__':
    badge = sys.argv[sys.argv.index('--badge') + 1] if '--badge' in sys.argv else None
    print(make(sys.argv[1], sys.argv[2], sys.argv[3], badge))
