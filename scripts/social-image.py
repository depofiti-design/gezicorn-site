# Günlük sosyal gönderi görselleri: feed (1080x1350, 4:5 dikey) ve hikaye (1080x1920, 9:16).
# Kullanım: python social-image.py girdi.json  (girdi: {slug, title, hook, category, cover_url, out_dir})
# Çıktı: <out_dir>/<slug>-feed.jpg ve <out_dir>/<slug>-story.jpg
# KURAL: 16:9 blog kapağı asla tek başına feed/hikaye olmaz (kullanıcı 23 ve 26 Eylül 2026 şikayeti). Kapak varsa çerçeveli görsel olarak
# kullanılır, yoksa 3D nesne. Hikaye üst 250 px ve alt 340 px'e metin koymaz (Instagram arayüz güvenli alanı). Insan figürü yok.
import io, json, os, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
FONT = os.path.join(HERE, 'fonts', 'Bricolage.ttf')
NAVY = (11, 43, 43); TEAL = (15, 118, 110); CREAM = (255, 251, 245); SAND = (250, 204, 21); ORANGE = (249, 115, 22); SOFT = (232, 240, 236)
OBJ = {'vize': 'passport', 'rehber': 'backpack', 'haber': 'globe', 'firsat': 'ticket'}
KICK = {'vize': 'VİZE', 'rehber': 'REHBER', 'haber': 'GÜNCEL', 'firsat': 'FIRSAT'}
KEYOBJ = [('pasaport', 'passport'), ('sigorta', 'phone'), ('bilet', 'ticket'), ('uçak', 'plane'), ('esim', 'phone'), ('çanta', 'backpack'), ('bavul', 'suitcase'),
          ('randevu', 'stampobj'), ('vize', 'stampobj'), ('rota', 'compass'), ('kamp', 'backpack'), ('ev ', 'pin')]


def font(size, wght=800, opsz=96):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([max(12, min(96, opsz)), wght, 100])
    return f


