"""v8 reels renderer: Rota paleti, kodla çizilen motion kartlar + Ken Burns foto + kelime vurgulu altyazı.
Önce: python tts.py   Sonra: python render.py [reel_n ...] [--still SANIYE]
Çıktı: img/social/manual/reels/v8-src/out/reel-v8-<n>-<slug>.mp4 (1080x1920, 30fps) + kapak jpg
"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(ROOT, 'img', 'social', 'manual', 'reels', 'v8-src')
W, H, FPS = 1080, 1920, 30
INK, TEAL, TEALD, OR, YL, PAPER, RED = (11, 43, 43), (15, 118, 110), (11, 79, 74), (249, 115, 22), (250, 204, 21), (255, 251, 245), (220, 38, 38)
FONT = os.path.join(HERE, 'fonts', 'Bricolage.ttf')
_fc = {}


def font(size, w='ExtraBold'):
    k = (size, w)
    if k not in _fc:
        f = ImageFont.truetype(FONT, size)
        f.set_variation_by_name(w)
        _fc[k] = f
    return _fc[k]


def hexc(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def up(s):
    return s.replace('i', 'İ').replace('ı', 'I').upper()


def ease_out(x):
    x = max(0, min(1, x)); return 1 - (1 - x) ** 3


def ease_back(x):
    x = max(0, min(1, x)); c = 1.70158; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


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


# ---------- ortak çizim ----------

def card(im, box, fill, radius=28, border=6, shadow=14):
    """Rota stili: koyu çerçeve + sert gölge."""
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0 + shadow, y0 + shadow, x1 + shadow, y1 + shadow), radius, fill=INK)
    d.rounded_rectangle(box, radius, fill=fill, outline=INK, width=border)


def paste_scaled(im, layer, cx, cy, s, alpha=1.0, rot=0):
    if s <= 0.01 or alpha <= 0.01:
        return
    l = layer
    if rot:
        l = l.rotate(rot, resample=Image.BICUBIC, expand=True)
    if s != 1:
        l = l.resize((max(1, int(l.width * s)), max(1, int(l.height * s))), Image.BICUBIC)
    if alpha < 1:
        a = l.getchannel('A').point(lambda v: int(v * alpha)); l = l.copy(); l.putalpha(a)
    im.alpha_composite(l, (int(cx - l.width / 2), int(cy - l.height / 2)))


def layer_card(w, h, fill, lines, fsize, color, weight='ExtraBold', pad=0, line_gap=1.12):
    sh = 14
    L = Image.new('RGBA', (w + sh + 4, h + sh + 4), (0, 0, 0, 0))
    card(L, (2, 2, 2 + w, 2 + h), fill)
    d = ImageDraw.Draw(L); f = font(fsize, weight)
    lh = fsize * line_gap; y = 2 + (h - lh * len(lines)) / 2
    for ln in lines:
        d.text((2 + w / 2, y + lh / 2), ln, font=f, fill=color, anchor='mm'); y += lh
    return L


class Assets:
    def __init__(self):
        self.img, self.obj = {}, {}
        lg = Image.open(os.path.join(ROOT, 'brand', 'gezicorn-logo-seffaf-256.png')).convert('RGBA')
        self.logo = lg.resize((150, 150), Image.LANCZOS)
        self.logo_big = lg.resize((300, 300), Image.LANCZOS)
        self.bg = self.make_bg()
        ring = Image.new('RGBA', (900, 900), (0, 0, 0, 0)); rd = ImageDraw.Draw(ring)
        rd.ellipse((10, 10, 890, 890), outline=(255, 255, 255, 18), width=10)
        rd.ellipse((70, 70, 830, 830), outline=(255, 255, 255, 12), width=4)
        self.ring = ring

    def make_bg(self):
        g = Image.new('RGB', (W, H))
        d = ImageDraw.Draw(g)
        for y in range(H):
            t = y / H
            d.line([(0, y), (W, y)], fill=tuple(int(INK[i] * (1 - t) + TEALD[i] * t) for i in range(3)))
        g = g.convert('RGBA')
        dots = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dd = ImageDraw.Draw(dots)
        for yy in range(0, H, 54):
            for xx in range(0, W, 54):
                dd.ellipse((xx - 3, yy - 3, xx + 3, yy + 3), fill=(255, 255, 255, 22))
        g.alpha_composite(dots)
        return g

    def photo(self, name, blur=False):
        k = (name, blur)
        if k not in self.img:
            im = Image.open(os.path.join(SRC, 'img', name + '.png')).convert('RGB')
            s = max(W * 1.12 / im.width, H * 1.12 / im.height)
            im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
            if blur:
                im = im.filter(ImageFilter.GaussianBlur(18))
                im = Image.blend(im, Image.new('RGB', im.size, INK), 0.55)
            self.img[k] = im
        return self.img[k]

    def o(self, name, size):
        k = (name, size)
        if k not in self.obj:
            im = Image.open(os.path.join(ROOT, 'assets', '3d', name + '.webp')).convert('RGBA')
            self.obj[k] = im.resize((size, size), Image.LANCZOS)
        return self.obj[k]


def kenburns(A, name, t, dur, blur=False, seed=0):
    im = A.photo(name, blur)
    p = t / max(dur, 0.1)
    z = 1.0 + 0.07 * p
    cw, ch = W * 1.12 / z, H * 1.12 / z
    cw, ch = min(cw, im.width), min(ch, im.height)
    dx = (im.width - cw) * (0.5 + (0.25 if seed % 2 else -0.25) * (p - 0.5))
    dy = (im.height - ch) * 0.5
    fr = im.crop((int(dx), int(dy), int(dx + cw), int(dy + ch))).resize((W, H), Image.BILINEAR).convert('RGBA')
    if not blur:
        fr.alpha_composite(shade())
    return fr


_shade = []


def shade():
    if not _shade:
        sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
        for y in range(H):
            a = 0
            if y < 420: a = int(150 * (1 - y / 420))
            if y > 1150: a = int(200 * (y - 1150) / (H - 1150))
            if a: sd.line([(0, y), (W, y)], fill=(0, 0, 0, a))
        _shade.append(sh)
    return _shade[0]


# ---------- sahneler ----------

def sc_photo(A, v, t, dur, k):
    fr = kenburns(A, v['img'], t, dur, seed=k)
    if v.get('chip'):
        txt = up(v['chip']); f = font(58)
        w = int(f.getlength(txt)) + 90
        L = layer_card(w, 120, OR, [txt], 58, (255, 255, 255))
        paste_scaled(fr, L, W / 2, 1180, ease_back((t - 0.25) / 0.35), ease_out((t - 0.25) / 0.2))
    return fr


def bg_for(A, v, t, dur, k):
    if v.get('bgimg'):
        return kenburns(A, v['bgimg'], t, dur, blur=True, seed=k)
    fr = A.bg.copy()
    # yavaş dönen damga halkası
    fr.alpha_composite(A.ring, (W // 2 - 450, 860 - 450))
    return fr


def bob(t, amp=14, sp=1.6):
    return math.sin(t * sp) * amp


def sc_number(A, v, t, dur, k):
    fr = bg_for(A, v, t, dur, k)
    if v.get('obj'):
        paste_scaled(fr, A.o(v['obj'], 300), W / 2 + 250, 560 + bob(t), ease_back((t - 0.15) / 0.4), ease_out((t - 0.15) / 0.3), rot=-8)
    big = up(v['big']); fs = 300 if len(big) <= 2 else 190
    while font(fs).getlength(big) > 2 * 290 - 90 and fs > 60:
        fs -= 6
    R = 290
    C = Image.new('RGBA', (2 * R + 30, 2 * R + 30), (0, 0, 0, 0)); cd = ImageDraw.Draw(C)
    cd.ellipse((16, 16, 2 * R + 16, 2 * R + 16), fill=INK)
    cd.ellipse((2, 2, 2 * R + 2, 2 * R + 2), fill=OR, outline=INK, width=8)
    unit = up(v.get('unit', ''))
    cy = R + 2 - (40 if unit else 0)
    cd.text((R + 2, cy), big, font=font(fs), fill=(255, 255, 255), anchor='mm')
    if unit:
        cd.text((R + 2, cy + fs * 0.5 + 40), unit, font=font(76), fill=INK, anchor='mm')
    paste_scaled(fr, C, W / 2, 860, ease_back(t / 0.45))
    lab = v.get('label')
    if lab:
        lines = wrap(lab, font(56), 820)
        L = layer_card(900, 60 + 66 * len(lines), PAPER, lines, 56, INK)
        a = ease_out((t - 0.35) / 0.3)
        paste_scaled(fr, L, W / 2, 1270 + (1 - a) * 60, 1, a)
    return fr


def sc_myth(A, v, t, dur, k):
    fr = bg_for(A, v, t, dur, k)
    ts = min(0.55, dur * 0.25); tt = min(1.15, dur * 0.5)
    lines = wrap('“' + v['claim'] + '”', font(70), 820)
    L = layer_card(920, 80 + 82 * len(lines), PAPER, lines, 70, INK)
    ch_ = 80 + 82 * len(lines); cyc = 640
    paste_scaled(fr, L, W / 2, cyc, 1, ease_out(t / 0.25))
    # YANLIŞ damgası
    S = Image.new('RGBA', (620, 200), (0, 0, 0, 0)); sd = ImageDraw.Draw(S)
    sd.rounded_rectangle((6, 6, 614, 194), 24, outline=RED, width=14)
    sd.text((310, 100), 'YANLIŞ', font=font(130), fill=RED, anchor='mm')
    p = (t - ts) / 0.22
    if p > 0:
        s = 1 + 0.7 * (1 - ease_out(p))
        paste_scaled(fr, S, W / 2 + 150, cyc + ch_ / 2 + 75, s, ease_out(p * 2), rot=-10)
    if t > tt:
        a = ease_out((t - tt) / 0.3)
        tl = wrap(v['truth'], font(60), 780)
        T = layer_card(920, 150 + 70 * len(tl), TEAL, [], 60, (255, 255, 255))
        td = ImageDraw.Draw(T)
        td.text((462, 60), 'DOĞRUSU', font=font(44), fill=YL, anchor='mm')
        y = 120
        for ln in tl:
            td.text((462, y + 30), ln, font=font(60), fill=(255, 255, 255), anchor='mm'); y += 70
        paste_scaled(fr, T, W / 2, 1220 + (1 - a) * 80, 1, a)
    return fr


def sc_compare(A, v, t, dur, k):
    fr = bg_for(A, v, t, dur, k)
    for side in (0, 1):
        head, body = (v['left'] if side == 0 else v['right'])
        col = hexc(v['lc'] if side == 0 else v['rc'])
        cw, chh = 440, 560
        Lc = Image.new('RGBA', (cw + 20, chh + 20), (0, 0, 0, 0))
        card(Lc, (2, 2, cw, chh), PAPER)
        d = ImageDraw.Draw(Lc)
        d.rounded_rectangle((2, 2, cw, 200), 28, fill=col, outline=INK, width=6)
        d.rectangle((8, 150, cw - 6, 200), fill=col)
        d.line((2, 200, cw, 200), fill=INK, width=6)
        hl = wrap(up(head), font(54), cw - 50)
        y = 101 - (len(hl) - 1) * 30
        for ln in hl:
            d.text((cw / 2, y), ln, font=font(54), fill=(255, 255, 255), anchor='mm'); y += 60
        bl = wrap(body, font(64), cw - 60)
        y = 380 - (len(bl) - 1) * 38
        for ln in bl:
            d.text((cw / 2, y), ln, font=font(64), fill=INK, anchor='mm'); y += 76
        dl = 0.1 + side * 0.25
        a = ease_out((t - dl) / 0.35)
        x = (W / 2 - 250) if side == 0 else (W / 2 + 250)
        x += (-1 if side == 0 else 1) * (1 - a) * 300
        paste_scaled(fr, Lc, x, 900, 1, a)
    vs = Image.new('RGBA', (150, 150), (0, 0, 0, 0)); vd = ImageDraw.Draw(vs)
    vd.ellipse((4, 4, 146, 146), fill=YL, outline=INK, width=6)
    vd.text((75, 78), 'VS', font=font(56), fill=INK, anchor='mm')
    paste_scaled(fr, vs, W / 2, 900, ease_back((t - 0.5) / 0.3))
    return fr


def sc_list(A, v, t, dur, k):
    fr = bg_for(A, v, t, dur, k)
    items = v['items']; n = len(items)
    T = layer_card(int(font(56).getlength(up(v['title']))) + 80, 110, YL, [up(v['title'])], 56, INK)
    paste_scaled(fr, T, W / 2, 470, ease_back(t / 0.35))
    rowh = 175 if n <= 3 else 140
    y0 = 880 - (n - 1) * rowh / 2 + 40
    span = max(0.6, dur * 0.65)
    for i, (txt, obj) in enumerate(items):
        ti = 0.25 + i * span / n
        a = ease_out((t - ti) / 0.3)
        if a <= 0:
            continue
        R = Image.new('RGBA', (900, rowh), (0, 0, 0, 0))
        card(R, (2, 2, 880, rowh - 22), PAPER, radius=24, border=5, shadow=10)
        d = ImageDraw.Draw(R)
        R.alpha_composite(A.o(obj, rowh - 40), (14, 10))
        fs = 62 if n <= 3 else 54
        while font(fs).getlength(txt) > 800 - 50 - (rowh + 10) and fs > 30:
            fs -= 2
        d.text((rowh + 10, (rowh - 20) / 2), txt, font=font(fs), fill=INK, anchor='lm')
        bx = 800; by = (rowh - 20) / 2
        if v.get('cross'):
            d.ellipse((bx - 34, by - 34, bx + 34, by + 34), fill=RED, outline=INK, width=4)
            d.line((bx - 14, by - 14, bx + 14, by + 14), fill=(255, 255, 255), width=8)
            d.line((bx - 14, by + 14, bx + 14, by - 14), fill=(255, 255, 255), width=8)
        else:
            d.ellipse((bx - 34, by - 34, bx + 34, by + 34), fill=TEAL, outline=INK, width=4)
            d.line((bx - 16, by, bx - 4, by + 13, bx + 17, by - 13), fill=(255, 255, 255), width=8, joint='curve')
        paste_scaled(fr, R, W / 2 + (1 - a) * 200, y0 + i * rowh, 1, a)
    return fr


def sc_cta(A, v, t, dur, k):
    fr = bg_for(A, v, t, dur, k)
    paste_scaled(fr, A.logo_big, W / 2, 560, ease_back(t / 0.4))
    if v.get('obj'):
        paste_scaled(fr, A.o(v['obj'], 260), W / 2 + 300, 450 + bob(t), ease_back((t - 0.2) / 0.4), rot=10)
    lines = wrap(v['text'], font(76), 860)
    L = layer_card(940, 90 + 88 * len(lines), YL, lines, 76, INK)
    paste_scaled(fr, L, W / 2, 900, ease_back((t - 0.15) / 0.4))
    a = ease_out((t - 0.4) / 0.3)
    d = ImageDraw.Draw(fr)
    if a > 0:
        sub = Image.new('RGBA', (W, 200), (0, 0, 0, 0)); sd = ImageDraw.Draw(sub)
        fs = 58
        while font(fs, 'Bold').getlength(v['sub']) > W - 120 and fs > 30:
            fs -= 2
        sd.text((W / 2, 50), v['sub'], font=font(fs, 'Bold'), fill=(255, 255, 255), anchor='mm')
        sd.text((W / 2, 140), '@gezicorn  ·  gezicorn.com', font=font(46, 'SemiBold'), fill=YL, anchor='mm')
        paste_scaled(fr, sub, W / 2, 1130, 1, a)
    return fr


SCENES = {'photo': sc_photo, 'number': sc_number, 'myth': sc_myth, 'compare': sc_compare, 'list': sc_list, 'cta': sc_cta}


# ---------- altyazı ----------

def words_from(al):
    ws, cur, st = [], '', None
    for ch, s, e in zip(al['chars'], al['start'], al['end']):
        if ch.isspace():
            if cur: ws.append([cur, st, pe]); cur = ''
            continue
        if not cur: st = s
        cur += ch; pe = e
    if cur: ws.append([cur, st, pe])
    return ws


def chunks(ws):
    out, cur = [], []
    for w in ws:
        cur.append(w)
        txt = ' '.join(x[0] for x in cur)
        if len(cur) >= 3 or len(txt) >= 18 or w[0][-1] in '.,?!:':
            out.append(cur); cur = []
    if cur: out.append(cur)
    return out


def draw_caption(fr, ch, t):
    f = font(70)
    parts = [x[0] for x in ch]
    total = f.getlength(' '.join(parts))
    x = W / 2 - total / 2; y = 1560
    d = ImageDraw.Draw(fr)
    for (w, s, e) in ch:
        col = YL if s <= t < e + 0.08 else (255, 255, 255)
        d.text((x, y), w, font=f, fill=col, anchor='lm', stroke_width=9, stroke_fill=INK)
        x += f.getlength(w + ' ')


def draw_hook(fr, text, t):
    if t > 2.6:
        return
    a = ease_out(t / 0.25) * (1 - ease_out((t - 2.35) / 0.25))
    lines = wrap(text, font(78), 860)
    L = layer_card(940, 70 + 90 * len(lines), YL, lines, 78, INK)
    paste_scaled(fr, L, W / 2, 300 + 40 * len(lines), 0.9 + 0.1 * ease_back(t / 0.35), a)


# ---------- ana akış ----------

def plan(r):
    al = json.load(open(os.path.join(SRC, 'audio', f"{r['n']}.json"), encoding='utf8'))
    starts = []
    for i, (a, b) in enumerate(al['ranges']):
        j = a
        while j < b and al['chars'][j].isspace(): j += 1
        starts.append(0.0 if i == 0 else al['start'][j] - 0.08)
    total = al['end'][-1] + 0.9
    bounds = [(starts[i], starts[i + 1] if i + 1 < len(starts) else total) for i in range(len(starts))]
    return al, bounds, total


def frame_at(A, r, bounds, chs, t, total):
    k = max(i for i, (s, e) in enumerate(bounds) if s <= t or i == 0)
    s, e = bounds[k]
    v = r['scenes'][k]['v']
    fr = SCENES[v['type']](A, v, t - s, e - s, k)
    # sahne geçişi: ilk 5 karede beyaz flaş azalması
    lt = t - s
    if k > 0 and lt < 5 / FPS:
        fl = Image.new('RGBA', (W, H), (255, 255, 255, int(120 * (1 - lt * FPS / 5))))
        fr.alpha_composite(fl)
    if k == 0 and v['type'] != 'myth':
        draw_hook(fr, r['hook'], t)
    fr.alpha_composite(A.logo, (W - 150 - 40, 60))
    cur = None
    for c in chs:
        if c[0][1] - 0.05 <= t:
            cur = c
    if cur and t < cur[-1][2] + 0.6 and r['scenes'][k]['v']['type'] != 'cta':
        draw_caption(fr, cur, t)
    d = ImageDraw.Draw(fr)
    d.rectangle((0, H - 14, int(W * t / total), H), fill=OR)
    return fr.convert('RGB')


def cover(A, r):
    v = r['scenes'][0]['v']
    img = v.get('img') or v.get('bgimg') or next((s['v'].get('img') for s in r['scenes'] if s['v'].get('img')), None)
    fr = kenburns(A, img, 0, 1, blur=True) if img else A.bg.copy()
    lines = wrap(r['hook'], font(104), 880)
    L = layer_card(960, 110 + 120 * len(lines), YL, lines, 104, INK)
    paste_scaled(fr, L, W / 2, 860, 1)
    obj = next((s['v'].get('obj') for s in r['scenes'] if s['v'].get('obj')), 'passport')
    paste_scaled(fr, A.o(obj, 360), W / 2 + 260, 860 - 60 * len(lines) - 230, 1, 1, rot=-8)
    fr.alpha_composite(A.logo, (W - 150 - 40, 60))
    d = ImageDraw.Draw(fr)
    d.text((W / 2, 1420), 'gezicorn.com', font=font(54, 'Bold'), fill=(255, 255, 255), anchor='mm')
    return fr.convert('RGB')


def ffmpeg():
    p = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Packages',
                     'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.1-full_build', 'bin', 'ffmpeg.exe')
    return p if os.path.exists(p) else 'ffmpeg'


def render(r, still=None):
    A = Assets()
    al, bounds, total = plan(r)
    chs = chunks(words_from(al))
    out_dir = os.path.join(SRC, 'out'); os.makedirs(out_dir, exist_ok=True)
    name = f"reel-v8-{r['n']}-{r['slug']}"
    if still is not None:
        for s in still:
            frame_at(A, r, bounds, chs, s, total).save(os.path.join(out_dir, f"{r['n']}_still_{s}.jpg"), quality=85)
        return
    mp4 = os.path.join(out_dir, name + '.mp4')
    cmd = [ffmpeg(), '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-i', os.path.join(SRC, 'audio', f"{r['n']}.mp3"),
           '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
           '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-af', 'apad', '-t', f'{total:.2f}', '-movflags', '+faststart', mp4]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    nf = int(total * FPS)
    for i in range(nf):
        p.stdin.write(frame_at(A, r, bounds, chs, i / FPS, total).tobytes())
    p.stdin.close(); p.wait()
    cover(A, r).save(os.path.join(out_dir, name + '-cover.jpg'), quality=88)
    print('ok', name, f'{total:.1f} sn')


def main():
    args = sys.argv[1:]
    still = None
    if '--still' in args:
        i = args.index('--still'); still = [float(x) for x in args[i + 1].split(',')]; args = args[:i] + args[i + 2:]
    specs = json.load(open(os.path.join(HERE, 'specs.json'), encoding='utf8'))['reels']
    for r in specs:
        if args and str(r['n']) not in args:
            continue
        render(r, still)


if __name__ == '__main__':
    main()
