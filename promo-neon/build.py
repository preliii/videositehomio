"""Homio · Crăciun · stil neon (referință: reclamă TikTok cu fundal închis, neon roșu, text cromat). 19 s, 1080×1920, 30 fps.
Toate iconițele sunt desenate aici (SVG), fără poze de produse. Rulare: python3 build.py"""
import os, random, json

DUR = 19.0
L = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122'
X = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0'
FONTS = f"""
    @font-face {{ font-family: 'Anton'; font-weight: 400; src: url('assets/fonts/anton-latin-400-normal.woff2') format('woff2'); unicode-range: {L}; }}
    @font-face {{ font-family: 'Anton'; font-weight: 400; src: url('assets/fonts/anton-latin-ext-400-normal.woff2') format('woff2'); unicode-range: {X}; }}
    @font-face {{ font-family: 'Fredoka'; font-weight: 700; src: url('assets/fonts/fredoka-latin-700-normal.woff2') format('woff2'); unicode-range: {L}; }}
    @font-face {{ font-family: 'Fredoka'; font-weight: 700; src: url('assets/fonts/fredoka-latin-ext-700-normal.woff2') format('woff2'); unicode-range: {X}; }}
"""
CSS = """
    #root { position: absolute; inset: 0; overflow: hidden; }
    .world { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 38%, #1d2740 0%, #101829 55%, #070b14 100%); }
    .scan { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 2px, transparent 2px 6px); z-index: 30; pointer-events: none; }
    .grain { position: absolute; inset: 0; opacity: .07; mix-blend-mode: overlay; background-image: url('assets/img/grain.png'); z-index: 31; pointer-events: none; }
    .vig { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%); z-index: 29; pointer-events: none; }
    .abs { position: absolute; }
    .chrome { background: linear-gradient(180deg, #ffffff 0%, #eef1f8 30%, #aab3c6 49%, #566075 52%, #d4dbea 70%, #ffffff 100%); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; padding: 46px 16px 16px; margin: -46px -16px -16px; font-family: 'Anton', sans-serif; text-transform: uppercase; white-space: nowrap; line-height: 1; filter: drop-shadow(0 5px 0 #0a0f1c) drop-shadow(0 0 22px rgba(255,255,255,.22)); }
    .neon { color: #ff4655; font-family: 'Anton', sans-serif; text-transform: uppercase; white-space: nowrap; line-height: 1; text-shadow: 0 0 6px #ff2d3f, 0 0 18px #ff2d3f, 0 0 44px rgba(255,45,63,.8); }
    .lite { color: #cfd6e6; font-family: 'Fredoka', sans-serif; font-weight: 700; text-transform: uppercase; white-space: nowrap; line-height: 1; letter-spacing: .02em; }
    .box { position: absolute; border: 7px solid #ff4655; box-shadow: 0 0 14px #ff2d3f, 0 0 40px rgba(255,45,63,.7), inset 0 0 22px rgba(255,45,63,.55); background: rgba(255,45,63,.08); }
    .plate { position: absolute; background: linear-gradient(180deg, #ff3b4b, #c1101f); box-shadow: 0 0 30px rgba(255,45,63,.65), 0 10px 0 #5a0710; }
    .plate span { display: block; color: #fff; font-family: 'Anton'; text-transform: uppercase; white-space: nowrap; line-height: 1; text-align: center; }
    .gb { position: absolute; left: 0; width: 1080px; z-index: 40; pointer-events: none; opacity: 0; }
    .badge { position: absolute; width: 190px; height: 190px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ff6572, #d4101f 60%, #8d0814); box-shadow: 0 0 26px rgba(255,45,63,.8), inset 0 -8px 0 rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; flex-direction: column; color: #fff; font-family: 'Anton'; line-height: .95; text-align: center; }
    .badge b { font-weight: 400; font-size: 58px; } .badge i { font-style: normal; font-size: 40px; }
    .slash { position: absolute; width: 8px; background: linear-gradient(180deg, transparent, #fff 20%, #fff 80%, transparent); box-shadow: 0 0 18px #fff; transform-origin: 50% 50%; }
"""

