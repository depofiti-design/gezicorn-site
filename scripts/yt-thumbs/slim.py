import sys, numpy as np
from PIL import Image
def slim(img, k, cy, ry, cx=None):
    a=np.asarray(img).astype(np.float32); h,w,_=a.shape; out=np.zeros_like(a)
    cx=w*0.5 if cx is None else cx
    for y in range(h):
        wy=max(0.0,1-((y-cy)/ry)**2); s=1-k*wy
        xs=(np.arange(w)-cx)/s+cx
        x0=np.clip(np.floor(xs).astype(int),0,w-1); x1=np.clip(x0+1,0,w-1); f=(xs-np.floor(xs))[:,None]
        out[y]=a[y][x0]*(1-f)+a[y][x1]*f; out[y][(xs<0)|(xs>w-1)]=0
    return Image.fromarray(out.astype(np.uint8),'RGBA')
if __name__=='__main__':
    src,dst,k,cyr,ryr=sys.argv[1],sys.argv[2],float(sys.argv[3]),float(sys.argv[4]),float(sys.argv[5])
    im=Image.open(src).convert('RGBA'); im=im.crop(im.getbbox()); h=im.height
    bb=im.getchannel('A').crop((0,0,im.width,int(h*0.5))).getbbox()  # baş bölgesinin yatay merkezi
    slim(im,k,cy=h*cyr,ry=h*ryr,cx=(bb[0]+bb[2])/2).save(dst)
