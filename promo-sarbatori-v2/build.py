"""Generează index.html, compozițiile și events.json (evenimentele pentru sunet). Totul pe grila de bătăi: 120 BPM, 1 bătaie = 0,5 s, 1 măsură = 2 s."""
import os, json, math, random
from string import Template

BEAT = 0.4
FPS = 30
DUR = 28.8
RED, GREEN, GOLD, TEAL, BLUE, PINK, ORANGE = '#D7263D', '#138A4B', '#FFC93C', '#0F7C8C', '#2457D6', '#E8457F', '#FF8A2A'
DARK = '#0B3D2E'
M = json.load(open('assets/products.json'))
EV = []   # (timp, tip) pentru sunet

L = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122'
X = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0'
FONTS = f"""
    @font-face {{ font-family: 'Anton'; font-weight: 400; src: url('assets/fonts/anton-latin-400-normal.woff2') format('woff2'); unicode-range: {L}; }}
    @font-face {{ font-family: 'Anton'; font-weight: 400; src: url('assets/fonts/anton-latin-ext-400-normal.woff2') format('woff2'); unicode-range: {X}; }}
    @font-face {{ font-family: 'Fredoka'; font-weight: 700; src: url('assets/fonts/fredoka-latin-700-normal.woff2') format('woff2'); unicode-range: {L}; }}
    @font-face {{ font-family: 'Fredoka'; font-weight: 700; src: url('assets/fonts/fredoka-latin-ext-700-normal.woff2') format('woff2'); unicode-range: {X}; }}
"""

# fulg de zăpadă decupat din hârtie (6 brațe cu ramuri)
def snow_d():
    d = []
    for a in range(6):
        t = math.radians(a * 60 - 90); c, s = math.cos(t), math.sin(t)
        d.append(f'M0,0 L{c*46:.1f},{s*46:.1f}')
        for r, l in ((22, 12), (34, 9)):
            for sg in (-1, 1):
                u = t + sg * math.radians(50)
                d.append(f'M{c*r:.1f},{s*r:.1f} L{c*r+math.cos(u)*l:.1f},{s*r+math.sin(u)*l:.1f}')
    return ' '.join(d)
SNOW_D = snow_d()

COMMON = """
    #root { position: absolute; inset: 0; overflow: hidden; }
    .world { position: absolute; inset: 0; background: var(--bg); color: var(--ink); }
    .stage { position: absolute; inset: 0; }
    .pat { position: absolute; inset: 0; }
    .grain { position: absolute; inset: 0; opacity: .06; mix-blend-mode: multiply; background-image: url('assets/img/grain.png'); pointer-events: none; }
    .abs { position: absolute; }
    .snow { position: absolute; color: rgba(255,255,255,.16); }
    .title { position: absolute; left: 70px; font-family: 'Anton', sans-serif; font-weight: 400; text-transform: uppercase; line-height: 1.02; white-space: nowrap; z-index: 6; }
    .subt { position: absolute; left: 74px; font-family: 'Fredoka', sans-serif; font-weight: 700; z-index: 6; white-space: nowrap; }
    .stk { position: absolute; filter: drop-shadow(12px 16px 0 rgba(0,0,0,.28)); z-index: 3; }
    .stk img { display: block; width: 100%; height: auto; }
    .mt { position: absolute; width: 300px; height: 200px; z-index: 5; transform-origin: 0 0; }
    .mt .sw { position: absolute; inset: 0; transform-origin: 50% 0; filter: drop-shadow(6px 8px 0 rgba(0,0,0,.25)); }
    .mt .st { position: absolute; left: 148px; top: 0; width: 5px; height: 44px; background: #D7263D; }
    .mt .tg { position: absolute; left: 0; top: 36px; width: 300px; height: 164px; background: #F4C86E; clip-path: polygon(0 34px, 34px 0, calc(100% - 34px) 0, 100% 34px, 100% 100%, 0 100%); }
    .mt .hl { position: absolute; left: 134px; top: 46px; width: 28px; height: 28px; border-radius: 50%; background: var(--bg); box-shadow: inset 0 0 0 5px #C99A4E; }
    .mt .pr { position: absolute; left: 0; right: 0; top: 78px; text-align: center; font-family: 'Anton'; font-size: 92px; line-height: 1; color: #B01C2E; white-space: nowrap; }
    .mt .pr small { font-family: 'Fredoka'; font-weight: 700; font-size: 38px; color: #6B4A1F; margin-left: 8px; }
    .badge { position: absolute; z-index: 7; width: 250px; height: 250px; }
    .badge .bg { position: absolute; inset: 0; background: #138A4B; border-radius: 50%; box-shadow: inset 0 0 0 10px #FFC93C, 8px 10px 0 rgba(0,0,0,.28); }
    .badge .tx { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Anton'; color: #fff; line-height: .95; text-align: center; }
    .badge .tx b { font-weight: 400; font-size: 76px; } .badge .tx i { font-style: normal; font-size: 40px; font-family: 'Fredoka'; font-weight: 700; }
    .cf { position: absolute; display: block; z-index: 8; }
    .bunt { position: absolute; left: 0; top: 0; width: 1080px; height: 230px; z-index: 2; }
"""

def tpl(s, **kw): return Template(s).safe_substitute(**kw)

