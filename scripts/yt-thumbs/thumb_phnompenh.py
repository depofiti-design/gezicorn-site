import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps
W, H = 1280, 720
bgsrc, chip = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else '')
out = sys.argv[3] if len(sys.argv) > 3 else 'thumb.jpg'
bg = Image.open(bgsrc).convert('RGB')
bg = ImageOps.fit(bg, (W, H), Image.LANCZOS, centering=(0.5, float(sys.argv[4]) if len(sys.argv) > 4 else 0.4))
bg = bg.filter(ImageFilter.GaussianBlur(1.5))
bg = ImageEnhance.Brightness(bg).enhance(1.15); bg = ImageEnhance.Color(bg).enhance(1.25)
im = bg.convert('RGBA')
# sol tarafa okunabilirlik için koyu degrade
g = Image.new('L', (W, 1)); [g.putpixel((x, 0), int(200 * max(0, 1 - x / 760))) for x in range(W)]
im.alpha_composite(Image.merge('RGBA', [Image.new('L', (W, H), 0)] * 3 + [g.resize((W, H))]))
cut = Image.open('cut.png').convert('RGBA'); cut = cut.crop(cut.getbbox())
s = 740 / cut.height; cut = cut.resize((int(cut.width * s), 740), Image.LANCZOS)
cut = ImageEnhance.Brightness(cut).enhance(1.05)
# kenar parlaklığı (kesimi arka plandan ayırır)
glow = Image.new('RGBA', cut.size, (255, 255, 255, 0)); glow.putalpha(cut.getchannel('A').filter(ImageFilter.GaussianBlur(10)).point(lambda v: min(255, v)))
x = W - cut.width + 170; y = 0
im.alpha_composite(glow, (x, y)); im.alpha_composite(cut, (x, y))
d = ImageDraw.Draw(im)
def T(txt, size, xy, fill, stroke=10):
    f = ImageFont.truetype('Anton.ttf', size)
    d.text(xy, txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0))
    return f.getbbox(txt, stroke_width=stroke)
T("PHNOM PENH'TE", 92, (50, 40), (255, 255, 255))
T('6 AY', 250, (40, 125), (250, 204, 21), 14)
# turuncu rozet
f = ImageFont.truetype('Anton.ttf', 70); txt = 'TÜM GERÇEKLER'
tw = f.getlength(txt); pw, ph = int(tw + 60), 108
L = Image.new('RGBA', (pw + 16, ph + 16), (0, 0, 0, 0)); ld = ImageDraw.Draw(L)
ld.rounded_rectangle((12, 12, pw + 12, ph + 12), 16, fill=(0, 0, 0)); ld.rounded_rectangle((0, 0, pw, ph), 16, fill=(249, 115, 22), outline=(0, 0, 0), width=6)
ld.text((pw / 2, ph / 2 + 2), txt, font=f, fill=(255, 255, 255), anchor='mm', stroke_width=3, stroke_fill=(0, 0, 0))
im.alpha_composite(L.rotate(3, expand=True, resample=Image.BICUBIC), (52, 445))
if chip:
    f = ImageFont.truetype('Anton.ttf', 64); cw = int(f.getlength(chip)) + 50
    d.rounded_rectangle((60, 590, 60 + cw, 680), 14, fill=(255, 255, 255), outline=(0, 0, 0), width=5)
    d.text((60 + cw / 2, 636), chip, font=f, fill=(0, 0, 0), anchor='mm')
im.convert('RGB').save(out, quality=92)