def glitch_bars(sid, seed, n=7):
    r = random.Random(seed); out = ''
    for i in range(n):
        h = r.choice([14, 22, 38, 64, 96, 140]); top = r.randint(180, 1500); col = r.choice(['#ffffff', '#ff3b4b', '#ffffff', '#9fb7ff'])
        out += f'<i id="{sid}-gb{i}" class="gb" style="top:{top}px;height:{h}px;background:{col}"></i>'
    return out

def glitch_js(sid, t0, n=7, seed=1):
    r = random.Random(seed + 7); js = ''
    for i in range(n):
        dx = r.randint(-340, 340); d = r.uniform(.05, .12); st = t0 + r.uniform(0, .12)
        js += f'tl.set("#{sid}-gb{i}", {{ opacity: 1, x: {dx} }}, {st:.3f});\n'
        js += f'tl.to("#{sid}-gb{i}", {{ opacity: 0, x: {-dx // 3}, duration: {d:.2f}, ease: "power2.out" }}, {st:.3f});\n'
    return js

# ───────────────────────── icoane (SVG, cromate) ─────────────────────────
def defs(p):
    return f"""<defs>
      <linearGradient id="{p}ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".32" stop-color="#e8ecf5"/><stop offset=".5" stop-color="#8d97ad"/><stop offset=".53" stop-color="#4a5468"/><stop offset=".72" stop-color="#cfd6e6"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
      <linearGradient id="{p}rd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6572"/><stop offset="1" stop-color="#b30f1d"/></linearGradient>
    </defs>"""

def icon_tree(p):
    return f"""<svg id="{p}" viewBox="0 0 400 420" width="100%" height="100%">{defs(p)}
      <g stroke="#0a0f1c" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
        <rect x="170" y="340" width="60" height="62" fill="url(#{p}ch)"/>
        <polygon points="200,150 345,345 55,345" fill="url(#{p}ch)"/>
        <polygon points="200,85 320,235 80,235" fill="url(#{p}ch)"/>
        <polygon points="200,30 290,140 110,140" fill="url(#{p}ch)"/>
        <polygon points="200,-12 214,18 246,20 222,40 230,70 200,54 170,70 178,40 154,20 186,18" fill="url(#{p}rd)" transform="translate(0,-6)"/>
      </g>
      <g fill="url(#{p}rd)" stroke="#0a0f1c" stroke-width="5"><circle cx="150" cy="215" r="14"/><circle cx="250" cy="195" r="14"/><circle cx="200" cy="290" r="15"/><circle cx="120" cy="320" r="13"/><circle cx="285" cy="318" r="13"/></g>
      <path d="M120,120 L168,60 M130,215 L190,140 M96,330 L176,235" stroke="#fff" stroke-opacity=".7" stroke-width="6" fill="none" stroke-linecap="round"/>
    </svg>"""

def icon_ball(p):
    return f"""<svg id="{p}" viewBox="0 0 400 420" width="100%" height="100%">{defs(p)}
      <g stroke="#0a0f1c" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
        <path d="M200,60 C200,30 235,20 245,45" fill="none" stroke="url(#{p}ch)" stroke-width="12"/>
        <rect x="165" y="68" width="70" height="42" rx="8" fill="url(#{p}rd)"/>
        <circle cx="200" cy="245" r="140" fill="url(#{p}ch)"/>
        <path d="M70,215 Q200,300 330,215 L330,265 Q200,350 70,265 Z" fill="url(#{p}rd)"/>
      </g>
      <ellipse cx="140" cy="170" rx="34" ry="52" fill="#fff" fill-opacity=".85" transform="rotate(35 140 170)"/>
      <circle cx="270" cy="330" r="12" fill="#fff" fill-opacity=".7"/>
    </svg>"""

