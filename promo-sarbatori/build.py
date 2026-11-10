"""Generează index.html și compozițiile din compositions/ (scene scrise ca HTML static, editabile)."""
import os
FPS=30
RED, WHITE, GREEN, TERRA = '#C8202F', '#FFFFFF', '#0E4B3A', '#B4651F'
L = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122'
X = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0'
FONTS = f"""
    @font-face {{ font-family: 'Anton'; font-weight: 400; src: url('assets/fonts/anton-latin-400-normal.woff2') format('woff2'); unicode-range: {L}; }}
    @font-face {{ font-family: 'Anton'; font-weight: 400; src: url('assets/fonts/anton-latin-ext-400-normal.woff2') format('woff2'); unicode-range: {X}; }}
    @font-face {{ font-family: 'Fredoka'; font-weight: 600; src: url('assets/fonts/fredoka-latin-600-normal.woff2') format('woff2'); unicode-range: {L}; }}
    @font-face {{ font-family: 'Fredoka'; font-weight: 600; src: url('assets/fonts/fredoka-latin-ext-600-normal.woff2') format('woff2'); unicode-range: {X}; }}
    @font-face {{ font-family: 'Fredoka'; font-weight: 700; src: url('assets/fonts/fredoka-latin-700-normal.woff2') format('woff2'); unicode-range: {L}; }}
    @font-face {{ font-family: 'Fredoka'; font-weight: 700; src: url('assets/fonts/fredoka-latin-ext-700-normal.woff2') format('woff2'); unicode-range: {X}; }}
"""
COMMON = """
    #root { position: absolute; inset: 0; overflow: hidden; }
    .world { position: absolute; inset: 0; background: var(--bg); color: var(--ink); }
    .grain { position: absolute; inset: 0; opacity: .05; mix-blend-mode: multiply; background-image: url('assets/img/grain.png'); pointer-events: none; }
    .abs { position: absolute; }
    .hem { position: absolute; left: 0; right: 0; top: 1440px; bottom: 0; }
    .name { position: absolute; left: 70px; top: 290px; width: 900px; font-family: 'Anton', sans-serif; font-weight: 400; font-size: 112px; line-height: 1.14; text-transform: uppercase; color: var(--ink); letter-spacing: 0; }
    .w { display: inline-block; }
    .gold { color: #FFD84A; }
    .sub { position: absolute; font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 52px; line-height: 1.1; color: var(--ink); }
    .stk { position: absolute; filter: drop-shadow(0 18px 22px rgba(0,0,0,.35)); }
    .stk img { display: block; width: 100%; height: auto; }
    .tagpos { position: absolute; width: 560px; height: 430px; scale: .86; transform-origin: 0 0; }
    .swing { position: absolute; inset: 0; transform-origin: 50% 0; filter: drop-shadow(0 14px 14px rgba(0,0,0,.3)); }
    .string { position: absolute; left: 50%; top: 0; width: 8px; height: 110px; margin-left: -4px; background: #C8202F; }
    .tag { position: absolute; left: 0; top: 96px; width: 560px; height: 330px; background: #E9C48E; clip-path: polygon(0 56px, 56px 0, calc(100% - 56px) 0, 100% 56px, 100% 100%, 0 100%); }
    .hole { position: absolute; left: 50%; top: 26px; width: 34px; height: 34px; margin-left: -17px; border-radius: 50%; background: var(--bg); box-shadow: inset 0 0 0 6px #C9A066; }
    .tag .de { position: absolute; left: 0; right: 0; top: 66px; text-align: center; font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 52px; color: #6B4A1F; letter-spacing: .1em; }
    .tag .price { position: absolute; left: 0; right: 0; top: 142px; text-align: center; font-family: 'Anton', sans-serif; font-size: 176px; line-height: 1; color: #C8202F; white-space: nowrap; }
"""
def tag(sid, dur, x, y, de, price, rot=0):
    return f"""<div id="{sid}-tag" class="clip tagpos" data-start="0" data-duration="{dur}" style="left:{x}px;top:{y}px;rotate:{rot}deg">
        <div class="swing" id="{sid}-swing"><div class="string"></div><div class="tag"><i class="hole"></i><span class="de" data-layout-allow-overlap>{de}</span><span class="price" data-layout-allow-overlap>{price}</span></div></div>
      </div>"""
