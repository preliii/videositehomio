"""Coloana sonoră pentru videoclipul Homio: muzică + efecte sintetizate (numpy) și vocea reală pusă pe timeline.
Scrie în <out>/: voice.wav, music.wav, sfx.wav (44,1 kHz, stereo). Mixajul final se face cu ffmpeg (vezi build.sh).
Timpii sunt aceiași cu cei din TL (anim.js)."""
import sys, wave, subprocess, os
import numpy as np

SR = 44100
DUR = 28.8
N = int(SR * DUR)
rng = np.random.default_rng(7)
OUT = sys.argv[1]
VOICE_DIR = sys.argv[2]            # director cu linie_1.mp3 … linie_6.mp3
os.makedirs(OUT, exist_ok=True)

# ───────── timpii (copiați din TL) ─────────
A = [0, 0.65, 3.0, 8.75, 15.0, 19.8, 24.0]
T = dict(
    hook=[0.67, 0.93, 1.45], l1=[3.15, 3.55, 3.82, 4.22, 4.42], l2=[5.6, 6.0, 6.28, 6.56], stitch=7.48,
    sputter=2.2, descend=3.4, touch=5.0, pause=8.85, cursor1=10.5, cursor2=10.88, no=12.42, panelOut=12.72,
    slam=13.24, slam2=13.88, slam3=14.26, irisA=14.55, irisB=15.1, vanIn=14.7, vanStop=15.9, homio=15.08,
    door=16.0, prod0=16.2, gap=0.38, cad=[16.08, 16.58], deliv=[17.28, 17.67, 17.81], rom=18.15, vanOut=18.45,
    pushA=19.0, pushB=19.6, giftIn=19.7, gaugeIn=20.65, gaugeDown=21.6, gaugeZero=22.5, open=22.25,
    flashA=23.4, logo=24.0, tag1=[25.09, 25.82], tag2=27.11, url=27.5)

# ───────── unelte ─────────
def buf(): return np.zeros((N, 2), np.float32)
def tt(d): return np.arange(int(d * SR), dtype=np.float64) / SR
def put(b, x, t0, g=1.0, pan=0.0):
    i = int(round(t0 * SR)); x = np.asarray(x, np.float32)
    if i < 0: x = x[-i:]; i = 0
    j = min(N, i + len(x))
    if j <= i: return
    l = g * np.cos((pan + 1) * np.pi / 4); r = g * np.sin((pan + 1) * np.pi / 4)
    b[i:j, 0] += x[:j - i] * l; b[i:j, 1] += x[:j - i] * r
def fftf(x, lo=None, hi=None, soft=.15):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo: m *= 1 / (1 + np.exp(-(f - lo) / (lo * soft)))
    if hi: m *= 1 / (1 + np.exp((f - hi) / (hi * soft)))
    return np.fft.irfft(X * m, len(x))
def noise(d): return rng.standard_normal(int(d * SR))
def env(d, a=.005, r=None, p=2.0):
    n = int(d * SR); t = np.arange(n) / SR; r = r if r is not None else d - a
    e = np.minimum(t / max(a, 1e-4), 1) * np.clip(1 - (t - a) / max(r, 1e-4), 0, 1) ** p
    return e
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def sine(f, d): t = tt(d); return np.sin(2 * np.pi * (f if np.isscalar(f) else f) * t)
def glide(f0, f1, d, curve=1.0):
    t = tt(d); u = (t / d) ** curve; f = f0 + (f1 - f0) * u
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def norm(x, peak=1.0): m = np.max(np.abs(x)) + 1e-9; return x / m * peak

def ping(f, d=.7, bright=1.0):
    t = tt(d); x = np.sin(2 * np.pi * f * t) + .35 * bright * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 14) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 30)
    return x * np.exp(-t * 5.5) * env(d, .002, d, 1)
def pop(f=520, d=.09, up=False):
    x = glide(f * (.6 if up else 1.5), f * (1.5 if up else .7), d) * env(d, .002, d, 2)
    return x
def thump(f0=130, f1=38, d=.6, click=True):
    x = glide(f0, f1, d, .35) * np.exp(-tt(d) * 6)
    if click: x[:int(.004 * SR)] += noise(.004)[:int(.004 * SR)] * .5
    return x
