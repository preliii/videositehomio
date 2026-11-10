"""Muzică (120 BPM, originală, sintetizată) + efecte sincronizate cu events.json. Scrie assets/audio/mix.wav (44,1 kHz, stereo)."""
import json, subprocess, sys, wave
import numpy as np

SR = 44100; BPM = 120; BEAT = 60 / BPM
EVJ = json.load(open('events.json')); DUR = EVJ['dur']; N = int(SR * DUR)
rng = np.random.default_rng(3)

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
    with np.errstate(over='ignore'):
        if lo: m *= 1 / (1 + np.exp(-(f - lo) / (lo * soft)))
        if hi: m *= 1 / (1 + np.exp((f - hi) / (hi * soft)))
    return np.fft.irfft(X * m, len(x))
def noise(d): return rng.standard_normal(int(d * SR))
def env(d, a=.005, r=None, p=2.0):
    n = int(d * SR); t = np.arange(n) / SR; r = r if r is not None else d - a
    return np.minimum(t / max(a, 1e-4), 1) * np.clip(1 - (t - a) / max(r, 1e-4), 0, 1) ** p
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def glide(f0, f1, d, curve=1.0):
    t = tt(d); u = (t / d) ** curve; f = f0 + (f1 - f0) * u
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def norm(x, peak=1.0): return x / (np.max(np.abs(x)) + 1e-9) * peak

def ping(f, d=.7, bright=1.0):
    t = tt(d); x = np.sin(2 * np.pi * f * t) + .35 * bright * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 14) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 30)
    return x * np.exp(-t * 5.5) * env(d, .002, d, 1)
def pluck(m, d=.35):
    t = tt(d); f = midi(m); x = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.3 for k in (1, 2, 3, 4)) * np.exp(-t * 9)
    return x * env(d, .002, d, 1)
def thump(f0=130, f1=38, d=.6):
    x = glide(f0, f1, d, .35) * np.exp(-tt(d) * 6); x[:int(.004 * SR)] += noise(.004)[:int(.004 * SR)] * .5; return x
def kick(): return thump(150, 46, .30) * .95
def clap():
    n = fftf(noise(.2), 900, 6000) * env(.2, .002, .2, 3)
    for k in (.012, .024): n[int(k * SR):int(k * SR) + 600] += rng.standard_normal(600) * .7
    return n
def hat(d=.05): return fftf(noise(d), 7000, 16000) * env(d, .001, d, 2)
def shaker(d=.08): return fftf(noise(d), 5500, 14000) * env(d, .004, d, 2)
def bass(m, d, amp=.34):
    t = tt(d); f = midi(m); x = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t); return x * amp * env(d, .01, d, 1.3)
def whoosh(d, f0=300, f1=5000, shape=.5):
    K = 14; n = int(d * SR); out = np.zeros(n); base = noise(d)
    for k in range(K):
        fc = f0 * (f1 / f0) ** (k / (K - 1)); y = fftf(base, fc / 1.5, fc * 1.5); c = k / (K - 1)
        out += y * np.exp(-((np.arange(n) / n - c) ** 2) / (2 * .12 ** 2))
    t = np.arange(n) / n; return norm(out * np.sin(np.pi * np.clip(t ** shape, 0, 1)) ** 1.5, .9)
def riser(d, f0=200, f1=6500):
    n = int(d * SR); t = np.arange(n) / n; return (whoosh(d, f0, f1, 1.0) * .8 + glide(f0, f1, d, 2.0) * .35) * (t ** 1.6)
def sparkle(d=.9, n=12, lo=76, hi=100):
    out = np.zeros(int(d * SR))
    for _ in range(n):
        t0 = rng.uniform(0, d * .7); p = ping(midi(int(rng.integers(lo, hi))), .35); i = int(t0 * SR); out[i:i + len(p)] += p[:len(out) - i] * rng.uniform(.25, .7)
    return norm(out, .8)
def pop(f=520, d=.09): return glide(f * .6, f * 1.5, d) * env(d, .002, d, 2)
def snare():
    a = fftf(noise(.2), 1200, 9000) * env(.2, .002, .2, 2.2) * .9
    b = glide(220, 160, .12) * env(.12, .001, .12, 2) * .4
    a[:len(b)] += b[:len(a)]; return a

CHORD = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'Am', 'F', 'C', 'C']
BASS = dict(C=36, Am=33, F=29, G=31)
TRI = dict(C=(60, 64, 67), Am=(57, 60, 64), F=(53, 57, 60), G=(55, 59, 62))
MEL = dict(C=[76, 76, 79, 81, 79, 76, 74, 72], Am=[81, 79, 76, 79, 81, 84, 81, 79], F=[77, 77, 81, 84, 81, 77, 76, 74], G=[79, 79, 83, 86, 83, 79, 77, 74])

