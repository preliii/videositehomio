# Homio · „Crăciunul n-are restart”

Reclamă verticală (1080×1920, 60 fps, 24 s) pentru homio.ro, cu voce reală (ElevenLabs), muzică și efecte sintetizate.

| Fișier | Ce e |
|---|---|
| `homio-craciun-final.mp4` | Videoclipul complet: voce + muzică + efecte |
| `homio-craciun-doar-voce.mp4` | Același video, doar cu vocea (fără muzică și efecte) |
| `voce/audio/linie_1..6.mp3` | Replicile originale, în ordinea din video |
| `voce/prompt-voce.md` | Promptul și scriptul pentru voce |
| `video/anim.js` | Animația (canvas 2D). Timpii sunt în obiectul `TL` de la început |
| `video/render.mjs` | Randează cadrele JPEG: `node render.mjs <dir> 0 1440 4 6` (de la, până la, procese, sample-uri de motion blur) |
| `video/make_audio.py`, `video/build_audio.sh` | Muzica, efectele și mixajul |
| `storyboard.html` | Storyboard-ul inițial (24 s, înainte de voce) |

## Cum se regenerează

```bash
cd video
node render.mjs /tmp/frames 0 1440 4 6                       # cadre (~4 min)
python3 make_audio.py /tmp/audio ../voce/audio               # voce.wav, music.wav, sfx.wav
./build_audio.sh /tmp/audio /tmp/audio                        # mix.wav, voce.wav
ffmpeg -framerate 60 -i /tmp/frames/f_%05d.jpg -i /tmp/audio/mix.wav -t 24 \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k ../homio-craciun-final.mp4
```

## Sincronizare cu vocea

`video/timing.py` este sursa unică: conține grupurile de vorbire din fiecare replică, pauzele (scurtate) și momentul de start al fiecărei replici.
`python3 timing.py` scrie `timing.json` și actualizează blocul `TL` din `anim.js`; `make_audio.py` folosește aceleași valori și reconstruiește vocea cu pauzele scurtate (cuvintele rămân întregi).
Timpii cuvintelor din interiorul unui grup sunt estimați proporțional cu numărul de litere.