def icon_garland(p):
    import math
    pts = []
    for i, x in enumerate(range(52, 352, 27)):
        y = 215 + 28 * math.sin(x / 48.0)
        for sg in (-1, 1):
            ang = math.radians(-62 * sg + (8 if i % 2 else -8))
            pts.append((x, y, x + 56 * math.cos(ang), y + 56 * math.sin(ang) * -1 if sg < 0 else y + 56 * abs(math.sin(ang))))
    needles = ''.join(f'<path d="M{x:.0f},{y:.0f} L{x2:.0f},{y2:.0f}"/>' for x, y, x2, y2 in pts)
    cols = ['r', 'w']
    bulbs = ''.join(f'<circle cx="{x}" cy="{215 + 28 * math.sin(x / 48.0):.0f}" r="17" fill="{"url(#%srd)" % p if cols[i % 2] == "r" else "#fff"}" stroke="#0a0f1c" stroke-width="5"/>' for i, x in enumerate(range(72, 340, 54)))
    return f"""<svg id="{p}" viewBox="0 0 400 420" width="100%" height="100%">{defs(p)}
      <g stroke="#0a0f1c" stroke-width="26" stroke-linecap="round">{needles}</g>
      <g stroke="url(#{p}ch)" stroke-width="14" stroke-linecap="round">{needles}</g>
      <path d="{' '.join(('M' if i == 0 else 'L') + f'{x},{215 + 28 * math.sin(x / 48.0):.0f}' for i, x in enumerate(range(40, 366, 6)))}" stroke="#0a0f1c" stroke-width="30" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="{' '.join(('M' if i == 0 else 'L') + f'{x},{215 + 28 * math.sin(x / 48.0):.0f}' for i, x in enumerate(range(40, 366, 6)))}" stroke="url(#{p}ch)" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      {bulbs}
    </svg>"""

def icon_santa(p):
    return f"""<svg id="{p}" viewBox="0 0 400 420" width="100%" height="100%">{defs(p)}
      <g stroke="#0a0f1c" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
        <ellipse cx="200" cy="215" rx="82" ry="66" fill="#f4dccb"/>
        <path d="M112,205 Q70,380 200,410 Q330,380 288,205 Q250,252 200,234 Q150,252 112,205 Z" fill="url(#{p}ch)"/>
        <ellipse cx="168" cy="244" rx="38" ry="20" fill="url(#{p}ch)" transform="rotate(12 168 244)"/>
        <ellipse cx="232" cy="244" rx="38" ry="20" fill="url(#{p}ch)" transform="rotate(-12 232 244)"/>
        <path d="M96,166 Q112,22 250,34 Q306,52 304,172 Q200,150 96,166 Z" fill="url(#{p}rd)"/>
        <rect x="84" y="150" width="232" height="50" rx="25" fill="url(#{p}ch)"/>
        <circle cx="312" cy="48" r="32" fill="url(#{p}ch)"/>
      </g>
      <g fill="#0a0f1c"><circle cx="166" cy="212" r="8"/><circle cx="234" cy="212" r="8"/></g>
      <circle cx="200" cy="232" r="12" fill="#e0805f" stroke="#0a0f1c" stroke-width="4"/>
    </svg>"""

def icon_bell(p):
    return f"""<svg id="{p}" viewBox="0 0 400 420" width="100%" height="100%">{defs(p)}
      <g stroke="#0a0f1c" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
        <circle cx="200" cy="62" r="22" fill="none" stroke="url(#{p}ch)" stroke-width="12"/>
        <path d="M200,80 C130,80 110,170 100,260 L70,320 L330,320 L300,260 C290,170 270,80 200,80 Z" fill="url(#{p}ch)"/>
        <circle cx="200" cy="350" r="36" fill="url(#{p}rd)"/>
        <path d="M90,300 Q200,330 310,300" fill="none" stroke="url(#{p}rd)" stroke-width="14"/>
      </g>
      <path d="M150,130 Q130,220 135,270" stroke="#fff" stroke-opacity=".85" stroke-width="14" fill="none" stroke-linecap="round"/>
    </svg>"""

