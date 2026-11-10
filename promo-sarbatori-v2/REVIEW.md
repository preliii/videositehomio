# REVIEW · Homio Sărbători v2 (26,4 s, 9:16, cu muzică și efecte; produsele din montaj stau 0,8 s)

**Ce s-a schimbat față de v1:** decupaje curate, fără contur alb (umbră dură colorată în loc de margine); fără câmpuri albe; montaj pe ritm (120 BPM, o schimbare la fiecare bătaie, 0,5 s); 10 scene în loc de 9; 5 capitole de produse + montaj rapid cu 8 produse; 28 de poze reale de produse; steguleţe, fulgi decupați, confetti la fiecare lovitură; muzică și efecte sincronizate pe aceleași momente (`events.json`).

**Fapte folosite (homio.ro, 10 nov 2026):** prețuri din liste; 45 de produse cu stoc numeric pozitiv în primele pagini ale subcategoriilor Sărbători (7.154 bucăți) => „peste 40 de produse în stoc”; transport gratuit peste 200 lei; livrare în 24 h în majoritatea cazurilor. Nu am inventat oferte, reduceri sau „stoc limitat”.

**Măsurat:** `check` fără erori (lint, runtime, layout, contrast). Randat 1080×1920, 30 fps, 26,4 s, cu audio AAC stereo. Montajul rapid: 8 produse × 0,8 s, muzica trece pe 150 BPM (2 bătăi = o carte), apoi revine pe 120 BPM.
**Doar privit:** cadre statice pe fiecare scenă și pe tranziții; mișcarea nu a fost văzută în redare continuă.
**Nimeni nu a verificat:** sunetul nu a fost ascultat. Muzica și efectele sunt sintetizate (originale, fără drepturi de autor), deci calitatea e necunoscută. `assets/audio/mix.wav` se poate înlocui cu o piesă din biblioteca TikTok/Meta, păstrând 24 s.

**Cele mai slabe puncte:** decupajul statuetelor are mici goluri (barba la 30 cm, marginea hainei la 90 cm); montajul de 8 produse are 0,5 s pe produs, deci prețul se citește doar de la 360 px în sus dacă privitorul e atent; hook-ul are avertismentul `line_unread` (prețul stă 1,4 s) păstrat deliberat pentru ritm.


## v4 (25,6 s, 150 BPM)
Refăcut după feedback: produse mari și toate vizibile (v3 pierdea al treilea brad), etichete de preț lângă produs, fără text peste text (verificat cadru cu cadru la 0,4 s), montaj cu 6 produse × 0,8 s, melodie nouă (I-V-vi-IV, clopoțel, bas cu sidechain, tobe, riser și drop la 22,4 s). Muzica a fost verificată doar prin spectrogramă și niveluri, nu ascultată.

## v5 (28,8 s)
Transport și livrare: câte 3,2 s (2 măsuri), mașina mărită (×1,4); eticheta de nume din montaj nu mai atinge produsul; titlurile din hook separate; confetti sub text. Muzica extinsă la 18 măsuri.

## v6
Decupaje refăcute cu GrabCut (OpenCV): margini curate, fără halou alb, gol transparent în funde, fără baza albă la brazi. Etichetele de preț din capitolele cu 4 produse stau mai sus, ca să acopere mai puțin produsul. Script: cutout2.py.

## v7
Produsele cu alb/transparență (statuete Moș Crăciun, globuri în cutie de plastic) sunt fotografii întregi pe card cu colțuri rotunjite (cards.py), nu decupaje. Eticheta ÎN STOC din montaj e aurie, lizibilă pe orice fundal.
