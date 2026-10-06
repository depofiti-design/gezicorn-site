# -*- coding: utf-8 -*-
"""Gezicorn reels sablonlari (5 paket) uretici.
Calistirma: python build_templates.py
Cikti: sablon-N-*/ klasorleri (spec.md, overlay PNG, sample.mp4, preview.jpg) + karsilastirma.jpg
"""
import os, subprocess, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)).replace("\\", "/")
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
FONTS = os.path.join(HERE, "fonts")
LOGO = os.path.join(ROOT, "brand", "gezicorn-logo-seffaf-512.png")
FFMPEG = r"C:\Users\Pepe\AppData\Local\Programs\Python\Python312\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
SCRATCH = r"C:\Users\Pepe\AppData\Local\Temp\claude\C--Users-Pepe\9a3659fb-ef18-40cb-84ab-69311095e91a\scratchpad"

W, H = 1080, 1920
FPS = 30
DUR = 9.0
HOOK_END = 3.0
SUB_BOTTOM = 1470  # alt-yazi zonunun alt siniri (y)
HOOK_TEXT = "Vizen neden reddedildi?"

SEGMENTS = [
    (1.0, 3.3, "Ret gerekçesini belgede ara."),
    (3.3, 5.6, "İtiraz hakkın her zaman var."),
    (5.6, 7.8, "İlgili bölümü hemen oku."),
    (7.8, 9.0, "Şimdi kontrol et."),
]

NAVY = (20, 52, 95)          # logo rengi (orijinal)
WHITE = (255, 255, 255)


def lower_tr(s):
    """Turkce kucuk harf: I -> ı, İ -> i (once explicit map, sonra lower)."""
    return s.replace("İ", "i").replace("I", "ı").lower()


def upper_tr(s):
    return s.replace("i", "İ").replace("ı", "I").upper()


_fc = {}


def F(file, size, **axes):
    key = (file, size, tuple(sorted(axes.items())))
    if key in _fc:
        return _fc[key]
    f = ImageFont.truetype(os.path.join(FONTS, file), size)
    if axes:
        vals = [axes.get(a["name"].decode().lower(), a["default"]) for a in f.get_variation_axes()]
        f.set_variation_by_axes(vals)
    _fc[key] = f
    return f


def blank():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def wrap(text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if font.getlength(t) <= maxw or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit(text, mk, maxw, maxlines, hi, lo, step=4):
    for s in range(hi, lo - 1, -step):
        f = mk(s)
        lines = wrap(text, f, maxw)
        if len(lines) <= maxlines and all(f.getlength(l) <= maxw for l in lines):
            return s, f, lines
    f = mk(lo)
    return lo, f, wrap(text, f, maxw)


def put_lines(L, lines, f, lh, y, x, align, fill, stroke=None, sw=0, shadow=False):
    d = ImageDraw.Draw(L)
    for i, l in enumerate(lines):
        tw = f.getlength(l)
        xx = x - tw / 2 if align == "center" else x
        yy = y + i * lh
        if shadow:
            sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ImageDraw.Draw(sh).text((xx, yy + 7), l, font=f, fill=(0, 0, 0, 150))
            L.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7)))
            d = ImageDraw.Draw(L)
        if stroke:
            d.text((xx, yy), l, font=f, fill=fill, stroke_width=sw, stroke_fill=stroke)
        else:
            d.text((xx, yy), l, font=f, fill=fill)


def logo_img(color, size):
    im = Image.open(LOGO).convert("RGBA").resize((size, size), Image.LANCZOS)
    solid = Image.new("RGBA", (size, size), tuple(color) + (255,))
    solid.putalpha(im.split()[3])
    return solid


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def scene(top, bottom, blob, blob2, a2=110):
    """Sahne placeholder: dikey gradyan + yumusak daireler (parlak ve koyu alan testi icin)."""
    base = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(base)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp(top, bottom, y / (H - 1)))
    bl = blank()
    ImageDraw.Draw(bl).ellipse((120, 1020, 980, 1780), fill=tuple(blob) + (200,))
    bl = bl.filter(ImageFilter.GaussianBlur(110))
    b2 = blank()
    ImageDraw.Draw(b2).ellipse((560, 180, 1240, 860), fill=tuple(blob2) + (a2,))
    b2 = b2.filter(ImageFilter.GaussianBlur(120))
    out = base.convert("RGBA")
    out.alpha_composite(bl)
    out.alpha_composite(b2)
    return out