def icon_parcel(p):
    return f"""<svg id="{p}" viewBox="0 0 400 420" width="100%" height="100%">{defs(p)}
      <g stroke="#0a0f1c" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
        <rect x="40" y="170" width="320" height="220" rx="10" fill="url(#{p}ch)"/>
        <rect x="26" y="130" width="348" height="64" rx="10" fill="url(#{p}ch)"/>
        <rect x="170" y="130" width="60" height="260" fill="url(#{p}rd)"/>
        <path d="M200,130 C120,110 90,30 150,40 C190,48 200,100 200,130 Z M200,130 C280,110 310,30 250,40 C210,48 200,100 200,130 Z" fill="url(#{p}rd)"/>
      </g>
      <path d="M60,215 L60,360" stroke="#fff" stroke-opacity=".8" stroke-width="12" stroke-linecap="round"/>
    </svg>"""

def scene(sid, start, dur, body, js, css=''):
    html = f"""<template>
  <style>{FONTS}{CSS}{css}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="1080" data-height="1920">
    <div id="{sid}-world" class="world">
{body}
      <div class="vig"></div><div class="scan"></div><div class="grain"></div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{js}
    window.__timelines["{sid}"] = tl;
  </script>
</template>
"""
    open(f'compositions/{sid}.html', 'w').write(html)
    SC.append((sid, start, dur))

SC = []
os.makedirs('compositions', exist_ok=True)

# ───────────── S1 · 0,0–1,6 · „Crăciunul vine!” ─────────────
sid = 's1'
body = (glitch_bars(sid, 11) +
        f'<div class="abs" style="left:0;top:215px;width:1080px;text-align:center"><div id="{sid}-t1" class="chrome" style="font-size:176px;display:inline-block">CRĂCIUNUL</div></div>' +
        f'<div class="abs" style="left:0;top:415px;width:1080px;text-align:center"><div id="{sid}-t2" class="neon" style="font-size:270px;display:inline-block">VINE!</div></div>' +
        f'<div id="{sid}-ic" class="abs" style="left:240px;top:760px;width:600px;height:630px">{icon_tree(sid + "i")}</div>' +
        f'<div id="{sid}-ln" class="box" style="left:150px;top:722px;width:780px;height:0;border-width:4px 0 0 0"></div>')
js = f"""
    tl.fromTo("#{sid}-t1", {{ x: -80, skewX: -14, opacity: 1, filter: "blur(8px)" }}, {{ x: 0, skewX: -10, opacity: 1, filter: "blur(0px)", duration: 0.28, ease: "expo.out" }}, 0);
    tl.fromTo("#{sid}-t2", {{ scale: 1.35, skewX: -14, opacity: 1 }}, {{ scale: 1, skewX: -10, opacity: 1, duration: 0.3, ease: "back.out(2)" }}, 0.12);
    tl.fromTo("#{sid}-ic", {{ y: 90, scale: 0.8, opacity: 1 }}, {{ y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)" }}, 0.25);
    tl.fromTo("#{sid}-ln", {{ scaleX: 0, opacity: 1 }}, {{ scaleX: 1, opacity: 1, duration: 0.4, ease: "power3.out" }}, 0.3);
    tl.to("#{sid}-ic", {{ y: -14, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }}, 0.8);
    {glitch_js(sid, 0.0, seed=1)}{glitch_js(sid, 1.38, seed=2)}
"""
scene(sid, 0.0, 1.6, body, js)