def pattern(kind):
    if kind == 'dots': return "background: radial-gradient(circle, rgba(255,255,255,.13) 9px, transparent 10px) 0 0 / 66px 66px;"
    if kind == 'stripes': return "background: repeating-linear-gradient(-45deg, rgba(0,0,0,.07) 0 46px, transparent 46px 92px);"
    if kind == 'diamonds': return "background: linear-gradient(45deg, rgba(255,255,255,.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,.1) 75%) 0 0 / 90px 90px, linear-gradient(45deg, rgba(255,255,255,.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,.1) 75%) 45px 45px / 90px 90px;"
    return ''

def snowflakes(sid, spots):
    out = ''
    for i, (x, y, s, r) in enumerate(spots):
        out += f'<svg id="{sid}-sf{i}" class="snow" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;rotate:{r}deg" viewBox="-52 -52 104 104"><path d="{SNOW_D}" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/></svg>'
    return out

def bunting(sid, colors):
    n = 9; out = f'<svg id="{sid}-bunt" class="bunt" data-layout-allow-overflow viewBox="0 0 1080 230"><path d="M-20,34 Q540,150 1100,34" fill="none" stroke="#3b2a1a" stroke-width="5"/>'
    for i in range(n):
        x = 40 + i * (1000 / (n - 1)); y = 34 + 116 * 4 * (x / 1080) * (1 - x / 1080) * 0.78 * 1.0
        y = 34 + (150 - 34) * (1 - (2 * x / 1080 - 1) ** 2) * 0.78 + 4
        out += f'<polygon class="{sid}-fl" points="{x-46:.0f},{y:.0f} {x+46:.0f},{y:.0f} {x:.0f},{y+104:.0f}" fill="{colors[i % len(colors)]}" style="transform-box:fill-box;transform-origin:50% 0"/>'
    return out + '</svg>'

def confetti(sid, name, n, seed, cx, cy, cols, t0, spread=520, up=1.0):
    r = random.Random(seed); html = ''; js = ''
    for i in range(n):
        w = r.randint(14, 30); h = r.randint(8, 16); col = cols[i % len(cols)]
        ang = r.uniform(0, math.tau); dist = r.uniform(.35, 1) * spread
        dx = math.cos(ang) * dist; dy = math.sin(ang) * dist * .8 - 140 * up; rot = r.uniform(-540, 540); fall = r.uniform(260, 520)
        cid = f'{sid}-cf{name}{i}'
        html += f'<i id="{cid}" class="cf" style="left:{cx}px;top:{cy}px;width:{w}px;height:{h}px;background:{col};opacity:0"></i>'
        js += f'tl.fromTo("#{cid}", {{x:0,y:0,rotation:0,scale:.3,opacity:1}}, {{x:{dx:.0f},y:{dy:.0f},rotation:{rot:.0f},scale:1,opacity:1,duration:.55,ease:"power3.out"}}, {t0:.3f});\n'
        js += f'tl.to("#{cid}", {{y:{dy+fall:.0f},rotation:{rot*1.6:.0f},opacity:0,duration:.8,ease:"power1.in"}}, {t0+.55:.3f});\n'
    return html, js

def mtag(sid, name, cx, cy, price, scale=1.0, rot=0):
    w, h = 300 * scale, 200 * scale
    return f'<div id="{sid}-{name}" class="mt" style="left:{cx-w/2:.0f}px;top:{cy-h/2:.0f}px;scale:{scale};rotate:{rot}deg"><div class="sw" id="{sid}-{name}-sw"><div class="st"></div><div class="tg"><i class="hl"></i></div><div class="pr">{price}<small>LEI</small></div></div></div>'

def stk(sid, name, pid, cx, cy, h, rot=0):
    m = M[pid]; w = h * m['w'] / m['h']
    return f'<div id="{sid}-{name}" class="stk" style="left:{cx-w/2:.0f}px;top:{cy-h/2:.0f}px;width:{w:.0f}px;rotate:{rot}deg"><img id="{sid}-{name}-img" src="assets/img/{pid}.png" alt="" /></div>', w

def wipe_js(sid, kind, p=(540, 1000)):
    if kind is None: return ''
    A = {
        'circle': (f'circle(0px at {p[0]}px {p[1]}px)', f'circle(2300px at {p[0]}px {p[1]}px)'),
        'up': ('inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'),
        'left': ('inset(0% 0% 0% 100%)', 'inset(0% 0% 0% 0%)'),
        'right': ('inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'),
        'iris': ('inset(50% 50% 50% 50% round 90px)', 'inset(0% 0% 0% 0% round 0px)'),
        'diag': ('polygon(0% 100%, 0% 100%, 0% 100%)', 'polygon(0% 100%, 0% -120%, 220% 100%)'),
    }[kind]
    return f'tl.fromTo("#{sid}-world", {{ clipPath: "{A[0]}" }}, {{ clipPath: "{A[1]}", duration: 0.25, ease: "power3.inOut" }}, 0);'

