"""Muzică originală (150 BPM, do major, I-V-vi-IV) + efecte sincronizate cu events.json -> assets/audio/mix.wav
Aranjament pe măsuri de 1,6 s: 0 hook · 1-8 capitole · 9-11 montaj · 12 pauză · 13 build · 14 drop · 15 final."""
import json, subprocess, wave
import numpy as np

SR = 44100
EVJ = json.load(open('events.json')); BPM = EVJ['bpm']; BEAT = EVJ['beat']; BAR = EVJ['bar']; DUR = EVJ['dur']; N = int(SR * DUR)
rng = np.random.default_rng(11)

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

# ───────── instrumente ─────────
def bell(m, d=.6, bright=1.0):          # clopoțel FM, curat
    f = midi(m); t = tt(d); idx = 2.2 * bright * np.exp(-t * 7)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) + .25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9)
    return x * np.exp(-t * 5.2) * env(d, .002, d, 1)
def stab(m, d=.3):                        # acord scurt, cald
    f = midi(m); t = tt(d); x = np.zeros_like(t)
    for det in (-.006, .006): x += sum(np.sin(2 * np.pi * f * (1 + det) * k * t) / k ** 1.4 for k in (1, 2, 3, 4, 5))
    return fftf(x, None, 2600) * np.exp(-t * 11) * env(d, .004, d, 1)
def pad(m, d):                            # nota lungă, moale
    f = midi(m); t = tt(d); x = np.zeros_like(t)
    for det in (-.004, .004): x += sum(np.sin(2 * np.pi * f * (1 + det) * k * t) / k ** 1.6 for k in (1, 2, 3))
    return fftf(x, None, 1500) * np.minimum(t / .25, 1) * np.clip((d - t) / .3, 0, 1)
def bassn(m, d):
    f = midi(m); t = tt(d); x = np.sin(2 * np.pi * f * t * (1 + .06 * np.exp(-t * 40))) + .3 * np.sin(2 * np.pi * 2 * f * t)
    return x * env(d, .006, d, 1.2)
def kick():
    t = tt(.34); x = np.sin(2 * np.pi * np.cumsum(46 + 120 * np.exp(-t * 30)) / SR) * np.exp(-t * 9)
    x[:int(.003 * SR)] += .6; return x
def clap():
    x = np.zeros(int(.26 * SR))
    for k, g in ((0, .9), (.011, .8), (.022, .7)):
        n = fftf(noise(.2), 900, 6500) * env(.2, .001, .2, 4); i = int(k * SR); x[i:i + len(n)] += n[:len(x) - i] * g
    return x
def hat(d=.045): return fftf(noise(d), 7500, 16000) * env(d, .001, d, 2)
def ohat(d=.16): return fftf(noise(d), 6500, 15000) * env(d, .002, d, 1.4)
def shaker(d=.07): return fftf(noise(d), 5000, 12000) * env(d, .004, d, 2)
def snare():
    a = fftf(noise(.2), 1400, 9000) * env(.2, .002, .2, 2.2) * .9; b = glide(230, 170, .12) * env(.12, .001, .12, 2) * .4
    a[:len(b)] += b[:len(a)]; return a
def crash(d=1.2): return fftf(noise(d), 3500, 16000) * env(d, .003, d, 2.2)

def ir(rt=1.1):
    n = int(rt * SR); t = np.arange(n) / SR; x = noise(rt) * np.exp(-t * 4.2); x = fftf(x, 300, 6500); x[:int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR)); return norm(x, .1)
IR = ir()
def reverb(b, wet=.16):
    out = np.zeros_like(b); L = len(b) + len(IR); n = 1 << (L - 1).bit_length(); H = np.fft.rfft(IR, n)
    for c in (0, 1): out[:, c] = np.fft.irfft(np.fft.rfft(b[:, c], n) * H, n)[:len(b)]
    return b + out * wet