# ───────────── S2 · 1,6–5,2 · 4 categorii ─────────────
sid = 's2'
cats = [('BRAZI', icon_tree, 'L'), ('GLOBURI', icon_ball, 'R'), ('GHIRLANDE', icon_garland, 'L'), ('MOȘ CRĂCIUN', icon_santa, 'R')]
body = glitch_bars(sid, 21, 9); js = ''
SL = 0.9
for i, (word, ic, side) in enumerate(cats):
    fs = 150 if len(word) <= 9 else 128
    body += (f'<div id="{sid}-w{i}" class="abs" style="left:0;top:235px;width:1080px;text-align:center"><div class="chrome" style="font-size:{fs}px;display:inline-block">{word}</div></div>'
             f'<div id="{sid}-i{i}" class="abs" style="left:170px;top:430px;width:740px;height:777px">{ic(f"{sid}ic{i}")}</div>'
             f'<div id="{sid}-s{i}" class="slash" style="left:538px;top:430px;height:790px;opacity:0;transform:skewX(-8deg)"></div>'
             f'<div id="{sid}-b{i}" class="badge" style="left:{760 if side == "L" else 130}px;top:{1040}px"><b>ÎN</b><i>STOC</i></div>')
    t = i * SL; dx = -620 if side == 'L' else 620
    js += (f'tl.fromTo("#{sid}-w{i}", {{ x: {dx}, skewX: -14, opacity: 0 }}, {{ x: 0, skewX: -10, opacity: 1, duration: 0.26, ease: "expo.out" }}, {t:.2f});\n'
           f'tl.fromTo("#{sid}-i{i}", {{ x: {-dx}, scale: 0.85, opacity: 0 }}, {{ x: 0, scale: 1, opacity: 1, duration: 0.34, ease: "back.out(1.5)" }}, {t + .06:.2f});\n'
           f'tl.fromTo("#{sid}-s{i}", {{ scaleY: 0, opacity: 0 }}, {{ scaleY: 1, opacity: 1, duration: 0.2, ease: "power3.out" }}, {t + .1:.2f});\n'
           f'tl.fromTo("#{sid}-b{i}", {{ scale: 0.1, rotation: -50, opacity: 0 }}, {{ scale: 1, rotation: -8, opacity: 1, duration: 0.32, ease: "back.out(2.4)" }}, {t + .3:.2f});\n')
    if i < 3:
        js += (f'tl.to("#{sid}-w{i}", {{ x: {-dx}, opacity: 0, duration: 0.14, ease: "power3.in" }}, {t + SL - .16:.2f});\n'
               f'tl.to("#{sid}-i{i}", {{ x: {dx}, opacity: 0, duration: 0.14, ease: "power3.in" }}, {t + SL - .16:.2f});\n'
               f'tl.to(["#{sid}-s{i}", "#{sid}-b{i}"], {{ opacity: 0, duration: 0.1 }}, {t + SL - .16:.2f});\n')
    js += glitch_js(sid, t - 0.0 if i else 0.0, 5, seed=30 + i)
scene(sid, 1.6, 3.6, body, js)

# ───────────── S3 · 5,2–7,8 · „Decorațiuni de la 11 lei” ─────────────
sid = 's3'
rects = ''.join(f'<div id="{sid}-r{i}" class="box" style="left:{140 - i * 70}px;top:{560 - i * 90}px;width:{800 + i * 140}px;height:{700 + i * 180}px;border-width:5px"></div>' for i in range(5))
body = (glitch_bars(sid, 41) + rects +
        f'<div id="{sid}-pl" class="plate" style="left:90px;top:540px;width:900px;height:250px"><span style="font-size:118px;margin-top:60px">DECORAȚIUNI</span></div>' +
        f'<div id="{sid}-pl2" class="plate" style="left:150px;top:830px;width:790px;height:230px;background:linear-gradient(180deg,#fff,#dfe4ee);box-shadow:0 0 30px rgba(255,255,255,.4),0 10px 0 #4a5468"><span style="font-size:112px;margin-top:55px;color:#c1101f">DE LA 11 LEI</span></div>' +
        f'<div id="{sid}-ic" class="abs" style="left:660px;top:1070px;width:320px;height:336px">{icon_bell(sid + "i")}</div>' +
        f'<div id="{sid}-sub" class="lite" style="position:absolute;left:0;top:1130px;width:680px;text-align:right;font-size:44px;font-style:italic">pe homio.ro</div>')