JSLIB = """
    const OFF = $off, B = 0.4;
    const T = k => OFF + k * B;
    const pop = (sel, t, r0, r1, s0) => tl.fromTo(sel, { scale: s0 || 0.15, rotation: r0, y: 100, opacity: 0 }, { scale: 1, rotation: r1, y: 0, opacity: 1, duration: 0.4, ease: "back.out(2.2)" }, t);
    const slam = (sel, t, r, vis) => tl.fromTo(sel, { scale: vis ? 1.12 : 1.8, rotation: vis ? r * 0.3 : r, opacity: vis ? 1 : 0, filter: vis ? "blur(0px)" : "blur(12px)" }, { scale: 1, rotation: 0, opacity: 1, filter: "blur(0px)", duration: 0.24, ease: "expo.out" }, t);
    const swingTag = (sel, t, a) => tl.fromTo(sel, { rotation: a, opacity: 0 }, { rotation: 0, opacity: 1, duration: 1.4, ease: "elastic.out(1, 0.35)" }, t);
    const shake = (t, a) => {
      const st = "#$sid-stage";
      tl.to(st, { x: a, y: -a * 0.6, duration: 0.04, ease: "power1.out" }, t).to(st, { x: -a * 0.7, y: a * 0.5, duration: 0.05 }, t + 0.04)
        .to(st, { x: a * 0.35, y: -a * 0.2, duration: 0.05 }, t + 0.09).to(st, { x: 0, y: 0, duration: 0.08 }, t + 0.14);
    };
    const flags = (t) => tl.fromTo(".$sid-fl", { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: "back.out(2)", stagger: 0.035 }, t);
"""

SCENES = []   # (sid, start, length, wipe)
def scene(sid, bg, ink, start, length, body, js, wipe=None, wipe_at=(540, 1000), extra_css='', pat=''):
    off = 0.25 if wipe else 0.0
    ds = max(0.0, start - off); dd = round(length + off, 3)
    SCENES.append((sid, ds, dd))
    EV.append((start - off, 'whoosh')) if wipe else None
    html = f"""<template>
  <style>{FONTS}{COMMON}{extra_css}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="1080" data-height="1920">
    <div id="{sid}-world" class="world" style="--bg:{bg};--ink:{ink}">
      <div class="pat" style="{pat}"></div>
      <div id="{sid}-stage" class="stage">
{body}
      </div>
      <div class="grain"></div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{tpl(JSLIB, off=off, sid=sid)}
    {wipe_js(sid, wipe, wipe_at)}
{js}
    window.__timelines["{sid}"] = tl;
  </script>
</template>
"""
    import re as _re
    ids = _re.findall(r'\bid="([^"]+)"', html)
    dups = sorted({i for i in ids if ids.count(i) > 1})
    assert not dups, f'ID-uri duplicate în {sid}: {dups}'
    open(f'compositions/{sid}.html', 'w').write(html)

def title(sid, name, text, top, size, color='var(--ink)', extra=''):
    return f'<div id="{sid}-{name}" class="title" data-layout-allow-overlap style="top:{top}px;font-size:{size}px;color:{color};{extra}">{text}</div>'

def stamp(sid, name, x, y, big='ÎN', small='STOC'):
    return f'<div id="{sid}-{name}" class="badge" style="left:{x}px;top:{y}px"><div class="bg"></div><div class="tx"><b>{big}</b><i>{small}</i></div></div>'


def E(S0, k, kind): EV.append((round(S0 + k * BEAT, 3), kind))

def title(sid, name, text, top, size, color='var(--ink)', extra=''):
    return f'<div id="{sid}-{name}" class="title" style="top:{top}px;font-size:{size}px;color:{color};{extra}">{text}</div>'

def stamp(sid, name, x, y, big='ÎN', small='STOC'):
    return f'<div id="{sid}-{name}" class="badge" style="left:{x}px;top:{y}px"><div class="bg"></div><div class="tx"><b>{big}</b><i>{small}</i></div></div>'

def badge_in(sid, name, k, rot=8):
    return f'tl.fromTo("#{sid}-{name}", {{ scale: 0.1, rotation: {rot-40}, opacity: 0 }}, {{ scale: 1, rotation: {rot}, opacity: 1, duration: 0.45, ease: "back.out(2.4)" }}, T({k}));\n'

def chap_sub(sid, text, top, color, size=58):
    return f'<div id="{sid}-sub" class="subt" style="top:{top}px;font-size:{size}px;color:{color}">{text}</div>'
def sub_in(sid, k): return f'tl.fromTo("#{sid}-sub", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }}, T({k}));\n'


BAR = 4 * BEAT
def item(sid, key, pid, cx, cy, h, rot, price, tdx=0, tdy=30, tscale=0.7, corner=False):
    """sticker + eticheta lui de preț. Implicit eticheta atârnă sub produs; cu corner=True stă în colțul stânga-sus al produsului."""
    html, w = stk(sid, key, pid, cx, cy, h, rot)
    tx, ty = (cx - w / 2 + tdx, cy - h / 2 + tdy) if corner else (cx + tdx, cy + h / 2 + tdy)
    html += mtag(sid, key + 't', tx, ty, price, tscale, rot * .6)
    return html

# ───────────────────────── S1 HOOK (1 măsură = 1,6 s) ─────────────────────────
sid = 's1-hook'; S0 = 0.0
c_html, c_js = confetti(sid, 'c', 24, 11, 540, 760, ['#FFC93C', '#fff', '#138A4B', '#2457D6', '#FF8A2A'], 0.12)
st1, _ = stk(sid, 'tree', '7746', 860, 800, 700, 5)
st2, _ = stk(sid, 'bell', '7799', 450, 1230, 380, -8)
st3, _ = stk(sid, 'bow', '7784', 690, 1290, 330, 9)
st4, _ = stk(sid, 'tray', '7767', 860, 1300, 280, -4)
body = (bunting(sid, [GOLD, GREEN, '#fff', BLUE, ORANGE]) + snowflakes(sid, [(640, 200, 520, 0), (-120, 900, 420, 15)]) +
        title(sid, 't1', 'TOT', 280, 200, '#fff') + title(sid, 't2', 'CRĂCIUNUL', 590, 170, '#fff') + title(sid, 't3', 'ÎN STOC', 790, 170, GOLD, 'rotate:-3deg') +
        st1 + st2 + st3 + st4 + mtag(sid, 'tag', 190, 1150, '11', 0.8, -6) + c_html)
