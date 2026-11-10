"""Produse cu alb/transparență (barbă albă, cutii de plastic): foto întreagă pe card cu colțuri rotunjite, fără decupaj."""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
M = json.load(open('assets/products.json'))
IDS = ['7818', '7842', '7826', '7822', '7775', '7774', '7772', '7770']
for pid in IDS:
    im = Image.open(f'assets/raw/{pid}.img')
    if im.mode == 'RGBA':
        b = Image.new('RGBA', im.size, (255, 255, 255, 255)); b.alpha_composite(im); im = b
    im = im.convert('RGB'); im.thumbnail((900, 900), Image.LANCZOS)
    a = np.asarray(im); nz = np.argwhere(a.min(axis=2) < 238)
    y0, x0 = nz.min(0); y1, x1 = nz.max(0); pad = 34
    box = (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))
    c = im.crop(box); w, h = c.size
    mask = Image.new('L', (w * 3, h * 3), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, w * 3 - 1, h * 3 - 1), radius=40 * 3, fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    out = c.convert('RGBA'); out.putalpha(mask); out.save(f'assets/img/{pid}.png', optimize=True)
    M[pid]['w'], M[pid]['h'] = out.size; print(pid, out.size)
json.dump(M, open('assets/products.json', 'w'), ensure_ascii=False, indent=1)
