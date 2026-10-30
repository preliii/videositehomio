'use strict';
/* Homio · „Crăciunul n-are restart” — motion graphic randat frame cu frame (canvas 2D).
   Tot ce apare pe ecran e o funcție de timp: scene(ctx, t). Când vine vocea reală,
   se ajustează doar timpii din TL. */

const W = 1080, H = 1920, FPS = 60, DURATION = 24;
const TAU = Math.PI * 2;

// ───────────────────────── timeline (secunde) ─────────────────────────
const TL = {
  // scena 1-2: lumea de noapte
  hook1: 0.75, hook2: 1.05, hook3: 1.4, hookOut: 2.75,
  sputter: 2.3, descend: 3.1, touch: 4.3, stopA: 5.5,
  l1: 3.0, l2: 4.15, stitch: 5.05,
  // scena 3: pauză
  pause: 6.0, cursor1: 6.45, cursor2: 7.0, no: 7.45, panelOut: 7.75, slam: 7.95,
  // tranziție + scena 4: livrarea
  irisA: 8.8, irisB: 9.35,
  vanIn: 9.1, vanStop: 10.7, homio: 9.55, door: 10.9, prod0: 11.1, prodGap: 0.38, deliv: 12.9, vanOut: 13.4,
  // push spre interior
  pushA: 14.7, pushB: 15.3,
  // scena 5: camera
  giftIn: 15.3, gaugeIn: 16.0, gaugeDown: 16.6, gaugeZero: 19.0, open: 17.9, zeroTxt: 19.1,
  // scena 6: final
  flashA: 20.65, flashB: 21.35, logo: 21.2, tag1: 22.1, tag2: 22.55, url: 22.9
};