def gradient(W, H):
    bg = Image.new('RGB', (W, H)); px = bg.load()
    for y in range(H):
        t = y / H
        c = tuple(int(NAVY[i] + (TEAL[i] - NAVY[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = c
    return bg


def wrap(d, text, f, maxw):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= maxw:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines


def fit(d, text, maxw, maxlines, sizes, wght=800):
    """En büyük punto ile maxlines satıra sığan metni döndür; sığmazsa son satırı kısaltır."""
    for s in sizes:
        f = font(s, wght, 96 if s > 60 else 24)
        ls = wrap(d, text, f, maxw)
        if len(ls) <= maxlines:
            return f, ls
    f = font(sizes[-1], wght, 24)
    ls = wrap(d, text, f, maxw)[:maxlines]
    while ls and d.textlength(ls[-1] + '…', font=f) > maxw:
        ls[-1] = ls[-1].rsplit(' ', 1)[0] if ' ' in ls[-1] else ls[-1][:-1]
    ls[-1] = ls[-1].rstrip(' ,.;:') + '…'
    return f, ls


def pick_obj(title, category):
    t = title.lower()
    for k, v in KEYOBJ:
        if k in t: return v
    return OBJ.get(category, 'passport')


def rounded(im, radius):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=radius, fill=255)
    im = im.convert('RGBA'); im.putalpha(m)
    return im


def visual(w, h, cover, obj):
    """w x h boyutunda görsel blok: kapak varsa çerçeveli fotoğraf, yoksa sarı daire içinde 3D nesne."""
    blk = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    if cover is not None:
        s = max(w / cover.width, h / cover.height)
        c = cover.resize((int(cover.width * s) + 1, int(cover.height * s) + 1), Image.LANCZOS)
        c = c.crop(((c.width - w) // 2, (c.height - h) // 2, (c.width - w) // 2 + w, (c.height - h) // 2 + h))
        c = rounded(c, 48)
        blk.alpha_composite(c)
        ImageDraw.Draw(blk).rounded_rectangle([1, 1, w - 2, h - 2], radius=48, outline=CREAM, width=6)
        return blk
    d = ImageDraw.Draw(blk, 'RGBA')
    cx, cy = w // 2, h // 2
    r0 = min(w, h) // 2
    for r, a in ((r0, 30), (int(r0 * .82), 44), (int(r0 * .64), 70)):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*SAND, a), width=5)
    rr = int(r0 * .5)
    d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=SAND)
    o = Image.open(os.path.join(ROOT, 'assets', '3d', obj + '.webp')).convert('RGBA')
    side = int(r0 * 1.15)
    o = o.resize((side, side), Image.LANCZOS)
    blk.alpha_composite(o, (cx - side // 2, cy - side // 2 - int(r0 * .04)))
    return blk


def header(im, logo, center=False):
    W = im.width
    lg = logo.resize((110, 110), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    if center:
        im.paste(lg, (W // 2 - 55, 240), lg)
        d.text((W // 2, 385), 'gezicorn', font=font(54), fill=CREAM, anchor='mm')
    else:
        im.paste(lg, (70, 64), lg)
        d.text((200, 119), 'gezicorn', font=font(56), fill=CREAM, anchor='lm')


def chip(d, x, y, text, anchor_center=False):
    f = font(38, 800, 24)
    tw = d.textlength(text, font=f)
    x0 = x - tw / 2 - 30 if anchor_center else x
    d.rounded_rectangle([x0, y, x0 + tw + 60, y + 68], radius=34, fill=SAND)
    d.text((x0 + 30 + tw / 2, y + 35), text, font=f, fill=NAVY, anchor='mm')


def build_feed(a, cover, logo):
    W, H = 1080, 1350
    im = gradient(W, H).convert('RGBA')
    header(im, logo)
    d = ImageDraw.Draw(im)
    chip(d, 70, 210, a['kicker'])
    f, ls = fit(d, a['title'], W - 140, 4, [92, 84, 76, 68, 62])
    y = 310
    lh = int(f.size * 1.08)
    for ln in ls:
        d.text((70, y), ln, font=f, fill=CREAM)
        y += lh
    d.rectangle([70, y + 12, 250, y + 18], fill=SAND)
    fb = font(44, 500, 24)
    maxb = 3 if cover is None else (4 if len(ls) <= 3 else 3)
    bl = wrap(d, a['hook'], fb, W - 140)[:maxb]
    if len(wrap(d, a['hook'], fb, W - 140)) > maxb:
        while bl and d.textlength(bl[-1] + '…', font=fb) > W - 140: bl[-1] = bl[-1].rsplit(' ', 1)[0] if ' ' in bl[-1] else bl[-1][:-1]
        bl[-1] = bl[-1].rstrip(' ,.;:') + '…'
    yb = y + 52
    for ln in bl:
        d.text((70, yb), ln, font=fb, fill=SOFT)
        yb += 62
    vh = min(470, H - 170 - (yb + 30))
    vh = max(vh, 330 if cover is not None else 430)
    vb = visual(940, vh, cover, a['obj'])
    im.alpha_composite(vb, (70, H - 150 - vh))
    d = ImageDraw.Draw(im)
    d.text((W // 2, H - 72), 'Yazının tamamı profildeki linkte', font=font(40, 800, 24), fill=SAND, anchor='mm')
    return im.convert('RGB')


def build_story(a, cover, logo):
    W, H = 1080, 1920
    im = gradient(W, H).convert('RGBA')
    header(im, logo, center=True)
    d = ImageDraw.Draw(im)
    chip(d, W // 2, 470, a['kicker'], anchor_center=True)
    f, ls = fit(d, a['title'], W - 160, 4, [96, 88, 80, 72, 64])
    y = 590
    lh = int(f.size * 1.08)
    for ln in ls:
        d.text((W // 2, y), ln, font=f, fill=CREAM, anchor='ma')
        y += lh
    vy = y + 50
    vh = min(560, 1500 - vy)
    vh = max(vh, 380)
    vb = visual(860, vh, cover, a['obj'])
    im.alpha_composite(vb, (110, vy))
    d = ImageDraw.Draw(im)
    d.text((W // 2, min(vy + vh + 70, 1560)), 'Yazının tamamı profildeki linkte', font=font(42, 800, 24), fill=SAND, anchor='mm')
    return im.convert('RGB')


def main():
    a = json.load(open(sys.argv[1], encoding='utf-8'))
    a['kicker'] = KICK.get(a.get('category'), 'GEZİCORN')
    a['obj'] = pick_obj(a['title'], a.get('category'))
    cover = None
    if a.get('cover_url'):
        try:
            raw = urllib.request.urlopen(urllib.request.Request(a['cover_url'], headers={'User-Agent': 'gezicorn-social'}), timeout=30).read()
            cover = Image.open(io.BytesIO(raw)).convert('RGB')
        except Exception as e:
            print('kapak alınamadı, 3D nesne kullanılacak:', e)
    logo = Image.open(os.path.join(ROOT, 'brand', 'gezicorn-logo-seffaf-512.png')).convert('RGBA')
    out = a['out_dir']
    os.makedirs(out, exist_ok=True)
    build_feed(a, cover, logo).save(os.path.join(out, a['slug'] + '-feed.jpg'), quality=90, optimize=True)
    build_story(a, cover, logo).save(os.path.join(out, a['slug'] + '-story.jpg'), quality=90, optimize=True)
    print('ok', a['slug'], a['obj'], 'kapak' if cover else 'nesne')


if __name__ == '__main__':
    main()
