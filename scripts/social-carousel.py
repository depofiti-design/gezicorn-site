# Kaydırmalı (carousel) gönderi + hikaye ŞABLONU. Tüm elle hazırlanan carousel'ler bunu kullanır ki logo, başlık, hizalama hep aynı olsun.
# Kullanım: python social-carousel.py spec.json  -> <out_dir>/<name>-1..N.jpg (1080x1350) ve <name>-story.jpg (1080x1920)
# spec: {name, out_dir, cover:{kicker,title,big,sub}, slides:[{kicker,title,body,chip?}], outro:{line}, story:{kicker,title_lines[],big,lines[],footer}}
# Hizalama kuralı (kullanıcı 26 Eylül 2026): sol üstte logo + "gezicorn" yan yana, sol kenar 70 px, başlıklar aynı yükseklikte,
# sağ üst BOŞ (Instagram sayı rozeti orayı kapatır), sayaç sol altta, "kaydır" sağ altta. İnsan figürü yok.
import importlib.util, json, os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
spec_ = importlib.util.spec_from_file_location('social_image', os.path.join(HERE, 'social-image.py'))
si = importlib.util.module_from_spec(spec_)
spec_.loader.exec_module(si)
font, gradient, wrap, fit, header, chip = si.font, si.gradient, si.wrap, si.fit, si.header, si.chip
CREAM, SAND, ORANGE, NAVY, SOFT = si.CREAM, si.SAND, si.ORANGE, si.NAVY, si.SOFT
LOGO = Image.open(os.path.join(si.ROOT, 'brand', 'gezicorn-logo-seffaf-512.png')).convert('RGBA')
W, H = 1080, 1350


def base():
    im = gradient(W, H).convert('RGBA')
    header(im, LOGO)
    return im, ImageDraw.Draw(im)


def deco(im, name, cy, r):
    """Alt bölümde ortalanmış sarı daire + 3D nesne (metin bloğunun altında sabit yerde, çakışmaz)."""
    cx = W // 2
    d = ImageDraw.Draw(im, 'RGBA')
    for rr, a in ((int(r * 1.3), 34), (int(r * 1.15), 56)):
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(*SAND, a), width=5)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SAND)
    o = Image.open(os.path.join(si.ROOT, 'assets', '3d', name + '.webp')).convert('RGBA')
    side = int(r * 1.85)
    o = o.resize((side, side), Image.LANCZOS)
    im.alpha_composite(o, (cx - side // 2, cy - side // 2 - int(r * .05)))


def footer(d, n, total):
    if n:
        d.text((70, H - 70), f'{n}/{total}', font=font(40, 800, 24), fill=SAND, anchor='lm')
    d.text((W - 70, H - 70), 'kaydır  →', font=font(40, 800, 24), fill=SAND if n else CREAM, anchor='rm')


def cover(c, total):
    im, d = base()
    chip(d, 70, 240, c['kicker'])
    f, ls = fit(d, c['title'], W - 140, 3, [140, 128, 116, 104, 92])
    y = 340
    for ln in ls:
        d.text((70, y), ln, font=f, fill=CREAM)
        y += int(f.size * 1.08)
    if c.get('big'):
        d.text((70, y + 20), c['big'], font=font(190), fill=ORANGE)
        y += 230
    d.rectangle([70, y + 20, 250, y + 26], fill=SAND)
    d.text((70, y + 64), c['sub'], font=font(52, 500, 24), fill=SOFT)
    deco(im, c.get('obj', 'passport'), 1085, 150)
    footer(d, 0, total)
    return im.convert('RGB')


def inner(s, n, total):
    im, d = base()
    d.text((70, 250), s['kicker'], font=font(44, 800, 24), fill=SAND)
    f, ls = fit(d, s['title'], W - 140, 3, [112, 100, 92, 84, 76])
    y = 325
    for ln in ls:
        d.text((70, y), ln, font=f, fill=CREAM)
        y += int(f.size * 1.1)
    d.rectangle([70, y + 14, 250, y + 20], fill=SAND)
    y += 70
    fb = font(50, 500, 24)
    for ln in wrap(d, s['body'], fb, W - 140):
        d.text((70, y), ln, font=fb, fill=SOFT)
        y += 70
    if s.get('chip'):
        fc = font(46, 800, 24)
        tw = d.textlength(s['chip'], font=fc)
        d.rounded_rectangle([70, y + 24, 70 + tw + 70, y + 108], radius=42, fill=ORANGE)
        d.text((105, y + 66), s['chip'], font=fc, fill=NAVY, anchor='lm')
    deco(im, s.get('obj', 'stampobj'), 1100, 135)
    footer(d, n, total)
    return im.convert('RGB')


def outro(o):
    im = gradient(W, H).convert('RGBA')
    lg = LOGO.resize((420, 420), Image.LANCZOS)
    im.paste(lg, (W // 2 - 210, int(H * 0.22)), lg)
    d = ImageDraw.Draw(im)
    y = int(H * 0.22) + 500
    d.text((W // 2, y), 'gezicorn', font=font(110), fill=CREAM, anchor='mm')
    d.rectangle([W // 2 - 90, y + 70, W // 2 + 90, y + 76], fill=SAND)
    d.text((W // 2, y + 150), o['line'], font=font(50, 500, 24), fill=CREAM, anchor='mm')
    d.text((W // 2, y + 220), 'profildeki linkte', font=font(50, 800, 24), fill=SAND, anchor='mm')
    d.text((W // 2, H - 90), '@gezicorn', font=font(44, 800, 24), fill=CREAM, anchor='mm')
    return im.convert('RGB')


def story(s):
    Ws, Hs = 1080, 1920
    im = gradient(Ws, Hs).convert('RGBA')
    header(im, LOGO, center=True)
    d = ImageDraw.Draw(im)
    chip(d, Ws // 2, 470, s['kicker'], anchor_center=True)
    y = 620
    for ln in s['title_lines']:
        d.text((Ws // 2, y), ln, font=font(140), fill=CREAM, anchor='ma')
        y += 150
    f = font(190)
    tw = d.textlength(s['big'], font=f)
    d.rounded_rectangle([Ws // 2 - tw / 2 - 60, y + 40, Ws // 2 + tw / 2 + 60, y + 270], radius=60, fill=ORANGE)
    d.text((Ws // 2, y + 158), s['big'], font=f, fill=NAVY, anchor='mm')
    y += 360
    for ln in s['lines']:
        d.text((Ws // 2, y), ln, font=font(50, 500, 24), fill=SOFT, anchor='mm')
        y += 68
    d.text((Ws // 2, y + 70), s['footer'], font=font(44, 800, 24), fill=SAND, anchor='mm')
    return im.convert('RGB')


def main():
    sp = json.load(open(sys.argv[1], encoding='utf-8'))
    out = sp['out_dir']
    os.makedirs(out, exist_ok=True)
    total = len(sp['slides']) + 2
    frames = [cover(sp['cover'], total)] + [inner(s, i + 2, total) for i, s in enumerate(sp['slides'])] + [outro(sp['outro'])]
    for i, f in enumerate(frames, 1):
        f.save(os.path.join(out, f"{sp['name']}-{i}.jpg"), quality=90, optimize=True)
    story(sp['story']).save(os.path.join(out, f"{sp['name']}-story.jpg"), quality=90, optimize=True)
    print('ok', sp['name'], len(frames), 'kare + hikaye')


if __name__ == '__main__':
    main()