def stk(sid, name, dur, img, cx, cy, w, h, extra=''):
    return f"""<div id="{sid}-{name}" class="clip stk" data-start="0" data-duration="{dur}" style="left:{cx-w/2}px;top:{cy-h/2}px;width:{w}px;{extra}"><img id="{sid}-{name}-img" src="assets/img/{img}" alt="" /></div>"""
def names(sid, dur, lines, top=290, size=112, extra_cls=''):
    out=''
    for li,line in enumerate(lines):
        words=''.join(f'<span class="w{" gold" if g else ""}" data-layout-allow-overlap>{w}</span> ' for (w,g) in line)
        out+=words.rstrip()+('<br/>' if li<len(lines)-1 else '')
    return f"""<div id="{sid}-name" class="clip name" data-start="0" data-duration="{dur}" style="top:{top}px;font-size:{size}px">{out}</div>"""
HEM={RED:'#A51A28',WHITE:'#E6ECEE',GREEN:'#0A3A2D',TERRA:'#97531A'}
def zig(n=19):
    pts=['0 100%']
    w=100/n
    for i in range(n+1): pts.append(f'{i*w:.2f}% {(0 if i%2==0 else 16)}px')
    pts.append('100% 100%')
    return 'polygon('+','.join(pts)+')'
def scene(sid, bg, ink, dur, body, js, css='', flood=None):
    fl=''
    if flood: fl=f'tl.fromTo("#{sid}-world", {{ clipPath: "circle(0px at {flood[0]}px {flood[1]}px)" }}, {{ clipPath: "circle(2100px at {flood[0]}px {flood[1]}px)", duration: 0.55, ease: "power2.inOut" }}, 0);'
    return f"""<template>
  <style>{FONTS}{COMMON}{css}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="1080" data-height="1920">
    <div id="{sid}-world" class="world" style="--bg:{bg};--ink:{ink}">
      {body}
      <div class="hem" style="background:{HEM[bg]};clip-path:{zig()}"></div>
      <div class="grain"></div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {fl}
    {js}
    window.__timelines["{sid}"] = tl;
  </script>
</template>
"""
words_in = lambda sid, t0: f'tl.fromTo("#{sid}-name .w", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.16, stagger: 0.085, ease: "power2.out" }}, {t0});'
swing = lambda sid, t0, a=16: f'tl.fromTo("#{sid}-swing", {{ rotation: {a} }}, {{ rotation: 0, duration: 1.7, ease: "elastic.out(1, 0.35)" }}, {t0});'
OV=0.55
# (id, start, length, ...)
S=[('s1-hook',0.0,2.4),('s2-funda',2.4,2.0),('s3-globuri',4.4,2.0),('s4-mos',6.4,2.0),('s5-ghirlanda',8.4,2.0),('s6-brad',10.4,3.0),('s7-bon',13.4,3.6),('s8-transport',17.0,3.2),('s9-final',20.2,3.8)]
D={k:round(l+(OV if k!='s9-final' else 0),2) for k,s,l in S}
files={}

# S1 hook — roșu
sid='s1-hook'; d=D[sid]
files[sid]=scene(sid,RED,'#fff',d,
 names(sid,d,[[('DECORAȚIUNI',0)],[('DE',0),('CRĂCIUN',1)]])+
 stk(sid,'bell',d,'clopot.png',730,860,480,546)+
 tag(sid,d,50,900,'DE LA','11 LEI',-6),
 f"""
    tl.fromTo("#{sid}-bell-img", {{ scale: 0.86, rotation: -14, transformOrigin: "50% 8%" }}, {{ scale: 1, rotation: 0, duration: 0.9, ease: "elastic.out(1, 0.55)" }}, 0);
    tl.to("#{sid}-bell-img", {{ rotation: 4, duration: 0.28, ease: "sine.inOut", yoyo: true, repeat: 3 }}, 0.9);
    """+swing(sid,0,14))

# S2 fundă — alb
sid='s2-funda'; d=D[sid]
files[sid]=scene(sid,WHITE,GREEN,d,
 names(sid,d,[[('FUNDĂ',0),('DECORATIVĂ',0)],[('ROȘIE',1)]])+
 stk(sid,'bow',d,'funda.png',560,870,520,618)+
 tag(sid,d,400,930,'DE LA','17 LEI',5),
 words_in(sid,0.28)+f"""
    tl.fromTo("#{sid}-bow", {{ x: -900, rotation: -30, filter: "blur(18px) drop-shadow(0 18px 22px rgba(0,0,0,.35))" }}, {{ x: 0, rotation: -7, filter: "blur(0px) drop-shadow(0 18px 22px rgba(0,0,0,.35))", duration: 0.6, ease: "power4.out" }}, 0.15);
    """+swing(sid,0.55,-18),flood=(330,1130))

