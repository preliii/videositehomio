GOAL:    Cine vede reclama în feed știe în 2 secunde că Homio vinde decorațiuni de Crăciun de la 11 lei, vede 6 produse reale cu prețul lor, află că tot setul costă 746 lei și că transportul e gratuit peste 200 lei, apoi apasă pe homio.ro/sarbatori.
OUTPUT:  HyperFrames, 1080 x 1920, 30 fps, fără sunet.
TIME:    24,0 s x 30 fps = 720 cadre. Fără muzică => fără BPM. Schimbare de plan la 2,0–3,0 s, ceva nou la fiecare 2–4 s.
LOOK:    câmpuri plate: roșu #C8202F, alb #FFFFFF, verde #0E4B3A, teracotă #B4651F (culoarea brandului), grăunte de hârtie 5%.
         Cerneală: alb pe roșu/verde/teracotă, verde #0E4B3A pe alb. Accent: auriu #FFD84A doar pe un cuvânt pe plan; prețul e roșu #C8202F pe etichetă.
         Display: Anton 400, majuscule, 112–150 px (5,8–7,8% din înălțime), spațiere 0. Corp: Fredoka 600/700, 44–56 px.
         Mediul: colaj de hârtie. Produsele sunt poze reale decupate, cu margine albă de 14 px și umbră (0 18 px, blur 22 px, 35%). Etichetele sunt de cadou, hârtie kraft #E9C48E, gaură și sfoară roșie.
         Trecere: culoarea următoare se revarsă ca un cerc din gaura etichetei (0,5 s, power2.inOut).
OBJECTS: eticheta de cadou kraft (colțuri tăiate sus, gaură cu inel, sfoară), bonul (hârtie albă cu rânduri și linie punctată), pachetul kraft cu panglică roșie (desenat, nu există poză).
MOTION:  intrări diferite pe fiecare plan: cuvânt cu blur, elastic (1, .55), whip lateral cu blur 18 px, glisare de jos, dezvăluire cu clip-path, creștere de jos; etichete: pendul amortizat (ease elastic.out(1,.5)).
         Titlurile nu se mișcă după ce aterizează. Ieșirile le face revărsarea culorii.
SHOTS:   0,0–2,4 hook (roșu): clopoței + etichetă „DE LA 11 LEI”; titlu „DECORAȚIUNI DE CRĂCIUN”.
         2,4–4,4 fundă roșie 17 lei (alb). 4,4–6,4 set 24 ornamente aurii 45 lei (verde). 6,4–8,4 statuetă Moș Crăciun, 4 mărimi 30–90 cm, 119 lei (teracotă).
         8,4–10,4 ghirlandă 270 cm, 100 LED-uri, 195 lei (alb). 10,4–13,4 brad 210 cm, 359 lei (roșu), riglă 0 -> 210 cm.
         13,4–17,0 „CÂT COSTĂ TOT?” bon cu 6 rânduri, suma urcă la 746 LEI (verde).
         17,0–20,2 transport gratuit peste 200 lei, livrare în 24 h în majoritatea cazurilor (alb, pachet kraft).
         20,2–24,0 card final (teracotă): sigla Homio pe cardul alb adusă de etichetă, homio.ro/sarbatori, buton „VEZI DECORAȚIUNILE”, ținut 2,5 s.
SAFE:    text și produs între y 270 și 1330, x 60–940 (sub 270 și peste 1330 doar culoare; interfața TikTok și Meta acoperă marginile).
BANNED:  fundal negru/bleumarin gol cu obiecte mici; strălucire, neon, particule; degrade albastru/violet, sticlă; hârtie crem cu serif; totul centrat;
         totul care apare cu fade și urcă; titlu care se mișcă după aterizare; colțare, borduri, HUD; trei carduri în rând; sigla lipită într-un colț; bule de text.
QA:      cadrele 0,0 / 2,0 / 5,0 / 7,5 / 9,5 / 12,5 / 15,5 / 18,5 / 22,5: fiecare produs recognoscibil, prețul citibil la 360 px lățime, nimic în afara benzii de siguranță.