js = f"""
    {''.join(f'tl.fromTo("#{sid}-r{i}", {{ scale: 0.4, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.35, ease: "power3.out" }}, {i * 0.05:.2f});' for i in range(5))}
    tl.fromTo("#{sid}-pl", {{ x: -900, rotation: -9, opacity: 1 }}, {{ x: 0, rotation: -4, opacity: 1, duration: 0.34, ease: "expo.out" }}, 0.2);
    tl.fromTo("#{sid}-pl2", {{ x: 900, rotation: 9, opacity: 1 }}, {{ x: 0, rotation: -2, opacity: 1, duration: 0.34, ease: "expo.out" }}, 0.5);
    tl.fromTo("#{sid}-ic", {{ scale: 0.1, rotation: -30, opacity: 0 }}, {{ scale: 1, rotation: 8, opacity: 1, duration: 0.45, ease: "back.out(2.2)" }}, 0.95);
    tl.to("#{sid}-ic", {{ rotation: -8, duration: 0.16, yoyo: true, repeat: 3, ease: "sine.inOut" }}, 1.4);
    tl.fromTo("#{sid}-sub", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }}, 1.2);
    {glitch_js(sid, 0.0, seed=4)}
"""
scene(sid, 5.2, 2.6, body, js)

# ───────────── S4 · 7,8–10,4 · „Peste 40 de produse în stoc” ─────────────
sid = 's4'
body = (glitch_bars(sid, 51) +
        f'<div class="abs" style="left:0;top:300px;width:1080px;text-align:center"><div id="{sid}-pe" class="lite" style="font-size:64px;font-style:italic;display:inline-block">PESTE</div></div>' +
        f'<div class="abs" style="left:0;top:380px;width:1080px;text-align:center"><div id="{sid}-n" class="chrome" style="font-size:520px;display:inline-block"><span id="{sid}-nv">0</span></div></div>' +
        f'<div id="{sid}-bx" class="box" style="left:100px;top:930px;width:880px;height:200px"></div>' +
        f'<div class="abs" style="left:100px;top:930px;width:880px;height:200px;display:flex;align-items:center;justify-content:center"><div id="{sid}-nt" class="neon" style="font-size:96px">PRODUSE ÎN STOC</div></div>' +
        f'<div id="{sid}-lo" class="lite" style="position:absolute;left:0;top:1200px;width:1080px;text-align:center;font-size:48px;font-style:italic">decorațiuni de Crăciun</div>')
js = f"""
    const o = {{ v: 0 }};
    tl.fromTo("#{sid}-pe", {{ opacity: 0, y: -30 }}, {{ opacity: 1, y: 0, duration: 0.2, ease: "power3.out" }}, 0.05);
    tl.fromTo("#{sid}-n", {{ scale: 1.5, skewX: -14, opacity: 0, filter: "blur(10px)" }}, {{ scale: 1, skewX: -10, opacity: 1, filter: "blur(0px)", duration: 0.3, ease: "expo.out" }}, 0.1);
    tl.to(o, {{ v: 40, duration: 0.7, ease: "power3.out", onUpdate: () => {{ document.getElementById("{sid}-nv").textContent = String(Math.round(o.v)) + (o.v >= 39.5 ? "+" : ""); }} }}, 0.1);
    tl.fromTo("#{sid}-bx", {{ scaleX: 0, opacity: 0 }}, {{ scaleX: 1, opacity: 1, duration: 0.3, ease: "power3.out" }}, 0.55);
    tl.fromTo("#{sid}-nt", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.25, ease: "power2.out" }}, 0.8);
    tl.fromTo("#{sid}-lo", {{ opacity: 0, y: 24 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }}, 1.2);
    {glitch_js(sid, 0.0, seed=5)}
"""
scene(sid, 7.8, 2.6, body, js)

# ───────────── S5 · 10,4–13,4 · „Transport gratuit peste 200 lei” ─────────────
sid = 's5'
lines = ''.join(f'<i id="{sid}-sp{i}" class="abs" style="left:{40 + i * 26}px;top:{860 + i * 56}px;width:{260 + i * 30}px;height:10px;border-radius:5px;background:rgba(255,255,255,.75);z-index:4"></i>' for i in range(4))
body = (glitch_bars(sid, 61) +
        f'<div class="abs" style="left:0;top:230px;width:1080px;text-align:center"><div id="{sid}-t1" class="chrome" style="font-size:168px;display:inline-block">TRANSPORT</div></div>' +
        f'<div class="abs" style="left:0;top:420px;width:1080px;text-align:center"><div id="{sid}-t2" class="neon" style="font-size:210px;display:inline-block">GRATUIT</div></div>' +
        lines +
        f'<div id="{sid}-pc" class="abs" style="left:310px;top:660px;width:520px;height:545px;z-index:5">{icon_parcel(sid + "i")}</div>' +
        f'<div id="{sid}-pl" class="plate" style="left:110px;top:1230px;width:780px;height:150px;z-index:6;transform-origin:50% 50%"><span style="font-size:82px;margin-top:32px">PESTE 200 LEI</span></div>')