def logo_overlay(plate, logo_color, border=None):
    L = blank()
    P = 132
    x, y = W - 40 - P, 56
    ImageDraw.Draw(L).rounded_rectangle((x, y, x + P, y + P), radius=30, fill=plate,
                                        outline=border, width=3 if border else 0)
    L.alpha_composite(logo_img(logo_color, 96), (x + 18, y + 18))
    return L


def rect(L, box, fill, radius=0):
    d = ImageDraw.Draw(L)
    if radius:
        d.rounded_rectangle(box, radius=radius, fill=fill)
    else:
        d.rectangle(box, fill=fill)


# ---------------------------------------------------------------- sablon 1
def p1_hook():
    L = blank()
    s, f, lines = fit(HOOK_TEXT, lambda z: F("Fraunces.ttf", z, weight=620, **{"optical size": 72, "softness": 30, "wonky": 0}),
                      920, 3, 124, 84)
    lh = int(s * 1.08)
    put_lines(L, lines, f, lh, 330, 80, "left", (20, 33, 61, 255), stroke=(243, 235, 221, 255), sw=9)
    return L


def p1_sub(text):
    st = dict(font="Inter.ttf", axes={"weight": 600, "optical size": 28}, fill=(255, 255, 255, 255),
              stroke=(20, 33, 61, 255), sw=8, shadow=True, mode="stroke", hi=56, lo=42)
    return sub_layer(text, st)


def p1_accent():
    L = blank()
    rect(L, (80, 268, 240, 276), (232, 119, 46, 255))
    return L


def p1_lower():
    L = blank()
    rect(L, (80, 1292, 1000, 1294), (20, 33, 61, 255))
    return L


# ---------------------------------------------------------------- sablon 2
def p2_hook():
    L = blank()
    d = ImageDraw.Draw(L)
    txt = upper_tr(HOOK_TEXT)
    s, f, lines = fit(txt, lambda z: F("Montserrat.ttf", z, weight=900), 900 - 56, 3, 104, 62)
    lh = int(s * 1.12)
    bar_h = int(s * 1.3)
    y = 330
    for l in lines:
        tw = f.getlength(l)
        d.rectangle((60, y, 60 + tw + 56, y + bar_h), fill=(255, 201, 60, 255))
        ty = y + (bar_h - s) // 2 - int(s * 0.12)
        d.text((60 + 28, ty), l, font=f, fill=(11, 27, 51, 255))
        y += bar_h + 10
    return L


def p2_sub(text):
    st = dict(font="Manrope.ttf", axes={"weight": 600}, fill=(255, 255, 255, 255),
              stroke=(0, 0, 0, 255), sw=9, shadow=False, mode="stroke", hi=56, lo=42)
    return sub_layer(text, st)


def p2_accent():
    L = blank()
    rect(L, (0, 300, 16, 1000), (255, 201, 60, 255))
    return L


def p2_lower():
    L = blank()
    rect(L, (440, 1262, 640, 1274), (255, 201, 60, 255))
    return L


# ---------------------------------------------------------------- sablon 3
def p3_hook():
    L = blank()
    s, f, lines = fit(HOOK_TEXT, lambda z: F("PlusJakartaSans.ttf", z, weight=800), 920, 3, 120, 80)
    put_lines(L, lines, f, int(s * 1.08), 330, 80, "left", (31, 41, 55, 255), stroke=(255, 255, 255, 255), sw=12)
    return L


def p3_sub(text):
    st = dict(font="PlusJakartaSans.ttf", axes={"weight": 600}, fill=(17, 24, 39, 255),
              stroke=(255, 255, 255, 255), sw=10, shadow=False, mode="stroke", hi=54, lo=42)
    return sub_layer(text, st)


def p3_accent():
    L = blank()
    rect(L, (0, 0, W, 10), (15, 118, 110, 255))
    rect(L, (0, H - 10, W, H), (15, 118, 110, 255))
    return L