def whoosh(d, f0=300, f1=5000, shape=.5):
    K = 14; n = int(d * SR); out = np.zeros(n); base = noise(d)
    for k in range(K):
        fc = f0 * (f1 / f0) ** (k / (K - 1)); y = fftf(base, fc / 1.5, fc * 1.5)
        c = (k / (K - 1)); w = np.exp(-((np.arange(n) / n - c) ** 2) / (2 * .12 ** 2)); out += y * w
    t = np.arange(n) / n; out *= np.sin(np.pi * np.clip(t ** shape, 0, 1)) ** 1.5
    return norm(out, .9)
def crunch(d=.5, lo=1500):
    x = fftf(noise(d), lo, 9000) * env(d, .003, d, 3)
    # câteva „pocnituri”
    for _ in range(int(d * 40)):
        i = rng.integers(0, int(d * SR) - 200); x[i:i + 60] += rng.standard_normal(60) * 2.5 * np.exp(-i / (d * SR) * 4)
    return norm(x, .9)
def sparkle(d=.9, n=14, lo=70, hi=96):
    out = np.zeros(int(d * SR))
    for _ in range(n):
        t0 = rng.uniform(0, d * .7); p = ping(midi(rng.integers(lo, hi)), .35); i = int(t0 * SR); out[i:i + len(p)] += p[:len(out) - i] * rng.uniform(.25, .7)
    return norm(out, .8)
def riser(d, f0=200, f1=6000):
    n = int(d * SR); t = np.arange(n) / n
    return (whoosh(d, f0, f1, 1.0) * .8 + glide(f0, f1, d, 2.0) * .35) * (t ** 1.6)
def tick(f=1800, d=.012): return np.sin(2 * np.pi * f * tt(d)) * env(d, .0005, d, 3)
def buzzer(d=.35): t = tt(d); return (np.sign(np.sin(2 * np.pi * 120 * t)) + np.sign(np.sin(2 * np.pi * 127 * t))) * .35 * env(d, .003, d, .6)
def engine(d, f0=110, f1=50, gate=True):
    t = tt(d); f = f0 + (f1 - f0) * (t / d) ** 1.2; ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in (1, 2, 3, 4, 5))
    if gate:
        g = np.ones_like(t); pos = 0.0
        while pos < d:
            on = rng.uniform(.05, .18) * (1 + pos / d); off = rng.uniform(.02, .12) * (1 + 2 * pos / d)
            i, j = int(pos * SR), int((pos + off) * SR); g[i:j] = .12; pos += on + off
        g = fftf(g, None, 60); x = x * np.clip(g, 0, 1)
    return fftf(x, None, 700) * np.clip(1 - t / d, 0, 1) ** .3

PENTA = [72, 74, 76, 79, 81, 84]

