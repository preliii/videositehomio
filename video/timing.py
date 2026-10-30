"""Sursa unică pentru sincronizare voce ↔ animație.

Fiecare replică are „grupuri” de vorbire (început, sfârșit în fișierul original, în secunde) și pauza NOUĂ
dintre ele (None = se păstrează pauza originală). Pauzele lungi sunt scurtate; cuvintele rămân întregi.
Din asta se calculează: timpii replicilor în video, momentul fiecărui cuvânt și blocul TL din anim.js.
Rulare: python3 timing.py  → scrie timing.json și actualizează TL în anim.js."""
import json, re, os

DURATION = 24.0
START = {1: 0.50, 2: 2.05, 3: 6.85, 4: 12.44, 5: 16.54, 6: 19.75}      # momentul în care începe vorbirea fiecărei replici

G = {   # (o_start, o_end, cuvinte, pauza_nouă_după)
    1: [(0.02, 1.19, ['S-A', 'STRICAT', 'CEVA?'], None)],
    2: [(0.15, 1.82, ['MOȘUL', 'N-A', 'AJUNS', 'LA', 'TIMP?'], .46), (2.60, 3.90, ['TOCMAI', 'CÂND', 'ȚI-A', 'CERUT'], .34), (4.48, 5.13, ['STITCH?'], None)],
    3: [(0.14, 1.48, ['PAUZĂ'], .40), (2.13, 3.00, ['RESTART?'], .42), (3.67, 4.00, ['NU'], .30), (4.49, 6.02, ['CRĂCIUNUL', 'N-ARE', 'RESTART'], None)],
    4: [(0.08, 0.88, ['HOMIO'], 'orig'), (1.08, 2.26, ['CADOURI', 'LICENȚIATE'], 'orig'), (2.28, 3.10, ['LIVRATE', 'ÎN', 'TOATĂ'], 'orig'), (3.15, 3.78, ['ROMÂNIA'], None)],
    5: [(0.06, 0.62, ['ȘI', 'GATA'], .26), (0.96, 1.75, ['SUPĂRAREA'], .18), (1.93, 2.84, ['SCADE', 'LA', 'ZERO'], None)],
    6: [(0.12, 0.86, ['HOMIO'], .23), (1.09, 2.55, ['CADOUL', 'AJUNGE'], .38), (3.11, 3.62, ['MEREU'], None)],
}

def layout():
    """→ {n: [ {o:(s,e), rel, dur, words:[onset absolut], end} ]}"""
    out = {}
    for n, groups in G.items():
        rel = 0.0; lst = []
        for i, (os_, oe, words, gap) in enumerate(groups):
            dur = oe - os_; tot = sum(len(w) + 1 for w in words); c = 0; ons = []
            for w in words: ons.append(round(START[n] + rel + dur * c / tot, 3)); c += len(w) + 1
            nxt = groups[i + 1][0] if i + 1 < len(groups) else None
            keep = (gap == 'orig')
            lst.append(dict(o=(os_, oe), rel=round(START[n] + rel, 3), dur=dur, words=ons, end=round(START[n] + rel + dur, 3), keep=keep))
            if nxt is not None: rel += dur + ((nxt - oe) if keep else gap)
        out[n] = lst
    return out

def tl():
    L = layout(); r = lambda x: round(x, 2)
    s = START
    l1 = L[1][0]['words']; l2a = L[2][0]['words']; l2b = L[2][1]['words']; stitch = L[2][2]['words'][0]
    l3 = L[3]; l4 = L[4]; l5 = L[5]; l6 = L[6]
    t = dict(
        a=[0] + [s[i] for i in range(1, 7)],
        hook=[r(x) for x in l1], hookOut=r(L[1][0]['end'] + .25),
        sputter=r(L[1][0]['end'] + .1), descend=r(s[2] + .35), touch=r(s[2] + 1.95), stopA=r(s[2] + 3.45),
        l1=[r(x) for x in l2a], l2=[r(x) for x in l2b], stitch=r(stitch), textsOut=r(L[2][2]['end'] + .05),
        pause=r(s[3]), cursor1=r(l3[1]['words'][0] - .34), cursor2=r(l3[1]['words'][0]),
        no=r(l3[2]['words'][0]), panelOut=r(l3[2]['words'][0] + .3),
        slam=r(l3[3]['words'][0]), slam2=r(l3[3]['words'][1]), slam3=r(l3[3]['words'][2]),
        irisA=r(l3[3]['end'] + .01), irisB=r(l3[3]['end'] + .56),
        vanIn=r(l3[3]['end'] - .15), vanStop=r(l4[0]['end'] + .0), homio=r(s[4] + .06),
        door=r(l4[0]['end'] + .06), prod0=r(l4[1]['words'][0] + .01), prodGap=.3,
        cad=[r(x) for x in l4[1]['words']], deliv=[r(x) for x in l4[2]['words']], rom=r(l4[3]['words'][0]),
        vanOut=r(l4[3]['words'][0] + .24),
        pushA=r(l4[3]['end'] - .1), pushB=r(l4[3]['end'] + .4),
        giftIn=r(s[5] - .04), gaugeIn=r(l5[1]['words'][0] - .06), gaugeDown=r(l5[2]['words'][0] - .13),
        gaugeZero=r(l5[2]['end'] - .1), open=r(l5[2]['words'][2] - .06), zeroTxt=r(l5[2]['end'] - .1),
        flashA=r(s[6] - .45), flashB=r(s[6]), logo=r(s[6]), tag1=[r(x) for x in l6[1]['words']], tag2=r(l6[2]['words'][0]),
        url=r(l6[2]['words'][0] + .35))
    return t

def tl_js(t):
    def v(x):
        if isinstance(x, list): return '[' + ', '.join(str(i) for i in x) + ']'
        return str(x)
    keys = list(t.keys()); rows = []
    for k in keys: rows.append(f'  {k}: {v(t[k])}')
    return 'const TL = {\n' + ',\n'.join(rows) + '\n};'

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    t = tl(); json.dump(dict(START=START, TL=t, layout={str(k): v for k, v in layout().items()}, DURATION=DURATION), open(os.path.join(here, 'timing.json'), 'w'), ensure_ascii=False, indent=1)
    p = os.path.join(here, 'anim.js'); s = open(p).read()
    i = s.index('const TL = {'); j = s.index('};', i) + 2
    s = s[:i] + tl_js(t) + s[j:]
    s = re.sub(r'DURATION = [0-9.]+;', f'DURATION = {DURATION};', s, count=1)
    open(p, 'w').write(s)
    for n, g in layout().items(): print(n, [(x['rel'], x['end']) for x in g])
    print('end L6', layout()[6][-1]['end'], 'DURATION', DURATION)