js = f"""
    flags(0);
    slam("#{sid}-t1", 0, -8, true); slam("#{sid}-t2", 0.06, 5, true); slam("#{sid}-t3", 0.8, -9);
    tl.fromTo("#{sid}-tree-img", {{ scale: 0.9, rotation: 8, y: 50, opacity: 1 }}, {{ scale: 1, rotation: 0, y: 0, duration: 0.5, ease: "back.out(2)" }}, 0);
    tl.fromTo("#{sid}-bell-img", {{ scale: 0.9, rotation: -10, y: 50, opacity: 1 }}, {{ scale: 1, rotation: 0, y: 0, duration: 0.5, ease: "back.out(2)" }}, 0.06);
    pop("#{sid}-bow-img", 0.4, 20, 0); pop("#{sid}-tray-img", 0.8, -14, 0);
    tl.fromTo("#{sid}-tag-sw", {{ rotation: 22, y: -300, opacity: 0 }}, {{ rotation: 0, y: 0, opacity: 1, duration: 1.0, ease: "elastic.out(1, 0.4)" }}, 0.5);
    {c_js}
    shake(0.0, 16); shake(0.8, 12);
"""
scene(sid, RED, '#fff', S0, BAR, body, js, None, pat=pattern('dots'))
for t, k in ((0.0, 'slam'), (0.2, 'pop'), (0.4, 'pop'), (0.8, 'slam'), (0.8, 'pop'), (0.5, 'tag'), (0.12, 'conf')): EV.append((t, k))

def chapter(sid, S0, bg, ink, wipe, pat_kind, items, title_html, extra_body, beats, seed, cols, wpos=(540, 1000), corner=False, tscale=0.7):
    """items: [(pid, cx, cy, h, rot, price, tdx, tdy)] · beats: momentul fiecărui produs (în bătăi)"""
    cf_h, cf_j = confetti(sid, 'c', 20, seed, 540, 700, cols, 0.25)
    body = bunting(sid, cols + ['#fff']) + snowflakes(sid, [(-100, 330, 460, 5), (700, 1000, 480, 18)]) + title_html + extra_body
    js = f'    flags(T(0));\n'
    for i, (pid, cx, cy, h, rot, pr, tdx, tdy) in enumerate(items):
        body += item(sid, f'i{i}', pid, cx, cy, h, rot, pr, tdx, tdy, corner=corner, tscale=tscale)
        k = beats[i]; sgn = -1 if i % 2 else 1
        js += f'    pop("#{sid}-i{i}-img", T({k}), {16*sgn}, 0); pop("#{sid}-i{i}t-sw", T({k + .3}), {-10*sgn}, 0);\n'
        E(S0, k, 'pop'); E(S0, k + .3, 'tag')
    js += f'    {cf_j}\n    shake(T(0), 14); ' + ' '.join(f'shake(T({k}), 9);' for k in beats[1:]) + '\n'
    E(S0, 0, 'slam'); E(S0, .75, 'conf')
    return body + cf_h, js

# ───────────────────────── S2 BRAZI ─────────────────────────
sid = 's2-brazi'; S0 = BAR
it = [('7746', 205, 1230 - 290, 580, -3, '239', 0, 28), ('7743', 520, 1230 - 345, 690, 2, '359', 0, 28), ('7738', 850, 1230 - 395, 790, -2, '1235', 0, 28)]
extra = stamp(sid, 'bd', 800, 290, 'ÎN', 'STOC') + chap_sub(sid, '180 · 210 · 240 CM', 520, DARK, 56)
body, js = chapter(sid, S0, GOLD, DARK, 'circle', 'diamonds', it, title(sid, 'h', 'BRAZI', 262, 250, DARK), extra, [1, 3, 5], 21, [RED, GREEN, BLUE])
js += f'    slam("#{sid}-h", T(0), -6); {sub_in(sid, 1)} {badge_in(sid, "bd", 0.5, 8)}\n'
scene(sid, GOLD, DARK, S0, 2 * BAR, body, js, 'circle', (540, 1000), pat=pattern('diamonds'))

# ───────────────────────── S3 GLOBURI ─────────────────────────
sid = 's3-globuri'; S0 = 3 * BAR
it = [('7768', 280, 815, 270, -5, '25', 105, -8), ('7767', 800, 815, 300, 4, '45', 105, -8), ('7766', 280, 1150, 310, 4, '49', 105, -8), ('7775', 800, 1150, 340, -4, '79', 70, -8)]
extra = stamp(sid, 'bd', 810, 290, 'ÎN', 'STOC') + chap_sub(sid, 'ȘI ORNAMENTE', 506, GOLD, 60)
body, js = chapter(sid, S0, TEAL, '#fff', 'up', 'dots', it, title(sid, 'h', 'GLOBURI', 262, 226, '#fff'), extra, [1, 2.5, 4, 5.5], 31, [GOLD, PINK, ORANGE], corner=True, tscale=0.62)
js += f'    slam("#{sid}-h", T(0), 6); {sub_in(sid, 1)} {badge_in(sid, "bd", 0.5, -8)}\n'
scene(sid, TEAL, '#fff', S0, 2 * BAR, body, js, 'up', pat=pattern('dots'))