# S3 globuri — verde
sid='s3-globuri'; d=D[sid]
files[sid]=scene(sid,GREEN,'#fff',d,
 names(sid,d,[[('ORNAMENTE',0),('AURII',1)],[('SET',0),('24',0),('BUCĂȚI',0)]])+
 stk(sid,'tray',d,'globuri.png',540,880,860,598)+
 tag(sid,d,50,930,'DE LA','45 LEI',-5),
 words_in(sid,0.28)+f"""
    tl.fromTo("#{sid}-tray", {{ y: 900, rotation: 9, filter: "blur(14px) drop-shadow(0 18px 22px rgba(0,0,0,.35))" }}, {{ y: 0, rotation: -3, filter: "blur(0px) drop-shadow(0 18px 22px rgba(0,0,0,.35))", duration: 0.65, ease: "expo.out" }}, 0.15);
    """+swing(sid,0.6,18),flood=(330,1130))

# S4 Moș — teracotă
sid='s4-mos'; d=D[sid]
files[sid]=scene(sid,TERRA,'#fff',d,
 names(sid,d,[[('STATUETĂ',0)],[('MOȘ',0),('CRĂCIUN',1)]])+
 f'<div id="{sid}-sub" class="clip sub" data-start="0" data-duration="{d}" style="left:70px;top:548px;font-size:46px">4 mărimi, 30–90 cm</div>'+
 stk(sid,'santas',d,'mos.png',560,920,900,643)+
 tag(sid,d,470,950,'DE LA','119 LEI',5),
 words_in(sid,0.28)+f"""
    tl.fromTo("#{sid}-santas", {{ clipPath: "inset(0% 100% 0% 0%)", rotation: -6 }}, {{ clipPath: "inset(0% 0% 0% 0%)", rotation: -3, duration: 0.7, ease: "power3.out" }}, 0.2);
    tl.fromTo("#{sid}-sub", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power2.out" }}, 0.85);
    """+swing(sid,0.6,-18),flood=(710,1130))

# S5 ghirlandă — alb
sid='s5-ghirlanda'; d=D[sid]
files[sid]=scene(sid,WHITE,GREEN,d,
 names(sid,d,[[('GHIRLANDĂ',0),('270',0),('CM',0)],[('100',1),('LED-URI',1)]])+
 stk(sid,'garland',d,'ghirlanda.png',540,780,1560,264,'rotate:-14deg')+
 tag(sid,d,50,930,'DE LA','195 LEI',-5),
 words_in(sid,0.28)+f"""
    tl.fromTo("#{sid}-garland", {{ clipPath: "inset(0% 100% 0% 0%)" }}, {{ clipPath: "inset(-20% -2% -20% -2%)", duration: 0.75, ease: "power3.inOut" }}, 0.15);
    tl.fromTo("#{sid}-garland-img", {{ x: -40 }}, {{ x: 0, duration: 0.75, ease: "power3.out" }}, 0.15);
    """+swing(sid,0.6,18),flood=(330,1130))

# S6 brad — roșu
sid='s6-brad'; d=D[sid]
files[sid]=scene(sid,RED,'#fff',d,
 names(sid,d,[[('BRAD',0)],[('ARTIFICIAL',0)]],size=104)+
 f'<div id="{sid}-num" class="clip" data-start="0" data-duration="{d}" style="position:absolute;left:66px;top:540px;font-family:Anton;font-size:230px;line-height:1;color:#FFD84A"><span id="{sid}-n">0</span><span style="font-size:96px;margin-left:14px">CM</span></div>'+
 stk(sid,'tree',d,'brad.png',745,810,500,922)+
 tag(sid,d,50,930,'DE LA','359 LEI',-5),
 words_in(sid,0.28)+f"""
    tl.fromTo("#{sid}-tree", {{ clipPath: "inset(100% 0% 0% 0%)", y: 60 }}, {{ clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.95, ease: "power3.out" }}, 0.2);
    const o = {{ v: 0 }};
    tl.to(o, {{ v: 210, duration: 0.95, ease: "power3.out", onUpdate: () => {{ document.getElementById("{sid}-n").textContent = String(Math.round(o.v)); }} }}, 0.2);
    """+swing(sid,0.9,18),flood=(330,1130))

