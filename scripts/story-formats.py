# Instagram hikaye (Story) formatlari - kullanici 4 Kasim 2026: "hikayelerini daha anlamli bisiyler yap, 5 tane format ayarla".
# Eskiden daily-social.js tek bir hikaye duzeni kullaniyordu (build_story, social-image.py). Bu dosya 5 FARKLI, birbirinden
# gorsel olarak ayrisan duzen tanimliyor; hepsi ayni marka dilini (gz brand renkleri, Bricolage font, assets/3d/*.webp
# claymorphism nesneler, insan yok) kullaniyor. Onizleme icin: python story-formats.py preview (orneklerle 5 jpg uretir).
import importlib.util, math, os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
spec_ = importlib.util.spec_from_file_location('social_image', os.path.join(HERE, 'social-image.py'))
si = importlib.util.module_from_spec(spec_)
spec_.loader.exec_module(si)
font, gradient, wrap, fit, header, chip, visual = si.font, si.gradient, si.wrap, si.fit, si.header, si.chip, si.visual
CREAM, SAND, ORANGE, NAVY, TEAL, SOFT = si.CREAM, si.SAND, si.ORANGE, si.NAVY, si.TEAL, si.SOFT
ROOT = si.ROOT
LOGO = Image.open(os.path.join(ROOT, 'brand', 'gezicorn-logo-seffaf-512.png')).convert('RGBA')
W, H = 1080, 1920
RED = (156, 59, 44)  # gumruk damgasi kirmizisi, site paletinde zaten var


def obj3d(name, side):
    o = Image.open(os.path.join(ROOT, 'assets', '3d', name + '.webp')).convert('RGBA')
    return o.resize((side, side), Image.LANCZOS)


def base(center_header=True):
    im = gradient(W, H).convert('RGBA')
    header(im, LOGO, center=center_header)
    return im, ImageDraw.Draw(im)