# ───────────────────────── S4 GHIRLANDE ─────────────────────────
sid = 's4-ghirlande'; S0 = 5 * BAR
specs = [('7810', 540, 640, 1040, -4, '79', 330, 62), ('7815', 540, 830, 1040, 3, '95', -330, 62), ('7806', 540, 1020, 1040, -3, '179', 330, 62), ('7805', 540, 1210, 1040, 4, '195', -330, 62)]
it = []
for pid, cx, cy, wd, rot, pr, tdx, tdy in specs:
    m = M[pid]; hh = wd * m['h'] / m['w']; it.append((pid, cx, cy, hh, rot, pr, tdx, tdy))
extra = stamp(sid, 'bd', 800, 270, 'ÎN', 'STOC')
body, js = chapter(sid, S0, RED, '#fff', 'diag', 'stripes', it, title(sid, 'h', 'GHIRLANDE', 262, 176, '#fff'), extra, [1, 2.5, 4, 5.5], 41, [GOLD, GREEN, BLUE])
js += f'    slam("#{sid}-h", T(0), -5); {badge_in(sid, "bd", 0.5, 8)}\n'
for i in range(4):   # ghirlandele intră lateral, mai viu decât un simplu pop
    js += f'    tl.fromTo("#{sid}-i{i}-img", {{ x: {(-1) ** i * 1300}, opacity: 1 }}, {{ x: 0, duration: 0.4, ease: "expo.out" }}, T({[1, 2.5, 4, 5.5][i]}) - 0.02);\n'
scene(sid, RED, '#fff', S0, 2 * BAR, body, js, 'diag', pat=pattern('stripes'))

# ───────────────────────── S5 FUNDE ȘI CLOPOȚEI ─────────────────────────
sid = 's5-funde'; S0 = 7 * BAR
it = [('7784', 280, 830, 330, -8, '17', 70, -6), ('7799', 800, 830, 350, 7, '11', 80, -6), ('7783', 280, 1165, 300, 6, '25', 80, -6), ('7795', 800, 1165, 360, -5, '69', 50, -6)]
extra = stamp(sid, 'bd', 790, 290, 'ÎN', 'STOC') + chap_sub(sid, 'ȘI CLOPOȚEI', 508, GOLD, 60)
body, js = chapter(sid, S0, BLUE, '#fff', 'left', 'diamonds', it, title(sid, 'h', 'FUNDE', 262, 240, '#fff'), extra, [1, 2.5, 4, 5.5], 61, [RED, PINK, GOLD], corner=True, tscale=0.62)
js += f'    slam("#{sid}-h", T(0), -6); {sub_in(sid, 1)} {badge_in(sid, "bd", 0.5, 8)}\n'
scene(sid, BLUE, '#fff', S0, 2 * BAR, body, js, 'left', pat=pattern('diamonds'))

# ───────────────────────── S6 MONTAJ RAPID (3 măsuri, 6 cărți × 0,8 s = 2 bătăi) ─────────────────────────
sid = 's6-montaj'; S0 = 9 * BAR; CARD = 2 * BEAT
cards = [('7746', 'Brad artificial 180 cm', '239', RED, '#fff', 640), ('7774', 'Set 24 de globuri', '55', GOLD, DARK, 620), ('7805', 'Ghirlandă LED 270 cm', '195', TEAL, '#fff', 0),
         ('7842', 'Moș Crăciun auriu', '119', GREEN, '#fff', 520), ('7772', 'Set 60 de globuri aurii', '109', BLUE, '#fff', 640), ('7775', 'Set 22 de globuri', '79', PINK, '#fff', 620)]