def p3_lower():
    L = blank()
    rect(L, (490, 1290, 590, 1294), (15, 118, 110, 255))
    return L


# ---------------------------------------------------------------- sablon 4
def p4_hook():
    L = blank()
    d = ImageDraw.Draw(L)
    s, f, lines = fit(HOOK_TEXT, lambda z: F("BricolageGrotesque.ttf", z, weight=800, **{"optical size": 96, "width": 100}),
                      920, 3, 112, 72)
    lh = int(s * 1.04)
    pad = 46
    top = 300
    d.rectangle((0, top, W, top + len(lines) * lh + 2 * pad), fill=(255, 90, 31, 255))
    put_lines(L, lines, f, lh, top + pad, 80, "left", (255, 255, 255, 255))
    return L


def p4_sub(text):
    st = dict(font="Manrope.ttf", axes={"weight": 700}, fill=(255, 255, 255, 255),
              stroke=(17, 17, 17, 255), sw=12, shadow=False, mode="stroke", hi=56, lo=42)
    return sub_layer(text, st)


def p4_accent():
    L = blank()
    rect(L, (0, 0, W, 14), (17, 17, 17, 255))
    rect(L, (80, 1822, 260, 1830), (255, 90, 31, 255))
    return L


def p4_lower():
    L = blank()
    rect(L, (80, 1292, 1000, 1298), (255, 90, 31, 255))
    return L