# ───────── armonie și melodie (I–V–vi–IV) ─────────
CH = dict(C=dict(root=36, tri=(60, 64, 67)), G=dict(root=31, tri=(59, 62, 67)), Am=dict(root=33, tri=(57, 60, 64)), F=dict(root=29, tri=(57, 60, 65)))
MEL = dict(C=[(0, 76, .5), (.5, 79, .5), (1, 81, 1), (2, 79, .5), (2.5, 76, .5), (3, 74, 1)],
           G=[(0, 74, .5), (.5, 76, .5), (1, 79, 1.5), (2.5, 76, .5), (3, 74, 1)],
           Am=[(0, 72, .5), (.5, 76, .5), (1, 81, 1), (2, 79, .5), (2.5, 76, .5), (3, 72, 1)],
           F=[(0, 77, .5), (.5, 81, .5), (1, 84, 1), (2, 81, .5), (2.5, 77, .5), (3, 76, 1)])
PROG = ['C', 'G', 'Am', 'F'] * 3 + ['Am', 'F', 'C', 'C']      # 16 măsuri
def mode(b): return 'hook' if b == 0 else 'chap' if b <= 8 else 'montage' if b <= 11 else 'break' if b == 12 else 'build' if b == 13 else 'drop' if b == 14 else 'final'

def build_music():
    drums, harm, lead = buf(), buf(), buf(); kicks = []
    for b in range(16):
        t0 = b * BAR; ch = PROG[b]; md = mode(b); c = CH[ch]
        full = md in ('hook', 'chap', 'montage', 'drop', 'final')
        # tobe
        if full:
            for q in range(4):
                put(drums, kick(), t0 + q * BEAT, .5); kicks.append(t0 + q * BEAT)
            for q in (1, 3): put(drums, clap(), t0 + q * BEAT, .5)
            for q in (.5, 1.5, 2.5, 3.5): put(drums, hat(), t0 + q * BEAT, .24)
            for q in range(8): put(drums, shaker(), t0 + (q * .5 + .25) * BEAT, .09)
            if md == 'montage':
                for q in range(8): put(drums, hat(.03), t0 + (q * .5 + .25) * BEAT, .09)
            if b == 11:                                   # fill înainte de pauză
                for k in range(8): put(drums, snare(), t0 + (2 + k * .25) * BEAT, .12 + .26 * k / 7)
            if b in (4, 8): put(drums, ohat(), t0 + 3.5 * BEAT, .22)
        if md == 'build':                                 # rulou de toba mică
            for k in range(16): put(drums, snare(), t0 + k * BEAT / 4, .08 + .4 * (k / 15) ** 1.6)
            for q in range(4): put(drums, hat(), t0 + q * BEAT + BEAT / 2, .12)
        # bas
        if full:
            for pos, ln, ofs in ((0, .85, 12), (1.5, .35, 12), (2, .85, 12), (3, .35, 24)):
                put(harm, bassn(c['root'] + ofs - 12, ln * BEAT), t0 + pos * BEAT, .3)
        elif md == 'break':
            put(harm, bassn(c['root'], 3.2 * BEAT), t0, .2)
        # acorduri
        if full:
            for pos in (.5, 1.5, 2.5):
                for n in c['tri']: put(harm, stab(n), t0 + pos * BEAT, .22, (n % 3 - 1) * .35)
        else:
            for n in c['tri']: put(harm, pad(n + (0 if md == 'break' else 12), 4 * BEAT), t0, .06, (n % 3 - 1) * .35)
        # melodie (clopoțel)
        hi = 12 if (5 <= b <= 8 or b == 14) else 0
        if md != 'final':
            for pos, n, ln in MEL[ch]:
                g = .34 if md in ('hook', 'chap', 'montage', 'drop') else .16
                put(lead, bell(n + hi, .55, 1.0 if md != 'break' else .6), t0 + pos * BEAT, g, ((n % 5) - 2) * .15)
        if md == 'break':      # arpegiu ușor
            for k in range(8): put(lead, bell(c['tri'][k % 3] + 24, .4, .5), t0 + k * BEAT / 2, .07, (k % 3 - 1) * .4)
    # final: acord lung, arpegiu
    tf = 15 * BAR
    for i, n in enumerate((72, 76, 79, 84, 88)): put(lead, bell(n, 1.6, .8), tf + i * .06, .2, (i - 2) * .3)
    for n in (48, 60, 64, 67): put(harm, stab(n, .9), tf, .2)
    # sidechain: bas/acorduri se retrag la fiecare lovitură de kick
    duck = np.ones(N, np.float32)
    for tk in kicks:
        i = int(tk * SR); L = int(.22 * SR); j = min(N, i + L)
        if j > i: duck[i:j] = np.minimum(duck[i:j], 1 - .55 * np.exp(-np.arange(j - i) / SR / .07))
    harm *= duck[:, None]
    # ecou pe melodie, reverb general
    echo = buf(); d = int(BEAT * .75 * SR); echo[d:] = lead[:-d] * .32
    lead = lead + echo
    bus = drums + harm + lead; bus = reverb(bus, .17)
    # pauza de o clipă înainte de drop, ca să lovească mai tare
    g = np.ones(N, np.float32); a, bb = int((EVJ['drop'] - .1) * SR), int(EVJ['drop'] * SR); g[a:bb] = np.linspace(1, .05, bb - a); bus *= g[:, None]
    tail = np.ones(N, np.float32); k0 = int((DUR - 1.0) * SR); tail[k0:] = np.linspace(1, 0, N - k0)
    return np.tanh(bus * 1.1) * tail[:, None]

