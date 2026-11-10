"""Decupare produse cu GrabCut + curățare margini (fără halou alb). Folosire: python3 cutout2.py [id ...]"""
import json, re, subprocess, sys, os
import numpy as np, cv2
from PIL import Image
from collections import deque
M = json.load(open('assets/products.json'))
IDS = sys.argv[1:] or list(M.keys())
BOWS = {'7784', '7783', '7780', '7791'}

def flood_border(mask):
    h, w = mask.shape; bg = np.zeros((h, w), np.uint8)
    n, lab = cv2.connectedComponents(mask.astype(np.uint8), connectivity=4)
    keep = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1]); keep.discard(0)
    return np.isin(lab, list(keep))

def fetch(pid):
    p = f'assets/raw/{pid}.img'
    if not os.path.exists(p):
        html = subprocess.run(['curl', '-sSL', '-m', '25', M[pid]['url']], capture_output=True, text=True).stdout
        og = re.search(r'property="og:image" content="([^"]+)"', html)
        subprocess.run(['curl', '-sSL', '-m', '30', '-o', p, og.group(1)])
    im = Image.open(p)
    if im.mode == 'RGBA':
        b = Image.new('RGBA', im.size, (255, 255, 255, 255)); b.alpha_composite(im); im = b
    im = im.convert('RGB'); im.thumbnail((900, 900), Image.LANCZOS); return np.asarray(im)

def cut(pid):
    img = fetch(pid); h, w, _ = img.shape
    mn = img.min(axis=2).astype(int); sat = (img.max(axis=2).astype(int) - mn)
    corner = img[:8, :8].reshape(-1, 3).mean(0)
    near = (np.abs(img.astype(int) - corner).max(axis=2) <= 22) | (mn >= 244)
    floor = (sat <= 9) & (mn >= 180)                      # umbre gri neutre / podea
    bg = flood_border(near | floor)
    # goluri albe închise în obiect (ex. centrul fundei): zone mari, aproape pure albe, neconectate la margine
    n, lab, st, _ = cv2.connectedComponentsWithStats((mn >= 250).astype(np.uint8), connectivity=4)
    holes = np.zeros((h, w), bool)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= (0.0002 if pid in BOWS else 0.0012) * h * w and not bg[lab == i].any():
            comp = lab == i; ring = cv2.dilate(comp.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
            if (sat[comp] <= 4).mean() > .97 and (ring & ~comp & ~bg).sum() > 0: holes |= comp
    bgx = bg | holes
    # GrabCut pe zona incertă din jurul marginii
    gm = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
    gm[bgx] = cv2.GC_BGD
    inner = cv2.erode((~bgx).astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    gm[inner] = cv2.GC_FGD
    ring = cv2.dilate(bgx.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    gm[(~bgx) & ring & ~inner] = cv2.GC_PR_BGD
    a1 = np.zeros((1, 65), np.float64); a2 = np.zeros((1, 65), np.float64)
    try: cv2.grabCut(cv2.cvtColor(img, cv2.COLOR_RGB2BGR), gm, None, a1, a2, 3, cv2.GC_INIT_WITH_MASK)
    except Exception as e: print('grabcut eșec', pid, e)
    fg = (gm == cv2.GC_FGD) | (gm == cv2.GC_PR_FGD)
    fg &= ~bgx
    # curăță pete mici și goluri mici
    fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    big = max(st[1:, cv2.CC_STAT_AREA]) if n > 1 else 0
    fg = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= max(60, big * .02)]).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    # margine: erodare 1 px + decontaminare culoare (pixelii de margine iau culoarea din interior)
    core = cv2.erode(fg, np.ones((3, 3), np.uint8)) > 0
    col = img.astype(np.float32) * core[..., None]; filled = core.copy()
    for _ in range(4):
        k = np.ones((3, 3), np.float32)
        acc = cv2.filter2D(col, -1, k); cnt = cv2.filter2D(filled.astype(np.float32), -1, k)
        new = (~filled) & (cnt > 0); col[new] = acc[new] / cnt[new][:, None]; filled |= new
    out = np.where(core[..., None], img.astype(np.float32), col)
    alpha = cv2.GaussianBlur(cv2.erode(fg, np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 0.9)
    rgba = np.dstack([out.clip(0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])
    im = Image.fromarray(rgba, 'RGBA'); im = im.crop(im.getbbox())
    im.save(f'assets/img/{pid}.png', optimize=True); M[pid]['w'], M[pid]['h'] = im.size
    print(pid, im.size)

for pid in IDS: cut(pid)
json.dump(M, open('assets/products.json', 'w'), ensure_ascii=False, indent=1)
