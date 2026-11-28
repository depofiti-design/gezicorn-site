"""Türk pasaportu kapağı çizer (AI'nın uydurma armaları yerine; kullanıcı 28 Kasım 2026).
Gerçek kapak düzeni (Wikimedia referansları): üstte TÜRKİYE CUMHURİYETİ / REPUBLIC OF TÜRKİYE, ortada altın ay-yıldız,
altta tür yazısı (PASAPORT / PASSPORT vb.) ve e-pasaport çip simgesi. Ay-yıldız oranları Türk Bayrağı Kanunu'na göre.
Kullanım: python draw_passport.py <tür: bordo|yesil|gri|siyah> <çıktı.png> [--scene]   (--scene: 9:16 masa sahnesi)
"""
import math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SERIF_B = 'C:/Windows/Fonts/timesbd.ttf' if os.path.exists('C:/Windows/Fonts/timesbd.ttf') else os.path.join(HERE, 'fonts', 'Bricolage.ttf')
SANS_B = 'C:/Windows/Fonts/arialbd.ttf' if os.path.exists('C:/Windows/Fonts/arialbd.ttf') else SERIF_B
KIND = {
    'bordo': ((94, 24, 38), ['PASAPORT', 'PASSPORT']),
    'yesil': ((16, 78, 58), ['HUSUSİ PASAPORT', 'SPECIAL PASSPORT']),
    'gri': ((88, 92, 96), ['HİZMET PASAPORTU', 'SERVICE PASSPORT']),
    'siyah': ((24, 24, 27), ['DİPLOMATİK PASAPORT', 'DIPLOMATIC PASSPORT']),
}
GOLD = ((236, 205, 130), (176, 132, 58))


def leather(w, h, base):
    rng = np.random.default_rng(7)
    n = rng.normal(0, 1, (h // 2, w // 2)).astype(np.float32)
    n = np.asarray(Image.fromarray(((n * 18) + 128).clip(0, 255).astype(np.uint8)).resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2)), np.float32) - 128
    img = np.zeros((h, w, 3), np.float32) + np.array(base, np.float32)
    img += n[..., None] * 0.35
    yy, xx = np.mgrid[0:h, 0:w]
    vig = 1 - 0.22 * (((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    img *= vig[..., None]
    return Image.fromarray(img.clip(0, 255).astype(np.uint8))


def gold_fill(mask):
    w, h = mask.size
    g = Image.linear_gradient('L').resize((w, h)).rotate(-25, expand=False)
    a = np.asarray(g, np.float32)[..., None] / 255
    col = np.array(GOLD[0], np.float32) * (1 - a) + np.array(GOLD[1], np.float32) * a
    lay = Image.fromarray(col.astype(np.uint8)).convert('RGBA')
    lay.putalpha(mask)
    return lay


def star(cx, cy, r, rot):
    pts = []
    for k in range(10):
        ang = rot + k * math.pi / 5
        rr = r if k % 2 == 0 else r * 0.382
        pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
    return pts


def cover(kind):
    base, lines = KIND[kind]
    W, H = 1000, 1400
    im = leather(W, H, base).convert('RGBA')
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    f1 = ImageFont.truetype(SANS_B, 62); f2 = ImageFont.truetype(SANS_B, 42)
    d.text((W / 2, 210), 'TÜRKİYE CUMHURİYETİ', font=f1, fill=255, anchor='mm')
    d.text((W / 2, 285), 'REPUBLIC OF TÜRKİYE', font=f2, fill=255, anchor='mm')
    # ay-yıldız (Türk Bayrağı Kanunu oranları, G = 600)
    # Türk Bayrağı Kanunu: dış ay çapı 0.5G, iç ay çapı 0.4G, merkezler arası 0.0625G,
    # yıldız dairesi çapı 0.25G ve dış ay merkezinden 1/3 G uzakta başlar; yıldızın bir kolu aya bakar.
    G = 560
    cx, cy = W / 2 - G / 6, 650          # amblemi yatayda ortala (genişlik ~0.833G)
    R1, R2, off = 0.25 * G, 0.20 * G, 0.0625 * G
    d.ellipse((cx - R1, cy - R1, cx + R1, cy + R1), fill=255)
    d.ellipse((cx + off - R2, cy - R2, cx + off + R2, cy + R2), fill=0)
    d.polygon(star(cx + G / 3 + 0.125 * G, cy, 0.125 * G, math.pi), fill=255)
    f3 = ImageFont.truetype(SANS_B, 74 if len(lines[0]) < 12 else 58); f4 = ImageFont.truetype(SANS_B, 46)
    d.text((W / 2, 1030), lines[0], font=f3, fill=255, anchor='mm')
    d.text((W / 2, 1105), lines[1], font=f4, fill=255, anchor='mm')
    # e-pasaport çip simgesi
    cxc, cyc = W / 2, 1230
    d.rounded_rectangle((cxc - 60, cyc - 38, cxc + 60, cyc + 38), 10, outline=255, width=7)
    d.ellipse((cxc - 20, cyc - 20, cxc + 20, cyc + 20), outline=255, width=7)
    d.line((cxc - 60, cyc, cxc - 20, cyc), fill=255, width=7); d.line((cxc + 20, cyc, cxc + 60, cyc), fill=255, width=7)
    # kabartma gölgesi + altın
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sh.putalpha(m.filter(ImageFilter.GaussianBlur(3)).point(lambda v: int(v * 0.55)))
    im.alpha_composite(sh, (3, 4))
    im.alpha_composite(gold_fill(m))
    # köşe yuvarlatma + kenar
    mask = Image.new('L', (W, H), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, W - 1, H - 1), 46, fill=255)
    im.putalpha(mask)
    ImageDraw.Draw(im).rounded_rectangle((8, 8, W - 9, H - 9), 40, outline=tuple(int(c * 0.7) for c in base) + (255,), width=5)
    return im


def scene(kind, bg_path=None):
    W, H = 1080, 1920
    if bg_path and os.path.exists(bg_path):
        from PIL import ImageOps
        bg = ImageOps.fit(Image.open(bg_path).convert('RGB'), (W, H)).filter(ImageFilter.GaussianBlur(18)).convert('RGBA')
        bg.alpha_composite(Image.new('RGBA', (W, H), (0, 0, 0, 70)))
    else:
        bg = Image.new('RGBA', (W, H), (226, 222, 214, 255))
    c = cover(kind).resize((720, 1008), Image.LANCZOS)
    c = c.rotate(-6, resample=Image.BICUBIC, expand=True)
    shadow = Image.new('RGBA', c.size, (0, 0, 0, 0)); shadow.putalpha(c.getchannel('A').point(lambda v: int(v * 0.55)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    x, y = (W - c.width) // 2, (H - c.height) // 2 - 40
    bg.alpha_composite(shadow, (x + 28, y + 40)); bg.alpha_composite(c, (x, y))
    return bg.convert('RGB')


if __name__ == '__main__':
    kind, out = sys.argv[1], sys.argv[2]
    bg = sys.argv[sys.argv.index('--bg') + 1] if '--bg' in sys.argv else None
    (scene(kind, bg) if '--scene' in sys.argv else cover(kind)).save(out)
    print('ok', out)