def build_music():
    m = buf()
    for bar in range(12):
        t0 = bar * 4 * BEAT; ch = CHORD[bar]
        drive = bar in (0, 1, 2, 3, 4, 5, 6, 7, 10, 11); breakdown = bar in (8, 9)
        last = bar == 11
        for k in range(8):
            t = t0 + k * BEAT / 2
            # clopoței de sanie (în toată piesa) și hi-hat
            put(m, shaker(), t, .16 + .1 * (k % 2 == 0), (-1) ** k * .4)
            if drive and k % 2 == 1: put(m, hat(), t, .13)
            if bar in (6, 7): put(m, hat(.04), t + BEAT / 4, .11)
            # melodie (glockenspiel), mai discretă în pauză
            note = MEL[ch][k]
            if not last: put(m, ping(midi(note), .5), t, .2 if not breakdown else .24, (-1) ** k * .3)
            # bas
            if drive and k % 2 == 0: put(m, bass(BASS[ch] + (12 if k in (4, 6) else 0), BEAT * .9), t, 1.0)
            if breakdown and k in (0, 4): put(m, bass(BASS[ch], BEAT * 1.8, .26), t, 1.0)
            # acorduri pe contratimpi
            if (drive or breakdown) and k % 2 == 1:
                for n in TRI[ch]: put(m, pluck(n + (0 if drive else 12)), t, .16 if drive else .12, (n % 3 - 1) * .3)
        if drive:
            for q in (0, 1, 2, 3): put(m, kick(), t0 + q * BEAT, .6)
            for q in (1, 3): put(m, clap(), t0 + q * BEAT, .3)
        if bar == 9:   # tensiune: rulou de toba mică până la 20,0 s
            for k in range(16): put(m, snare(), t0 + k * BEAT / 4, .1 + .35 * (k / 15) ** 1.5)
    # final: acord lung de do major cu arpegiu
    t0 = 22.0
    for i, n in enumerate((72, 76, 79, 84, 88, 91)): put(m, ping(midi(n), 1.8, .6), t0 + i * .07, .2, (i - 2.5) * .25)
    for n in (48, 60, 64, 67): put(m, pluck(n, .9), t0, .2)
    # pauză scurtă (taie muzica) imediat înainte de „drop” la 20,0 s ca să lovească mai tare
    g = np.ones(N, np.float32); a, b = int(19.86 * SR), int(20.0 * SR); g[a:b] = np.linspace(1, 0, b - a)
    m *= g[:, None]
    # coadă
    tail = np.ones(N, np.float32); k0 = int((DUR - 1.2) * SR); tail[k0:] = np.linspace(1, 0, N - k0)
    return m * tail[:, None]

def build_sfx():
    s = buf()
    for t, kind in EVJ['events']:
        if t >= DUR: continue
        if kind == 'slam':
            put(s, thump(110, 32, .7), t, .85); put(s, fftf(noise(.5), 400, 7000) * env(.5, .003, .5, 3) * .6, t, .5); put(s, whoosh(.25, 4000, 500), t - .08, .3)
        elif kind == 'pop':
            put(s, pop(520 + 60 * int(rng.integers(0, 4))), t, .5, float(rng.uniform(-.5, .5))); put(s, fftf(noise(.1), 800, 4000) * env(.1, .002, .1, 2), t, .22)
        elif kind == 'tag':
            put(s, fftf(noise(.18), 2500, 9000) * env(.18, .003, .18, 2), t, .28); put(s, ping(midi(88 + int(rng.integers(0, 3) * 2)), .35, .5), t + .03, .16)
        elif kind == 'whoosh':
            put(s, whoosh(.32, 400, 5500), t, .4, float(rng.uniform(-.4, .4)))
        elif kind == 'hit':
            put(s, thump(130, 40, .35), t, .6); put(s, snare(), t, .35); put(s, fftf(noise(.14), 1500, 8000) * env(.14, .002, .14, 3), t, .2)
        elif kind == 'thump':
            put(s, thump(120, 40, .4), t, .6)
        elif kind == 'conf':
            put(s, fftf(noise(.45), 1800, 9000) * env(.45, .004, .45, 2.2), t, .35); put(s, sparkle(.9, 14), t + .03, .35)
    # riser înainte de „drop”-ul de la 20,0 s și impact mare
    put(s, riser(2.0, 200, 8000), 18.0, .6)
    put(s, thump(100, 28, 1.2), 20.0, 1.0); put(s, fftf(noise(.9), 300, 9000) * env(.9, .004, .9, 2.4), 20.0, .55); put(s, sparkle(1.4, 22), 20.02, .5)
    for k, n in enumerate((84, 88, 91, 96)): put(s, ping(midi(n), 1.5), 20.02 + k * .03, .3, (k - 1.5) * .35)
    return s

def write(p, b):
    b = b / max(1.0, float(np.abs(b).max()) / .97); w = wave.open(p, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((b * 32767).astype('<i2').tobytes()); w.close()

if __name__ == '__main__':
    mus = build_music(); sfx = build_sfx()
    for nm, b in (('music', mus), ('sfx', sfx)):
        print(nm, 'peak', float(np.abs(b).max()), 'rms dB', 20 * np.log10(np.sqrt(np.mean(b ** 2)) + 1e-9)); write(f'/tmp/promo_{nm}.wav', b)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/promo_music.wav', '-i', '/tmp/promo_sfx.wav', '-filter_complex',
                    '[0:a]volume=-5dB[m];[1:a]volume=-3dB[x];[m][x]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=9[o]', '-map', '[o]', '-ar', '44100', '-ac', '2', 'assets/audio/mix.wav'], check=True)
    print('mix.wav gata')