# ---------------------------------------------------------------- sablon 5
def p5_hook():
    L = blank()
    d = ImageDraw.Draw(L)
    s, f, lines = fit(HOOK_TEXT, lambda z: F("Poppins-SemiBold.ttf", z), 920 - 60, 3, 96, 64)
    ch = int(s * 1.42)
    y = 330
    for l in lines:
        tw = f.getlength(l)
        d.rounded_rectangle((80, y, 80 + tw + 60, y + ch), radius=ch // 2, fill=(255, 248, 238, 255))
        d.text((80 + 30, y + (ch - s) // 2 - 4), l, font=f, fill=(59, 42, 32, 255))
        y += ch + 14
    return L


def p5_sub(text):
    tx = lower_tr(text)
    mk = lambda z: F("Poppins-Medium.ttf", z)
    size, f, lines = fit(tx, mk, 860, 2, 50, 38)
    L = blank()
    d = ImageDraw.Draw(L)
    ch = int(size * 1.5)
    padx = 28
    gap = 10
    total = len(lines) * ch + (len(lines) - 1) * gap
    y = SUB_BOTTOM - total
    for l in lines:
        tw = f.getlength(l)
        cw = tw + 2 * padx
        x = (W - cw) / 2
        d.rounded_rectangle((x, y, x + cw, y + ch), radius=ch // 2, fill=(181, 82, 59, 255))
        d.text((x + padx, y + (ch - size) // 2 - 3), l, font=f, fill=(255, 248, 238, 255))
        y += ch + gap
    return L


def p5_accent():
    L = blank()
    ImageDraw.Draw(L).rounded_rectangle((80, 268, 200, 278), radius=5, fill=(181, 82, 59, 255))
    return L


def p5_lower():
    L = blank()
    ImageDraw.Draw(L).rounded_rectangle((470, 1290, 610, 1300), radius=5, fill=(181, 82, 59, 255))
    return L


# ---------------------------------------------------------------- ortak altyazi
def sub_layer(text, st):
    tx = lower_tr(text)
    mk = lambda z: F(st["font"], z, **st["axes"])
    size, f, lines = fit(tx, mk, 900, 2, st["hi"], st["lo"])
    L = blank()
    lh = int(size * 1.22)
    y0 = SUB_BOTTOM - len(lines) * lh
    put_lines(L, lines, f, lh, y0, W / 2, "center", st["fill"], stroke=st["stroke"], sw=st["sw"], shadow=st["shadow"])
    return L


# ---------------------------------------------------------------- paketler
PACKS = [
    dict(folder="sablon-1-editoryal", label="Şablon 1", style="Editoryal",
         scene=((236, 225, 205), (38, 52, 78), (255, 250, 240), (200, 120, 70), 90),
         logo=dict(plate=(243, 235, 221), color=NAVY, border=None),
         hook=p1_hook, sub=p1_sub, accent=p1_accent, lower=p1_lower),
    dict(folder="sablon-2-bold-sari-bar", label="Şablon 2", style="Bold sarı bar",
         scene=((27, 46, 79), (4, 10, 22), (58, 90, 140), (255, 201, 60), 60),
         logo=dict(plate=(11, 27, 51), color=WHITE, border=None),
         hook=p2_hook, sub=p2_sub, accent=p2_accent, lower=p2_lower),
    dict(folder="sablon-3-minimal-cizgi", label="Şablon 3", style="Minimal çizgi",
         scene=((221, 231, 228), (62, 76, 89), (255, 255, 255), (15, 118, 110), 50),
         logo=dict(plate=WHITE, color=NAVY, border=(15, 118, 110)),
         hook=p3_hook, sub=p3_sub, accent=p3_accent, lower=p3_lower),
    dict(folder="sablon-4-turuncu-blok", label="Şablon 4", style="Turuncu blok",
         scene=((255, 196, 160), (26, 15, 10), (255, 150, 90), (255, 255, 255), 60),
         logo=dict(plate=WHITE, color=NAVY, border=None),
         hook=p4_hook, sub=p4_sub, accent=p4_accent, lower=p4_lower),
    dict(folder="sablon-5-kum-chip", label="Şablon 5", style="Kum chip",
         scene=((246, 236, 220), (170, 120, 90), (255, 248, 238), (181, 82, 59), 40),
         logo=dict(plate=(255, 248, 238), color=NAVY, border=None),
         hook=p5_hook, sub=p5_sub, accent=p5_accent, lower=p5_lower),
]


def build_pack(pk):
    out = os.path.join(HERE, pk["folder"])
    os.makedirs(out, exist_ok=True)
    top, bot, b1, b2, a2 = pk["scene"]
    sc = scene(top, bot, b1, b2, a2)

    lg = logo_overlay(pk["logo"]["plate"], pk["logo"]["color"], pk["logo"]["border"])
    acc = pk["accent"]()
    low = pk["lower"]()
    lg.save(os.path.join(out, "logo-overlay.png"))
    acc.save(os.path.join(out, "accent-overlay.png"))
    low.save(os.path.join(out, "lower-third-overlay.png"))

    static = sc.copy()
    static.alpha_composite(acc)
    static.alpha_composite(low)
    static.alpha_composite(lg)
    hook = pk["hook"]()
    subs = [(a, b, pk["sub"](t)) for a, b, t in SEGMENTS]

    cmd = [FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(out, "sample.mp4")]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = int(DUR * FPS)
    preview_frame = int(1.0 * FPS)
    for i in range(n):
        t = i / FPS
        img = static.copy()
        if t < HOOK_END:
            img.alpha_composite(hook)
        for a, b, L in subs:
            if a <= t < b:
                img.alpha_composite(L)
                break
        rgb = img.convert("RGB")
        if i == preview_frame:
            rgb.save(os.path.join(out, "preview.jpg"), quality=92)
        if i == int(5.0 * FPS) and SCRATCH:
            os.makedirs(SCRATCH, exist_ok=True)
            rgb.save(os.path.join(SCRATCH, pk["folder"] + "-5s.jpg"), quality=92)
        p.stdin.write(rgb.tobytes())
    p.stdin.close()
    p.wait()
    assert p.returncode == 0, "ffmpeg hata verdi"
    return out


def write_spec(pk, out):
    specs = {
        "sablon-1-editoryal": dict(
            desc="Editoryal: krem zemin, lacivert metin, turuncu kisa cizgi. Sakin ve gazete tarzi.",
            colors="Krem #F3EBDD (plaka), Lacivert #14213D (hook, metin), Turuncu #E8772E (aksan), Logo #14345F",
            fonts="Hook: Fraunces (wght 620, opsz 72) | Altyazi: Inter (wght 600). Lisans: OFL",
            hook="Buyuk serif, lacivert dolgu, krem 9px kontur. Sol hizali, y=330 ustten baslar, en fazla 3 satir.",
            sub="Inter 600, 42-56px, beyaz dolgu, lacivert 8px kontur + yumusak golge. Kutu YOK. Ortali, alt sinir y=1470.",
            accent="Turuncu 160x6 kisa cizgi (y=268). Lower-third: lacivert 2px yatay cizgi (y=1292).",
            spec_extra="Logo: krem yuvarlak plaka (132px), sag ust (x=908, y=56)."),
        "sablon-2-bold-sari-bar": dict(
            desc="Bold: koyu lacivert zemin, sari hook bari, sari sol serit. Enerjik ve net.",
            colors="Koyu lacivert #0B1B33 (plaka, hook metni), Sari #FFC93C (hook bari, aksan), Beyaz #FFFFFF, Siyah kontur #000000",
            fonts="Hook: Montserrat (wght 900). Altyazi: Manrope (wght 600). Lisans: OFL",
            hook="BUYUK HARF, her satir kendi sari dolu barinda, lacivert metin. Sol x=60, y=330.",
            sub="Manrope 600, 42-56px, beyaz dolgu, siyah 9px kontur. Golge YOK (sadece kontur). Kutu YOK. Ortali, alt sinir y=1470.",
            accent="Sol kenarda sari serit 16x700 (y=300-1000). Lower-third: ortada sari 200x12 bar (y=1262).",
            spec_extra="Logo: koyu lacivert plaka uzerinde beyaz logo (logo rengi bu pakete ozel)."),
        "sablon-3-minimal-cizgi": dict(
            desc="Minimal: beyaz/acik zemin, ust ve alt ince turkuaz cizgiler, sticker tarzi altyazi.",
            colors="Turkuaz #0F766E (cizgiler, aksan), Koyu gri #1F2937 (hook), Ink #111827 (altyazi), Beyaz (halo, plaka)",
            fonts="Hook + altyazi: Plus Jakarta Sans (wght 800 hook, 600 altyazi). Lisans: OFL",
            hook="Koyu gri dolgu, beyaz 12px halo (acik ve koyu zeminde okunur). Sol x=80, y=330.",
            sub="Plus Jakarta Sans 600, 42-54px, koyu dolgu + beyaz 10px halo, golge yok. Ortali, alt sinir y=1470.",
            accent="Tam genislik ust ve alt turkuaz bantlar (10px). Lower-third: ortada 100x4 turkuaz cizgi (y=1290).",
            spec_extra="Logo: beyaz plaka, turkuaz 3px kontur, sag ust."),
        "sablon-4-turuncu-blok": dict(
            desc="Turuncu blok: tam genislik turuncu hook blogu, beyaz konturlu altyazi. Guclu ve dikkat ceken.",
            colors="Turuncu #FF5A1F (hook blogu, aksan), Beyaz #FFFFFF (hook, altyazi dolgu), Ink #111111 (kontur, ust serit)",
            fonts="Hook: Bricolage Grotesque (wght 800, opsz 96, wdth 100). Altyazi: Manrope (wght 700). Lisans: OFL",
            hook="Tam genislik turuncu blok (opak), beyaz metin, x=80, y=300, blok ic bosluk 46px.",
            sub="Manrope 700, 42-56px, beyaz dolgu, ink 12px kontur, golge yok (outlined beyaz). Ortali, alt sinir y=1470.",
            accent="Ust ink serit (14px), sol alt turuncu cubuk 180x8 (y=1822). Lower-third: turuncu 6px tam cizgi (y=1292).",
            spec_extra="Logo: beyaz plaka, lacivert logo, sag ust."),
        "sablon-5-kum-chip": dict(
            desc="Kum: yumusak kum gradyan zemin, yuvarlak etiket chipleri. Sicak ve sakin.",
            colors="Kum/krem #F6ECDC (zemin), Krem #FFF8EE (hook chip, altyazi metni), Terrakota #B5523A (altyazi chip, aksan), Kahve #3B2A20 (hook metni), Lacivert logo #14345F",
            fonts="Hook: Poppins SemiBold. Altyazi: Poppins Medium. Lisans: OFL",
            hook="Her satir krem yuvarlak chip icinde, kahve metin. x=80, y=330.",
            sub="Poppins Medium 38-50px, krem metin, TERRAKOTA OPAK YUVARLAK CHIP (yari saydam degil). Ortali, alt sinir y=1470.",
            accent="Ust sol terrakota yuvarlak cubuk 120x10 (y=268). Lower-third: ortada terrakota 140x10 yuvarlak bar (y=1290).",
            spec_extra="Logo: krem yuvarlak plaka, sag ust."),
    }
    s = specs[pk["folder"]]
    txt = f"""# {pk['label']}: {pk['style']}

{s['desc']}

Format: 1080x1920 (9:16), 30 fps. Sample: 9 sn, sessiz (ses yok).

## Renkler
{s['colors']}

## Fontlar
{s['fonts']}

## Logo
Dosya: brand/gezicorn-logo-seffaf-512.png (renk ve plaka bu pakete gore). Boyut: 96px logo, 132px plaka. Konum: sag ust (x=908, y=56). Metin olarak "gezicorn" YOK.
{s['spec_extra']}

## Hook (0.0 sn)
{s['hook']}
Hook 0.0 sn'de ekranda, narasyon da ilk 1 sn icinde baslamali. Hook ilk 3 sn gosterilir.

## Altyazi
{s['sub']}
Kucuk harf Turkce. Konversiyon: I -> ı, İ -> i (once), sonra lower().

## Aksan cizgileri ve alt bolge
{s['accent']}

## Guvenli alanlar (9:16)
- Ust 220px: logo ve ust cizgi disinda icerik yok.
- Hook alani: y 260-800.
- Altyazi alani: y 1280-1470 (alt sinir y=1470). Alttaki 450px Instagram arayuzu icin bos kalir.
- Yan kenar bosluk: 80px (sol/sag).

## Dosyalar
- logo-overlay.png: logo + plaka (1080x1920, seffaf)
- accent-overlay.png: aksan cizgileri/serit (1080x1920, seffaf)
- lower-third-overlay.png: alt bolge cizgisi/bari (1080x1920, seffaf)
- sample.mp4: 9 sn ornek (hook 0-3 sn, altyazi 1-9 sn)
- preview.jpg: 1.0 sn kare
"""
    with open(os.path.join(out, "spec.md"), "w", encoding="utf-8") as fh:
        fh.write(txt)


def comparison(paths):
    from PIL import ImageFont as IF
    tw, th = 432, 768
    gap, margin, top = 28, 50, 260
    cw = len(paths) * tw + (len(paths) - 1) * gap + 2 * margin
    ch = top + th + 60
    canvas = Image.new("RGB", (cw, ch), (245, 245, 245))
    d = ImageDraw.Draw(canvas)
    title = F("Inter.ttf", 56, weight=800)
    d.text((margin, 50), "Reels şablonları: karşılaştırma", font=title, fill=(20, 20, 20))
    sub = F("Inter.ttf", 30, weight=400)
    d.text((margin, 122), "Hook 0.0 sn, altyazı 1.0 sn kare. Aynı içerik, 5 farklı marka paketi.", font=sub, fill=(90, 90, 90))
    lab = F("Inter.ttf", 40, weight=700)
    lab2 = F("Inter.ttf", 26, weight=400)
    for i, (pk, p) in enumerate(paths):
        x = margin + i * (tw + gap)
        im = Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS)
        canvas.paste(im, (x, top))
        d.rectangle((x, top, x + tw - 1, top + th - 1), outline=(190, 190, 190), width=2)
        d.text((x, top - 84), pk["label"], font=lab, fill=(20, 20, 20))
        d.text((x, top - 40), pk["style"], font=lab2, fill=(90, 90, 90))
    canvas.save(os.path.join(HERE, "karsilastirma.jpg"), quality=92)


if __name__ == "__main__":
    done = []
    for pk in PACKS:
        out = build_pack(pk)
        write_spec(pk, out)
        done.append((pk, os.path.join(out, "preview.jpg")))
        print("ok", pk["folder"])
    comparison(done)
    print("karsilastirma ok")