# S7 bon — verde
sid='s7-bon'; d=D[sid]
rows=[('Clopoței','11'),('Fundă roșie','17'),('Set ornamente aurii','45'),('Statuetă Moș Crăciun','119'),('Ghirlandă 270 cm LED','195'),('Brad artificial 210 cm','359')]
rows_html=''.join(f'<div id="{sid}-r{i}" class="clip row" data-start="0" data-duration="{d}" style="top:{34+i*86}px"><span class="rn">{n}</span><span class="rp">{p} lei</span></div>' for i,(n,p) in enumerate(rows))
css7="""
    .paper { position: absolute; left: 70px; top: 440px; width: 880px; height: 580px; background: #fff; box-shadow: 0 18px 30px rgba(0,0,0,.35); }
    .row { position: absolute; left: 36px; right: 36px; height: 76px; border-bottom: 3px dashed #BFC9C3; font-family: 'Fredoka', sans-serif; font-weight: 700; color: #0E4B3A; }
    .row .rn { position: absolute; left: 0; top: 10px; font-size: 44px; }
    .row .rp { position: absolute; right: 0; top: 4px; font-family: 'Anton'; font-weight: 400; font-size: 58px; color: #C8202F; }
    .tot { position: absolute; left: 0; right: 0; top: 1050px; text-align: center; font-family: 'Anton'; font-size: 236px; line-height: 1; color: #FFD84A; }
"""
files[sid]=scene(sid,GREEN,'#fff',d,
 names(sid,d,[[('CÂT',0),('COSTĂ',0),('TOT?',1)]],size=108)+
 f'<div id="{sid}-paper" class="clip paper" data-start="0" data-duration="{d}"><div class="abs" style="inset:0">{rows_html}</div></div>'+
 f'<div id="{sid}-tot" class="clip tot" data-start="0" data-duration="{d}"><span id="{sid}-tv">0</span> LEI</div>',
 words_in(sid,0.28)+f"""
    tl.fromTo("#{sid}-paper", {{ y: 1300 }}, {{ y: 0, duration: 0.6, ease: "expo.out" }}, 0.25);
    const prices = [11, 17, 45, 119, 195, 359], t0 = 0.75, gap = 0.3; let run = 0; const st = {{ v: 0 }};
    prices.forEach((p, i) => {{
      tl.fromTo("#{sid}-r" + i, {{ x: 900, opacity: 0, filter: "blur(10px)" }}, {{ x: 0, opacity: 1, filter: "blur(0px)", duration: 0.28, ease: "power3.out" }}, t0 + i * gap);
      run += p;
      tl.to(st, {{ v: run, duration: 0.25, ease: "power2.out", onUpdate: () => {{ document.getElementById("{sid}-tv").textContent = String(Math.round(st.v)); }} }}, t0 + i * gap + 0.05);
    }});
    tl.fromTo("#{sid}-tot", {{ scale: 1.0 }}, {{ scale: 1.0, duration: 0.01 }}, 0);
    tl.fromTo("#{sid}-tv", {{ opacity: 1 }}, {{ opacity: 1, duration: 0.01 }}, 0);
    """,css=css7,flood=(330,1130))

