# REVIEW · Homio Sărbători v2 (24 s, 9:16, cu muzică și efecte)

**Ce s-a schimbat față de v1:** decupaje curate, fără contur alb (umbră dură colorată în loc de margine); fără câmpuri albe; montaj pe ritm (120 BPM, o schimbare la fiecare bătaie, 0,5 s); 10 scene în loc de 9; 5 capitole de produse + montaj rapid cu 8 produse; 28 de poze reale de produse; steguleţe, fulgi decupați, confetti la fiecare lovitură; muzică și efecte sincronizate pe aceleași momente (`events.json`).

**Fapte folosite (homio.ro, 10 nov 2026):** prețuri din liste; 45 de produse cu stoc numeric pozitiv în primele pagini ale subcategoriilor Sărbători (7.154 bucăți) => „peste 40 de produse în stoc”; transport gratuit peste 200 lei; livrare în 24 h în majoritatea cazurilor. Nu am inventat oferte, reduceri sau „stoc limitat”.

**Măsurat:** `check` fără erori (lint, runtime, layout, contrast). Randat 1080×1920, 30 fps, 24,0 s, cu audio AAC stereo, −15,8 LUFS, vârf −1,3 dBFS.
**Doar privit:** cadre statice pe fiecare scenă și pe tranziții; mișcarea nu a fost văzută în redare continuă.
**Nimeni nu a verificat:** sunetul nu a fost ascultat. Muzica și efectele sunt sintetizate (originale, fără drepturi de autor), deci calitatea e necunoscută. `assets/audio/mix.wav` se poate înlocui cu o piesă din biblioteca TikTok/Meta, păstrând 24 s.

**Cele mai slabe puncte:** decupajul statuetelor are mici goluri (barba la 30 cm, marginea hainei la 90 cm); montajul de 8 produse are 0,5 s pe produs, deci prețul se citește doar de la 360 px în sus dacă privitorul e atent; hook-ul are avertismentul `line_unread` (prețul stă 1,4 s) păstrat deliberat pentru ritm.