// ───────────────────────── utilitare ─────────────────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  inCubic: t => t * t * t,
  inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * TAU / 3) + 1),
  outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
};
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const mod = (a, n) => ((a % n) + n) % n;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function glow(c, x, y, r, rgb, a = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(.35, `rgba(${rgb},${a * .35})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
function sparkle(c, x, y, r, rot = 0, fill = '#fff') {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = fill; c.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .22 : r, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.restore();
}
function heart(c, x, y, s, fill) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = fill; c.beginPath();
  c.moveTo(0, 8); c.bezierCurveTo(-16, -4, -10, -18, 0, -9); c.bezierCurveTo(10, -18, 16, -4, 0, 8); c.fill(); c.restore();
}
function txt(c, s, x, y, size, o = {}) {
  c.save();
  c.font = `${o.weight || ''} ${size}px ${o.font || 'Anton'}`;
  c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle';
  if (o.ls) c.letterSpacing = o.ls + 'px';
  c.lineJoin = 'round'; c.miterLimit = 2;
  if (o.stroke !== null) {
    if (o.shadow) { c.shadowColor = o.shadow; c.shadowBlur = o.sb || 0; c.shadowOffsetY = o.sy || size * .08; }
    c.lineWidth = o.sw || size * .16; c.strokeStyle = o.stroke || '#050a22'; c.strokeText(s, x, y);
    c.shadowColor = 'transparent';
  }
  c.fillStyle = o.fill || '#fff'; c.fillText(s, x, y);
  c.restore();
}
// cuvinte care „sar” pe ecran unul după altul
function words(c, t, list, cx, y, size, o = {}) {
  c.save(); c.font = `${size}px Anton`;
  let ws = list.map(w => c.measureText(w.s).width), total = ws.reduce((a, b) => a + b, 0) + size * .3 * (list.length - 1);
  const fit = Math.min(1, (o.maxW || 960) / total); size *= fit; ws = ws.map(w => w * fit); total *= fit;
  const sp = size * .3;
  c.restore();
  let x = cx - total / 2;
  const q = o.out != null ? prog(t, o.out, o.out + .35) : 0;
  list.forEach((w, i) => {
    const p = prog(t, w.t0, w.t0 + .42);
    if (p > 0 && q < 1) {
      const e = E.outBack(p, 2.2), sc = lerp(.15, 1, e) * (w.big || 1);
      c.save();
      c.translate(x + ws[i] / 2, y - E.inCubic(q) * 260 + (1 - e) * 60);
      c.rotate((1 - e) * (w.rot || .2) + (w.tilt || 0)); c.scale(sc, sc * (1 + .12 * (1 - e)));
      c.globalAlpha = clamp(p * 5) * (1 - q);
      txt(c, w.s, 0, 0, size, { fill: w.fill || '#fff', shadow: 'rgba(0,0,0,.55)', sb: 10 });
      c.restore();
    }
    x += ws[i] + sp;
  });
}
function shakeAt(t, ev) {
  let sx = 0, sy = 0;
  for (const e of ev) {
    const p = (t - e.t) / e.d;
    if (p >= 0 && p < 1) { const a = e.a * Math.pow(1 - p, 2); sx += Math.sin(t * 91 + e.t) * a; sy += Math.cos(t * 77 + e.t * 3) * a; }
  }
  return [sx, sy];
}
const SHAKES = [
  { t: 4.3, a: 26, d: .55 }, { t: 5.1, a: 14, d: .4 }, { t: 7.45, a: 22, d: .4 },
  { t: TL.slam, a: 34, d: .6 }, { t: 10.7, a: 14, d: .35 },
  { t: 11.1 + 0.9, a: 8, d: .25 }, { t: 11.48 + .9, a: 8, d: .25 }, { t: 11.86 + .9, a: 8, d: .25 },
  { t: 12.24 + .9, a: 8, d: .25 }, { t: 12.62 + .9, a: 8, d: .25 }, { t: TL.logo + .45, a: 12, d: .4 }
];

// ───────────────────────── resurse ─────────────────────────
const IMG = {};
const IMG_SRC = {
  logo: 'img/logo_alpha.png', logoCard: 'img/logo_card.png',
  trotineta: 'img/trotineta.png', pijamale: 'img/pijamale.png', ghiozdan: 'img/ghiozdan.png',
  spider: 'img/set_spiderman.png', paw: 'img/trotineta_paw.png'
};
async function loadAssets() {
  const L = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const X = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  const faces = [
    ['Anton', 'fonts/anton-latin-400-normal.woff2', '400', L], ['Anton', 'fonts/anton-latin-ext-400-normal.woff2', '400', X],
    ['Fredoka', 'fonts/fredoka-latin-600-normal.woff2', '600', L], ['Fredoka', 'fonts/fredoka-latin-ext-600-normal.woff2', '600', X],
    ['Fredoka', 'fonts/fredoka-latin-700-normal.woff2', '700', L], ['Fredoka', 'fonts/fredoka-latin-ext-700-normal.woff2', '700', X]
  ];
  for (const [fam, url, w, ur] of faces) {
    const f = new FontFace(fam, `url(${url})`, { weight: w, unicodeRange: ur });
    await f.load(); document.fonts.add(f);
  }
  await Promise.all(Object.entries(IMG_SRC).map(([k, s]) => new Promise((res, rej) => {
    const i = new Image(); i.onload = () => { IMG[k] = i; res(); }; i.onerror = () => rej(new Error('img ' + s)); i.src = s;
  })));
}

// ───────────────────────── date precalculate ─────────────────────────
const cv = document.getElementById('c');
const mc = cv.getContext('2d');
const oc = mk(W, H), ctx = oc.getContext('2d');

let SKY, VIGN, NOISE, CITY_A = [], CITY_B = [], ROOM_BG;
const STARS = [], SNOW = [], BOKEH = [], LAMPS = [];

function buildStatic() {
  // cer
  SKY = mk(W, H); let c = SKY.getContext('2d');
  let g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#040920'); g.addColorStop(.45, '#0c1f63'); g.addColorStop(.72, '#23409a'); g.addColorStop(.9, '#5f4a9c'); g.addColorStop(1, '#a35f86');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  let r = rng(7);
  for (let i = 0; i < 170; i++) STARS.push({ x: r() * W, y: r() * H * .55, r: .6 + r() * 1.8, ph: r() * TAU, f: 1 + r() * 3 });
  for (let i = 0; i < 300; i++) SNOW.push({ x: r() * W, y: r() * H, v: 70 + r() * 230, r: 1.5 + r() * 4.6, a: .35 + r() * .6, sw: 10 + r() * 40, fq: .5 + r() * 1.5, ph: r() * TAU, d: .3 + r() });
  for (let i = 0; i < 26; i++) BOKEH.push({ x: r() * W, y: r() * H, r: 20 + r() * 70, ph: r() * TAU, c: [[255, 190, 90], [255, 120, 80], [255, 220, 150]][i % 3] });
  // vignetă + grain
  VIGN = mk(W, H); c = VIGN.getContext('2d');
  g = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,8,.62)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  NOISE = mk(256, 256); c = NOISE.getContext('2d'); const id = c.createImageData(256, 256); r = rng(99);
  for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  c.putImageData(id, 0, 0);
  // orașe (tile-uri care se repetă)
  CITY_A = [
    makeCity({ seed: 11, tile: 1620, base: 1280, minH: 180, maxH: 420, minW: 70, maxW: 140, top: '#1c3482', bot: '#12235f', win: [255, 220, 150], prob: .12, k: .28 }),
    makeCity({ seed: 12, tile: 1620, base: 1360, minH: 160, maxH: 420, minW: 90, maxW: 170, top: '#0f2063', bot: '#0a1648', win: [255, 205, 120], prob: .3, k: .55 }),
    makeCity({ seed: 13, tile: 1620, base: 1440, minH: 120, maxH: 230, minW: 150, maxW: 250, top: '#0a1540', bot: '#060d2c', win: [255, 190, 100], prob: .6, k: 1, houses: true })
  ];
  CITY_B = [
    makeCity({ seed: 21, tile: 1620, base: 1110, minH: 220, maxH: 520, minW: 80, maxW: 150, top: '#1a3a86', bot: '#10245e', win: [255, 220, 150], prob: .14, k: .2 }),
    makeCity({ seed: 22, tile: 1620, base: 1250, minH: 200, maxH: 380, minW: 170, maxW: 270, top: '#10265f', bot: '#0a1845', win: [255, 200, 110], prob: .55, k: .5, houses: true, lights: true })
  ];
  ROOM_BG = makeRoom();
}

function makeCity(o) {
  const cc = mk(o.tile, H), c = cc.getContext('2d'), r = rng(o.seed);
  let x = 0;
  while (x < o.tile) {
    let w = o.minW + r() * (o.maxW - o.minW); if (x + w > o.tile - 40) w = o.tile - x;
    const h = o.minH + r() * (o.maxH - o.minH), y = o.base - h;
    const g = c.createLinearGradient(0, y, 0, o.base); g.addColorStop(0, o.top); g.addColorStop(1, o.bot);
    c.fillStyle = g;
    if (o.houses) {
      c.fillRect(x, y + 70, w, h - 70);
      c.beginPath(); c.moveTo(x - 10, y + 72); c.lineTo(x + w / 2, y - 6); c.lineTo(x + w + 10, y + 72); c.closePath(); c.fill();
      // zăpadă pe acoperiș
      c.fillStyle = '#dfe9ff'; c.beginPath(); c.moveTo(x - 10, y + 72); c.lineTo(x + w / 2, y - 6); c.lineTo(x + w + 10, y + 72);
      c.lineTo(x + w + 2, y + 74); c.quadraticCurveTo(x + w * .75, y + 58, x + w * .5, y + 70); c.quadraticCurveTo(x + w * .25, y + 56, x - 2, y + 74); c.closePath(); c.fill();
      // horn
      c.fillStyle = o.bot; c.fillRect(x + w * .7, y + 4, 18, 40); c.fillStyle = '#dfe9ff'; c.fillRect(x + w * .7 - 2, y, 22, 8);
    } else {
      c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(223,233,255,.85)'; c.beginPath(); c.roundRect(x - 2, y - 6, w + 4, 12, 6); c.fill();
    }
    // ferestre
    const cols = Math.max(2, Math.floor(w / 34)), rows = Math.floor((h - (o.houses ? 100 : 40)) / 56);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (r() > o.prob) continue;
      const wx = x + (i + .5) * (w / cols) - 9, wy = y + (o.houses ? 98 : 36) + j * 56;
      glow(c, wx + 9, wy + 11, 30, o.win.join(','), .35 * (o.k > .6 ? 1 : .5));
      c.fillStyle = `rgb(${o.win.join(',')})`; c.fillRect(wx, wy, 18, 24);
    }
    if (o.lights) {  // ghirlande de lumini între case
      const cols6 = ['255,80,80', '255,210,70', '90,200,255', '120,255,160'];
      for (let i = 0; i < 9; i++) { const lx = x + 8 + i * (w - 16) / 8, ly = y + 74 + Math.sin(i / 8 * Math.PI) * 14; glow(c, lx, ly, 22, cols6[i % 4], .8); c.fillStyle = `rgb(${cols6[i % 4]})`; c.beginPath(); c.arc(lx, ly, 5, 0, TAU); c.fill(); }
    }
    x += w + (o.houses ? 8 : 0);
  }
  return { c: cc, k: o.k, tile: o.tile };
}
function drawTile(c, layer, scroll) {
  const off = -mod(scroll * layer.k, layer.tile);
  c.drawImage(layer.c, off, 0); c.drawImage(layer.c, off + layer.tile, 0);
  if (off + layer.tile * 2 < W) c.drawImage(layer.c, off + layer.tile * 2, 0);
}

// ───────────────────────── elemente comune ─────────────────────────
function sky(c, t) {
  c.drawImage(SKY, 0, 0);
  c.save(); c.globalCompositeOperation = 'lighter';
  // aurora
  for (let b = 0; b < 3; b++) {
    const y0 = 260 + b * 120, col = [[60, 255, 180], [90, 160, 255], [200, 110, 255]][b];
    const g = c.createLinearGradient(0, y0 - 140, 0, y0 + 160);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(.5, `rgba(${col},.10)`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.beginPath(); c.moveTo(0, y0 + 160);
    for (let x = 0; x <= W; x += 30) c.lineTo(x, y0 + Math.sin(x * .006 + t * .6 + b * 2) * 70 + Math.sin(x * .013 - t * .9) * 24);
    c.lineTo(W, y0 + 160); c.closePath(); c.fill();
  }
  c.restore();
  for (const s of STARS) { c.globalAlpha = .35 + .65 * (.5 + .5 * Math.sin(t * s.f + s.ph)); c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
  // lună
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 810, 400, 380, '200,220,255', .35); c.restore();
  c.fillStyle = '#fff7d6'; c.beginPath(); c.arc(810, 400, 92, 0, TAU); c.fill();
  c.fillStyle = 'rgba(210,190,140,.35)';
  [[780, 380, 20], [835, 430, 14], [815, 360, 10]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); });
  // stea căzătoare
  const sp = prog(mod(t, 7), 3.2, 3.6);
  if (sp > 0 && sp < 1) { const x = 200 + sp * 520, y = 160 + sp * 240; const g = c.createLinearGradient(x, y, x - 190, y - 100); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.strokeStyle = g; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 190, y - 100); c.stroke(); }
}
function snow(c, t, o = {}) {
  const n = o.n || 300, a = o.alpha == null ? 1 : o.alpha, wind = o.wind == null ? 60 : o.wind, sp = o.speed || 1;
  c.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    const f = SNOW[i % SNOW.length];
    const y = mod(f.y + f.v * sp * t, H + 60) - 30;
    const x = mod(f.x + wind * f.d * t + Math.sin(t * f.fq + f.ph) * f.sw, W + 60) - 30;
    c.globalAlpha = a * f.a; c.beginPath(); c.arc(x, y, f.r, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
}
function ground(c, y, scroll, t) {
  const g = c.createLinearGradient(0, y, 0, H); g.addColorStop(0, '#e6eeff'); g.addColorStop(.18, '#a9bbea'); g.addColorStop(.6, '#4a5fae'); g.addColorStop(1, '#232f6e');
  c.fillStyle = g; c.beginPath(); c.moveTo(0, H); c.lineTo(0, y + 14);
  for (let x = 0; x <= W + 40; x += 40) c.lineTo(x, y + Math.sin((x + scroll) * .012) * 12 + Math.sin((x + scroll) * .031) * 5);
  c.lineTo(W, H); c.closePath(); c.fill();
  for (let i = 0; i < 46; i++) {
    const r = rng(i * 13 + 5), x = mod(r() * 1400 - scroll * 1.1, 1400) - 160, yy = y + 30 + r() * 260;
    c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 2 + i)); sparkle(c, x, yy, 4 + r() * 5, 0, '#fff');
  }
  c.globalAlpha = 1;
}
function pines(c, scroll, base, k, seed, sc) {
  const r = rng(seed);
  for (let i = 0; i < 9; i++) {
    const x = mod(i * 240 + r() * 120 - scroll * k, 2160) - 200, s = (.7 + r() * .6) * sc;
    c.save(); c.translate(x, base); c.scale(s, s);
    c.fillStyle = '#0a1a3e';
    for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(-60 + j * 8, -j * 70); c.lineTo(0, -j * 70 - 130); c.lineTo(60 - j * 8, -j * 70); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(223,233,255,.9)';
    for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(-26 + j * 4, -j * 70 - 80); c.lineTo(0, -j * 70 - 130); c.lineTo(26 - j * 4, -j * 70 - 80); c.quadraticCurveTo(0, -j * 70 - 92, -26 + j * 4, -j * 70 - 80); c.fill(); }
    c.restore();
  }
}
function trail(c, t, o) {  // particule emise la timp, deterministe
  const { t0, t1, rate, life, pos, draw } = o;
  const kMax = Math.floor((Math.min(t, t1) - t0) * rate);
  for (let k = Math.max(0, Math.floor((t - life - t0) * rate)); k <= kMax; k++) {
    const tb = t0 + k / rate, age = (t - tb) / life;
    if (age < 0 || age > 1) continue;
    draw(c, pos(tb), age, k);
  }
}
function burst(c, t, t0, x, y, o) {
  const age = t - t0; if (age < 0 || age > o.life) return;
  const r = rng(o.seed || 1), u = age / o.life;
  c.save(); c.globalCompositeOperation = o.add === false ? 'source-over' : 'lighter';
  for (let i = 0; i < o.n; i++) {
    const a = r() * TAU, v = o.speed * (.35 + r() * .8), col = o.colors[i % o.colors.length], sz = (o.size || 10) * (.5 + r());
    const px = x + Math.cos(a) * v * age, py = y + Math.sin(a) * v * age + .5 * (o.g || 0) * age * age;
    c.globalAlpha = 1 - u;
    if (o.shape === 'rect') { c.save(); c.translate(px, py); c.rotate(r() * TAU + age * 6); c.fillStyle = col; c.fillRect(-sz / 2, -sz / 4, sz, sz / 2); c.restore(); }
    else sparkle(c, px, py, sz * (1 - u * .5), age * 4 + i, col);
  }
  c.restore();
}
function vignette(c, a = 1) { c.globalAlpha = a; c.drawImage(VIGN, 0, 0); c.globalAlpha = 1; }
function grain(c, t) {
  const f = Math.floor(t * 24), ox = (f * 97) % 256, oy = (f * 57) % 256;
  c.save(); c.globalAlpha = .06; c.globalCompositeOperation = 'overlay';
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) c.drawImage(NOISE, x, y);
  c.restore();
}

// ───────────────────────── sanie + reni ─────────────────────────
function deer(c, t, ph, amp, lead, tired) {
  const body = '#8c5a34', dark = '#6e4526';
  // picioare (în spate / în față)
  const leg = (x, off) => {
    const a1 = Math.sin(ph + off) * .85 * amp + .05, a2 = a1 + Math.max(0, Math.sin(ph + off + 1.3)) * .9 * amp + .06;
    c.save(); c.translate(x, 18); c.lineCap = 'round'; c.strokeStyle = dark; c.lineWidth = 12;
    const kx = Math.sin(a1) * 38, ky = Math.cos(a1) * 38, fx = kx + Math.sin(a2) * 38, fy = ky + Math.cos(a2) * 38;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
    c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(fx, fy, 8, 0, TAU); c.fill(); c.restore();
  };
  leg(-46, 0); leg(-30, Math.PI); leg(22, Math.PI * .6); leg(38, Math.PI * 1.6);
  // corp
  c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, 60, 31, 0, 0, TAU); c.fill();
  c.fillStyle = '#b8845a'; c.beginPath(); c.ellipse(4, 13, 46, 14, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-60, -6, 10, 0, TAU); c.fill();
  // ham
  c.strokeStyle = '#ffd23f'; c.lineWidth = 6; c.beginPath(); c.arc(30, -10, 26, -1.2, 1.4); c.stroke();
  // gât + cap
  const bob = tired ? Math.sin(t * 5) * 3 + 10 : Math.sin(ph) * 4;
  c.strokeStyle = body; c.lineWidth = 34; c.lineCap = 'round'; c.beginPath(); c.moveTo(38, -8); c.lineTo(82, -50 + bob); c.stroke();
  c.save(); c.translate(92, -58 + bob); c.rotate(.25 + (tired ? .25 : 0));
  c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, 26, 19, 0, 0, TAU); c.fill();
  c.fillStyle = '#a56d3f'; c.beginPath(); c.ellipse(20, 6, 16, 12, 0, 0, TAU); c.fill();
  // ochi
  c.fillStyle = '#fff'; c.beginPath(); c.arc(4, -4, 6.5, 0, TAU); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(tired ? 3 : 6, tired ? 0 : -4, 3.2, 0, TAU); c.fill();
  if (tired) { c.strokeStyle = body; c.lineWidth = 7; c.beginPath(); c.moveTo(-3, -9); c.lineTo(14, -2); c.stroke(); }
  // nas
  if (lead) { glow(c, 34, 4, 46, '255,50,50', .9 * (tired ? .4 + .6 * (Math.sin(t * 38) > 0) : 1)); c.fillStyle = '#ff2d2d'; }
  else c.fillStyle = '#2a1a10';
  c.beginPath(); c.arc(34, 4, 9, 0, TAU); c.fill();
  // ureche + coarne
  c.fillStyle = '#7a4c28'; c.beginPath(); c.ellipse(-12, -20, 8, 15, -.5, 0, TAU); c.fill();
  c.strokeStyle = '#ecd7a8'; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-6, -24); c.lineTo(-20, -62); c.lineTo(-10, -96); c.moveTo(-20, -62); c.lineTo(-40, -76); c.moveTo(-14, -78); c.lineTo(2, -88); c.stroke();
  c.restore();
}
function sleigh(c, t, broken, shut) {
  // patine
  c.strokeStyle = '#dbe5ff'; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-160, 82); c.lineTo(110, 82); c.quadraticCurveTo(168, 82, 168, 36); c.quadraticCurveTo(168, 14, 146, 20); c.stroke();
  c.lineWidth = 7; c.beginPath(); c.moveTo(-110, 82); c.lineTo(-110, 40); c.moveTo(50, 82); c.lineTo(50, 40); c.stroke();
  // sac cu cadouri
  const box = (x, y, w, h, col, rb, rot) => {
    c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot || 0);
    c.fillStyle = col; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 6); c.fill();
    c.fillStyle = rb; c.fillRect(-5, -h / 2, 10, h); c.fillRect(-w / 2, -5, w, 10);
    c.beginPath(); c.ellipse(-12, -h / 2 - 4, 14, 9, -.4, 0, TAU); c.ellipse(12, -h / 2 - 4, 14, 9, .4, 0, TAU); c.fill();
    c.restore();
  };
  box(-140, -118, 78, 86, '#2e5bff', '#ffd23f', -.05); box(-72, -150, 66, 118, '#2fbf71', '#fff', .04); box(-130, -190, 64, 68, '#ffd23f', '#d62839', .1);
  box(-20, -92, 58, 60, '#a24dff', '#ffd23f', -.08);
  // corp
  const g = c.createLinearGradient(0, -34, 0, 62); g.addColorStop(0, '#ff3b4c'); g.addColorStop(1, '#a31224');
  c.fillStyle = g; c.beginPath(); c.roundRect(-160, -34, 320, 98, [14, 14, 44, 44]); c.fill();
  c.strokeStyle = '#ffd23f'; c.lineWidth = 8; c.beginPath(); c.moveTo(-154, -26); c.lineTo(154, -26); c.stroke();
  c.beginPath(); c.arc(150, -4, 30, -1.1, 1.2); c.stroke();
  // Moș Crăciun
  c.save(); c.translate(60 + (broken ? Math.sin(t * 40) * 1.5 : 0), -46);
  c.fillStyle = '#e31e32'; c.beginPath(); c.ellipse(0, 6, 36, 40, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.fillRect(-36, 20, 72, 10);
  c.fillStyle = '#f2cba6'; c.beginPath(); c.arc(0, -38, 20, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-22, -34); c.quadraticCurveTo(0, 28, 22, -34); c.quadraticCurveTo(0, -22, -22, -34); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(-7, -42, 3, 0, TAU); c.arc(7, -42, 3, 0, TAU); c.fill();
  c.fillStyle = '#e31e32'; c.beginPath(); c.moveTo(-22, -48); c.quadraticCurveTo(0, -92 + (broken ? 10 : 0), 28, -60); c.lineTo(22, -46); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-24, -52, 48, 12, 6); c.fill(); c.beginPath(); c.arc(30, -62 + (broken ? 8 : 0), 9, 0, TAU); c.fill();
  c.restore();
  // felinar
  const lit = broken ? (Math.sin(t * 31) + Math.sin(t * 47) > .4 ? 1 : .08) : 1;
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 160, -34, 130 * lit + 30, broken ? '255,140,40' : '255,230,150', .95 * lit); c.restore();
  c.fillStyle = lit > .5 ? '#fff3b0' : '#6b5a30'; c.beginPath(); c.arc(160, -34, 11, 0, TAU); c.fill();
}
// grupul sanie + 2 reni, origine = centrul primului ren
function sleighGroup(c, t, st) {
  c.save(); c.translate(st.x, st.y); c.rotate(st.rot); c.scale(st.sc, st.sc);
  // ham între ei
  c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath(); c.moveTo(-170, 0); c.quadraticCurveTo(-80, 14, -30, 4); c.moveTo(40, 0); c.quadraticCurveTo(100, 10, 150, 4); c.stroke();
  c.save(); c.translate(-330, 18); sleigh(c, t, st.broken); c.restore();
  c.save(); c.translate(0, 0); deer(c, t, st.ph + 1.4, st.amp, false, st.tired); c.restore();
  c.save(); c.translate(190, -4); deer(c, t, st.ph, st.amp, true, st.tired); c.restore();
  c.restore();
}
// poziția sanie în timp (coordonate ecran, centrul reniului din spate)
const GROUND_A = 1430;
function sleighState(t) {
  const sc = 1.12, hoof = 85 * sc;
  const fly = 960;
  let x, y = fly, rot = 0, amp = 1, broken = 0, tired = 0;
  const e = E.outCubic(prog(t, 0, 1.5));
  x = lerp(-420, 560, e);
  y = fly + Math.sin(t * 2.6) * 18 * e;
  rot = Math.sin(t * 2.6 + 1) * .03;
  if (t > TL.sputter) {
    broken = 1;
    const s = prog(t, TL.sputter, TL.descend);
    x = 560 + Math.sin(t * 45) * 4 * s;
    y = fly + Math.sin(t * 2.6) * 18 + (Math.sin(t * 22) > 0 ? 1 : -1) * 10 * s + 80 * E.inOut(s);
    rot = .04 + s * .05;
    amp = lerp(1, .6, s);
  }
  if (t > TL.descend) {
    const d = prog(t, TL.descend, TL.touch), yy = GROUND_A - hoof;
    const dd = d * d;
    y = lerp(fly + 80, yy, dd) + Math.sin(t * 22) * 6 * (1 - d);
    rot = lerp(.09, .0, d) + (d > .6 ? 0 : .03);
    x = 560 + 30 * d;
    amp = lerp(.6, 0, d);
    tired = 0;
  }
  if (t > TL.touch) {
    const k = prog(t, TL.touch, TL.stopA);
    x = 590 + 30 * E.outQuart(k);
    y = GROUND_A - hoof - Math.max(0, Math.sin(prog(t, TL.touch, TL.touch + .55) * Math.PI)) * 28 * (1 - prog(t, TL.touch, TL.touch + .55));
    rot = Math.sin(prog(t, TL.touch, TL.touch + .8) * TAU) * .04 * (1 - prog(t, TL.touch, TL.touch + .8));
    amp = 0; tired = 1;
  }
  return { x: x + 24 * sc, y, sc, rot, ph: t * 13, amp, broken, tired };
}
function scrollA(t) {
  const v = 460, t1 = TL.descend + .6, t2 = TL.stopA;
  if (t <= t1) return v * t;
  const p = prog(t, t1, t2), len = t2 - t1;
  return v * t1 + v * len * (1 - Math.pow(1 - p, 3)) / 3;
}

// ───────────────────────── SCENA 1-2: lumea de noapte ─────────────────────────
function worldA(c, t) {
  const sc = scrollA(t);
  sky(c, t);
  drawTile(c, CITY_A[0], sc); drawTile(c, CITY_A[1], sc);
  // ceață spre orizont
  let g = c.createLinearGradient(0, 1100, 0, 1440); g.addColorStop(0, 'rgba(120,140,220,0)'); g.addColorStop(1, 'rgba(150,160,230,.22)'); c.fillStyle = g; c.fillRect(0, 1100, W, 340);
  drawTile(c, CITY_A[2], sc);
  ground(c, GROUND_A, sc, t);
  pines(c, sc, GROUND_A + 40, 1.25, 4, 1.1);
  const st = sleighState(t);
  // urmă de scântei
  trail(c, t, {
    t0: .6, t1: TL.sputter + .3, rate: 70, life: .9,
    pos: tb => { const s = sleighState(tb); return { x: s.x - 360 * s.sc, y: s.y + 20, sc: scrollA(tb) }; },
    draw: (cc, p, a, k) => { const r = rng(k * 7 + 3); cc.save(); cc.globalCompositeOperation = 'lighter'; cc.globalAlpha = 1 - a; sparkle(cc, p.x - (scrollA(t) - p.sc) + (r() - .5) * 40, p.y + (r() - .5) * 60 + a * 50, 12 + r() * 14, a * 5, ['#ffe27a', '#fff', '#7fd4ff'][k % 3]); cc.restore(); }
  });
  // umbră + lumină pe zăpadă
  if (t > TL.descend - .3) {
    c.save(); c.globalCompositeOperation = 'lighter'; const k = prog(t, TL.descend - .3, TL.touch);
    c.translate(st.x + 80, GROUND_A + 18); c.scale(1, .16); glow(c, 0, 0, 520, '255,140,40', .55 * k); c.restore();
  }
  // fum (după ce se strică)
  trail(c, t, {
    t0: TL.sputter, t1: 99, rate: 26, life: 1.9,
    pos: tb => { const s = sleighState(tb); return { x: s.x - 300 * s.sc, y: s.y - 40 * s.sc, sc: scrollA(tb) }; },
    draw: (cc, p, a, k) => { const r = rng(k * 5 + 1); cc.fillStyle = `rgba(${34 + a * 40},${34 + a * 40},${52 + a * 40},${.75 * (1 - a)})`; cc.beginPath(); cc.arc(p.x - (scrollA(t) - p.sc) - a * 90 + (r() - .5) * 30, p.y - a * 230, 18 + a * 64, 0, TAU); cc.fill(); }
  });
  sleighGroup(c, t, st);
  // abur de la reni
  if (t > TL.touch) trail(c, t, {
    t0: TL.touch + .3, t1: 99, rate: 3.2, life: 1.2,
    pos: tb => { const s = sleighState(tb); return { x: s.x + 205 * s.sc, y: s.y - 52 * s.sc, sc: 0 }; },
    draw: (cc, p, a) => { cc.fillStyle = `rgba(255,255,255,${.5 * (1 - a)})`; cc.beginPath(); cc.arc(p.x + a * 60, p.y - a * 30, 10 + a * 34, 0, TAU); cc.fill(); }
  });
  // zăpadă împroșcată la aterizare
  burst(c, t, TL.touch, st.x - 200, GROUND_A, { n: 46, speed: 520, life: 1.1, g: 900, colors: ['#ffffff', '#cfe0ff'], size: 14, seed: 9, add: false });
  burst(c, t, TL.touch + .02, st.x + 120, GROUND_A, { n: 30, speed: 360, life: .9, g: 800, colors: ['#ffffff'], size: 12, seed: 4, add: false });
  // cadouri care sar
  if (t > TL.touch) {
    [[-60, 380, -.5], [30, 520, .4], [-30, 300, .9]].forEach(([vx, vy, rot], i) => {
      const a = t - TL.touch; let y = GROUND_A - 20 - (vy * a - .5 * 1500 * a * a); const hit = y > GROUND_A - 20;
      if (hit) { const b = Math.min(a, 1.4); y = GROUND_A - 20 - Math.abs(Math.sin(b * 6.5)) * 70 * Math.exp(-b * 2.2); }
      const x = st.x - 120 + i * 150 + vx * Math.min(a, .9) - 20, cols = ['#ffd23f', '#2e5bff', '#2fbf71'];
      c.save(); c.translate(x, y); c.rotate(rot * Math.min(a, .9) * 1.4); c.fillStyle = cols[i]; c.fillRect(-26, -26, 52, 52); c.fillStyle = '#fff'; c.fillRect(-4, -26, 8, 52); c.fillRect(-26, -4, 52, 8); c.restore();
    });
  }
  snow(c, t, { n: 220, alpha: .9 });
  // semnal de alarmă: puls portocaliu
  if (t > TL.sputter && t < TL.touch + .2) { const pu = (.5 + .5 * Math.sin(t * 14)) * prog(t, TL.sputter, TL.sputter + .4); c.fillStyle = `rgba(255,70,20,${.10 * pu})`; c.fillRect(0, 0, W, H); }
  return st;
}
function textsA(c, t) {
  const st = sleighState(t);
  words(c, t, [{ s: 'S-A', t0: TL.hook1, fill: '#fff', rot: -.3 }, { s: 'STRICAT', t0: TL.hook2, fill: '#ffd23f', rot: .25 }, { s: 'CEVA?', t0: TL.hook3, fill: '#fff', rot: -.2 }], 540, 420, 190, { out: TL.hookOut });
  // semn de exclamare deasupra lui Moș
  if (t > TL.sputter && t < TL.touch + 1) {
    const p = E.outBack(prog(t, TL.sputter + .1, TL.sputter + .45), 3);
    c.save(); c.translate(st.x - 100 * st.sc + (t > TL.descend ? 0 : 0), st.y - 250 * st.sc); c.scale(p, p);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 52, 0, TAU); c.fill(); c.fillStyle = '#e63946'; c.font = '86px Anton'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, 6); c.restore();
  }
  if (t > TL.l1) {
    words(c, t, [{ s: 'MOȘUL', t0: TL.l1, rot: .2 }, { s: 'N-A', t0: TL.l1 + .18 }, { s: 'AJUNS', t0: TL.l1 + .36 }, { s: 'LA', t0: TL.l1 + .5 }, { s: 'TIMP?', t0: TL.l1 + .62, fill: '#ffd23f' }], 540, 380, 118, {});
    words(c, t, [{ s: 'TOCMAI', t0: TL.l2 }, { s: 'CÂND', t0: TL.l2 + .2 }, { s: 'ȚI-A', t0: TL.l2 + .36 }, { s: 'CERUT', t0: TL.l2 + .52 }], 540, 520, 118, {});
  }
  if (t > TL.stitch) {
    const p = prog(t, TL.stitch, TL.stitch + .5), e = E.outElastic(p);
    c.save(); c.translate(540, 700); c.scale(lerp(.1, 1, e), lerp(.1, 1, e)); c.rotate(Math.sin(t * 30) * .02 * (1 - p) - .04);
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, 0, 420, '60,160,255', .5 * (.7 + .3 * Math.sin(t * 8))); c.restore();
    txt(c, 'STITCH?', 0, 0, 250, { fill: '#7fd0ff', stroke: '#06122e', sw: 40, shadow: 'rgba(0,0,0,.6)', sb: 20, sy: 14 });
    c.restore();
    burst(c, t, TL.stitch, 540, 700, { n: 26, speed: 560, life: .8, colors: ['#9fe0ff', '#fff', '#ffd23f'], size: 26, seed: 21 });
  }
}

// ───────────────────────── SCENA 3: PAUZĂ ─────────────────────────
function pauseScene(c, t) {
  const fz = TL.touch + 1.55;                         // cadrul înghețat
  const p0 = prog(t, TL.pause, TL.pause + .25);
  c.save();
  c.translate(W / 2, H / 2); const z = 1 + .04 * E.outCubic(p0) + (t - TL.pause) * .004; c.scale(z, z); c.translate(-W / 2, -H / 2);
  worldA(c, fz);
  c.restore();
  // întunecare + desaturare + scanlines
  c.fillStyle = `rgba(6,10,36,${.62 * E.outCubic(p0)})`; c.fillRect(0, 0, W, H);
  c.fillStyle = `rgba(60,80,170,${.18 * p0})`; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = .1 * p0; c.fillStyle = '#000'; for (let y = 0; y < H; y += 6) c.fillRect(0, y, W, 2); c.restore();
  // flash la îngheț
  const fl = 1 - prog(t, TL.pause, TL.pause + .22); if (fl > 0) { c.fillStyle = `rgba(255,255,255,${.85 * fl})`; c.fillRect(0, 0, W, H); }

  // HUD: misiune + data
  const h = E.outBack(prog(t, TL.pause + .25, TL.pause + .7));
  c.save(); c.translate(-420 * (1 - h), 0);
  c.fillStyle = 'rgba(5,10,40,.78)'; c.beginPath(); c.roundRect(50, 150, 560, 130, 16); c.fill();
  c.fillStyle = '#ffd23f'; c.fillRect(50, 150, 12, 130);
  txt(c, 'MISIUNE', 86, 188, 34, { align: 'left', fill: '#ffd23f', stroke: null, ls: 4 });
  txt(c, 'CADOUL SUB BRAD', 86, 238, 58, { align: 'left', fill: '#fff', stroke: null });
  c.restore();
  const pu = .75 + .25 * Math.sin(t * 9);
  c.save(); c.translate(1080 + 330 * (1 - h) - 50, 215); c.fillStyle = `rgba(230,57,70,${pu})`; c.beginPath(); c.roundRect(-250, -62, 250, 124, 16); c.fill();
  txt(c, 'RĂMAS', -125, -22, 34, { fill: '#fff', stroke: null, ls: 3 }); txt(c, '24 DEC', -125, 28, 62, { fill: '#fff', stroke: null }); c.restore();

  // panoul de pauză
  const pin = E.outBack(prog(t, TL.pause + .15, TL.pause + .7), 1.8), pout = E.inCubic(prog(t, TL.panelOut, TL.panelOut + .25));
  if (pout < 1) {
    let sx = 0, sy = 0; if (t > TL.no && t < TL.no + .35) { sx = Math.sin(t * 120) * 16 * (1 - prog(t, TL.no, TL.no + .35)); }
    c.save(); c.translate(540 + sx, 900 + sy); c.scale(pin * (1 - pout * .9), pin * (1 - pout * .9)); c.rotate(pout * .5);
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, 0, 640, '90,130,255', .28); c.restore();
    c.fillStyle = '#0c1540'; c.strokeStyle = '#cdd6ff'; c.lineWidth = 10; c.beginPath(); c.roundRect(-320, -360, 640, 720, 26); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(120,150,255,.5)'; c.lineWidth = 3; c.beginPath(); c.roundRect(-300, -340, 600, 680, 18); c.stroke();
    txt(c, 'PAUZĂ', 0, -250, 170, { fill: '#fff', stroke: null, ls: 8 });
    c.fillStyle = '#ffd23f'; c.fillRect(-200, -160, 400, 8);
    // cursor
    const k = E.inOut(prog(t, TL.cursor1, TL.cursor2)), sel = lerp(0, 1, k) , items = ['CONTINUĂ', 'RESTART', 'IEȘIRE'];
    const sy2 = -60 + sel * 130 + (t > TL.cursor2 ? 0 : 0);
    // bara galbenă urmărește cursorul
    const barY = lerp(-60, 70, k);
    c.fillStyle = '#ffd23f'; c.beginPath(); c.roundRect(-270, barY - 52, 540, 104, 14); c.fill();
    items.forEach((s, i) => {
      const y = -60 + i * 130, active = Math.abs(barY - y) < 65;
      txt(c, s, 0, y + 4, 84, { fill: active ? '#0a1033' : '#8ea2ff', stroke: null, ls: 4 });
    });
    const bl = (Math.sin(t * 14) > -.3) ? 1 : 0;
    if (bl) { c.fillStyle = '#0a1033'; c.beginPath(); c.moveTo(-250, barY - 22); c.lineTo(-210, barY); c.lineTo(-250, barY + 22); c.closePath(); c.fill(); }
    // X „NU”
    if (t > TL.no) { const q = E.outBack(prog(t, TL.no, TL.no + .2), 3); c.save(); c.translate(210, 70); c.scale(q, q); c.rotate(-.2); c.fillStyle = '#e63946'; c.beginPath(); c.roundRect(-95, -50, 190, 100, 16); c.fill(); txt(c, 'NU!', 0, 4, 80, { fill: '#fff', stroke: null }); c.restore(); }
    c.restore();
  }
  if (t > TL.no && t < TL.no + .25) { c.fillStyle = `rgba(230,57,70,${.35 * (1 - prog(t, TL.no, TL.no + .25))})`; c.fillRect(0, 0, W, H); }
  // SLAM
  if (t > TL.slam - .3) {
    const s = t - TL.slam, dim = prog(t, TL.slam - .3, TL.slam); c.fillStyle = `rgba(3,6,24,${.55 * dim})`; c.fillRect(0, 0, W, H);
    if (s > 0) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(540, 880); c.rotate(t * .25);
      for (let i = 0; i < 18; i++) { c.rotate(TAU / 18); const g = c.createLinearGradient(0, 0, 900, 0); g.addColorStop(0, 'rgba(255,200,70,.5)'); g.addColorStop(1, 'rgba(255,200,70,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(900, -34 * E.outCubic(clamp(s * 4))); c.lineTo(900, 34 * E.outCubic(clamp(s * 4))); c.fill(); }
      c.restore();
      const drop = (t0, text, y, size, fill, rot) => {
        const q = prog(t, t0, t0 + .22); if (q <= 0) return;
        c.save(); c.font = `${size}px Anton`; const fw = Math.min(1, 940 / c.measureText(text).width); c.restore(); size *= fw;
        const sc = lerp(3.2, 1, E.outCubic(q)), a = clamp(q * 4), ca = (1 - q) * 22;
        c.save(); c.translate(540, y); c.rotate(rot); c.scale(sc, sc); c.globalAlpha = a;
        c.globalCompositeOperation = 'lighter'; txt(c, text, -ca, 0, size, { fill: 'rgba(255,0,60,.9)', stroke: null }); txt(c, text, ca, 0, size, { fill: 'rgba(0,220,255,.9)', stroke: null });
        c.globalCompositeOperation = 'source-over'; txt(c, text, 0, 0, size, { fill, stroke: '#04081f', sw: size * .2, shadow: 'rgba(0,0,0,.65)', sb: 24, sy: 16 });
        c.restore();
      };
      drop(TL.slam, 'CRĂCIUNUL', 780, 232, '#fff', -.05);
      drop(TL.slam + .35, 'N-ARE', 990, 250, '#ffd23f', .04);
      drop(TL.slam + .6, 'RESTART.', 1200, 250, '#ffd23f', -.03);
      burst(c, t, TL.slam, 540, 880, { n: 36, speed: 760, life: .9, colors: ['#fff', '#ffd23f', '#ff8a1f'], size: 28, seed: 31 });
    }
  }
}

// ───────────────────────── SCENA 4: livrarea ─────────────────────────
const GROUND_B = 1450, ROAD_Y = 1300;
function scrollB(t) { const v = 520, a = TL.vanStop; if (t <= a) return v * t; return v * a + v * 1.2 / 3 * (1 - Math.pow(1 - prog(t, a, a + 1.2), 3)); }
function vanX(t) {
  if (t < TL.vanOut) return lerp(-720, 700, E.outCubic(prog(t, TL.vanIn, TL.vanStop)));
  return lerp(700, 2000, E.inCubic(prog(t, TL.vanOut, TL.vanOut + 1.1)));
}
function drawVan(c, t) {
  const x = vanX(t), moving = (t > TL.vanIn && t < TL.vanStop + .3) || t > TL.vanOut;
  const rot = t < TL.vanStop + .5 ? -.035 * Math.sin(prog(t, TL.vanStop - .5, TL.vanStop + .5) * Math.PI) * (t > TL.vanStop - .5 ? 1 : 0) : (t > TL.vanOut ? -.02 * prog(t, TL.vanOut, TL.vanOut + .4) : 0);
  const wheelAng = x / 52;
  // faruri / lumină
  c.save(); c.translate(x, ROAD_Y + 40);
  c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(300, 0, 1000, 0); g.addColorStop(0, 'rgba(255,240,180,.5)'); g.addColorStop(1, 'rgba(255,240,180,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(306, -118); c.lineTo(1100, -300); c.lineTo(1100, 60); c.closePath(); c.fill(); c.restore();
  // fum eșapament
  if (moving) trail(c, t, { t0: Math.max(0, t - 1), t1: t, rate: 40, life: .8, pos: tb => ({ x: vanX(tb) - x - 304, y: -70 }), draw: (cc, p, a, k) => { cc.fillStyle = `rgba(255,255,255,${.35 * (1 - a)})`; cc.beginPath(); cc.arc(p.x - a * 80, p.y - a * 40 + (k % 3), 10 + a * 30, 0, TAU); cc.fill(); } });
  c.save(); c.rotate(rot);
  // umbră
  c.fillStyle = 'rgba(0,0,10,.45)'; c.beginPath(); c.ellipse(0, 4, 360, 24, 0, 0, TAU); c.fill();
  // arcuri roți + roți
  const wheel = (wx) => {
    c.fillStyle = '#0a0f2c'; c.beginPath(); c.arc(wx, -56, 68, 0, TAU); c.fill();
    c.save(); c.translate(wx, -56); c.rotate(wheelAng);
    c.fillStyle = '#161b33'; c.beginPath(); c.arc(0, 0, 54, 0, TAU); c.fill();
    c.fillStyle = '#cfd6ee'; c.beginPath(); c.arc(0, 0, 32, 0, TAU); c.fill();
    c.strokeStyle = '#7d89b3'; c.lineWidth = 6; for (let i = 0; i < 5; i++) { c.rotate(TAU / 5); c.beginPath(); c.moveTo(0, 0); c.lineTo(28, 0); c.stroke(); }
    c.fillStyle = '#c0722f'; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill(); c.restore();
  };
  // caroserie
  const body = c.createLinearGradient(0, -310, 0, -60); body.addColorStop(0, '#fffaf0'); body.addColorStop(1, '#efe3cf');
  c.fillStyle = body; c.beginPath(); c.roundRect(-300, -310, 410, 250, [28, 6, 6, 28]); c.fill();
  c.beginPath(); c.moveTo(110, -60); c.lineTo(110, -284); c.lineTo(212, -284); c.quadraticCurveTo(240, -284, 254, -246); c.lineTo(298, -150); c.quadraticCurveTo(314, -126, 314, -96); c.lineTo(314, -60); c.closePath(); c.fill();
  c.fillStyle = '#c0722f'; c.fillRect(-300, -140, 410, 34); c.fillRect(110, -140, 204, 34);
  c.drawImage(IMG.logo, -250, -296, 150, 142);
  c.fillStyle = '#1a2b5c'; c.beginPath(); c.moveTo(126, -268); c.lineTo(206, -268); c.quadraticCurveTo(222, -268, 232, -244); c.lineTo(262, -176); c.lineTo(126, -176); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(140, -262); c.lineTo(172, -262); c.lineTo(150, -182); c.lineTo(140, -182); c.fill();
  c.fillStyle = '#2a2f55'; c.beginPath(); c.roundRect(292, -100, 40, 34, 8); c.fill();
  c.fillStyle = '#fff6c4'; c.beginPath(); c.arc(304, -126, 15, 0, TAU); c.fill(); c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 304, -126, 90, '255,235,170', .8); c.restore();
  // coroană brad pe grilă
  c.fillStyle = '#1f7a44'; c.beginPath(); c.arc(260, -120, 22, 0, TAU); c.fill(); c.fillStyle = '#0c1540'; c.beginPath(); c.arc(260, -120, 11, 0, TAU); c.fill(); c.fillStyle = '#e63946'; c.beginPath(); c.arc(246, -142, 8, 0, TAU); c.arc(274, -142, 8, 0, TAU); c.fill();
  wheel(-170); wheel(190);
  // lumini pe acoperiș
  const cols = ['255,70,70', '255,210,70', '90,200,255', '120,255,160'];
  for (let i = 0; i < 16; i++) { const lx = -290 + i * 26, ly = -313 + Math.sin(i / 15 * Math.PI) * 6, on = .45 + .55 * (Math.sin(t * 6 + i * 1.7) > 0 ? 1 : .2); c.save(); c.globalCompositeOperation = 'lighter'; glow(c, lx, ly, 26, cols[i % 4], .85 * on); c.restore(); c.fillStyle = `rgb(${cols[i % 4]})`; c.beginPath(); c.arc(lx, ly, 5, 0, TAU); c.fill(); }
  // hayon spate (se ridică)
  const dp = E.outBack(prog(t, TL.door, TL.door + .45), 1.4);
  if (dp > 0) {
    c.save(); c.translate(-300, -310); c.rotate(-dp * 1.75); c.fillStyle = '#efe3cf'; c.strokeStyle = '#c0722f'; c.lineWidth = 6; c.beginPath(); c.roundRect(-14, 0, 20, 250, 6); c.fill(); c.stroke(); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, -310, -190, 260 * dp, '255,220,120', .75 * (1 - prog(t, TL.prod0 + 3 * TL.prodGap, TL.prod0 + 6 * TL.prodGap) * .6)); c.restore();
  }
  c.restore(); c.restore();
}
function worldB(c, t) {
  const sc = scrollB(t);
  sky(c, t * .8);
  c.save(); c.translate(0, 100);
  drawTile(c, CITY_B[0], sc);
  const fg = c.createLinearGradient(0, 960, 0, 1250); fg.addColorStop(0, 'rgba(120,140,220,0)'); fg.addColorStop(1, 'rgba(150,170,240,.25)'); c.fillStyle = fg; c.fillRect(0, 960, W, 290);
  drawTile(c, CITY_B[1], sc);
  // trotuar zăpadă + drum
  c.fillStyle = '#c9d7f7'; c.fillRect(0, 1235, W, 40);
  const rg = c.createLinearGradient(0, 1275, 0, 1400); rg.addColorStop(0, '#242b57'); rg.addColorStop(1, '#141a3d'); c.fillStyle = rg; c.fillRect(0, 1275, W, 130);
  c.fillStyle = '#e9f0ff'; for (let x = -mod(sc * 1.4, 220); x < W; x += 220) c.fillRect(x, 1348, 110, 8);
  // felinare
  for (let i = -1; i < 4; i++) {
    const x = mod(i * 430 - sc * .95 + 215, 1720) - 200;
    c.fillStyle = '#10183f'; c.fillRect(x - 6, 880, 12, 370); c.fillRect(x - 6, 876, 70, 12);
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x + 56, 900, 170, '255,220,140', .6);
    const g = c.createLinearGradient(0, 900, 0, 1260); g.addColorStop(0, 'rgba(255,225,150,.32)'); g.addColorStop(1, 'rgba(255,225,150,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x + 44, 896); c.lineTo(x + 70, 896); c.lineTo(x + 190, 1260); c.lineTo(x - 70, 1260); c.fill(); c.restore();
    c.fillStyle = '#fff4c8'; c.beginPath(); c.arc(x + 56, 898, 11, 0, TAU); c.fill();
  }
  // zăpadă în prim-plan
  const sg = c.createLinearGradient(0, 1400, 0, H); sg.addColorStop(0, '#dfe9ff'); sg.addColorStop(.25, '#97aae0'); sg.addColorStop(1, '#222d6e'); c.fillStyle = sg;
  c.beginPath(); c.moveTo(0, H); c.lineTo(0, 1415); for (let x = 0; x <= W + 40; x += 40) c.lineTo(x, 1410 + Math.sin((x + sc) * .01) * 10); c.lineTo(W, H); c.fill();
  drawVan(c, t);
  // produse
  drawProducts(c, t);
  c.restore();
  // linii de viteză
  const spd = (t < TL.vanStop ? 1 - prog(t, TL.vanStop - 1.2, TL.vanStop) : 0) * prog(t, TL.vanIn - .2, TL.vanIn + .3) + (t > TL.vanOut ? prog(t, TL.vanOut, TL.vanOut + .5) : 0);
  if (spd > .02) { c.save(); c.strokeStyle = `rgba(255,255,255,${.5 * spd})`; c.lineWidth = 3; c.lineCap = 'round'; for (let i = 0; i < 18; i++) { const r = rng(i + 70); const y = 780 + r() * 620, len = 140 + r() * 380, x = mod(r() * 1500 + t * 3000 * (.6 + r()), 1500) - 300; c.beginPath(); c.moveTo(x, y); c.lineTo(x - len, y); c.stroke(); } c.restore(); }
  snow(c, t, { n: 200, alpha: .85, wind: 200 });
}
const PRODS = [
  { k: 'trotineta', x: 150, w: 210, a: -.1 }, { k: 'pijamale', x: 345, w: 250, a: .06 }, { k: 'ghiozdan', x: 560, w: 260, a: -.05 },
  { k: 'spider', x: 770, w: 270, a: .08 }, { k: 'paw', x: 950, w: 200, a: -.07 }
];
function drawProducts(c, t) {
  PRODS.forEach((p, i) => {
    const t0 = TL.prod0 + i * TL.prodGap, d = .9, u = prog(t, t0, t0 + d); if (u <= 0) return;
    const img = IMG[p.k], h = p.w * img.height / img.width, sx = vanX(Math.min(t0, TL.vanOut)) - 320, sy = ROAD_Y - 120, ex = p.x, ey = 1385 + (i % 2) * 30 - h * .5;
    let x = lerp(sx, ex, u), y = lerp(sy, ey, E.outCubic(u) * .4 + u * .6) - Math.sin(u * Math.PI) * 520, sc = lerp(.25, 1, E.outCubic(u)), rot = (1 - u) * (i % 2 ? 7 : -7) + p.a;
    let sqx = 1, sqy = 1; const l = t - (t0 + d);
    if (l > 0) { const q = Math.exp(-l * 7) * Math.cos(l * 22); sqy = 1 - .22 * q; sqx = 1 + .16 * q; y = ey; x = ex; sc = 1; rot = p.a; }
    // umbră
    if (l > 0 || u > .6) { c.fillStyle = 'rgba(8,14,50,.4)'; c.beginPath(); c.ellipse(ex, ey + h * .5, p.w * .45 * sc, 16 * sc, 0, 0, TAU); c.fill(); }
    // motion blur manual: trail când zboară
    c.save(); c.translate(x, y + h * .5); c.rotate(rot); c.scale(sc * sqx, sc * sqy); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 20; c.shadowOffsetY = 10;
    c.drawImage(img, -p.w / 2, -h, p.w, h); c.restore();
    if (l > 0 && l < .9) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, ex, ey + h * .35, 260 * (1 - l / .9), '255,230,150', .5); c.restore(); }
    burst(c, t, t0 + d, ex, ey + h * .45, { n: 22, speed: 420, life: .8, colors: ['#fff', '#ffd23f', '#9fe0ff'], size: 22, seed: 40 + i });
    burst(c, t, t0 + d, ex, ey + h * .5, { n: 16, speed: 260, life: .7, g: 500, colors: ['#ffffff'], size: 11, seed: 60 + i, add: false });
    // sclipiri continue deasupra
    if (l > .5) { c.save(); c.globalCompositeOperation = 'lighter'; const a = (Math.sin(t * 5 + i * 2) * .5 + .5); sparkle(c, ex + (i % 2 ? 40 : -40), ey - 10 + Math.sin(t * 3 + i) * 8, 14 + a * 10, t * 2, `rgba(255,240,180,${.4 + a * .6})`); c.restore(); }
  });
}
function textsB(c, t) {
  const q = prog(t, TL.homio, TL.homio + .55), e = E.outElastic(q);
  if (q > 0) {
    c.save(); c.translate(540, 330); c.scale(lerp(.1, 1, e), lerp(.1, 1, e)); c.rotate((1 - e) * -.4);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-240, -150, 480, 300, 30); c.fill();
    c.strokeStyle = '#c0722f'; c.lineWidth = 8; c.beginPath(); c.roundRect(-226, -136, 452, 272, 22); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, 0, 480, '255,200,120', .35); c.restore();
    c.drawImage(IMG.logo, -142, -134, 284, 268);
    // sclipire care trece
    const sh = prog(t, TL.homio + .5, TL.homio + 1.1); if (sh > 0 && sh < 1) { c.save(); c.beginPath(); c.roundRect(-240, -150, 480, 300, 30); c.clip(); c.globalCompositeOperation = 'lighter'; const gx = lerp(-300, 300, sh), g = c.createLinearGradient(gx - 60, 0, gx + 60, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-300, -150, 600, 300); c.restore(); }
    c.restore();
    burst(c, t, TL.homio + .1, 540, 330, { n: 30, speed: 620, life: .9, colors: ['#ffd23f', '#fff', '#ff8a1f'], size: 24, seed: 55 });
  }
  const f1 = TL.prod0 - .15;
  words(c, t, [{ s: 'CADOURI', t0: f1, rot: .25 }, { s: 'LICENȚIATE', t0: f1 + .26, fill: '#ffd23f', rot: -.2 }], 540, 640, 136, { out: TL.deliv - .4 });
  words(c, t, [{ s: 'LIVRĂM', t0: TL.deliv, rot: .2 }, { s: 'ÎN', t0: TL.deliv + .18 }, { s: 'TOATĂ', t0: TL.deliv + .3 }], 540, 600, 120, {});
  words(c, t, [{ s: 'ROMÂNIA!', t0: TL.deliv + .5, fill: '#ffd23f', big: 1.1, rot: -.25 }], 540, 790, 180, {});
  const u = E.outCubic(prog(t, TL.deliv + .75, TL.deliv + 1.25));
  if (u > 0) { const x0 = 540 - 340; [['#0b3a9e'], ['#ffd23f'], ['#e63946']].forEach(([col], i) => { c.fillStyle = col; c.beginPath(); c.roundRect(x0 + i * 680 / 3, 905, 680 / 3 * u + (i < 2 ? 2 : 0), 20, i === 0 ? [10, 0, 0, 10] : i === 2 ? [0, 10, 10, 0] : 0); c.fill(); }); }
}

// ───────────────────────── SCENA 5: camera caldă ─────────────────────────
function makeRoom() {
  const rc = mk(W, H), c = rc.getContext('2d');
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a1d3d'); g.addColorStop(.62, '#6b3550'); g.addColorStop(1, '#2a1620'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // tapet
  c.fillStyle = 'rgba(255,200,150,.05)'; for (let x = 0; x < W; x += 90) c.fillRect(x, 0, 45, 1320);
  // podea
  const fg = c.createLinearGradient(0, 1300, 0, H); fg.addColorStop(0, '#6a3a22'); fg.addColorStop(1, '#2c170d'); c.fillStyle = fg; c.fillRect(0, 1300, W, H - 1300);
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { const y = 1300 + i * i * 9 + i * 14; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.fillStyle = '#2b1218'; c.fillRect(0, 1290, W, 18);
  // covor
  c.fillStyle = '#8b2b3d'; c.beginPath(); c.ellipse(560, 1520, 560, 150, 0, 0, TAU); c.fill(); c.strokeStyle = '#f2c38d'; c.lineWidth = 8; c.beginPath(); c.ellipse(560, 1520, 500, 120, 0, 0, TAU); c.stroke();
  return rc;
}
function drawTree(c, t, x, base, h) {
  c.save(); c.translate(x, base); c.rotate(Math.sin(t * .8) * .004);
  const tiers = 5, w0 = h * .34;
  c.fillStyle = '#4a2a14'; c.fillRect(-26, -50, 52, 64);
  for (let i = tiers - 1; i >= 0; i--) {
    const yb = -40 - i * h * .17, wid = w0 * (1 - i * .17), top = yb - h * .27;
    const g = c.createLinearGradient(-wid, 0, wid, 0); g.addColorStop(0, '#0f5a35'); g.addColorStop(.5, '#1d9b57'); g.addColorStop(1, '#0c4a2c');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, top); c.lineTo(wid, yb);
    for (let k = 4; k >= -4; k--) c.quadraticCurveTo(wid * (k + .5) / 4.6, yb + 26, wid * (k - 0) / 4.2 * 1, yb + (k % 2 ? 4 : -2));
    c.lineTo(-wid, yb); c.closePath(); c.fill();
  }
  // globuri
  const r = rng(3), bc = ['#e63946', '#ffd23f', '#2e5bff', '#ff8a1f'];
  for (let i = 0; i < 16; i++) { const lv = 1 + r() * (tiers - 1), yy = -40 - (lv - 1) * h * .17 - r() * h * .12, wd = w0 * (1 - (lv - 1) * .17) * .75 * (1 - (r() * .6)); const xx = (r() - .5) * 2 * wd * .9; c.fillStyle = bc[i % 4]; c.beginPath(); c.arc(xx, yy, 14, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(xx - 4, yy - 5, 4, 0, TAU); c.fill(); }
  // beculețe care clipesc
  const lc = ['255,80,80', '255,220,90', '100,200,255', '130,255,170']; const r2 = rng(8);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) { const lv = r2() * (tiers - .2), yy = -50 - lv * h * .17 - r2() * 40, wd = w0 * (1 - lv * .17) * .85, xx = (r2() - .5) * 2 * wd; const on = .35 + .65 * (.5 + .5 * Math.sin(t * 4 + i * 1.3)); glow(c, xx, yy, 36, lc[i % 4], .85 * on); }
  c.restore();
  // stea
  const sy = -40 - (tiers - 1) * h * .17 - h * .27;
  c.save(); c.translate(0, sy - 10); c.globalCompositeOperation = 'lighter'; glow(c, 0, 0, 160, '255,220,100', .8); c.restore();
  c.save(); c.translate(0, sy - 10); c.rotate(t * .8); sparkle(c, 0, 0, 56, 0, '#ffd23f'); c.restore();
  c.restore();
}
function giftBox(c, x, y, w, h, col, rb, rot) {
  c.save(); c.translate(x, y); c.rotate(rot || 0);
  c.fillStyle = col; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 8); c.fill();
  c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(w / 2 - 14, -h, 14, h);
  c.fillStyle = rb; c.fillRect(-7, -h, 14, h); c.fillRect(-w / 2, -h * .55, w, 14);
  c.beginPath(); c.ellipse(-18, -h - 6, 20, 13, -.4, 0, TAU); c.ellipse(18, -h - 6, 20, 13, .4, 0, TAU); c.fill(); c.restore();
}
function gaugeVal(t) { return 100 * (1 - E.inOut(prog(t, TL.gaugeDown, TL.gaugeZero))); }
function room(c, t) {
  const zoom = 1 + .06 * prog(t, TL.pushB, TL.flashB);
  c.save(); c.translate(W / 2, H * .6); c.scale(zoom, zoom); c.translate(-W / 2, -H * .6);
  c.drawImage(ROOM_BG, 0, 0);
  // fereastră
  c.fillStyle = '#10205a'; c.beginPath(); c.roundRect(640, 330, 340, 460, 14); c.fill();
  c.save(); c.beginPath(); c.roundRect(650, 340, 320, 440, 8); c.clip();
  const wg = c.createLinearGradient(0, 340, 0, 780); wg.addColorStop(0, '#0a1a55'); wg.addColorStop(1, '#2a46a0'); c.fillStyle = wg; c.fillRect(650, 340, 320, 440);
  c.fillStyle = '#fff6d6'; c.beginPath(); c.arc(900, 420, 34, 0, TAU); c.fill();
  c.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const f = SNOW[i]; c.globalAlpha = f.a; c.beginPath(); c.arc(650 + mod(f.x + t * 20, 320), 340 + mod(f.y + f.v * .5 * t, 440), f.r * .8, 0, TAU); c.fill(); } c.globalAlpha = 1;
  c.restore();
  c.strokeStyle = '#f0d6b2'; c.lineWidth = 14; c.beginPath(); c.roundRect(640, 330, 340, 460, 14); c.moveTo(810, 330); c.lineTo(810, 790); c.moveTo(640, 560); c.lineTo(980, 560); c.stroke();
  // draperii
  c.fillStyle = '#b02a3c'; c.beginPath(); c.moveTo(610, 310); c.quadraticCurveTo(650, 520, 620, 850); c.lineTo(580, 850); c.lineTo(580, 310); c.fill();
  c.beginPath(); c.moveTo(1010, 310); c.quadraticCurveTo(970, 520, 1000, 850); c.lineTo(1040, 850); c.lineTo(1040, 310); c.fill();
  // ghirlandă sus
  c.strokeStyle = '#1f7a44'; c.lineWidth = 16; c.beginPath(); c.moveTo(0, 190); c.quadraticCurveTo(270, 300, 540, 200); c.quadraticCurveTo(810, 120, W, 230); c.stroke();
  const lc = ['255,80,80', '255,220,90', '100,200,255', '130,255,170']; c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 20; i++) { const u = i / 19, x = u * W, y = u < .5 ? lerp(190, 200, u * 2) + Math.sin(u * 2 * Math.PI) * 55 : 200 + Math.sin(u * Math.PI) * 10 - 20 + Math.sin((u - .5) * 2 * Math.PI) * 50; glow(c, x, y + 20, 34, lc[i % 4], .5 + .5 * Math.sin(t * 5 + i)); } c.restore();
  // lumânări / bokeh
  c.save(); c.globalCompositeOperation = 'lighter'; BOKEH.forEach((b, i) => { const a = .08 + .07 * Math.sin(t * 1.5 + b.ph); glow(c, b.x, b.y * .75 + 100, b.r, b.c.join(','), a); }); c.restore();
  drawTree(c, t, 330, 1330, 940);
  // cadouri sub brad
  giftBox(c, 150, 1380, 130, 110, '#2e5bff', '#ffd23f', -.04); giftBox(c, 560, 1392, 110, 80, '#2fbf71', '#fff', .05); giftBox(c, 70, 1450, 100, 80, '#a24dff', '#ffd23f', .08);
  c.restore();
  // cadoul mare
  const gi = prog(t, TL.giftIn, TL.giftIn + .9), gy0 = 1380;
  let gy = gy0; if (gi < 1) gy = lerp(-300, gy0, E.outBounce(gi));
  const wob = t > TL.giftIn + 1.2 && t < TL.open ? Math.sin(t * 24) * .035 * prog(t, TL.giftIn + 1.2, TL.open) * (1 + 3 * prog(t, TL.open - .7, TL.open)) : 0;
  const op = t - TL.open;
  c.save(); c.translate(760, gy);
  c.save(); c.globalAlpha = .4; c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, 6, 190, 26, 0, 0, TAU); c.fill(); c.restore();
  c.rotate(wob);
  // corp cutie
  const bw = 300, bh = 240;
  const bg = c.createLinearGradient(-bw / 2, 0, bw / 2, 0); bg.addColorStop(0, '#d62839'); bg.addColorStop(1, '#a31224');
  c.fillStyle = bg; c.beginPath(); c.roundRect(-bw / 2, -bh, bw, bh, 10); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(-18, -bh, 36, bh);
  if (op > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, -bh, 420 * E.outCubic(clamp(op * 3)), '255,230,150', .95 * (1 - clamp((op - .5) / 2) * .5)); c.restore(); }
  // capac
  const lp = op > 0 ? op : 0, ly = -bh - 26 - (lp > 0 ? 900 * E.outCubic(clamp(lp * 1.1)) - 900 * 0 : 0), lr = lp * 6;
  if (lp < 1.1) {
    c.save(); c.translate(0, ly + 0); c.rotate(lr * .5); c.globalAlpha = 1 - clamp((lp - .7) / .4);
    c.fillStyle = '#e63946'; c.beginPath(); c.roundRect(-bw / 2 - 12, -26, bw + 24, 52, 10); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(-18, -26, 36, 52);
    c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(-30, -38, 36, 22, -.4, 0, TAU); c.ellipse(30, -38, 36, 22, .4, 0, TAU); c.fill(); c.fillStyle = '#e8a91a'; c.beginPath(); c.arc(0, -34, 14, 0, TAU); c.fill();
    c.restore();
  }
  c.restore();
  // produsul care iese
  if (op > .12) {
    const k = prog(op, .12, 1.4), e = E.outBack(k, 1.4), img = IMG.paw, w = 400, h = w * img.height / img.width;
    const hover = Math.sin(t * 3) * 10 * clamp(op - 1.4);
    c.save(); c.translate(760, gy0 - 250 - 420 * e + hover); c.rotate(lerp(-.9, -.05, e)); const s = lerp(.2, 1, e); c.scale(s, s);
    c.shadowColor = 'rgba(255,230,150,.9)'; c.shadowBlur = 40; c.drawImage(img, -w / 2, -h * .6, w, h); c.restore();
    burst(c, t, TL.open + .05, 760, gy0 - 250, { n: 60, speed: 900, life: 1.3, g: 700, colors: ['#ffd23f', '#e63946', '#2e5bff', '#2fbf71', '#fff'], size: 30, seed: 77, shape: 'rect', add: false });
    burst(c, t, TL.open + .05, 760, gy0 - 250, { n: 30, speed: 620, life: 1.0, colors: ['#fff', '#ffe27a'], size: 34, seed: 78 });
    // inimioare
    trail(c, t, { t0: TL.open + .6, t1: 99, rate: 5, life: 2.4, pos: tb => ({ x: 760 + Math.sin(tb * 7) * 150, y: gy0 - 380 }), draw: (cc, p, a, kk) => { cc.globalAlpha = (1 - a); heart(cc, p.x + Math.sin(a * 6 + kk) * 26, p.y - a * 460, 1.8 + (kk % 3) * .4, ['#ff4d6d', '#ff8fa3', '#ffd23f'][kk % 3]); cc.globalAlpha = 1; } });
  }
  // detector SUPĂRARE
  const gp = E.outBack(prog(t, TL.gaugeIn, TL.gaugeIn + .55), 1.6), v = gaugeVal(t);
  if (gp > 0) {
    c.save(); c.translate(540, 330 - (1 - gp) * 400);
    c.fillStyle = 'rgba(8,10,40,.82)'; c.strokeStyle = '#cdd6ff'; c.lineWidth = 6; c.beginPath(); c.roundRect(-460, -130, 920, 260, 30); c.fill(); c.stroke();
    // față
    const m = 1 - v / 100, fc = v > 50 ? lerp(0, 1, (100 - v) / 50) : 1;
    const col = v > 50 ? mixc([230, 57, 70], [255, 210, 63], (100 - v) / 50) : mixc([255, 210, 63], [61, 220, 132], (50 - v) / 50);
    c.save(); c.translate(-330, 0); const sh = v > 70 ? Math.sin(t * 60) * 3 * (v / 100) : 0; c.translate(sh, 0);
    c.fillStyle = `rgb(${col})`; c.beginPath(); c.arc(0, 0, 82, 0, TAU); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(-28, -14, 9, 0, TAU); c.arc(28, -14, 9, 0, TAU); c.fill();
    c.strokeStyle = '#111'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-48, -40 + m * 10 - (1 - m) * 6); c.lineTo(-12, -30 - (1 - m) * 18 + m * 0); c.moveTo(48, -40 + m * 10 - (1 - m) * 6); c.lineTo(12, -30 - (1 - m) * 18 + m * 0); c.stroke();
    c.beginPath(); const my = 32, curve = lerp(-26, 30, m); c.moveTo(-34, my); c.quadraticCurveTo(0, my + curve, 34, my); c.stroke();
    c.restore();
    txt(c, 'SUPĂRARE', -30, -84, 50, { align: 'left', fill: '#fff', stroke: null, ls: 5 });
    c.fillStyle = '#1a2150'; c.beginPath(); c.roundRect(-30, -50, 440, 38, 19); c.fill();
    c.fillStyle = `rgb(${col})`; c.beginPath(); c.roundRect(-30, -50, Math.max(6, 440 * v / 100), 38, 19); c.fill();
    const num = Math.round(v);
    txt(c, num + '%', 410, 66, 100, { align: 'right', fill: `rgb(${col})`, stroke: '#04081f', sw: 14 });
    c.restore();
  }
  // „ZERO”
  const zq = prog(t, TL.zeroTxt, TL.zeroTxt + .5);
  if (zq > 0) { const e = E.outElastic(zq); c.save(); c.translate(540, 560); c.rotate(-.06); c.scale(e, e); txt(c, 'ZERO SUPĂRARE!', 0, 0, 120, { fill: '#7dffa8', stroke: '#04200f', sw: 24, shadow: 'rgba(0,0,0,.6)', sb: 20 }); c.restore(); burst(c, t, TL.zeroTxt, 540, 560, { n: 40, speed: 700, life: 1, g: 500, colors: ['#7dffa8', '#fff', '#ffd23f'], size: 30, seed: 88 }); }
  c.fillStyle = 'rgba(255,150,60,.08)'; c.fillRect(0, 0, W, H);
}
function mixc(a, b, t) { t = clamp(t); return a.map((v, i) => Math.round(lerp(v, b[i], t))).join(','); }

// ───────────────────────── SCENA 6: card final ─────────────────────────
function endCard(c, t) {
  const g = c.createRadialGradient(540, 760, 40, 540, 760, 1300); g.addColorStop(0, '#1c3f9c'); g.addColorStop(.55, '#0c1f63'); g.addColorStop(1, '#040920'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'lighter';
  BOKEH.forEach((b, i) => { const a = .1 + .08 * Math.sin(t * 1.2 + b.ph); glow(c, mod(b.x + t * 12 * (i % 3 + 1), W + 200) - 100, mod(b.y - t * 20, H + 200) - 100, b.r * 1.4, i % 2 ? '120,170,255' : '255,200,120', a); });
  glow(c, 540, 760, 780, '255,190,110', .18);
  c.restore();
  for (const s of STARS) { c.globalAlpha = .3 + .5 * Math.sin(t * s.f + s.ph) ** 2; c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, s.y * 3, s.r, 0, TAU); c.fill(); } c.globalAlpha = 1;
  const lp = prog(t, TL.logo, TL.logo + .8), e = E.outElastic(lp);
  if (lp > 0) {
    c.save(); c.translate(540, 690); const bob = Math.sin(t * 2) * 6; c.translate(0, bob); c.scale(lerp(.05, 1, e), lerp(.05, 1, e)); c.rotate((1 - e) * .8);
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, 0, 640, '255,210,140', .5); c.restore();
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 60; c.shadowOffsetY = 30;
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-300, -284, 600, 568, 44); c.fill(); c.shadowColor = 'transparent';
    c.drawImage(IMG.logo, -290, -274, 580, 548);
    const sh = prog(t, TL.logo + 1, TL.logo + 1.7); if (sh > 0 && sh < 1) { c.save(); c.beginPath(); c.roundRect(-300, -284, 600, 568, 44); c.clip(); c.globalCompositeOperation = 'lighter'; const gx = lerp(-500, 500, sh), gg = c.createLinearGradient(gx - 90, -90, gx + 90, 90); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.75)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(-340, -320, 680, 640); c.restore(); }
    c.restore();
    burst(c, t, TL.logo + .35, 540, 690, { n: 60, speed: 880, life: 1.3, colors: ['#ffd23f', '#fff', '#ff8a1f', '#9fe0ff'], size: 34, seed: 101 });
  }
  words(c, t, [{ s: 'CADOUL', t0: TL.tag1, rot: .25 }, { s: 'AJUNGE.', t0: TL.tag1 + .22, rot: -.2 }], 540, 1090, 120, {});
  words(c, t, [{ s: 'MEREU.', t0: TL.tag2, fill: '#ffd23f', big: 1.1, rot: .3 }], 540, 1290, 200, {});
  const up = E.outBack(prog(t, TL.url, TL.url + .45), 2);
  if (up > 0) { c.save(); c.translate(540, 1470); c.scale(up, up); const pu = 1 + .03 * Math.sin(t * 6); c.scale(pu, pu); c.fillStyle = '#c0722f'; c.beginPath(); c.roundRect(-250, -54, 500, 108, 54); c.fill(); c.strokeStyle = '#ffd9a8'; c.lineWidth = 5; c.stroke(); txt(c, 'homio.ro', 0, 4, 76, { font: 'Fredoka', weight: '700', fill: '#fff', stroke: null }); c.restore(); }
  snow(c, t, { n: 220, alpha: .8, wind: 30 });
}

// ───────────────────────── compoziție totală ─────────────────────────
function withCam(c, t, fn, zoom) {
  const [sx, sy] = shakeAt(t, SHAKES);
  c.save(); c.translate(W / 2 + sx, H / 2 + sy); c.scale(zoom, zoom); c.translate(-W / 2, -H / 2); fn(); c.restore();
}
function scene(c, t) {
  c.fillStyle = '#040920'; c.fillRect(0, 0, W, H);
  if (t < TL.pause) {
    withCam(c, t, () => worldA(c, t), 1.05);
    textsA(c, t);
  } else if (t < TL.irisB) {
    pauseScene(c, t);
    if (t > TL.irisA) {   // iris spre scena 4
      const q = E.inOut(prog(t, TL.irisA, TL.irisB)), r = q * 1700;
      c.save(); c.beginPath(); c.arc(540, 960, r, 0, TAU); c.clip(); withCam(c, t, () => worldB(c, t), 1.05); textsB(c, t); c.restore();
      c.save(); c.lineWidth = 16; c.strokeStyle = `rgba(255,255,255,${.9 * (1 - q)})`; c.beginPath(); c.arc(540, 960, r, 0, TAU); c.stroke(); c.restore();
    }
  } else if (t < TL.pushB) {
    const q = E.inOut(prog(t, TL.pushA, TL.pushB));
    c.save(); c.translate(-W * .35 * q, 0); withCam(c, t, () => worldB(c, t), 1.05); textsB(c, t); c.restore();
    if (q > 0) {
      c.save(); c.translate(W * (1 - q), 0); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 80; room(c, t); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; const x = W * (1 - q); const g = c.createLinearGradient(x - 120, 0, x + 40, 0); g.addColorStop(0, 'rgba(255,230,160,0)'); g.addColorStop(1, `rgba(255,230,160,${.7 * Math.sin(q * Math.PI)})`); c.fillStyle = g; c.fillRect(x - 120, 0, 160, H); c.restore();
    }
  } else if (t < TL.flashB) {
    withCam(c, t, () => room(c, t), 1);
    const f = prog(t, TL.flashA, TL.logo) ; if (f > 0) { c.fillStyle = `rgba(255,244,220,${E.inCubic(clamp(f / .45))})`; c.fillRect(0, 0, W, H); }
  } else {
    withCam(c, t, () => endCard(c, t), 1);
    const f = 1 - prog(t, TL.logo - .05, TL.logo + .35); if (f > 0) { c.fillStyle = `rgba(255,244,220,${f})`; c.fillRect(0, 0, W, H); }
  }
  // fade in / out global
  const fi = 1 - prog(t, 0, .35), fo = prog(t, DURATION - .3, DURATION);
  if (fi > 0 || fo > 0) { c.fillStyle = `rgba(4,9,32,${Math.max(fi, fo)})`; c.fillRect(0, 0, W, H); }
  vignette(c, .85); grain(c, t);
}

// ───────────────────────── randare cu motion blur ─────────────────────────
function renderFrame(t, samples = 4, shutter = 1 / FPS) {
  for (let k = 0; k < samples; k++) {
    const tt = clamp(t + ((k + .5) / samples - .5) * shutter, 0, DURATION);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    scene(ctx, tt);
    mc.globalAlpha = k === 0 ? 1 : 1 / (k + 1); mc.drawImage(oc, 0, 0);
  }
  mc.globalAlpha = 1;
}
window.frameJPEG = (t, samples, q) => { renderFrame(t, samples == null ? 4 : samples); return cv.toDataURL('image/jpeg', q || .93); };
window.framePNG = (t, samples) => { renderFrame(t, samples == null ? 4 : samples); return cv.toDataURL('image/png'); };
window.ready = loadAssets().then(() => { buildStatic(); renderFrame(0, 1); });

// previzualizare în browser (fără ?render)
if (!/render/.test(location.search)) {
  window.ready.then(() => {
    const t0 = performance.now();
    (function loop() { renderFrame(((performance.now() - t0) / 1000) % DURATION, 2); requestAnimationFrame(loop); })();
  });
}
