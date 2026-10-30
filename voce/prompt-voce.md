# Prompt voce · Homio „Crăciunul n-are restart”

Videoclipul are ~24 s. Vocea trebuie să sune ca un om real care povestește o glumă unui prieten,
nu ca un crainic și nu ca un robot de GPS. Mai jos ai două variante: un prompt lipit într-un singur
bloc (pentru orice AI de voce) și scriptul pe replici, cu tonul fiecăreia.

---

## 1. Prompt de lipit (un singur bloc)

```
Generează o voce off în limba ROMÂNĂ (accent din România, nativ), pentru o reclamă
verticală de 24 de secunde a magazinului online Homio (jucării, haine și cadouri de
Crăciun pentru copii).

VOCEA
- Adult, 30–40 de ani, cald, simpatic, cu zâmbet în voce. Ca un prieten care îți
  povestește o întâmplare amuzantă, nu ca un crainic de radio.
- Naturală 1:1 cu un om real: respirații audibile între fraze, mici ezitări, ton care
  urcă și coboară, nu monoton. Nu „perfect”, ci credibil.
- Ritm conversațional, ~2,3 cuvinte pe secundă, cu pauze scurte la „…” și la „?”.
- Fără muzică, fără efecte, fără ecou, fără zgomot de fundal. Doar vocea, curată.
- Pronunție corectă pentru: Moșul, Crăciunul, Stitch (citește „Stici”), Homio
  (citește „Hó-mi-o”), licențiate, România.

SCRIPT (fiecare linie = fișier audio separat, ton între paranteze drepte):

1. [amuzat, ușor dramatic] S-a stricat ceva?
2. [ofticat, apoi șoaptă teatrală la ultimele cuvinte] Moșul n-a ajuns la timp? Tocmai când ți-a cerut… Stitch?
3. [oftat scurt, apoi hotărât și ferm la „Nu”] Pauză… Restart? Nu. Crăciunul n-are restart.
4. [entuziast, energic, zâmbet larg] Homio! Cadouri licențiate, livrate în toată România.
5. [cald, liniștit, zâmbet în voce] Și gata. Supărarea… scade la zero.
6. [calm, sigur pe el, ca o concluzie] Homio. Cadoul ajunge. Mereu.

LIVRARE
- 6 fișiere separate (linie_1 … linie_6), 3 variante („take-uri”) pentru fiecare.
- Format WAV sau MP3 de calitate înaltă (44,1 kHz sau mai mult), mono sau stereo.
- Maximum 0,3 s de liniște la început și la sfârșit de fișier.
- Nu tăia respirațiile și nu „curăța” vocea până la steril.
```

---

## 2. Durata țintă pe replică (ca animația să se potrivească)

| # | Replică | Pe ecran | Durată țintă |
|---|---|---|---|
| 1 | S-a stricat ceva? | 0,7 s | 1,3–1,8 s |
| 2 | Moșul n-a ajuns la timp? Tocmai când ți-a cerut… Stitch? | 3,0 s | 3,0–3,3 s |
| 3 | Pauză… Restart? Nu. Crăciunul n-are restart. | 6,4 s | 3,0–3,5 s |
| 4 | Homio! Cadouri licențiate, livrate în toată România. | 9,5 s | 4,5–5,0 s |
| 5 | Și gata. Supărarea… scade la zero. | 15,3 s | 3,5–4,0 s |
| 6 | Homio. Cadoul ajunge. Mereu. | 21,2 s | 2,0–2,5 s |

Nu e nevoie să fie exact: animația se resincronizează pe vocea ta reală. Contează doar ca fiecare
replică să nu depășească mult durata de mai sus.

---

## 3. Dacă folosești ElevenLabs (verifică interfața, se schimbă des)

- Model: cel mai expresiv disponibil pentru română (de obicei „v3”, cu etichete de expresie).
- „Voice Design” sau o voce din bibliotecă: caută „Romanian”, bărbat, cald, conversațional.
  Text pentru Voice Design:
  `Adult Romanian male, 30-40, warm, playful, slightly husky, conversational, natural breaths, smiling while speaking, like telling a funny story to a friend.`
- Setări: stabilitate **mică** (mai multă expresivitate), similaritate medie-mare, stil crescut.
- Etichete în text (în engleză, funcționează cu v3): `[sighs]`, `[whispers]`, `[excited]`, `[laughs softly]`, `[calm]`.
  Exemplu: `[sighs] Pauză… Restart? [firm] Nu. Crăciunul n-are restart.`
- Generează de 3 ori fiecare linie și alege cea mai naturală.

## 4. Variantă cu voce de femeie

Înlocuiește în prompt „Adult, 30–40 de ani” cu „Femeie adultă, 28–38 de ani”. Restul rămâne la fel.