def footer_cta(d, text='Yazının tamamı profildeki linkte'):
    d.text((W // 2, H - 90), text, font=font(42, 800, 24), fill=SAND, anchor='mm')


# ---------- Format 1: "Kısaca" editoryal - başlık + kapak/3D nesne + kısa cevap. Günlük otomasyonun varsayılanı. ----------
def f1_kisaca(a, cover=None):
    im, d = base()
    chip(d, W // 2, 470, a.get('kicker', 'GEZİCORN'), anchor_center=True)
    f, ls = fit(d, a['title'], W - 160, 4, [96, 88, 80, 72, 64])
    y = 590
    for ln in ls:
        d.text((W // 2, y), ln, font=f, fill=CREAM, anchor='ma')
        y += int(f.size * 1.08)
    vy = y + 50
    vh = max(380, min(560, 1500 - vy))
    vb = visual(860, vh, cover, a.get('obj', 'passport'))
    im.alpha_composite(vb, (110, vy))
    d = ImageDraw.Draw(im)
    answer_y = min(vy + vh + 110, 1660)
    if a.get('answer'):
        fb = font(52, 600, 24)
        for ln in wrap(d, a['answer'], fb, W - 180):
            d.text((W // 2, answer_y), ln, font=fb, fill=SOFT, anchor='mm')
            answer_y += 66
    footer_cta(d)
    return im.convert('RGB')


# ---------- Format 2: "Büyük sayı" - rakam/fiyat/süre hero olarak ortada, bağlam üstte/altında. ----------
def f2_sayi(a):
    im, d = base()
    chip(d, W // 2, 420, a.get('kicker', 'GEZİCORN'), anchor_center=True)
    f, ls = fit(d, a['title'], W - 160, 2, [86, 76, 68])
    y = 530
    for ln in ls:
        d.text((W // 2, y), ln, font=f, fill=CREAM, anchor='ma')
        y += int(f.size * 1.12)
    y += 50
    fbig = font(260, 800, 96)
    tw = d.textlength(a['big'], font=fbig)
    d.rounded_rectangle([W / 2 - tw / 2 - 70, y, W / 2 + tw / 2 + 70, y + 310], radius=70, fill=ORANGE)
    d.text((W // 2, y + 155), a['big'], font=fbig, fill=NAVY, anchor='mm')
    y += 390
    fsub = font(48, 600, 24)
    for ln in wrap(d, a.get('sub', ''), fsub, W - 180):
        d.text((W // 2, y), ln, font=fsub, fill=SOFT, anchor='mm')
        y += 64
    footer_cta(d)
    return im.convert('RGB')


# ---------- Format 3: "Mit kırma" - yanlış bilgi alıntı + dönük kırmızı damga + doğrusu. ----------
def f3_mit(a):
    im, d = base()
    chip(d, W // 2, 420, 'MİT Mİ GERÇEK Mİ?', anchor_center=True)
    fq = font(64, 700, 24)
    y = 560
    for ln in wrap(d, '"' + a['myth'] + '"', fq, W - 220):
        d.text((W // 2, y), ln, font=fq, fill=SOFT, anchor='mm')
        y += 86
    # dönük damga
    stamp_img = Image.new('RGBA', (560, 220), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stamp_img)
    sd.rounded_rectangle([8, 8, 552, 212], radius=24, outline=RED, width=10)
    sd.rounded_rectangle([28, 28, 532, 192], radius=14, outline=RED, width=4)
    fstamp = font(96, 800, 24)
    sd.text((280, 110), a.get('stamp', 'YANLIŞ'), font=fstamp, fill=RED, anchor='mm')
    stamp_img = stamp_img.rotate(-9, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(stamp_img, (W // 2 - stamp_img.width // 2, y + 50))
    y += 50 + stamp_img.height + 70
    d.rectangle([W // 2 - 90, y, W // 2 + 90, y + 6], fill=SAND)
    y += 50
    d.text((W // 2, y), 'DOĞRUSU', font=font(42, 800, 24), fill=SAND, anchor='mm')
    y += 70
    fa = font(60, 700, 24)
    for ln in wrap(d, a['truth'], fa, W - 180):
        d.text((W // 2, y), ln, font=fa, fill=CREAM, anchor='mm')
        y += 78
    footer_cta(d)
    return im.convert('RGB')


# ---------- Format 4: "3 adım" - numaralı mini kartlar, her biri ikon + kısa cümle. ----------
def f4_liste(a):
    im, d = base()
    chip(d, W // 2, 420, a.get('kicker', 'ÖNCE BUNLARI YAP'), anchor_center=True)
    f, ls = fit(d, a['title'], W - 160, 2, [78, 70, 62])
    y = 530
    for ln in ls:
        d.text((W // 2, y), ln, font=f, fill=CREAM, anchor='ma')
        y += int(f.size * 1.12)
    y += 70
    card_h, gap, pad = 230, 34, 60
    CARD = (22, 69, 64)  # convert('RGB') alfa harmanlamadığı için düz (alfasız) renk kullan
    for i, item in enumerate(a['items'][:3], 1):
        x0, x1 = pad, W - pad
        d.rounded_rectangle([x0, y, x1, y + card_h], radius=36, fill=CARD)
        d.rounded_rectangle([x0, y, x0 + 110, y + card_h], radius=36, fill=SAND)
        d.rectangle([x0 + 55, y, x0 + 110, y + card_h], fill=SAND)
        d.text((x0 + 55, y + card_h / 2), str(i), font=font(80, 800, 24), fill=NAVY, anchor='mm')
        icon = obj3d(item.get('obj', 'passport'), card_h - 40)
        im.alpha_composite(icon, (x0 + 130, y + 20))
        fi = font(46, 600, 24)
        tx = x0 + 130 + icon.width + 30
        lines = wrap(ImageDraw.Draw(im), item['text'], fi, x1 - tx - 20)[:3]
        ty = y + card_h / 2 - (len(lines) * 56) / 2 + 28
        for ln in lines:
            d2 = ImageDraw.Draw(im)
            d2.text((tx, ty), ln, font=fi, fill=CREAM, anchor='lm')
            ty += 56
        y += card_h + gap
        d = ImageDraw.Draw(im)
    footer_cta(d)
    return im.convert('RGB')


# ---------- Format 5: "Önce / Şimdi" karşılaştırma - iki sütun, kural değişikliği / karşılaştırma için. ----------
def f5_karsilastir(a):
    im, d = base()
    chip(d, W // 2, 420, a.get('kicker', 'NE DEĞİŞTİ?'), anchor_center=True)
    f, ls = fit(d, a['title'], W - 160, 2, [78, 70, 62])
    y = 530
    for ln in ls:
        d.text((W // 2, y), ln, font=f, fill=CREAM, anchor='ma')
        y += int(f.size * 1.12)
    y += 80
    colw = (W - 180) / 2
    cols = [(90, a['left'], SOFT, False), (90 + colw + 60, a['right'], ORANGE, True)]
    top = y
    bottom = top + 820
    for x0, col, accent, hi in cols:
        if hi:
            d.rounded_rectangle([x0 - 24, top - 24, x0 + colw + 24, bottom], radius=40, outline=ORANGE, width=6)
        d.text((x0 + colw / 2, top + 30), col['label'], font=font(44, 800, 24), fill=accent, anchor='mm')
        icon = obj3d(col.get('obj', 'stampobj'), int(colw * 0.72))
        im.alpha_composite(icon, (int(x0 + colw / 2 - icon.width / 2), top + 90))
        d = ImageDraw.Draw(im)
        fb2 = font(68, 800, 24)
        d.text((x0 + colw / 2, top + 90 + icon.height + 70), col['big'], font=fb2, fill=CREAM, anchor='mm')
        fs = font(38, 500, 24)
        ty = top + 90 + icon.height + 150
        for ln in wrap(d, col.get('sub', ''), fs, colw - 30):
            d.text((x0 + colw / 2, ty), ln, font=fs, fill=SOFT, anchor='mm')
            ty += 50
    d.text((W // 2, top + 300), '→', font=font(70, 800, 24), fill=SAND, anchor='mm')
    footer_cta(d)
    return im.convert('RGB')


def preview():
    out = os.path.join(HERE, 'tmp-story-preview')
    os.makedirs(out, exist_ok=True)

    f1_kisaca({
        'kicker': 'VİZE', 'title': 'Pasaport harcı ne kadar oldu?', 'obj': 'passport',
        'answer': '10 yıllık pasaport için toplam yaklaşık 14.761 TL (13.410 TL harç + 1.351 TL defter bedeli), 1 Ocak 2026\'dan beri geçerli.',
    }).save(os.path.join(out, '1-kisaca.jpg'), quality=92)

    f2_sayi({
        'kicker': 'SCHENGEN', 'title': 'Kısa süreli Schengen vizesi ücreti', 'big': '90€',
        'sub': 'Yetişkin için standart ücret, 6-12 yaş arası çocuklarda 45€. 6 yaş altı ücretsiz.',
    }).save(os.path.join(out, '2-sayi.jpg'), quality=92)

    f3_mit({
        'myth': 'Kamboçya vizesi tamamen kaldırıldı, artık kapıda hiç işlem yok.',
        'stamp': 'YANLIŞ', 'truth': 'E-vize hâlâ geçerli ve gerekli. Sadece bazı ülkeler için kapıda vize kolaylığı var, deport haberleri farklı bir konu.',
    }).save(os.path.join(out, '3-mit.jpg'), quality=92)

    f4_liste({
        'kicker': 'ÇIKMADAN ÖNCE', 'title': 'Yurt dışına çıkmadan önce 3 kontrol', 'items': [
            {'obj': 'passport', 'text': 'Pasaport geçerlilik süresi en az 6 ay olmalı'},
            {'obj': 'phone', 'text': 'Seyahat sigortası poliçesini telefonuna kaydet'},
            {'obj': 'ticket', 'text': 'Dönüş bileti ya da devam bileti hazır olsun'},
        ],
    }).save(os.path.join(out, '4-liste.jpg'), quality=92)

    f5_karsilastir({
        'kicker': 'TAYLAND KURAL DEĞİŞİKLİĞİ', 'title': 'Vizesiz kalış süresi değişti',
        'left': {'label': 'ESKİ', 'obj': 'passport', 'big': '60 gün', 'sub': '15 Eylül 2026\'dan önce geçerliydi'},
        'right': {'label': 'YENİ', 'obj': 'stampobj', 'big': '30 gün', 'sub': 'TDAC varış kartı zorunlu, resmi sistemden doldurulur'},
    }).save(os.path.join(out, '5-karsilastir.jpg'), quality=92)

    print('ok, 5 onizleme uretildi:', out)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        preview()
    else:
        print('kullanim: python story-formats.py preview')
