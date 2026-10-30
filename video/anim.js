'use strict';
/* Homio · „Crăciunul n-are restart” — motion graphic randat frame cu frame (canvas 2D).
   Tot ce apare pe ecran e o funcție de timp: scene(ctx, t). Când vine vocea reală,
   se ajustează doar timpii din TL. */

const W = 1080, H = 1920, FPS = 60, DURATION = 28.8;
const TAU = Math.PI * 2;

// ───────────────────────── timeline (secunde) ─────────────────────────
const TL = {
  // timpii de start ai replicilor audio (secunde în video) — vezi voce/audio/linie_N.mp3
  a: [0, 0.65, 3.0, 8.75, 15.0, 19.8, 24.0],
  // scena 1-2: lumea de noapte
  hook: [0.67, 0.93, 1.45], hookOut: 2.35,
  sputter: 2.2, descend: 3.4, touch: 5.0, stopA: 6.5,
  l1: [3.15, 3.55, 3.82, 4.22, 4.42], l2: [5.6, 6.0, 6.28, 6.56], stitch: 7.48, textsOut: 8.45,
  // scena 3: pauză
  pause: 8.85, cursor1: 10.5, cursor2: 10.88, no: 12.42, panelOut: 12.72, slam: 13.24, slam2: 13.88, slam3: 14.26,
  // tranziție + scena 4: livrarea
  irisA: 14.55, irisB: 15.1,
  vanIn: 14.7, vanStop: 15.9, homio: 15.08, door: 16.0, prod0: 16.2, prodGap: 0.38, cad: [16.08, 16.58], deliv: [17.28, 17.67, 17.81], rom: 18.15, vanOut: 18.45,
  // push spre interior
  pushA: 19.0, pushB: 19.6,
  // scena 5: camera
  giftIn: 19.7, gaugeIn: 20.65, gaugeDown: 21.6, gaugeZero: 22.5, open: 22.25, zeroTxt: 22.5,
  // scena 6: final
  flashA: 23.4, flashB: 24.0, logo: 24.0, tag1: [25.09, 25.82], tag2: 27.11, url: 27.5
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
  { t: TL.touch, a: 26, d: .55 }, { t: TL.touch + .8, a: 14, d: .4 }, { t: TL.no, a: 22, d: .4 },
  { t: TL.slam, a: 34, d: .6 }, { t: TL.slam2, a: 22, d: .4 }, { t: TL.slam3, a: 28, d: .5 }, { t: TL.vanStop, a: 14, d: .35 },
  ...[0, 1, 2, 3, 4].map(i => ({ t: TL.prod0 + i * TL.prodGap + .9, a: 8, d: .25 })),
  { t: TL.logo + .45, a: 12, d: .4 }
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
// cadourile din sanie: fiecare cade la momentul tf (în ordinea în care alunecă din grămadă)
const GIFTS = [
  { x: -148, y: -120, w: 78, h: 86, col: '#2e5bff', rb: '#ffd23f', rot: -.05, tf: 4.75, vx: 70, vy: -60, w0: 2.2 },
  { x: -80, y: -152, w: 66, h: 118, col: '#2fbf71', rb: '#fff', rot: .04, tf: 4.4, vx: 40, vy: -120, w0: -1.7 },
  { x: -142, y: -188, w: 64, h: 68, col: '#ffd23f', rb: '#d62839', rot: .1, tf: 4.0, vx: 110, vy: -90, w0: 2.6 },
  { x: -84, y: -212, w: 58, h: 60, col: '#a24dff', rb: '#ffd23f', rot: -.08, tf: 3.7, vx: 60, vy: -140, w0: -2.4 }
];
function giftBoxLocal(c, w, h, col, rb) {
  c.fillStyle = col; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 6); c.fill();
  c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(w / 2 - 10, -h / 2, 10, h);
  c.fillStyle = rb; c.fillRect(-5, -h / 2, 10, h); c.fillRect(-w / 2, -5, w, 10);
  c.beginPath(); c.ellipse(-12, -h / 2 - 4, 14, 9, -.4, 0, TAU); c.ellipse(12, -h / 2 - 4, 14, 9, .4, 0, TAU); c.fill();
}
function santa(c, t, broken) {
  const wob = broken ? Math.sin(t * 38) * 1.6 : 0;
  c.save(); c.translate(38 + wob, -26);
  // trunchi
  const bg = c.createLinearGradient(-38, -90, 38, 0); bg.addColorStop(0, '#ff4455'); bg.addColorStop(1, '#b3101f');
  c.fillStyle = bg; c.beginPath(); c.ellipse(0, -36, 40, 48, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.fillRect(-5, -82, 10, 66);
  c.fillStyle = '#26160c'; c.fillRect(-40, -20, 80, 14); c.fillStyle = '#ffd23f'; c.beginPath(); c.roundRect(-10, -23, 20, 20, 3); c.fill(); c.fillStyle = '#26160c'; c.fillRect(-5, -18, 10, 10);
  // brațul care ține hățurile
  c.strokeStyle = '#d6182a'; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(24, -62); c.quadraticCurveTo(70, -58, 98, -36); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(98, -36, 13, 0, TAU); c.fill(); c.fillStyle = '#3a2a1a'; c.beginPath(); c.arc(108, -33, 11, 0, TAU); c.fill();
  // cap
  c.save(); c.translate(0, -92); c.rotate(broken ? Math.sin(t * 30) * .03 + .06 : 0); c.translate(0, 92);
  c.fillStyle = '#f4cfa9'; c.beginPath(); c.arc(0, -92, 24, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,120,120,.5)'; c.beginPath(); c.arc(-14, -86, 6, 0, TAU); c.arc(14, -86, 6, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-24, -96); c.quadraticCurveTo(-38, -34, 0, -42); c.quadraticCurveTo(38, -34, 24, -96); c.quadraticCurveTo(0, -74, -24, -96); c.fill();
  c.beginPath(); c.ellipse(-9, -83, 11, 6, .3, 0, TAU); c.ellipse(9, -83, 11, 6, -.3, 0, TAU); c.fill();
  c.fillStyle = '#e8977a'; c.beginPath(); c.arc(0, -89, 7, 0, TAU); c.fill();
  if (broken) {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-9, -100, 7, 0, TAU); c.arc(9, -100, 7, 0, TAU); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(-9, -99, 3, 0, TAU); c.arc(9, -99, 3, 0, TAU); c.fill();
    c.strokeStyle = '#8a8a8a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-17, -112); c.lineTo(-3, -108); c.moveTo(17, -112); c.lineTo(3, -108); c.stroke();
    c.fillStyle = '#3a1010'; c.beginPath(); c.ellipse(0, -66, 7, 9, 0, 0, TAU); c.fill();
    const dy = (t * 80) % 40; c.fillStyle = '#7fd4ff'; c.globalAlpha = 1 - dy / 40; c.beginPath(); c.moveTo(36, -118 + dy); c.quadraticCurveTo(44, -104 + dy, 36, -100 + dy); c.quadraticCurveTo(28, -104 + dy, 36, -118 + dy); c.fill(); c.globalAlpha = 1;
  } else {
    c.fillStyle = '#111'; c.beginPath(); c.arc(-9, -99, 3, 0, TAU); c.arc(9, -99, 3, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(-15, -108); c.lineTo(-4, -107); c.moveTo(15, -108); c.lineTo(4, -107); c.stroke();
  }
  c.fillStyle = '#e31e32'; c.beginPath(); c.moveTo(-25, -108); c.quadraticCurveTo(-20, -160, 20, -154); c.quadraticCurveTo(48, -150, 48, -118); c.lineTo(25, -108); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-29, -118, 58, 18, 9); c.fill(); c.beginPath(); c.arc(48, -116, 11, 0, TAU); c.fill();
  c.restore();
  c.restore();
}
function sleigh(c, t, broken) {
  // patine
  c.strokeStyle = '#dbe5ff'; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-160, 82); c.lineTo(110, 82); c.quadraticCurveTo(168, 82, 168, 36); c.quadraticCurveTo(168, 14, 146, 20); c.stroke();
  c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(146, 20, 8, 0, TAU); c.fill();
  c.lineWidth = 7; c.beginPath(); c.moveTo(-110, 82); c.lineTo(-110, 40); c.moveTo(50, 82); c.lineTo(50, 40); c.stroke();
  // spătar curbat
  c.fillStyle = '#8f0f1f'; c.beginPath(); c.moveTo(-162, -34); c.quadraticCurveTo(-176, -98, -128, -112); c.quadraticCurveTo(-120, -70, -100, -34); c.closePath(); c.fill();
  c.strokeStyle = '#ffd23f'; c.lineWidth = 6; c.beginPath(); c.moveTo(-166, -40); c.quadraticCurveTo(-176, -98, -128, -112); c.stroke();
  // cadouri (cele care nu au căzut încă)
  GIFTS.forEach(g => {
    if (t >= g.tf) return; const k = prog(t, g.tf - .45, g.tf);
    c.save(); c.translate(g.x + g.w / 2 + Math.sin(t * 55) * 3 * k, g.y + g.h / 2 - 10 * k * k); c.rotate(g.rot + k * .25); giftBoxLocal(c, g.w, g.h, g.col, g.rb); c.restore();
  });
  santa(c, t, broken);
  // corpul săniei (în față, acoperă picioarele lui Moș)
  const g = c.createLinearGradient(0, -34, 0, 62); g.addColorStop(0, '#ff3b4c'); g.addColorStop(1, '#a31224');
  c.fillStyle = g; c.beginPath(); c.roundRect(-160, -34, 320, 98, [14, 14, 44, 44]); c.fill();
  c.strokeStyle = '#ffd23f'; c.lineWidth = 8; c.beginPath(); c.moveTo(-154, -26); c.lineTo(154, -26); c.stroke();
  c.beginPath(); c.arc(150, -4, 30, -1.1, 1.2); c.stroke();
  // ornamente: volută aurie + stea în medalion
  c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath();
  c.moveTo(-120, 30); c.bezierCurveTo(-100, -4, -60, 4, -66, 26); c.bezierCurveTo(-70, 40, -90, 34, -86, 24);
  c.moveTo(-6, 30); c.bezierCurveTo(-26, -4, -66, 4, -60, 26); c.stroke();
  c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(40, 20, 27, 0, TAU); c.fill(); c.fillStyle = '#c4151f'; c.beginPath(); c.arc(40, 20, 21, 0, TAU); c.fill(); sparkle(c, 40, 20, 17, 0, '#ffe27a');
  c.fillStyle = '#ffd23f'; for (const bx of [-20, 100]) { c.beginPath(); c.arc(bx, 40, 5, 0, TAU); c.fill(); }
  // ghirlandă cu beculețe pe margine
  const lc = ['255,80,80', '255,220,90', '100,200,255', '130,255,170'];
  c.strokeStyle = '#1f7a44'; c.lineWidth = 5; c.beginPath(); for (let i = 0; i <= 12; i++) { const x = -150 + i * 25, y = -34 + Math.sin(i * Math.PI) * -4 + 10 * Math.abs(Math.sin(i * Math.PI / 2)); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  for (let i = 0; i <= 12; i++) {
    const x = -150 + i * 25, y = -34 + 10 * Math.abs(Math.sin(i * Math.PI / 2)), on = broken ? (Math.sin(t * 25 + i * 3) > 0 ? 1 : .15) : .55 + .45 * Math.sin(t * 6 + i * 1.3);
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x, y + 6, 22, lc[i % 4], .85 * on); c.restore();
    c.fillStyle = `rgb(${lc[i % 4]})`; c.beginPath(); c.arc(x, y + 6, 5, 0, TAU); c.fill();
  }
  // coroniță pe spate
  c.save(); c.translate(-160, 14); c.strokeStyle = '#1f7a44'; c.lineWidth = 12; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.stroke();
  c.fillStyle = '#e63946'; c.beginPath(); c.arc(-10, -18, 7, 0, TAU); c.arc(10, -18, 7, 0, TAU); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, 18, 4, 0, TAU); c.arc(-15, 10, 4, 0, TAU); c.arc(15, 10, 4, 0, TAU); c.fill(); c.restore();
  // clopoței atârnați de volută
  for (let i = 0; i < 3; i++) {
    const a = Math.sin(t * (broken ? 18 : 7) + i) * (broken ? .1 : .25), len = 26 + i * 8;
    c.save(); c.translate(146 + i * 10, 20 + i * 12); c.rotate(a); c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, len); c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, len + 6, 8, Math.PI, 0); c.lineTo(8, len + 12); c.lineTo(-8, len + 12); c.closePath(); c.fill(); c.fillStyle = '#b8860b'; c.beginPath(); c.arc(0, len + 13, 2.5, 0, TAU); c.fill(); c.restore();
  }
  // felinar
  const lit = broken ? (Math.sin(t * 31) + Math.sin(t * 47) > .4 ? 1 : .08) : 1;
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 160, -34, 130 * lit + 30, broken ? '255,140,40' : '255,230,150', .95 * lit); c.restore();
  c.fillStyle = lit > .5 ? '#fff3b0' : '#6b5a30'; c.beginPath(); c.arc(160, -34, 11, 0, TAU); c.fill();
}
// grupul sanie + 2 reni, origine = centrul primului ren
function sleighGroup(c, t, st) {
  c.save(); c.translate(st.x, st.y); c.rotate(st.rot); c.scale(st.sc, st.sc);
  // ham auriu + hățuri de la mâna lui Moș
  c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath(); c.moveTo(-170, 0); c.quadraticCurveTo(-80, 14, -30, 4); c.moveTo(40, 0); c.quadraticCurveTo(100, 10, 150, 4); c.stroke();
  c.strokeStyle = '#7a0d18'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-190, -44); c.quadraticCurveTo(-70, -10 + (st.broken ? 24 : 0), 34, -18); c.moveTo(-190, -44); c.quadraticCurveTo(10, -6 + (st.broken ? 28 : 0), 224, -20); c.stroke();
  c.save(); c.translate(-330, 18); sleigh(c, t, st.broken); c.restore();
  c.save(); c.translate(0, 0); deer(c, t, st.ph + 1.4, st.amp, true, st.tired); c.restore();
  c.save(); c.translate(190, -4); deer(c, t, st.ph, st.amp, true, st.tired); c.restore();
  c.restore();
}
// poziția sanie în timp (coordonate ecran, centrul reniului din spate)
const GROUND_A = 1430;
const Y_REST = 1112;
function sleighState(t) {
  const sc = 1.12, fly = 850;
  let x, y = fly, rot = 0, amp = 1, broken = 0, tired = 0;
  const e = E.outCubic(prog(t, 0, 1.5));
  x = lerp(-420, 560, e);
  y = fly + Math.sin(t * 2.6) * 18 * e;
  rot = Math.sin(t * 2.6 + 1) * .03;
  if (t > TL.sputter) {
    broken = 1;
    const s = prog(t, TL.sputter, TL.descend);
    x = 560 + Math.sin(t * 45) * 4 * s;
    y = fly + Math.sin(t * 2.6) * 18 + (Math.sin(t * 22) > 0 ? 1 : -1) * 10 * s + 50 * E.inOut(s);
    rot = .03 + s * .05; amp = lerp(1, .7, s);
  }
  if (t > TL.descend) {
    const d = prog(t, TL.descend, TL.touch), dd = d * d;
    y = lerp(fly + 50, Y_REST, dd) + Math.sin(t * 22) * 6 * (1 - d);
    rot = lerp(.08, .13, dd); x = 560 + 30 * d; amp = lerp(.7, 1.2, d);
  }
  if (t > TL.touch) {
    const a = t - TL.touch, k = prog(t, TL.touch, TL.stopA), decay = Math.exp(-a * 3.2);
    x = 590 + 22 * E.outQuart(k);
    y = Y_REST - 44 * Math.sin(a * 9) * decay + 16 * E.outCubic(prog(a, 0, .9));
    rot = .13 - .09 * E.outCubic(prog(a, 0, 1)) + .05 * Math.sin(a * 8) * decay;
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
// cadou căzut din sanie: simulare balistică + sărituri pe zăpadă, apoi se deplasează odată cu lumea
function giftState(i, t) {
  const g = GIFTS[i]; if (t < g.tf) return null;
  const s0 = sleighState(g.tf), lx = g.x + g.w / 2 - 330, ly = g.y + g.h / 2 + 18, cs = Math.cos(s0.rot), sn = Math.sin(s0.rot);
  let x = s0.x + s0.sc * (cs * lx - sn * ly), y = s0.y + s0.sc * (sn * lx + cs * ly);
  let vx = g.vx, vy = g.vy, ang = g.rot + s0.rot, w = g.w0, rest = false;
  const gy = 1412 - g.h / 2, dt = 1 / 120, n = Math.floor((t - g.tf) / dt); let tc = g.tf;
  for (let k = 0; k < n; k++) {
    const dsc = scrollA(tc + dt) - scrollA(tc); tc += dt;
    if (rest) { x -= dsc; continue; }
    vy += 1700 * dt; x += vx * dt; y += vy * dt; ang += w * dt;
    if (y >= gy) { y = gy; if (vy > 220) { vy = -vy * .36; vx *= .6; w *= .55; } else { vy = 0; vx = 0; w = 0; rest = true; } }
  }
  return { x, y, ang, rest };
}
function drawFallenGifts(c, t) {
  GIFTS.forEach((g, i) => {
    const s = giftState(i, t); if (!s) return;
    if (s.rest || s.y > 1300) { c.fillStyle = 'rgba(8,14,50,.35)'; c.beginPath(); c.ellipse(s.x, 1416, g.w * .6, 10, 0, 0, TAU); c.fill(); }
    c.save(); c.translate(s.x, s.y); c.rotate(s.ang); giftBoxLocal(c, g.w, g.h, g.col, g.rb); c.restore();
  });
}
// brazi mari în care aterizează sania
const TREES = [
  { x: 110, apex: 1215, w: 230 }, { x: 270, apex: 1160, w: 250 }, { x: 430, apex: 1130, w: 262 },
  { x: 600, apex: 1135, w: 262 }, { x: 770, apex: 1160, w: 250 }, { x: 945, apex: 1220, w: 230 }
];
function bigPine(c, x, apex, base, w, rot) {
  const Hh = base - apex, tiers = 5;
  c.save(); c.translate(x, base); c.rotate(rot);
  c.fillStyle = 'rgba(8,14,50,.35)'; c.beginPath(); c.ellipse(0, -4, w * .55, 22, 0, 0, TAU); c.fill();
  c.fillStyle = '#1b0f08'; c.fillRect(-w * .05, -Hh * .14, w * .1, Hh * .16);
  for (let k = 0; k < tiers; k++) {
    const yb = -Hh * (.07 + .155 * k), yt = yb - Hh * .3, hw = w / 2 * (1 - k * .17);
    const g = c.createLinearGradient(-hw, 0, hw, 0); g.addColorStop(0, '#08262f'); g.addColorStop(.55, '#145560'); g.addColorStop(1, '#0a2c38');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, yt); c.lineTo(hw, yb);
    for (let j = 1; j <= 5; j++) c.quadraticCurveTo(hw - (j - .5) * 2 * hw / 5, yb + 20, hw - j * 2 * hw / 5, yb - 2);
    c.closePath(); c.fill();
    const s = hw * .62, ys = yt + (yb - yt) * .46;
    c.fillStyle = '#e7f0ff'; c.beginPath(); c.moveTo(0, yt); c.lineTo(s, ys);
    for (let j = 1; j <= 4; j++) c.quadraticCurveTo(s - (j - .5) * 2 * s / 4, ys + 18, s - j * 2 * s / 4, ys - 3);
    c.closePath(); c.fill();
  }
  c.restore();
}
function crashTrees(c, t) {
  const sc = scrollA(t), end = scrollA(TL.stopA);
  TREES.forEach((tr, i) => {
    const x = tr.x + end - sc; if (x < -240 || x > W + 300) return;
    const tc = TL.touch - .1 + Math.abs(tr.x - 560) / 1400, a = t - tc, decay = a > 0 ? Math.exp(-a * 2.6) : 0;
    const rot = Math.sin(t * 1.3 + i) * .006 + (a > 0 ? Math.sin(a * 11 + i) * .05 * decay : 0);
    const sink = a > 0 ? 30 * E.outCubic(prog(a, 0, .6)) * (1 - Math.abs(tr.x - 560) / 900) + Math.sin(a * 13) * 10 * decay : 0;
    bigPine(c, x, tr.apex + sink, 1560, tr.w, rot);
  });
}
// zăpada scuturată din brazi + nori de praf alb
function crashSnow(c, t) {
  const t0 = TL.touch - .1, a = t - t0; if (a < 0 || a > 3.2) return;
  const r = rng(5); c.save();
  for (let i = 0; i < 30; i++) {
    const delay = r() * .4, x0 = 80 + r() * 920, y0 = 1130 + r() * 110, vx = (r() - .5) * 280, vy = -140 - r() * 420, rad = 14 + r() * 34, life = 1.3 + r() * 1.2;
    const aa = a - delay; if (aa < 0 || aa > life) continue; const u = aa / life;
    const px = x0 + vx * aa - (scrollA(t) - scrollA(t0 + delay)), py = y0 + vy * aa + .5 * 950 * aa * aa, rr = rad * (1 + u * .7);
    const gg = c.createRadialGradient(px, py, 0, px, py, rr); gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(.6, 'rgba(232,240,255,.55)'); gg.addColorStop(1, 'rgba(232,240,255,0)');
    c.globalAlpha = .95 * (1 - u * u); c.fillStyle = gg; c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fill();
  }
  for (let i = 0; i < 10; i++) {
    const delay = i * .04, aa = a - delay; if (aa < 0 || aa > 2.4) continue; const u = aa / 2.4, x0 = 60 + i * 105, rr = 70 + u * 110;
    const px = x0 - (scrollA(t) - scrollA(t0 + delay)) * .6, py = 1170 - 120 * E.outCubic(u) + (i % 2) * 20;
    const gg = c.createRadialGradient(px, py, 0, px, py, rr); gg.addColorStop(0, 'rgba(240,246,255,.55)'); gg.addColorStop(1, 'rgba(240,246,255,0)');
    c.globalAlpha = (1 - u) * .8; c.fillStyle = gg; c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fill();
  }
  c.restore();
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
  // fum (după ce se strică)
  trail(c, t, {
    t0: TL.sputter, t1: 99, rate: 26, life: 1.9,
    pos: tb => { const s = sleighState(tb); return { x: s.x - 300 * s.sc, y: s.y - 40 * s.sc, sc: scrollA(tb) }; },
    draw: (cc, p, a, k) => { const r = rng(k * 5 + 1); cc.fillStyle = `rgba(${34 + a * 40},${34 + a * 40},${52 + a * 40},${.75 * (1 - a)})`; cc.beginPath(); cc.arc(p.x - (scrollA(t) - p.sc) - a * 90 + (r() - .5) * 30, p.y - a * 230, 18 + a * 64, 0, TAU); cc.fill(); }
  });
  sleighGroup(c, t, st);
  crashTrees(c, t);                       // sania cade în vârfurile brazilor
  drawFallenGifts(c, t);
  // praf de zăpadă sub sanie, cât timp alunecă prin ramuri
  trail(c, t, {
    t0: TL.touch - .15, t1: TL.touch + 1.3, rate: 38, life: 1.1,
    pos: tb => { const s = sleighState(tb); return { x: s.x, y: s.y + 100 * s.sc, sc: scrollA(tb) }; },
    draw: (cc, p, a, k) => { const r = rng(k * 9 + 2), rr = 26 + a * 70; const px = p.x + (r() - .5) * 760 - a * 140 - (scrollA(t) - p.sc), py = p.y + 20 - a * 90 - r() * 30;
      const gg = cc.createRadialGradient(px, py, 0, px, py, rr); gg.addColorStop(0, 'rgba(255,255,255,.8)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); cc.globalAlpha = (1 - a) * .9; cc.fillStyle = gg; cc.beginPath(); cc.arc(px, py, rr, 0, TAU); cc.fill(); cc.globalAlpha = 1; }
  });
  crashSnow(c, t);
  // abur de la reni
  if (t > TL.touch) trail(c, t, {
    t0: TL.touch + .3, t1: 99, rate: 3.2, life: 1.2,
    pos: tb => { const s = sleighState(tb); return { x: s.x + 205 * s.sc, y: s.y - 52 * s.sc, sc: 0 }; },
    draw: (cc, p, a) => { cc.fillStyle = `rgba(255,255,255,${.5 * (1 - a)})`; cc.beginPath(); cc.arc(p.x + a * 60, p.y - a * 30, 10 + a * 34, 0, TAU); cc.fill(); }
  });
  snow(c, t, { n: 220, alpha: .9 });
  // semnal de alarmă: puls portocaliu
  if (t > TL.sputter && t < TL.touch + .2) { const pu = (.5 + .5 * Math.sin(t * 14)) * prog(t, TL.sputter, TL.sputter + .4); c.fillStyle = `rgba(255,70,20,${.10 * pu})`; c.fillRect(0, 0, W, H); }
  return st;
}
function textsA(c, t) {
  const st = sleighState(t);
  words(c, t, [{ s: 'S-A', t0: TL.hook[0], fill: '#fff', rot: -.3 }, { s: 'STRICAT', t0: TL.hook[1], fill: '#ffd23f', rot: .25 }, { s: 'CEVA?', t0: TL.hook[2], fill: '#fff', rot: -.2 }], 540, 420, 190, { out: TL.hookOut });
  // semn de exclamare deasupra lui Moș
  if (t > TL.sputter && t < TL.touch + 1) {
    const p = E.outBack(prog(t, TL.sputter + .1, TL.sputter + .45), 3);
    c.save(); c.translate(st.x - 296 * st.sc, st.y - 215 * st.sc); c.scale(p, p);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 52, 0, TAU); c.fill(); c.fillStyle = '#e63946'; c.font = '86px Anton'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, 6); c.restore();
  }
  if (t > TL.l1[0]) {
    const o = { out: TL.textsOut };
    words(c, t, [{ s: 'MOȘUL', t0: TL.l1[0], rot: .2 }, { s: 'N-A', t0: TL.l1[1] }, { s: 'AJUNS', t0: TL.l1[2] }, { s: 'LA', t0: TL.l1[3] }, { s: 'TIMP?', t0: TL.l1[4], fill: '#ffd23f' }], 540, 380, 118, o);
    words(c, t, [{ s: 'TOCMAI', t0: TL.l2[0] }, { s: 'CÂND', t0: TL.l2[1] }, { s: 'ȚI-A', t0: TL.l2[2] }, { s: 'CERUT', t0: TL.l2[3] }], 540, 520, 118, o);
  }
  if (t > TL.stitch && t < TL.textsOut + .4) {
    const p = prog(t, TL.stitch, TL.stitch + .5), e = E.outElastic(p) * (1 - E.inCubic(prog(t, TL.textsOut, TL.textsOut + .35)));
    c.save(); c.translate(540, 700); c.scale(lerp(.1, 1, e), lerp(.1, 1, e)); c.rotate(Math.sin(t * 30) * .02 * (1 - p) - .04);
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, 0, 420, '60,160,255', .5 * (.7 + .3 * Math.sin(t * 8))); c.restore();
    txt(c, 'STITCH?', 0, 0, 250, { fill: '#7fd0ff', stroke: '#06122e', sw: 40, shadow: 'rgba(0,0,0,.6)', sb: 20, sy: 14 });
    c.restore();
    if (t < TL.textsOut) burst(c, t, TL.stitch, 540, 700, { n: 26, speed: 560, life: .8, colors: ['#9fe0ff', '#fff', '#ffd23f'], size: 26, seed: 21 });
  }
}