# ───────── SFX ─────────
def build_sfx():
    s = buf()
    put(s, whoosh(.9, 250, 4500), .15, .45, -.2)
    # cuvinte-cheie: pop-uri discrete
    for i, t0 in enumerate(T['hook'] + T['l1'] + T['l2'] + T['cad'] + T['deliv'] + [T['rom']] + T['tag1'] + [T['tag2']]):
        put(s, pop(520 + 40 * (i % 5), .08, up=True), t0 - .02, .22, (-1) ** i * .15)
    # sania se strică
    put(s, pop(700, .14), T['sputter'] + .15, .5)
    put(s, engine(T['touch'] - T['sputter'] + .2, 120, 46), T['sputter'], .5)
    for t0 in (2.45, 2.85, 3.2, 3.7, 4.1, 4.5): put(s, fftf(noise(.18), 150, 1400) * env(.18, .005, .18, 2), t0, .35)
    put(s, glide(1100, 220, 1.6, 1.4) * env(1.6, .05, 1.5, 1.2), T['descend'], .13)
    put(s, thump(120, 34, .8), T['touch'], .95); put(s, crunch(.7), T['touch'], .5)
    for t0, m in ((4.58, 84), (4.88, 79), (5.28, 88), (5.62, 83)):      # cadourile aterizează în zăpadă
        put(s, thump(170, 70, .22), t0, .5); put(s, crunch(.22, 2000), t0, .22); put(s, ping(midi(m), .3, .3), t0 + .02, .2)
    for t0 in (3.72, 4.02, 4.42, 4.78): put(s, whoosh(.3, 400, 2500), t0, .18)      # cad din sanie
    put(s, crunch(1.0, 900), T['touch'] + .1, .35); put(s, whoosh(1.1, 600, 5000, .4), T['touch'] + .05, .25)   # zăpada se scutură din brazi
    # Stitch?
    put(s, sparkle(1.0), T['stitch'], .35); put(s, thump(150, 55, .4), T['stitch'], .5); put(s, whoosh(.6, 3000, 400), T['stitch'] - .1, .3)
    # PAUZĂ
    p = glide(520, 38, .7, .5) * env(.7, .005, .7, 1.2); put(s, p, T['pause'], .55)
    put(s, ping(2093, .9), T['pause'], .3); put(s, tick(900, .03), T['pause'], .5)
    put(s, whoosh(.35, 300, 3000), T['pause'] + .12, .25)
    put(s, tick(1300), T['cursor1'] + .02, .5); put(s, tick(1300), T['cursor1'] + .2, .5); put(s, ping(midi(91), .5), T['cursor2'] - .02, .5)
    put(s, buzzer(.38), T['no'], .6); put(s, thump(110, 50, .35), T['no'], .5)
    put(s, whoosh(.3, 3500, 400), T['panelOut'], .3)
    # SLAM
    put(s, riser(T['slam'] - 12.55, 250, 7000), 12.55, .55)
    put(s, thump(90, 28, 1.3), T['slam'], 1.0); put(s, crunch(.5, 400) * .6, T['slam'], .6); put(s, sparkle(1.1), T['slam'] + .02, .3)
    for t0 in (T['slam2'], T['slam3']): put(s, thump(130, 38, .7), t0, .85); put(s, crunch(.35, 800), t0, .4)
    # iris → scena 4
    put(s, whoosh(.65, 300, 7000, .8), T['irisA'], .5); put(s, sparkle(1.2), T['homio'] - .02, .38); put(s, thump(140, 60, .4), T['homio'], .5)
    # duba
    n = int((T['vanStop'] - T['vanIn'] + .5) * SR)
    rum = fftf(noise(n / SR), 40, 400) * (np.linspace(.2, 1, n) ** 1.5) * np.linspace(1, .5, n); put(s, norm(rum, .9), T['vanIn'], .5)
    sq = fftf(noise(.3), 2800, 7000) * env(.3, .02, .3, 1.4); put(s, norm(sq, .8), T['vanStop'] - .3, .22)
    put(s, thump(100, 50, .3), T['vanStop'], .45)
    put(s, ping(midi(55), .5, .2), T['door'], .45); put(s, thump(160, 70, .25), T['door'], .45); put(s, sparkle(.8), T['door'] + .05, .25)
    for i in range(5):
        t0 = T['prod0'] + i * T['gap']
        put(s, whoosh(.38, 350, 3500), t0 - .02, .3); put(s, pop(500, .1, up=True), t0, .35)
        put(s, thump(150, 55, .35), t0 + .9, .6); put(s, ping(midi(PENTA[i]), .8), t0 + .9, .4, (i - 2) * .3); put(s, sparkle(.5, 7), t0 + .9, .22)
    put(s, whoosh(.9, 3500, 300), T['vanOut'], .45); put(s, engine(.9, 80, 150, False) * .6, T['vanOut'], .25)
    # push + camera
    put(s, whoosh(.65, 300, 5000), T['pushA'], .45)
    for t0, g in ((19.96, .8), (20.26, .4), (20.48, .22)): put(s, thump(110, 45, .35), t0, g)
    put(s, glide(400, 900, .16) * env(.16, .003, .16), T['gaugeIn'], .35); put(s, ping(midi(88), .4), T['gaugeIn'], .25)
    t0 = 20.9; per = .13
    while t0 < T['open']: put(s, tick(1100 + 700 * (t0 - 20.9), .015), t0, .22 + .3 * (t0 - 20.9) / 1.4); per = max(.035, per * .93); t0 += per
    put(s, glide(900, 380, T['gaugeZero'] - T['gaugeDown'], 1.3) * env(T['gaugeZero'] - T['gaugeDown'], .05, 1.2, 1.2), T['gaugeDown'], .09)
    put(s, pop(420, .18, up=True), T['open'] - .02, .8); put(s, whoosh(.5, 400, 6000), T['open'], .5); put(s, sparkle(1.4, 24), T['open'] + .03, .5); put(s, thump(140, 50, .5), T['open'], .6)
    for k, m in enumerate((72, 76, 79, 84, 88)): put(s, ping(midi(m), .9), T['gaugeZero'] + k * .07, .38, (k - 2) * .3)
    for t0 in (23.0, 23.25, 23.55): put(s, ping(midi(91 + int(t0 * 3) % 3), .5), t0, .12, rng.uniform(-.5, .5))
    # final
    put(s, riser(T['logo'] - T['flashA'], 250, 8000), T['flashA'], .55)
    put(s, thump(100, 32, 1.1), T['logo'], .9); put(s, whoosh(.5, 3000, 300), T['logo'], .35)
    for k, m in enumerate((84, 88, 91, 96)): put(s, ping(midi(m), 1.4), T['logo'] + .02 + k * .03, .35, (k - 1.5) * .35)
    put(s, sparkle(1.5, 26), T['logo'] + .1, .4)
    put(s, ping(midi(103), 1.0), T['logo'] + 1.08, .22); put(s, pop(600, .1, up=True), T['url'], .5); put(s, ping(midi(91), .8), T['url'] + .02, .35)
    return s