body = ''; js = '    const C = i => OFF + 0.8 * i;\n'
pats = [pattern('dots'), pattern('stripes'), pattern('diamonds')]
for i, (pid, nm, pr, bg, ink, hh) in enumerate(cards):
    m = M[pid]
    if pid == '7805': wd = 1500; hh = wd * m['h'] / m['w']; w = wd
    else: w = hh * m['w'] / m['h']
    cx, cy = (560, 735) if pid != '7805' else (540, 735)
    rot = [-5, 4, -8, 3, -4, 5][i]
    body += f"""<div id="{sid}-k{i}" class="abs" style="inset:0;background:{bg};color:{ink};z-index:{10+i}"><div class="abs" style="inset:0;{pats[i % 3]}"></div>
      <div id="{sid}-k{i}-nm" class="subt" style="top:282px;left:70px;font-size:54px;color:{ink}">{nm}</div>
      <div id="{sid}-k{i}-st" class="stk" style="left:{cx-w/2:.0f}px;top:{cy-hh/2:.0f}px;width:{w:.0f}px;rotate:{rot}deg;z-index:3"><img id="{sid}-k{i}-img" src="assets/img/{pid}.png" alt="" /></div>
      <div id="{sid}-k{i}-pr" class="title" data-layout-allow-overlap style="top:1030px;left:64px;font-size:280px;color:{ink};line-height:1;z-index:6">{pr}<span style="font-size:100px;margin-left:12px">LEI</span></div>
      <div class="abs" style="right:60px;top:1130px;z-index:6;background:#138A4B;color:#fff;font-family:Anton;font-size:50px;padding:8px 24px;border-radius:12px;box-shadow:6px 8px 0 rgba(0,0,0,.25)">ÎN STOC</div></div>"""
    d = ['left', 'right', 'up', 'left', 'right', 'up'][i]
    clip = {'left': ('inset(0% 0% 0% 100%)', 'inset(0% 0% 0% 0%)'), 'right': ('inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'), 'up': ('inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)')}[d]
    if i == 0: js += f'    tl.fromTo("#{sid}-k0", {{ clipPath: "inset(0% 0% 0% 100%)" }}, {{ clipPath: "inset(0% 0% 0% 0%)", duration: 0.25, ease: "power3.inOut" }}, 0);\n'
    else: js += f'    tl.fromTo("#{sid}-k{i}", {{ clipPath: "{clip[0]}" }}, {{ clipPath: "{clip[1]}", duration: 0.14, ease: "power3.out" }}, C({i}) - 0.07);\n'
    js += f'    tl.fromTo("#{sid}-k{i}-img", {{ scale: 1.3, rotation: {rot*2}, opacity: 1 }}, {{ scale: 1, rotation: 0, duration: 0.3, ease: "expo.out" }}, C({i}));\n'
    js += f'    tl.fromTo("#{sid}-k{i}-pr", {{ scale: 1.6, x: -60, opacity: 1, filter: "blur(10px)" }}, {{ scale: 1, x: 0, filter: "blur(0px)", duration: 0.26, ease: "expo.out", transformOrigin: "0% 50%" }}, C({i}) + 0.04);\n'
    js += f'    tl.fromTo("#{sid}-k{i}-nm", {{ opacity: 0, y: 24 }}, {{ opacity: 1, y: 0, duration: 0.18, ease: "power3.out" }}, C({i}) + 0.06);\n'
    E(S0, i * 2, 'hit')
js += '    ' + ' '.join(f'shake(C({i}), {12 if i % 2 == 0 else 8});' for i in range(6)) + '\n'
scene(sid, RED, '#fff', S0, 6 * CARD, body, js, 'iris', (540, 1000), pat='')

# ───────────────────────── S7 TRANSPORT GRATUIT (1 măsură) ─────────────────────────
sid = 's7-transport'; S0 = 12 * BAR
cf_h, cf_j = confetti(sid, 'c', 20, 81, 540, 900, [RED, GREEN, '#fff', BLUE], 0.25 + 1.6)
css8 = """
    .cf { z-index: 2; }
    .star { position: absolute; z-index: 7; width: 520px; height: 520px; }
    .star .sh { position: absolute; inset: 0; background: #D7263D; clip-path: polygon(50% 0%, 61% 14%, 79% 9%, 82% 27%, 99% 33%, 90% 50%, 99% 67%, 82% 73%, 79% 91%, 61% 86%, 50% 100%, 39% 86%, 21% 91%, 18% 73%, 1% 67%, 10% 50%, 1% 33%, 18% 27%, 21% 9%, 39% 14%); }
    .star .tx { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-family: 'Anton'; line-height: .95; text-align: center; }
    .star .tx b { font-weight: 400; font-size: 70px; } .star .tx span { font-size: 150px; } .star .tx i { font-style: normal; font-size: 60px; }
    .box { position: absolute; left: 0; top: 80px; width: 520px; height: 330px; background: linear-gradient(#D9AE6E, #BF9150); border-radius: 8px; box-shadow: 12px 16px 0 rgba(0,0,0,.25); }
    .lid { position: absolute; left: -12px; top: 36px; width: 544px; height: 84px; background: linear-gradient(#E6BE82, #CFA364); border-radius: 8px; }
    .rib { position: absolute; left: 230px; top: 36px; width: 60px; height: 374px; background: #D7263D; }
    .bw1, .bw2 { position: absolute; top: -40px; width: 140px; height: 96px; background: #D7263D; border-radius: 70px; }
    .bw1 { left: 100px; transform: rotate(-26deg); } .bw2 { left: 280px; transform: rotate(26deg); }
    .kn { position: absolute; left: 228px; top: 4px; width: 64px; height: 52px; background: #A9151F; border-radius: 16px; }
"""
body = (bunting(sid, [RED, GREEN, '#fff', BLUE, ORANGE]) + snowflakes(sid, [(-120, 300, 480, 10), (720, 880, 460, -14)]) +
        title(sid, 't1', 'TRANSPORT', 262, 215, DARK) + title(sid, 't2', 'GRATUIT', 500, 250, '#B3152A') +
        f'<div id="{sid}-star" class="star" style="left:70px;top:790px"><div class="sh"></div><div class="tx"><b>PESTE</b><span>200</span><i>LEI</i></div></div>' +
        f'<div id="{sid}-parcel" class="abs" style="left:520px;top:880px;width:520px;height:420px;z-index:4"><div id="{sid}-pbox" class="abs" style="inset:0"><div class="box"></div><div class="lid"></div><div class="rib"></div><div class="bw1"></div><div class="bw2"></div><div class="kn"></div></div></div>' + cf_h)