function chamfer(c, x, y, w, h, k) {
  c.beginPath(); c.moveTo(x + k, y); c.lineTo(x + w - k, y); c.lineTo(x + w, y + k); c.lineTo(x + w, y + h - k); c.lineTo(x + w - k, y + h); c.lineTo(x + k, y + h); c.lineTo(x, y + h - k); c.lineTo(x, y + k); c.closePath();
}
function menuIcon(c, kind, x, y, s, col) {
  c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = s * .15; c.lineCap = 'round'; c.lineJoin = 'round';
  if (kind === 0) { c.beginPath(); c.moveTo(-s * .3, -s * .42); c.lineTo(s * .44, 0); c.lineTo(-s * .3, s * .42); c.closePath(); c.fill(); }
  else if (kind === 1) { c.beginPath(); c.arc(0, 0, s * .38, -2.0, 3.7); c.stroke(); c.beginPath(); c.moveTo(-s * .06, -s * .74); c.lineTo(s * .3, -s * .42); c.lineTo(-s * .12, -s * .26); c.closePath(); c.fill(); }
  else { c.beginPath(); c.roundRect(-s * .44, -s * .44, s * .46, s * .88, 4); c.stroke(); c.beginPath(); c.moveTo(-s * .06, 0); c.lineTo(s * .5, 0); c.moveTo(s * .28, -s * .2); c.lineTo(s * .5, 0); c.lineTo(s * .28, s * .2); c.stroke(); }
  c.restore();
}
function chip(c, kind, x, y, label, val, col) {
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(8,12,44,.85)'; c.strokeStyle = 'rgba(140,160,255,.45)'; c.lineWidth = 3; c.beginPath(); c.roundRect(-104, -34, 208, 68, 16); c.fill(); c.stroke();
  c.fillStyle = col;
  if (kind === 0) { c.fillRect(-84, -8, 30, 24); c.fillStyle = '#fff'; c.fillRect(-71, -8, 4, 24); c.fillRect(-84, 1, 30, 4); c.fillStyle = col; c.beginPath(); c.ellipse(-76, -12, 8, 5, -.5, 0, TAU); c.ellipse(-62, -12, 8, 5, .5, 0, TAU); c.fill(); }
  else if (kind === 1) { c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.save(); c.translate(-69, 4); c.rotate(i * Math.PI / 3); c.beginPath(); c.moveTo(-17, 0); c.lineTo(17, 0); c.stroke(); c.restore(); } }
  else heart(c, -69, 6, 1.5, col);
  txt(c, label, -40, -13, 22, { font: 'Fredoka', weight: '600', align: 'left', fill: '#9fb0ff', stroke: null, ls: 1 });
  txt(c, val, -40, 14, 34, { align: 'left', fill: '#fff', stroke: null });
  c.restore();
}
function pausePanel(c, t) {
  const pin = E.outBack(prog(t, TL.pause + .15, TL.pause + .7), 1.8), pout = E.inCubic(prog(t, TL.panelOut, TL.panelOut + .25));
  if (pout >= 1) return;
  let sx = 0; if (t > TL.no && t < TL.no + .35) sx = Math.sin(t * 120) * 16 * (1 - prog(t, TL.no, TL.no + .35));
  const PW = 740, PH = 900, sc = pin * (1 - pout * .9);
  c.save(); c.translate(540 + sx, 910); c.scale(sc, sc); c.rotate(pout * .5);
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, 0, 720, '90,130,255', .3); c.restore();
  // corp cu colțuri tăiate
  chamfer(c, -PW / 2, -PH / 2, PW, PH, 40);
  const bg = c.createLinearGradient(0, -PH / 2, 0, PH / 2); bg.addColorStop(0, '#18237a'); bg.addColorStop(.35, '#0d1650'); bg.addColorStop(1, '#070b2e'); c.fillStyle = bg; c.fill();
  c.save(); chamfer(c, -PW / 2, -PH / 2, PW, PH, 40); c.clip();
  c.strokeStyle = 'rgba(120,150,255,.08)'; c.lineWidth = 2; for (let x = -PW / 2; x < PW / 2; x += 40) { c.beginPath(); c.moveTo(x, -PH / 2); c.lineTo(x, PH / 2); c.stroke(); } for (let y = -PH / 2; y < PH / 2; y += 40) { c.beginPath(); c.moveTo(-PW / 2, y); c.lineTo(PW / 2, y); c.stroke(); }
  // antet
  const hg = c.createLinearGradient(0, -PH / 2, 0, -PH / 2 + 180); hg.addColorStop(0, 'rgba(255,255,255,.14)'); hg.addColorStop(1, 'rgba(255,255,255,.02)'); c.fillStyle = hg; c.fillRect(-PW / 2, -PH / 2, PW, 180);
  c.fillStyle = 'rgba(255,210,63,.1)'; for (let x = -PW / 2 - 100; x < PW / 2; x += 56) { c.beginPath(); c.moveTo(x, -PH / 2 + 180); c.lineTo(x + 28, -PH / 2 + 180); c.lineTo(x + 28 + 60, -PH / 2 + 120); c.lineTo(x + 60, -PH / 2 + 120); c.fill(); }
  c.fillStyle = '#ffd23f'; c.fillRect(-PW / 2, -PH / 2 + 180, PW, 6);
  // linie de scanare care trece peste panou
  const sy = mod(t * 260, PH + 200) - PH / 2 - 100; const sg = c.createLinearGradient(0, sy - 40, 0, sy + 40); sg.addColorStop(0, 'rgba(160,190,255,0)'); sg.addColorStop(.5, 'rgba(160,190,255,.14)'); sg.addColorStop(1, 'rgba(160,190,255,0)'); c.fillStyle = sg; c.fillRect(-PW / 2, sy - 40, PW, 80);
  c.restore();
  // contur neon cu degrade
  chamfer(c, -PW / 2, -PH / 2, PW, PH, 40); const bd = c.createLinearGradient(-PW / 2, -PH / 2, PW / 2, PH / 2); bd.addColorStop(0, '#6fe7ff'); bd.addColorStop(.5, '#a58bff'); bd.addColorStop(1, '#ff7ad9'); c.strokeStyle = bd; c.lineWidth = 9; c.stroke();
  chamfer(c, -PW / 2 + 16, -PH / 2 + 16, PW - 32, PH - 32, 28); c.strokeStyle = 'rgba(160,180,255,.3)'; c.lineWidth = 2; c.stroke();
  // colțare galbene
  c.strokeStyle = '#ffd23f'; c.lineWidth = 8; c.lineCap = 'square';
  for (const [sxx, syy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cx = sxx * (PW / 2 - 4), cy = syy * (PH / 2 - 4); c.beginPath(); c.moveTo(cx - sxx * 70, cy); c.lineTo(cx, cy); c.lineTo(cx, cy - syy * 70); c.stroke(); }
  // titlu + pictograme (Ă are loc destul deasupra)
  c.fillStyle = '#fff'; c.fillRect(-318, -PH / 2 + 62, 14, 56); c.fillRect(-294, -PH / 2 + 62, 14, 56); c.fillRect(280, -PH / 2 + 62, 14, 56); c.fillRect(304, -PH / 2 + 62, 14, 56);
  txt(c, 'PAUZĂ', 0, -PH / 2 + 96, 128, { fill: '#fff', stroke: null, ls: 10, shadow: 'rgba(110,180,255,.9)', sb: 0 });
  // statistici
  chip(c, 0, -232, -PH / 2 + 250, 'CADOURI', '12/12', '#ff6b6b'); chip(c, 1, 0, -PH / 2 + 250, 'VITEZĂ', '0 KM/H', '#9fe0ff'); chip(c, 2, 232, -PH / 2 + 250, 'MOȘ', '100%', '#ff6b8a');
  // butoane
  const items = ['CONTINUĂ', 'RESTART', 'IEȘIRE'], ys = [-80, 52, 184], k = E.inOut(prog(t, TL.cursor1, TL.cursor2)), barY = lerp(ys[0], ys[1], k);
  items.forEach((s, i) => {
    const y = ys[i], act = clamp(1 - Math.abs(barY - y) / 70);
    c.save(); c.translate(0, y);
    chamfer(c, -300, -52, 600, 104, 22);
    if (act > .01) { const ag = c.createLinearGradient(0, -52, 0, 52); ag.addColorStop(0, '#fff1a8'); ag.addColorStop(.5, '#ffd23f'); ag.addColorStop(1, '#ff9d1f'); c.fillStyle = ag; c.save(); c.globalAlpha = act; c.shadowColor = 'rgba(255,200,60,.8)'; c.shadowBlur = 30 * act; c.fill(); c.restore(); }
    if (act < .99) { const ig = c.createLinearGradient(0, -52, 0, 52); ig.addColorStop(0, '#1d2a82'); ig.addColorStop(1, '#0f1850'); c.fillStyle = ig; c.save(); c.globalAlpha = 1 - act; c.fill(); c.restore(); }
    chamfer(c, -300, -52, 600, 104, 22); c.strokeStyle = act > .5 ? '#fff' : '#3b4bb5'; c.lineWidth = 4; c.stroke();
    if (act > .3) { c.save(); chamfer(c, -300, -52, 600, 104, 22); c.clip(); c.fillStyle = `rgba(255,255,255,${.3 * act})`; c.fillRect(-300, -52, 600, 44); c.restore(); }
    const col = act > .5 ? '#1a1233' : '#8ea2ff';
    menuIcon(c, i, -240, 0, 54, col);
    txt(c, s, -6, 4, 70, { fill: col, stroke: null, ls: 5 });
    c.restore();
  });
  const bl = Math.sin(t * 14) > -.3; if (bl) { c.fillStyle = '#1a1233'; c.beginPath(); c.moveTo(250, barY - 18); c.lineTo(220, barY); c.lineTo(250, barY + 18); c.closePath(); c.fill(); }
  // subsol
  txt(c, 'APASĂ PENTRU A ALEGE', 0, 332, 28, { font: 'Fredoka', weight: '600', fill: '#9fb0ff', stroke: null, ls: 3 });
  c.fillStyle = 'rgba(140,160,255,.3)'; c.fillRect(-300, 358, 600, 3);
  txt(c, 'NIVEL 24 DECEMBRIE', -300, 392, 26, { font: 'Fredoka', weight: '600', align: 'left', fill: '#6f80d8', stroke: null, ls: 2 });
  txt(c, 'ORA 23:59', 300, 392, 26, { font: 'Fredoka', weight: '600', align: 'right', fill: '#ffd23f', stroke: null, ls: 2 });
  // „NU!”
  if (t > TL.no) { const q = E.outBack(prog(t, TL.no, TL.no + .2), 3); c.save(); c.translate(250, 52); c.scale(q, q); c.rotate(-.2); c.fillStyle = '#e63946'; c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.roundRect(-95, -50, 190, 100, 16); c.fill(); c.stroke(); txt(c, 'NU!', 0, 4, 80, { fill: '#fff', stroke: null }); c.restore(); }
  c.restore();
}
// ───────────────────────── SCENA 3: PAUZĂ ─────────────────────────
function pauseScene(c, t) {
  const fz = TL.stopA + .15;                         // cadrul înghețat
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

  pausePanel(c, t);
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
      drop(TL.slam2, 'N-ARE', 990, 250, '#ffd23f', .04);
      drop(TL.slam3, 'RESTART.', 1200, 250, '#ffd23f', -.03);
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
  words(c, t, [{ s: 'CADOURI', t0: TL.cad[0], rot: .25 }, { s: 'LICENȚIATE', t0: TL.cad[1], fill: '#ffd23f', rot: -.2 }], 540, 640, 136, { out: TL.deliv[0] - .4 });
  words(c, t, [{ s: 'LIVRĂM', t0: TL.deliv[0], rot: .2 }, { s: 'ÎN', t0: TL.deliv[1] }, { s: 'TOATĂ', t0: TL.deliv[2] }], 540, 600, 120, {});
  words(c, t, [{ s: 'ROMÂNIA!', t0: TL.rom, fill: '#ffd23f', big: 1.1, rot: -.25 }], 540, 790, 180, {});
  const u = E.outCubic(prog(t, TL.rom + .25, TL.rom + .75));
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
  const tiers = 6, w0 = h * .43, th = h * .27, step = h * .145;
  const bc = ['#e63946', '#ffd23f', '#2e5bff', '#c9d3e6', '#ff8a1f', '#a24dff', '#2fbf71'];
  c.fillStyle = '#4a2a14'; c.fillRect(-26, -54, 52, 66);
  const garl = [], ball = [], r = rng(31);
  for (let k = 0; k < tiers; k++) {
    const yb = -44 - k * step, wid = w0 * (1 - k * .14), top = yb - th, m = 5 + (tiers - k > 3 ? 1 : 0) - (k > 3 ? 1 : 0);
    // strat din spate, mai închis, ca ramurile să pară pline
    c.fillStyle = '#0a4026'; c.beginPath(); c.moveTo(0, top - 6); c.lineTo(wid * 1.05, yb + 12); c.lineTo(-wid * 1.05, yb + 12); c.closePath(); c.fill();
    const g = c.createLinearGradient(-wid, 0, wid, 0); g.addColorStop(0, '#0f5a35'); g.addColorStop(.5, '#22a85f'); g.addColorStop(1, '#0c4a2c');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, top); c.lineTo(wid, yb);
    const pts = [];
    for (let j = 1; j <= m; j++) { const x1 = wid - (j - .5) * 2 * wid / m, x2 = wid - j * 2 * wid / m; c.quadraticCurveTo(x1, yb + 28, x2, yb - 2); pts.push({ x0: wid - (j - 1) * 2 * wid / m, x1, x2, yb }); }
    c.closePath(); c.fill();
    // fire de ramuri
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3; for (let q = 1; q < 4; q++) { c.beginPath(); c.moveTo(0, top + (yb - top) * q / 4.4); c.lineTo(wid * (q / 4) * .95, yb - 4 - (4 - q) * 3); c.moveTo(0, top + (yb - top) * q / 4.4); c.lineTo(-wid * (q / 4) * .95, yb - 4 - (4 - q) * 3); c.stroke(); }
    garl.push(pts); 
  }
  // ghirlande aurii pe marginea fiecărei trepte + globuri la fiecare scallop (aproape ordonat, cu mici abateri)
  const lights = [], lcl = ['255,80,80', '255,220,90', '100,200,255', '130,255,170'];
  garl.forEach((pts, k) => {
    c.strokeStyle = '#f2c14e'; c.lineWidth = 5; c.beginPath();
    pts.forEach((p, j) => { const yy = p.yb + 28 * .5; if (j === 0) c.moveTo(p.x0, p.yb - 1); c.quadraticCurveTo(p.x1, p.yb + 30, p.x2, p.yb - 1); });
    c.stroke();
    pts.forEach((p, j) => {
      // bile la capetele festonului (jos) – culori alternate cu mici abateri
      const bx = p.x1 + (r() - .5) * 8, by = p.yb + 21 + (r() - .5) * 8, rad = 13 + r() * 4, col = bc[(k * 2 + j + (r() < .25 ? 1 : 0)) % bc.length];
      ball.push({ x: bx, y: by, r: rad, c: col });
      if (j > 0) ball.push({ x: p.x0 + (r() - .5) * 6, y: p.yb - 12 + (r() - .5) * 6, r: 10 + r() * 3, c: bc[(k + j * 3) % bc.length] });
      for (let q = 1; q < 4; q++) { const u = q / 4, lx = lerp(p.x0, p.x2, u), ly = p.yb + 2 + Math.sin(u * Math.PI) * 26; lights.push({ x: lx, y: ly, c: lcl[(j + q + k) % 4], ph: j * 1.7 + q * .9 + k }); }
    });
  });
  ball.forEach(b => {
    c.fillStyle = b.c; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(b.x + b.r * .25, b.y + b.r * .3, b.r * .8, 0, TAU); c.fill(); c.fillStyle = b.c; c.beginPath(); c.arc(b.x, b.y, b.r * .85, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(b.x - b.r * .3, b.y - b.r * .35, b.r * .26, 0, TAU); c.fill();
    c.fillStyle = '#f2c14e'; c.fillRect(b.x - 3, b.y - b.r - 4, 6, 6);
  });
  c.save(); c.globalCompositeOperation = 'lighter';
  lights.forEach(l => { const on = .35 + .65 * (.5 + .5 * Math.sin(t * 4 + l.ph)); glow(c, l.x, l.y, 30, l.c, .8 * on); });
  c.restore();
  lights.forEach(l => { c.fillStyle = `rgb(${l.c})`; c.beginPath(); c.arc(l.x, l.y, 4, 0, TAU); c.fill(); });
  // stea
  const sy = -44 - (tiers - 1) * step - th;
  c.save(); c.translate(0, sy - 10); c.globalCompositeOperation = 'lighter'; glow(c, 0, 0, 170, '255,220,100', .85); c.restore();
  c.save(); c.translate(0, sy - 10); c.rotate(t * .8); sparkle(c, 0, 0, 60, 0, '#ffd23f'); c.restore();
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
  drawTree(c, t, 330, 1340, 880);
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
  // produsul care iese: zboară în sus din cutie și rămâne deasupra ei, sub text
  if (op > .1) {
    const k = prog(op, .1, 1.2), e = E.outBack(k, 1.5), img = IMG.paw, w = 330, h = w * img.height / img.width;
    const hover = Math.sin(t * 3) * 12 * clamp(op - 1.2), cy = lerp(1330, 905, e) + hover;
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(760, 930); c.rotate(t * .35);
    for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); const g = c.createLinearGradient(0, 0, 470, 0); g.addColorStop(0, 'rgba(255,230,150,.5)'); g.addColorStop(1, 'rgba(255,230,150,0)'); c.fillStyle = g; c.globalAlpha = clamp(op * 2) * (.5 + .5 * Math.sin(i * 2 + t * 3)); c.beginPath(); c.moveTo(0, 0); c.lineTo(470, -26); c.lineTo(470, 26); c.fill(); }
    c.restore();
    c.save(); c.translate(760, cy); c.rotate(lerp(-1.1, -.12, e) + Math.sin(t * 2) * .03 * clamp(op - 1)); const s2 = lerp(.2, 1, e); c.scale(s2, s2);
    c.shadowColor = 'rgba(255,230,150,.9)'; c.shadowBlur = 40; c.drawImage(img, -w / 2, -h * .55, w, h); c.restore();
    burst(c, t, TL.open + .05, 760, 1150, { n: 60, speed: 900, life: 1.3, g: 700, colors: ['#ffd23f', '#e63946', '#2e5bff', '#2fbf71', '#fff'], size: 30, seed: 77, shape: 'rect', add: false });
    burst(c, t, TL.open + .05, 760, 1150, { n: 30, speed: 620, life: 1.0, colors: ['#fff', '#ffe27a'], size: 34, seed: 78 });
    trail(c, t, { t0: TL.open + .6, t1: 99, rate: 5, life: 2.4, pos: tb => ({ x: 760 + Math.sin(tb * 7) * 150, y: 1180 }), draw: (cc, p, a, kk) => { cc.globalAlpha = (1 - a); heart(cc, p.x + Math.sin(a * 6 + kk) * 26, p.y - a * 420, 1.8 + (kk % 3) * .4, ['#ff4d6d', '#ff8fa3', '#ffd23f'][kk % 3]); cc.globalAlpha = 1; } });
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
  words(c, t, [{ s: 'CADOUL', t0: TL.tag1[0], rot: .25 }, { s: 'AJUNGE.', t0: TL.tag1[1], rot: -.2 }], 540, 1090, 120, {});
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