# ───────── MUZICA ─────────
CHORDS = [(48, [60, 64, 67]), (45, [57, 60, 64]), (53, [57, 60, 65]), (43, [55, 59, 62])]   # C Am F G
def pad(notes, d, amp=.16):
    t = tt(d); x = np.zeros_like(t)
    for m in notes:
        f = midi(m)
        for det in (-.004, .004):
            ph = 2 * np.pi * f * (1 + det) * t
            x += sum(np.sin(k * ph) / k ** 1.4 for k in (1, 2, 3, 4, 6))
    x = fftf(x, None, 1800)
    return norm(x, amp) * np.minimum(t / .35, 1) * np.clip((d - t) / .5, 0, 1)
def glock(m, d=.5):
    return ping(midi(m), d, .7)
def bass(m, d, amp=.3):
    t = tt(d); f = midi(m)
    x = np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)
    return x * amp * env(d, .01, d, 1.4)
def shaker(d=.08): return fftf(noise(d), 5500, 14000) * env(d, .004, d, 2)
def kick(): return thump(150, 42, .32) * .9
def clap(): return fftf(noise(.18), 900, 5000) * env(.18, .002, .18, 3)
def hat(): return fftf(noise(.05), 7000, 16000) * env(.05, .001, .05, 2)

def music_seg(m, t_start, t_end, mode, ci0=0, bpm=118):
    """mode: 'a' (zbor, clopoței), 'calm' (cameră), 'drive' (energic), 'end' (final)"""
    beat = 60 / bpm; bar = 4 * beat; t = t_start; bi = 0
    while t < t_end - 1e-6:
        root, ch = CHORDS[(ci0 + bi) % 4]
        d = min(bar, t_end - t)
        put(m, pad(ch, d + .4, .2 if mode != 'drive' else .17), t, 1)
        for k in range(8):
            tk = t + k * beat / 2
            if tk >= t_end: break
            gl = {'a': .13, 'calm': .17, 'drive': .2, 'end': .18}[mode]
            note = ch[[0, 1, 2, 1, 2, 1, 0, 1][k]] + 12 + (12 if mode in ('drive', 'end') and k % 4 == 3 else 0)
            put(m, glock(note, .55), tk, gl, (-1) ** k * .25)
            if mode == 'a' and k % 1 == 0: put(m, shaker(), tk + beat / 4 * 0, .1 + .07 * (k % 2 == 0), (-1) ** k * .4)
            if mode == 'drive':
                put(m, hat(), tk, .1);
                put(m, bass(root, beat / 2 * .9, .3), tk, 1)
            elif mode in ('calm', 'end') and k % 2 == 0: put(m, bass(root, beat * .95, .27), tk, 1)
            elif mode == 'a' and k % 2 == 0: put(m, bass(root, beat * .9, .2), tk, 1)
        if mode in ('drive',):
            for q in (0, 2): put(m, kick(), t + q * beat, .55)
            put(m, kick(), t + 3.5 * beat, .35)
            for q in (1, 3): put(m, clap(), t + q * beat, .22)
        if mode == 'end' and bi < 2:
            for q in (0, 2): put(m, kick(), t + q * beat, .4)
            for q in (1, 3): put(m, clap(), t + q * beat, .14)
        t += bar; bi += 1