js = f"""
    flags(T(0)); slam("#{sid}-t1", T(0), -4); slam("#{sid}-t2", T(1), 5);
    tl.fromTo("#{sid}-star", {{ scale: 0.1, rotation: -60, opacity: 0 }}, {{ scale: 1, rotation: -8, opacity: 1, duration: 0.5, ease: "back.out(2.2)" }}, T(2));
    tl.fromTo("#{sid}-pbox", {{ y: 700, rotation: 14, opacity: 0 }}, {{ y: 0, rotation: -4, opacity: 1, duration: 0.45, ease: "expo.out" }}, T(3));
    tl.to("#{sid}-pbox", {{ y: -26, duration: 0.14, ease: "power2.out" }}, T(5)).to("#{sid}-pbox", {{ y: 0, duration: 0.2, ease: "bounce.out" }}, T(5) + 0.14);
    tl.to("#{sid}-star", {{ rotation: -3, duration: 0.18, ease: "power2.out" }}, T(5)).to("#{sid}-star", {{ rotation: -8, duration: 0.3, ease: "elastic.out(1,.4)" }}, T(5) + 0.18);
    {cf_j}
    shake(T(0), 14); shake(T(1), 12); shake(T(2), 12); shake(T(3), 10); shake(T(5), 8);
"""
scene(sid, GOLD, DARK, S0, 2 * BAR, body, js, 'circle', (540, 1000), extra_css=css8, pat=pattern('stripes'))
E(S0, 0, 'slam'); E(S0, 1, 'slam'); E(S0, 2, 'pop'); E(S0, 3, 'whoosh'); E(S0, 4, 'conf'); E(S0, 5, 'thump')

# ───────────────────────── S8 LIVRARE 24 H (1 măsură) ─────────────────────────
sid = 's8-livrare'; S0 = 14 * BAR
cf_h, cf_j = confetti(sid, 'c', 18, 91, 540, 760, [GOLD, '#fff', ORANGE, PINK], 0.25 + 2.4)
css9 = """
    .cf { z-index: 2; }
    .van { position: absolute; left: 0; top: 1040px; width: 640px; height: 300px; z-index: 5; }
    .van .cab { position: absolute; left: 0; top: 40px; width: 560px; height: 190px; background: #fff; border-radius: 14px 14px 8px 8px; box-shadow: 10px 14px 0 rgba(0,0,0,.25); }
    .van .cab2 { position: absolute; left: 400px; top: 90px; width: 190px; height: 140px; background: #fff; border-radius: 10px 60px 8px 8px; }
    .van .win { position: absolute; left: 440px; top: 108px; width: 110px; height: 66px; background: #2457D6; border-radius: 6px 40px 4px 4px; }
    .van .strp { position: absolute; left: 0; top: 140px; width: 590px; height: 26px; background: #D7263D; }
    .van .wh { position: absolute; top: 190px; width: 84px; height: 84px; border-radius: 50%; background: #1f1f2b; box-shadow: inset 0 0 0 16px #8b8fa3; }
    .van .wh i { position: absolute; left: 36px; top: 4px; width: 12px; height: 76px; background: #1f1f2b; }
    .van .tg { position: absolute; left: 70px; top: 60px; width: 300px; text-align: center; font-family: 'Anton'; font-size: 66px; color: #D7263D; line-height: 1; }
    .sp { position: absolute; height: 10px; border-radius: 5px; background: rgba(255,255,255,.7); z-index: 4; }
"""
body = (bunting(sid, [GOLD, '#fff', RED, GREEN, ORANGE]) + snowflakes(sid, [(700, 250, 460, 0), (-110, 1100, 430, 15)]) +
        title(sid, 't1', 'LIVRARE ÎN', 262, 150, '#fff') + title(sid, 't2', '24 H', 420, 440, GOLD) +
        f'<div id="{sid}-sub" class="subt" style="top:900px;font-size:60px;color:#fff">în majoritatea cazurilor</div>' +
        ''.join(f'<i id="{sid}-sp{i}" class="sp" style="left:{40+i*30}px;top:{1130+i*38}px;width:{240+i*40}px"></i>' for i in range(4)) +
        f'<div id="{sid}-van" class="van"><div class="cab"></div><div class="cab2"></div><div class="win"></div><div class="strp"></div><div class="tg">HOMIO</div><div class="wh {sid}-wh" style="left:90px"><i></i></div><div class="wh {sid}-wh" style="left:440px"><i></i></div></div>' + cf_h)
js = f"""
    flags(T(0)); slam("#{sid}-t1", T(0), -4); slam("#{sid}-t2", T(0.8), 4); {sub_in(sid, 2)}
    tl.fromTo("#{sid}-van", {{ x: -1000, scale: 1.4, transformOrigin: "0% 50%" }}, {{ x: 120, scale: 1.4, transformOrigin: "0% 50%", duration: 0.9, ease: "power3.out" }}, T(3));
    tl.fromTo(".{sid}-wh", {{ rotation: 0 }}, {{ rotation: 900, duration: 0.9, ease: "power3.out" }}, T(3));
    tl.to("#{sid}-van", {{ y: -14, duration: 0.14, ease: "power2.out" }}, T(5.5)).to("#{sid}-van", {{ y: 0, duration: 0.22, ease: "bounce.out" }}, T(5.5) + 0.14);
    tl.fromTo(["#{sid}-sp0", "#{sid}-sp1", "#{sid}-sp2", "#{sid}-sp3"], {{ scaleX: 0, transformOrigin: "100% 50%", opacity: 0 }}, {{ scaleX: 1, opacity: 1, duration: 0.25, ease: "power3.out", stagger: 0.05 }}, T(3.1));
    {cf_j}
    shake(T(0), 14); shake(T(0.8), 10); shake(T(3.9), 10); shake(T(5.5), 8);
"""
scene(sid, BLUE, '#fff', S0, 2 * BAR, body, js, 'up', extra_css=css9, pat=pattern('dots'))
E(S0, 0, 'slam'); E(S0, .8, 'slam'); E(S0, 3, 'whoosh'); E(S0, 3.9, 'thump'); E(S0, 5.5, 'thump'); E(S0, 5, 'conf')