js = f"""
    tl.fromTo("#{sid}-t1", {{ x: -700, skewX: -14, opacity: 0 }}, {{ x: 0, skewX: -10, opacity: 1, duration: 0.3, ease: "expo.out" }}, 0.05);
    tl.fromTo("#{sid}-t2", {{ x: 700, skewX: -14, opacity: 0 }}, {{ x: 0, skewX: -10, opacity: 1, duration: 0.3, ease: "expo.out" }}, 0.25);
    tl.fromTo("#{sid}-pc", {{ x: 900, rotation: 14, opacity: 0 }}, {{ x: 0, rotation: -4, opacity: 1, duration: 0.5, ease: "expo.out" }}, 0.55);
    tl.fromTo(["#{sid}-sp0", "#{sid}-sp1", "#{sid}-sp2", "#{sid}-sp3"], {{ scaleX: 0, transformOrigin: "100% 50%", opacity: 0 }}, {{ scaleX: 1, opacity: 1, duration: 0.25, ease: "power3.out", stagger: 0.05 }}, 0.65);
    tl.fromTo("#{sid}-pl", {{ scale: 0.2, rotation: 10, opacity: 0 }}, {{ scale: 1, rotation: -3, opacity: 1, duration: 0.4, ease: "back.out(2)" }}, 1.15);
    tl.to("#{sid}-pc", {{ y: -22, duration: 0.14, ease: "power2.out" }}, 1.6).to("#{sid}-pc", {{ y: 0, duration: 0.2, ease: "bounce.out" }}, 1.74);
    {glitch_js(sid, 0.0, seed=6)}
"""
scene(sid, 10.4, 3.0, body, js)

# ───────────── S6 · 13,4–16,6 · „Comandă online” (telefon neon, zoom prin el) ─────────────
sid = 's6'
body = (glitch_bars(sid, 71) +
        f'<div id="{sid}-pill" class="box" style="left:210px;top:235px;width:660px;height:120px;border-radius:60px"></div>' +
        f'<div class="abs" style="left:210px;top:235px;width:660px;height:120px;display:flex;align-items:center;justify-content:center"><div id="{sid}-pt" class="lite" style="font-size:58px;color:#ff6572;text-shadow:0 0 14px #ff2d3f;font-style:italic">COMANDĂ ONLINE &#9906;</div></div>' +
        f'<div id="{sid}-ph" class="abs" style="left:250px;top:400px;width:580px;height:900px"><div class="abs" style="inset:0;border:12px solid #fff;border-radius:96px;box-shadow:0 0 22px #fff,0 0 60px rgba(255,255,255,.6),inset 0 0 28px rgba(255,255,255,.5)"></div>'
        f'<div class="abs" style="left:215px;top:34px;width:150px;height:30px;border-radius:15px;background:#fff;box-shadow:0 0 14px #fff"></div>'
        f'<div class="abs" style="left:0;top:250px;width:580px;text-align:center"><div id="{sid}-hm" class="chrome" style="font-size:112px;display:inline-block">HOMIO.RO</div></div>'
        f'<div class="abs" style="left:0;top:410px;width:580px;text-align:center"><div id="{sid}-sb" class="neon" style="font-size:66px;display:inline-block">SĂRBĂTORI</div></div>'
        f'<div id="{sid}-bt" class="abs" style="left:70px;top:740px;width:440px;height:96px;border-radius:48px;background:linear-gradient(180deg,#ff3b4b,#c1101f);box-shadow:0 0 26px rgba(255,45,63,.8);display:flex;align-items:center;justify-content:center;color:#fff;font-family:Anton;font-size:54px">COMANDĂ</div></div>' +
        f'<div id="{sid}-st" class="lite" style="position:absolute;left:0;top:1330px;width:1080px;text-align:center;font-size:44px;font-style:italic;color:#9fb0cc">pe site sau în aplicație</div>')
