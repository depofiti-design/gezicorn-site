"""Gezicorn Pinterest pini (1000x1500, Rota paleti): üstte yazı kapağı, altta başlık kartı.
Kullanım: python make-pin.py <slug> "<başlık>" <kategori> <çıktı.jpg>
Kapak: img/covers/<slug>.jpg (yoksa _default.jpg). Font: scripts/reels-v8/fonts/Bricolage.ttf
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FONT = os.path.join(ROOT, 'scripts', 'reels-v8', 'fonts', 'Bricolage.ttf')
W, H = 1000, 1500
INK, TEAL, OR, YL, PAPER = (11, 43, 43), (15, 118, 110), (249, 115, 22), (250, 204, 21), (255, 251, 245)
KICK = {'vize': 'VİZE REHBERİ', 'rehber': 'GEZİ REHBERİ', 'haber': 'GÜNCEL', 'firsat': 'FIRSAT', 'pasaport': 'PASAPORT'}


def font(size, w='ExtraBold'):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_name(w)
    return f


def wrap(text, f, maxw):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if f.getlength(t) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines


def make(slug, title, cat, out):
    cov = os.path.join(ROOT, 'img', 'covers', slug + '.jpg')
    if not os.path.exists(cov):
        cov = os.path.join(ROOT, 'img', 'covers', '_default.jpg')
    im = Image.new('RGB', (W, H), INK)
    photo = ImageOps.fit(Image.open(cov).convert('RGB'), (W, 860), Image.LANCZOS, centering=(0.5, 0.45))
    im.paste(photo, (0, 0))
    d = ImageDraw.Draw(im)
    # alt alan: koyu teal degrade + nokta deseni
    for y in range(760, H):
        t = (y - 760) / (H - 760)
        d.line([(0, y), (W, y)], fill=tuple(int(INK[i] * (1 - t) + (11, 79, 74)[i] * t) for i in range(3)))
    for yy in range(800, H, 44):
        for xx in range(0, W, 44):
            d.ellipse((xx - 2, yy - 2, xx + 2, yy + 2), fill=(30, 72, 70))
    # başlık kartı (Rota: koyu çerçeve + sert gölge)
    best = None
    for fs in (84, 76, 68, 60, 54):
        lines = wrap(title, font(fs), 780)
        if len(lines) <= 4:
            best = (fs, lines); break
    fs, lines = best or (54, wrap(title, font(54), 780)[:5])
    lh = int(fs * 1.12)
    ch = 90 + lh * len(lines)
    x0, y0 = 60, 700
    d.rounded_rectangle((x0 + 14, y0 + 14, W - 60 + 14, y0 + ch + 14), 30, fill=(0, 0, 0))
    d.rounded_rectangle((x0, y0, W - 60, y0 + ch), 30, fill=PAPER, outline=INK, width=6)
    y = y0 + 45
    for ln in lines:
        d.text((W / 2, y + lh / 2), ln, font=font(fs), fill=INK, anchor='mm'); y += lh
    # kategori rozeti
    k = KICK.get(cat, 'GEZİCORN')
    kf = font(40)
    kw = int(kf.getlength(k)) + 60
    d.rounded_rectangle((x0 + 8, y0 - 40 + 8, x0 + kw + 8, y0 + 30 + 8), 18, fill=(0, 0, 0))
    d.rounded_rectangle((x0, y0 - 40, x0 + kw, y0 + 30), 18, fill=YL, outline=INK, width=5)
    d.text((x0 + kw / 2, y0 - 5), k, font=kf, fill=INK, anchor='mm')
    # alt marka satırı
    by = min(H - 110, y0 + ch + 120)
    logo = Image.open(os.path.join(ROOT, 'brand', 'gezicorn-logo-seffaf-256.png')).convert('RGBA').resize((110, 110), Image.LANCZOS)
    im.paste(logo, (W // 2 - 260, by - 55), logo)
    d.text((W // 2 - 130, by - 22), 'gezicorn.com', font=font(58), fill=(255, 255, 255), anchor='lm')
    d.text((W // 2 - 128, by + 30), 'Türk pasaportuyla seyahat rehberi', font=font(30, 'SemiBold'), fill=YL, anchor='lm')
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    im.save(out, quality=88, optimize=True)


if __name__ == '__main__':
    make(*sys.argv[1:5])
