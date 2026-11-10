"""Descarcă pozele produselor din stoc și le decupează curat (fără contur alb)."""
import json, re, subprocess, sys, os
import numpy as np
from PIL import Image, ImageFilter
from collections import deque
HOMIO='/tmp/claude-0/-home-user-videositehomio/ad3d0ae4-d139-5190-912a-88dc7b40385e/scratchpad/homio/'
P=json.load(open(HOMIO+'prods.json'))
IDS=['7746','7743','7738','7768','7767','7766','7775','7760','7774','7772','7770','7810','7815','7806','7805','7809','7818','7842','7826','7822','7799','7784','7783','7795','7793','7794','7780','7791']
def flood(bgl):
    h,w=bgl.shape; bg=np.zeros((h,w),bool); dq=deque()
    for x in range(w):
        for y in (0,h-1):
            if bgl[y,x] and not bg[y,x]: bg[y,x]=True; dq.append((y,x))
    for y in range(h):
        for x in (0,w-1):
            if bgl[y,x] and not bg[y,x]: bg[y,x]=True; dq.append((y,x))
    while dq:
        y,x=dq.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=y+dy,x+dx
            if 0<=ny<h and 0<=nx<w and bgl[ny,nx] and not bg[ny,nx]: bg[ny,nx]=True; dq.append((ny,nx))
    return bg
def shift(a,dy,dx):
    out=np.zeros_like(a)
    h,w=a.shape[:2]
    ys=slice(max(dy,0),h+min(dy,0)); yd=slice(max(-dy,0),h+min(-dy,0))
    xs=slice(max(dx,0),w+min(dx,0)); xd=slice(max(-dx,0),w+min(-dx,0))
    out[ys,xs]=a[yd,xd]; return out
def cutout(src,dst,size=820):
    im=Image.open(src); 
    if im.mode=='RGBA': bgc=Image.new('RGBA',im.size,(255,255,255,255)); bgc.alpha_composite(im); im=bgc
    im=im.convert('RGB'); im.thumbnail((size,size),Image.LANCZOS)
    a=np.asarray(im).astype(float); h,w,_=a.shape
    corner=a[:6,:6].reshape(-1,3).mean(0)
    near=lambda c:(np.abs(a-c).max(axis=2)<=26)
    bgl=near(corner)|(a.min(axis=2)>=238)
    bg=flood(bgl)
    alpha=(~bg)
    # taie franjul alb: erodare 2 px, apoi colorează marginea din interior
    am=Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))
    inner=np.asarray(am.filter(ImageFilter.MinFilter(5)))>128
    filled=inner.copy(); col=a*inner[...,None]
    for _ in range(7):
        acc=np.zeros_like(col); cnt=np.zeros((h,w))
        for dy in (-1,0,1):
            for dx in (-1,0,1):
                if dy==0 and dx==0: continue
                acc+=shift(col,dy,dx); cnt+=shift(filled.astype(float),dy,dx)
        new=(~filled)&(cnt>0)
        col[new]=(acc[new]/cnt[new][:,None]); filled|=new
    out=np.where(inner[...,None],a,col)
    alpha_img=am.filter(ImageFilter.GaussianBlur(0.9))
    rgba=Image.fromarray(out.clip(0,255).astype(np.uint8)).convert('RGBA'); rgba.putalpha(alpha_img)
    rgba=rgba.crop(rgba.getbbox()); rgba.save(dst,optimize=True); return rgba.size
meta={}
for pid in IDS:
    p=P[pid]; html=subprocess.run(['curl','-sSL','-m','25',p['url']],capture_output=True,text=True).stdout
    og=re.search(r'property="og:image" content="([^"]+)"',html); img=og.group(1) if og else p['img']
    raw=f'assets/img/raw_{pid}.img'; subprocess.run(['curl','-sSL','-m','30','-o',raw,img])
    try: w,h=cutout(raw,f'assets/img/{pid}.png')
    except Exception as e: print('EȘEC',pid,e); continue
    os.remove(raw)
    meta[pid]=dict(title=p['title'],price=p['price'],cat=p['cat'],url=p['url'],w=w,h=h,qty=p.get('qty'))
    print(pid,p['price'],w,h,p['title'][:50])
json.dump(meta,open('assets/products.json','w'),ensure_ascii=False,indent=1)