js = f"""
    tl.fromTo("#{sid}-pill", {{ scaleX: 0, opacity: 0 }}, {{ scaleX: 1, opacity: 1, duration: 0.3, ease: "power3.out" }}, 0.05);
    tl.fromTo("#{sid}-pt", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }}, 0.2);
    tl.fromTo("#{sid}-ph", {{ y: 700, scale: 0.7, rotation: 6, opacity: 0 }}, {{ y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: "expo.out" }}, 0.3);
    tl.fromTo("#{sid}-hm", {{ opacity: 0, scale: 1.4 }}, {{ opacity: 1, scale: 1, duration: 0.25, ease: "expo.out" }}, 0.75);
    tl.fromTo("#{sid}-sb", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.2 }}, 0.95);
    tl.fromTo("#{sid}-bt", {{ scale: 0.6, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }}, 1.25);
    tl.to("#{sid}-bt", {{ scale: 0.94, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }}, 1.85);
    tl.fromTo("#{sid}-st", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.25 }}, 1.5);
    tl.to("#{sid}-ph", {{ scale: 7, opacity: 0, filter: "blur(12px)", duration: 0.5, ease: "power3.in", transformOrigin: "50% 40%" }}, 2.7);
    {glitch_js(sid, 0.0, seed=7)}
"""
scene(sid, 13.4, 3.2, body, js)

# ───────────── S7 · 16,6–19,0 · cardul final ─────────────
sid = 's7'
body = (glitch_bars(sid, 81) +
        f'<div id="{sid}-fr" class="box" style="left:230px;top:300px;width:620px;height:590px;border-radius:14px"></div>' +
        f'<div id="{sid}-lg" class="abs" style="left:262px;top:332px;width:556px;height:526px;background:url(assets/img/logo-card.png) center/contain no-repeat"></div>' +
        f'<div class="abs" style="left:0;top:960px;width:1080px;text-align:center"><div id="{sid}-u" class="chrome" style="font-size:98px;display:inline-block">HOMIO.RO</div></div>' +
        f'<div class="abs" style="left:0;top:1090px;width:1080px;text-align:center"><div id="{sid}-u2" class="neon" style="font-size:84px;display:inline-block">/SARBATORI</div></div>' +
        f'<div id="{sid}-f" class="lite" style="position:absolute;left:0;top:1230px;width:1080px;text-align:center;font-size:46px;font-style:italic">transport gratuit peste 200 lei</div>')
js = f"""
    tl.fromTo("#{sid}-fr", {{ scale: 1.9, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.4, ease: "expo.out" }}, 0);
    tl.fromTo("#{sid}-lg", {{ scale: 1.9, opacity: 0, filter: "blur(10px)" }}, {{ scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "expo.out" }}, 0.05);
    tl.fromTo("#{sid}-u", {{ x: -500, skewX: -14, opacity: 0 }}, {{ x: 0, skewX: -10, opacity: 1, duration: 0.3, ease: "expo.out" }}, 0.4);
    tl.fromTo("#{sid}-u2", {{ x: 500, skewX: -14, opacity: 0 }}, {{ x: 0, skewX: -10, opacity: 1, duration: 0.3, ease: "expo.out" }}, 0.55);
    tl.fromTo("#{sid}-f", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.25 }}, 0.95);
    {glitch_js(sid, 0.0, seed=8)}
"""
scene(sid, 16.6, 2.4, body, js)

hosts = ''.join(f'      <div id="{k}" data-composition-id="{k}" data-composition-src="compositions/{k}.html" data-start="{s}" data-duration="{d}" data-track-index="{i+1}" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:{i+1}"></div>\n' for i, (k, s, d) in enumerate(SC))
open('index.html', 'w').write(f"""<!doctype html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="lib/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #0b1220; }}
      #root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920" data-motion-blur="on">
{hosts}    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
""")
print('ok', len(SC), 'scene', DUR, 's')
