import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps
W, H = 1280, 720
L = {
 'en': dict(top='LIVING IN PHNOM PENH', big='6 MONTHS', badge='THE REAL TRUTH', chip='~$300 / MONTH', font='Anton.ttf'),
 'ru': dict(top='ЖИЗНЬ В ПНОМПЕНЕ', big='6 МЕСЯЦЕВ', badge='ВСЯ ПРАВДА', chip='~$300 В МЕСЯЦ', font='Rubik.ttf', var='Black'),
 'es': dict(top='VIVIR EN PHNOM PENH', big='6 MESES', badge='TODA LA VERDAD', chip='~$300 AL MES', font='Anton.ttf'),
 'zh': dict(top='在金边生活', big='6个月', badge='全部真相', chip='每月约300美元', font='NotoSansSC.ttf', var='Black'),
 'ar': dict(top='الحياة في بنوم بنه', big='6 أشهر', badge='كل الحقيقة', chip='~300$ شهرياً', font='C:/Windows/Fonts/arialbd.ttf'),
}
def shape(t, lang):
    if lang != 'ar': return t
    import arabic_reshaper
    from bidi.algorithm import get_display
    return get_display(arabic_reshaper.reshape(t))
def font(cfg, size):
    f = ImageFont.truetype(cfg['font'], size)
    if cfg.get('var'):
        try: f.set_variation_by_name(cfg['var'])
        except Exception:
            try: f.set_variation_by_axes([900])
            except Exception: pass
    return f
def fit(cfg, txt, size, maxw, stroke):
    while size > 30 and font(cfg, size).getlength(txt) + 2 * stroke > maxw: size -= 4
    return font(cfg, size)
def make(lang, out):
    c = L[lang]
    bg = ImageOps.fit(Image.open('bgc_1745.jpg').convert('RGB'), (W, H), Image.LANCZOS, centering=(0.5, 0.45)).filter(ImageFilter.GaussianBlur(1.5))
    bg = ImageEnhance.Color(ImageEnhance.Brightness(bg).enhance(1.15)).enhance(1.25)
    im = bg.convert('RGBA')
    g = Image.new('L', (W, 1)); [g.putpixel((x, 0), int(200 * max(0, 1 - x / 760))) for x in range(W)]
    im.alpha_composite(Image.merge('RGBA', [Image.new('L', (W, H), 0)] * 3 + [g.resize((W, H))]))
    cut = Image.open('cut_j.png').convert('RGBA'); cut = cut.crop(cut.getbbox())
    s = 740 / cut.height; cut = cut.resize((int(cut.width * s), 740), Image.LANCZOS)
    glow = Image.new('RGBA', cut.size, (255, 255, 255, 0)); glow.putalpha(cut.getchannel('A').filter(ImageFilter.GaussianBlur(10)))
    x = W - cut.width + 170; im.alpha_composite(glow, (x, 0)); im.alpha_composite(cut, (x, 0))
    d = ImageDraw.Draw(im)
    top, big, badge, chip = (shape(c[k], lang) for k in ('top', 'big', 'badge', 'chip'))
    f = fit(c, top, 92, 660, 10); d.text((50, 40), top, font=f, fill='white', stroke_width=10, stroke_fill='black')
    f = fit(c, big, 250, 660, 14); bb = d.textbbox((40, 125), big, font=f, stroke_width=14)
    d.text((40, 125 + (125 - bb[1]) + 10), big, font=f, fill=(250, 204, 21), stroke_width=14, stroke_fill='black')
    f = fit(c, badge, 70, 560, 3); tw = f.getlength(badge); pw, ph = int(tw + 60), 108
    Lb = Image.new('RGBA', (pw + 16, ph + 16), (0, 0, 0, 0)); ld = ImageDraw.Draw(Lb)
    ld.rounded_rectangle((12, 12, pw + 12, ph + 12), 16, fill='black'); ld.rounded_rectangle((0, 0, pw, ph), 16, fill=(249, 115, 22), outline='black', width=6)
    ld.text((pw / 2, ph / 2 + 2), badge, font=f, fill='white', anchor='mm', stroke_width=3, stroke_fill='black')
    im.alpha_composite(Lb.rotate(3, expand=True, resample=Image.BICUBIC), (52, 445))
    f = fit(c, chip, 64, 560, 0); cw = int(f.getlength(chip)) + 50
    d.rounded_rectangle((60, 590, 60 + cw, 680), 14, fill='white', outline='black', width=5)
    d.text((60 + cw / 2, 636), chip, font=f, fill='black', anchor='mm')
    im.convert('RGB').save(out, quality=92)
for lang in sys.argv[1:]:
    make(lang, f'thumb_{lang}.jpg')