# S8 transport — alb
sid='s8-transport'; d=D[sid]
css8="""
    .box { position: absolute; left: 0; top: 0; width: 600px; height: 340px; background: linear-gradient(#D7AC6E, #BE8F50); border-radius: 8px; box-shadow: 0 22px 30px rgba(0,0,0,.3); }
    .lid { position: absolute; left: -14px; top: -34px; width: 628px; height: 92px; background: linear-gradient(#E2B97C, #CDA062); border-radius: 8px; }
    .rib { position: absolute; left: 270px; top: -34px; width: 60px; height: 374px; background: #C8202F; }
    .bowl, .bowr { position: absolute; top: -118px; width: 150px; height: 100px; background: #C8202F; border-radius: 80px 80px 80px 80px; }
    .bowl { left: 150px; transform: rotate(-24deg); } .bowr { left: 300px; transform: rotate(24deg); }
    .knot { position: absolute; left: 268px; top: -64px; width: 64px; height: 56px; background: #A9151F; border-radius: 16px; }
    .band { position: absolute; left: 70px; top: 650px; width: 760px; height: 130px; background: #C8202F; color: #fff; font-family: 'Anton'; font-size: 98px; line-height: 130px; text-align: center; }
"""
files[sid]=scene(sid,WHITE,GREEN,d,
 names(sid,d,[[('TRANSPORT',0)],[('GRATUIT',1)]],size=150)+
 f'<div id="{sid}-band" class="clip band" data-start="0" data-duration="{d}">PESTE 200 LEI</div>'+
 f'<div id="{sid}-parcel" class="clip abs" data-start="0" data-duration="{d}" style="left:240px;top:900px;width:600px;height:440px"><div class="abs" id="{sid}-pbox" style="inset:0"><div class="box"></div><div class="rib"></div><div class="lid"></div><div class="bowl"></div><div class="bowr"></div><div class="knot"></div></div></div>'+
 f'<div id="{sid}-fine" class="clip sub" data-start="0" data-duration="{d}" style="left:70px;top:1262px;font-size:42px;font-weight:600">Livrare în 24 h, în majoritatea cazurilor</div>',
 words_in(sid,0.28)+f"""
    tl.fromTo("#{sid}-band", {{ clipPath: "inset(0% 100% 0% 0%)" }}, {{ clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power3.out" }}, 0.7);
    tl.fromTo("#{sid}-pbox", {{ x: 1100, rotation: 12, filter: "blur(14px)" }}, {{ x: 0, rotation: -3, filter: "blur(0px)", duration: 0.7, ease: "power4.out" }}, 0.4);
    tl.fromTo("#{sid}-fine", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power2.out" }}, 1.3);
    """,css=css8,flood=(330,1130))

# S9 final — teracotă
sid='s9-final'; d=D[sid]
css9="""
    .hang { position: absolute; left: 280px; top: 250px; width: 520px; height: 640px; }
    .hang .sw { position: absolute; inset: 0; transform-origin: 50% 0; filter: drop-shadow(0 18px 20px rgba(0,0,0,.35)); }
    .hang .st { position: absolute; left: 50%; top: 0; width: 8px; height: 90px; margin-left: -4px; background: #fff; }
    .hang img { position: absolute; left: 0; top: 80px; width: 520px; height: auto; }
    .url { position: absolute; left: 0; right: 0; top: 920px; text-align: center; font-family: 'Anton'; font-size: 92px; color: #fff; letter-spacing: .01em; }
    .cta { position: absolute; left: 140px; top: 1070px; width: 800px; height: 136px; background: #C8202F; color: #fff; border-radius: 18px; font-family: 'Anton'; font-size: 68px; line-height: 136px; text-align: center; box-shadow: 0 16px 24px rgba(0,0,0,.3); }
"""
files[sid]=scene(sid,TERRA,'#fff',d,
 f'<div id="{sid}-hang" class="clip hang" data-start="0" data-duration="{d}"><div class="sw" id="{sid}-sw"><div class="st"></div><img src="assets/img/logo-card.png" alt="Homio" /></div></div>'+
 f'<div id="{sid}-url" class="clip url" data-start="0" data-duration="{d}">HOMIO.RO/SARBATORI</div>'+
 f'<div id="{sid}-cta" class="clip cta" data-start="0" data-duration="{d}">VEZI DECORAȚIUNILE</div>',
 f"""
    tl.fromTo("#{sid}-sw", {{ rotation: 22, y: -700 }}, {{ rotation: 0, y: 0, duration: 1.5, ease: "elastic.out(1, 0.4)" }}, 0.15);
    tl.fromTo("#{sid}-url", {{ clipPath: "inset(0% 100% 0% 0%)" }}, {{ clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "power3.out" }}, 0.75);
    tl.fromTo("#{sid}-cta", {{ scale: 0.7, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)" }}, 1.1);
    """,css=css9,flood=(540,1130))

os.makedirs('compositions',exist_ok=True)
for k,v in files.items(): open(f'compositions/{k}.html','w').write(v)

hosts=''
for i,(k,s,l) in enumerate(S):
    hosts+=f'      <div id="{k}" data-composition-id="{k}" data-composition-src="compositions/{k}.html" data-start="{s}" data-duration="{D[k]}" data-track-index="{i+1}" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:{i+1}"></div>\n'
open('index.html','w').write(f"""<!doctype html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="lib/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #C8202F; }}
      #root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="24" data-width="1080" data-height="1920" data-motion-blur="on">
{hosts}    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
""")
print('ok', D)