# ───────────────────────── S9 FINAL (2 măsuri) ─────────────────────────
sid = 's9-final'; S0 = 16 * BAR
c1h, c1j = confetti(sid, 'a', 26, 101, 540, 520, [GOLD, '#fff', GREEN, BLUE, ORANGE, PINK], 0.25, 640)
c2h, c2j = confetti(sid, 'b', 20, 102, 300, 1000, [GOLD, '#fff', GREEN, PINK], 0.25 + 1.2, 520)
css10 = """
    .hang { position: absolute; left: 270px; top: 262px; width: 540px; height: 600px; z-index: 5; }
    .hang .sw { position: absolute; inset: 0; transform-origin: 50% 0; filter: drop-shadow(12px 16px 0 rgba(0,0,0,.28)); }
    .hang .sg { position: absolute; left: 50%; top: 0; width: 8px; height: 80px; margin-left: -4px; background: #FFC93C; }
    .hang img { position: absolute; left: 0; top: 70px; width: 540px; height: auto; }
    .url { position: absolute; left: 0; right: 0; top: 880px; text-align: center; font-family: 'Anton'; font-size: 96px; color: #fff; z-index: 6; }
    .cta { position: absolute; left: 120px; top: 1010px; width: 840px; height: 150px; background: #FFC93C; color: #0B3D2E; border-radius: 22px; font-family: 'Anton'; font-size: 84px; line-height: 150px; text-align: center; box-shadow: 10px 14px 0 rgba(0,0,0,.3); z-index: 6; }
    .fine { position: absolute; left: 0; right: 0; text-align: center; font-family: 'Fredoka'; font-weight: 700; font-size: 46px; color: #fff; z-index: 6; }
"""
body = (bunting(sid, [GOLD, '#fff', GREEN, BLUE, ORANGE]) + snowflakes(sid, [(-120, 250, 480, 8), (720, 700, 520, -12), (100, 1050, 420, 20)]) +
        f'<div id="{sid}-hang" class="hang"><div class="sw" id="{sid}-sw"><div class="sg"></div><img src="assets/img/logo-card.png" alt="Homio" /></div></div>' +
        f'<div id="{sid}-url" class="url">HOMIO.RO/SARBATORI</div><div id="{sid}-cta" class="cta">COMANDĂ ACUM</div>' +
        f'<div id="{sid}-f1" class="fine" style="top:1200px">PESTE 40 DE PRODUSE ÎN STOC</div><div id="{sid}-f2" class="fine" style="top:1262px;color:#FFC93C">Transport gratuit peste 200 lei</div>' + c1h + c2h)
js = f"""
    flags(T(0));
    tl.fromTo("#{sid}-sw", {{ rotation: 24, y: -700 }}, {{ rotation: 0, y: 0, duration: 1.3, ease: "elastic.out(1, 0.4)" }}, T(0));
    tl.fromTo("#{sid}-url", {{ clipPath: "inset(0% 100% 0% 0%)" }}, {{ clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "power3.out" }}, T(1.5));
    tl.fromTo("#{sid}-cta", {{ scale: 0.6, opacity: 0, y: 60 }}, {{ scale: 1, y: 0, opacity: 1, duration: 0.45, ease: "back.out(2)" }}, T(2.5));
    tl.fromTo("#{sid}-f1", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }}, T(3.5));
    tl.fromTo("#{sid}-f2", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }}, T(4));
    {c1j} {c2j}
    shake(T(0), 20); shake(T(2.5), 12);
"""
scene(sid, RED, '#fff', S0, 2 * BAR, body, js, 'iris', (540, 1000), extra_css=css10, pat=pattern('dots'))
E(S0, 0, 'hit'); E(S0, 0, 'conf'); E(S0, 1.5, 'whoosh'); E(S0, 2.5, 'pop'); E(S0, 3, 'conf'); E(S0, 3.5, 'pop'); E(S0, 4, 'pop')

# ───────────────────────── index.html ─────────────────────────
hosts = ''
for i, (k, ds, dd) in enumerate(SCENES):
    hosts += f'      <div id="{k}" data-composition-id="{k}" data-composition-src="compositions/{k}.html" data-start="{round(ds,3)}" data-duration="{round(dd,3)}" data-track-index="{i+1}" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:{i+1}"></div>\n'
open('index.html', 'w').write(f"""<!doctype html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="lib/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #D7263D; }}
      #root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920" data-motion-blur="on">
{hosts}      <audio id="mix" src="assets/audio/mix.wav" data-start="0" data-duration="{DUR}" data-volume="1"></audio>
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
""")
json.dump(dict(bpm=150, beat=BEAT, bar=BAR, events=sorted(EV), scenes=SCENES, dur=DUR, montage=[9 * BAR, 9 * BAR + 6 * CARD], build=15 * BAR, drop=16 * BAR), open('events.json', 'w'), indent=1)
print('ok', len(SCENES), 'scene;', len(EV), 'evenimente; durata', DUR)
