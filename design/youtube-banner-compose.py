from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
W,H=2560,1440
src=Image.open('c2.png').convert('RGB')
sw,sh=src.size
s=W/sw*1.0              # genişliğe göre ölçekle
img=src.resize((W,int(sh*s)),Image.LANCZOS)   # 2560x1448
shift=95                # kafayı güvenli şeride indir
canvas=Image.new('RGB',(W,H))
# üst boşluğu: üst şeridin aynası + bulanıklık
top=img.crop((0,0,W,shift+8)).transpose(Image.FLIP_TOP_BOTTOM).filter(ImageFilter.GaussianBlur(18))
canvas.paste(top,(0,0))
canvas.paste(img.crop((0,0,W,H-shift)),(0,shift))
# yumuşak geçiş
seam=canvas.crop((0,shift-30,W,shift+30)).filter(ImageFilter.GaussianBlur(10))
canvas.paste(seam.crop((0,10,W,50)),(0,shift-10))
# alt/üst karartma
ov=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
for y in range(H):
    a=0
    if y>H*0.72: a=int(140*((y-H*0.72)/(H*0.28))**1.6)
    if y<H*0.10: a=max(a,int(60*(1-y/(H*0.10))))
    d.line([(0,y),(W,y)],fill=(8,18,36,a))
canvas=Image.alpha_composite(canvas.convert('RGBA'),ov).convert('RGB')

# cam panel (bulanık + lacivert tint), yazının arkasında
bx0,by0,bx1,by1=1085,535,2085,925
region=canvas.crop((bx0,by0,bx1,by1)).filter(ImageFilter.GaussianBlur(26))
tint=Image.new('RGB',region.size,(10,26,52))
region=Image.blend(region,tint,0.52)
mask=Image.new('L',region.size,0); ImageDraw.Draw(mask).rounded_rectangle([0,0,region.size[0]-1,region.size[1]-1],radius=36,fill=255)
canvas.paste(region,(bx0,by0),mask)
d=ImageDraw.Draw(canvas)
d.rounded_rectangle([bx0,by0,bx1,by1],radius=36,outline=(232,190,140),width=3)
f=ImageFont.truetype('Fraunces.ttf',176); f.set_variation_by_axes([144,780,40,0])
sans=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',44)
sans_b=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',29)
cream=(255,253,247); sand=(232,190,140)
x0=bx0+52; y0=by0+8
d.text((x0,y0),'gezicorn',font=f,fill=cream)
d.rectangle([x0+6,y0+232,x0+260,y0+237],fill=sand)
d.text((x0+4,y0+256),'Solo travel  ·  Vize rehberi  ·  Gerçek rota',font=sans,fill=sand)
d.text((x0+4,y0+322),'YouTube @gezikorn  ·  Instagram @gezicorn  ·  TikTok @gezicorn',font=sans_b,fill=(240,236,225))
print('handles right edge:', x0+4+d.textlength('YouTube @gezikorn  ·  Instagram @gezicorn  ·  TikTok @gezicorn',font=sans_b), 'bottom', y0+322+40)
# güvenli alan kontrolü (yalnızca test için): tw kontrolü
os.makedirs('C:/Users/Pepe/Desktop/gezicorn-site/brand',exist_ok=True)
canvas.save('C:/Users/Pepe/Desktop/gezicorn-site/brand/youtube-banner-2560x1440.jpg','JPEG',quality=92,optimize=True)
# önizleme: güvenli şerit çerçeveli
pv=canvas.copy(); pd=ImageDraw.Draw(pv)
pd.rectangle([507,508,2053,931],outline=(255,0,0),width=6)
pv.resize((1280,720)).save('../banner-preview.jpg',quality=85)
print(os.path.getsize('C:/Users/Pepe/Desktop/gezicorn-site/brand/youtube-banner-2560x1440.jpg')//1024,'KB')