def build_music():
    m = buf()
    music_seg(m, 0.0, T['pause'], 'a', 0)                                   # zbor + stricat
    mm = buf(); music_seg(mm, 0.0, N / SR, 'a', 0)                          # variantă pentru „pauză” (filtrată)
    m2 = buf(); music_seg(m2, T['slam'], T['pushA'] + .6, 'drive', 0)       # energic: scena 3→4
    m3 = buf(); music_seg(m3, T['pushA'], T['logo'], 'calm', 2)             # cameră
    m4 = buf(); music_seg(m4, T['logo'], DUR, 'end', 0)                     # final
    # în sania stricată clopoțeii se opresc (tăiem shaker 2.2–5.0 prin gain)
    g = np.ones(N, np.float32)
    def fade(a, b, v0, v1):
        i, j = int(a * SR), int(b * SR); g[i:j] = np.linspace(v0, v1, j - i)
    # secțiunea „a”: muzica se „strică” la sputter (coboară) și amuțește la pauză
    fade(T['sputter'], T['sputter'] + .4, 1, .55); fade(T['touch'], T['touch'] + .5, .55, .35); fade(T['pause'] - .05, T['pause'], .35, 0); g[int(T['pause'] * SR):] = 0
    out = m * g[:, None]
    # „pauză”: aceeași muzică, filtrată, foarte încet
    lo = np.stack([fftf(mm[:, c].astype(np.float64), None, 650) for c in (0, 1)], 1).astype(np.float32)
    pg = np.zeros(N, np.float32); i, j = int(T['pause'] * SR), int(T['slam'] * SR); pg[i:j] = .55; pg[i:i + 1500] *= np.linspace(0, 1, 1500)
    pg[j - 800:j] *= np.linspace(1, 0, 800)
    out += lo * pg[:, None]
    for seg, a, b in ((m2, T['slam'], T['pushA'] + .6), (m3, T['pushA'] + .1, T['logo'] + .1), (m4, T['logo'], DUR)):
        sg = np.zeros(N, np.float32); i, j = int(a * SR), int(b * SR); sg[i:j] = 1
        fi = int(.05 * SR); fo = int(.35 * SR); sg[i:i + fi] *= np.linspace(0, 1, fi); sg[j - fo:j] *= np.linspace(1, 0, fo)
        out += seg * sg[:, None]
    # final: sting lung + fade out
    tail = np.ones(N, np.float32); k0 = int((DUR - 1.4) * SR); tail[k0:] = np.linspace(1, 0, N - k0)
    return out * tail[:, None]

# ───────── VOCEA ─────────
def load_mp3(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768
def build_voice():
    v = buf()
    for n in range(1, 7):
        x = load_mp3(os.path.join(VOICE_DIR, f'linie_{n}.mp3'))
        rms = np.sqrt(np.mean(x[np.abs(x) > .01] ** 2)); x = x * (10 ** (-19 / 20) / rms)      # același nivel între replici
        put(v, x, A[n], 1.0)
    return v

def write(p, b):
    b = b / max(1.0, float(np.abs(b).max()) / .97); w = wave.open(p, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((b * 32767).astype('<i2').tobytes()); w.close()

if __name__ == '__main__':
    sfx = build_sfx(); mus = build_music(); voc = build_voice()
    for nm, b in (('sfx', sfx), ('music', mus), ('voice', voc)):
        print(nm, 'peak', float(np.abs(b).max()), 'rms dB', 20 * np.log10(np.sqrt(np.mean(b ** 2)) + 1e-9))
        write(os.path.join(OUT, nm + '.wav'), b)