def build_sfx():
    s = buf(); BUILD, DROP = EVJ['build'], EVJ['drop']
    for t, kind in EVJ['events']:
        if t >= DUR - .05: continue
        if kind == 'slam':
            put(s, kick() * .8, t, .5); put(s, fftf(noise(.45), 400, 7500) * env(.45, .003, .45, 3), t, .28)
        elif kind == 'pop':
            f = 520 + 70 * int(rng.integers(0, 4)); put(s, glide(f * .6, f * 1.5, .09) * env(.09, .002, .09, 2), t, .32, float(rng.uniform(-.4, .4)))
        elif kind == 'tag':
            put(s, fftf(noise(.16), 2800, 9500) * env(.16, .003, .16, 2), t, .16)
        elif kind == 'whoosh':
            put(s, fftf(noise(.34), 500, 6000) * env(.34, .14, .2, 1.2), t - .05, .22)
        elif kind == 'hit':
            put(s, snare(), t, .22)
        elif kind == 'conf':
            put(s, fftf(noise(.4), 2200, 10000) * env(.4, .004, .4, 2.4), t, .2)
    # riser + impact la drop
    n = int(2 * BAR * SR); r = fftf(noise(2 * BAR), 300, 9000) * (np.arange(n) / n) ** 2; put(s, norm(r, .9), BUILD, .35)
    put(s, kick() * 1.1, DROP, .5); put(s, crash(1.6), DROP, .5)
    for k, nn in enumerate((84, 88, 91, 96)): put(s, bell(nn, 1.4), DROP + .02 + k * .03, .14, (k - 1.5) * .35)
    return s

def write(p, b):
    b = b / max(1.0, float(np.abs(b).max()) / .97); w = wave.open(p, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((b * 32767).astype('<i2').tobytes()); w.close()

if __name__ == '__main__':
    mus = build_music(); sfx = build_sfx()
    for nm, b in (('music', mus), ('sfx', sfx)):
        print(nm, 'peak %.2f' % float(np.abs(b).max()), 'rms %.1f dB' % (20 * np.log10(np.sqrt(np.mean(b ** 2)) + 1e-9))); write(f'/tmp/promo_{nm}.wav', b)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/promo_music.wav', '-i', '/tmp/promo_sfx.wav', '-filter_complex',
                    '[0:a]volume=-1dB[m];[1:a]volume=-2dB[x];[m][x]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-2.2:LRA=9[o]', '-map', '[o]', '-ar', '44100', '-ac', '2', 'assets/audio/mix.wav'], check=True)
    print('mix.wav gata')
