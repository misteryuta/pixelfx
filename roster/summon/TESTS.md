# Beschwörungen auf der 2,5D-Bühne: Playtests (2026-11-26)

Code-Pfad (identisch in beiden Places):

- **Client:** `ReplicatedStorage.PixelArena` (zeichnet, sendet Slot-Eingaben)
- **Simulation:** `PixelArena.Sim`, ausgeführt von `ServerScriptService.PixelArenaServer`. Sie entscheidet alle Treffer.
- **Grafik:** eingebettete Packs aus `roster/summon/bake.mjs`
- **Pixel BAS:** eingehängt über `PixelBellTest.TestAbilities` (Level 1)
- **vfx test:** eingehängt über `StarterPlayerScripts.PixelArenaStage` (Knopf „2.5D-TRAINING“)

Auslösung immer über den regulären Slot der Variante: Panel-Variante `classic/kakashi-hatake-team-7-sensei`, Taste/Slot 3.
Der Server prüft, ob der Slot eine Beschwörung trägt.

Ziele: T1 (30,0), T2 (52,7), T3 (30,26), Bühnenkoordinaten relativ zum Startpunkt.

## Kakashi Hatake (Team 7 Sensei), Classic, Slot 3: Summoning: Ninken Fanged Pursuit

Alle Fälle in Studio ausgeführt.

| Fall | Richtung | Startpunkt | Ergebnis (Server) | Phasen | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| Treffer | rechts | 0,0 | hit, Ausbruch bei 30,0 (T1) | seal > track > warn > hold > done | bestanden, Bild geprüft | Server bestanden, Bild offen* |
| Ziel weicht aus (liest die Warnzone) | rechts | 0,0 | miss bei 30,0 | seal > track > warn > miss > done | bestanden | Server bestanden |
| Treffer | unten (zur Kamera) | 30,-22 | hit bei 30,0 | seal > track > warn > hold > done | bestanden, Bild geprüft (Bull in Rückenansicht vorne, Gesichter zur Kamera hinten) | Server bestanden |
| Ziel weicht aus | unten | 30,-22 | miss bei 30,0 | … > warn > miss > done | bestanden | – |
| Treffer | oben (von der Kamera weg) | 30,20 | hit bei 30,0 | … > hold > done | bestanden, Bild geprüft (Spieler in Rückenansicht, Furchen nach oben) | Server bestanden |
| Ziel weicht aus | oben | 30,20 | miss bei 30,0 | … > warn > miss > done | bestanden | – |
| Ziel läuft während der Vorbereitung | rechts | 0,0 | hit bei 30,10.9 (die Spur folgt dem Geruch, Ausbruch am eingeholten Punkt) | … > hold > done | bestanden | – |
| Ziel wird während der Spur entfernt | rechts | 0,0 | miss am letzten gerochenen Punkt 30,0, Rudel schnüffelt | … > warn > miss > done | bestanden | – |
| Kein Ziel im Kegel | links | 0,0 | miss nach 26 Studs (-26,0) | … > miss > done | bestanden | – |
| Abbruch (Q) während der Spur | rechts | 0,0 | abort bei T 0.81, Rauch, Steuerung frei | seal > track > abort | bestanden | – |
| Respawn während der Spur | rechts | 0,0 | Wirkung abgebrochen, 0 Restkarten, Panel weg; nach Neustart des Levels trifft der nächste Wurf | – | bestanden | – |
| Einzelbild vor/nach dem Ausbruch | rechts | 0,0 | T 1.60 (BurstT 1.63): Warnzone und Erdbeulen; T +0.12: Schnauzen und Köpfe aus den Löchern | – | bestanden, Bild geprüft | – |

\* vfx test: In den Spieleinstellungen ist unter „Sicherheit“ die EditableImage-API nicht freigegeben. Die Bühne zeigt dort deshalb einen Hinweis statt Pixeln. Simulation und Treffer laufen dort bereits identisch (Spalte „Server bestanden“). Sobald die API freigegeben ist, laufen in vfx test dieselben Bild-Tests.

## Naruto Uzumaki (Final Valley), Classic, Slot 3: Gamabunta (Gama Dosu Zan)

Technik: Toad Sword Beheading (Narutopedia, Manga 135 / Anime 78, Konoha Crush). Gamabunta springt präzise aufs Ziel und schneidet sofort mit der Dosu; dieser Schnitt trennte Shukakus Arm ab.

Aussehen nach Narutopedia und den Folge-78-Bildern:

- rostrote Haut, hellrote Zeichnungen an Augen, Lippen und Brust, Narbe über dem linken Auge
- blaues Happi mit weißer Kante und Wappen auf dem Rücken, weiße Bauchbinde
- Kiseru im linken Mundwinkel, Dosu an der linken Hüfte, mit der rechten Hand gezogen

Das Rig hat eigene Seiten-, Vorder- und Rückansicht.

Ablauf (Server):

1. Siegel
2. Erscheinen im Rauch: bei seitlichen Würfen hinter Naruto, bei Würfen nach oben oder unten neben ihm
3. Ducken: Er dreht sich zum Ziel und folgt ihm. Das ist das Signal, auszuweichen.
4. Sprung: eigene Höhe von 10 Studs, Schatten und Landering auf dem Boden
5. Landung: Wer darunter steht, wird zerdrückt.
6. Ziehen der Dosu
7. Schnitt von seiner linken zu seiner rechten Seite: Die Trefferzone ist das vom Blatt überstrichene Band, Bild für Bild. Auf dem Boden liegt das Band als flache Markierung unter der Klinge.
8. Nachhalten. Bei einem Fehlschlag sucht er das Ziel, dann verschwindet er im Rauch.

Der Rückstoß geht vom Kröterich weg. Von hinten gesehen ist er zu 35 % durchsichtig, damit das Ziel hinter ihm sichtbar bleibt.

Alle Fälle in Studio ausgeführt (Pixel BAS v516):

| # | Fall | Richtung | Start | Sprung | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|---|
| 1 | Treffer | rechts | 0,0 | -15,0 → 8.6,0 | Klinge trifft T1, Rückstoß nach 39,0 | bestanden, Bild geprüft (Profil, Band unter der Klinge) | Server bestanden |
| 2 | Ziel läuft beim Absprung weg | rechts | 0,0 | -15,0 → 8.6,0 | Fehlschlag, T1 bei 45,0 außer Reichweite; er sucht, dann Rauch | bestanden | Server bestanden |
| 3 | Treffer | unten | 30,-28 | 14,-32 → 30,-21.4 | Klinge trifft T1, Rückstoß nach unten (30,9) | bestanden, Bild geprüft (Vorderansicht, Ducken und Schnitt) | Server bestanden |
| 4 | Ziel läuft weg | unten | 30,-28 | 14,-32 → 30,-21.4 | Fehlschlag (T1 bei 30,15) | bestanden | Server bestanden |
| 5 | Treffer | oben | 52,30 | 36,34 → 52,28.4 | Klinge trifft T2, Rückstoß nach oben (52,-2) | bestanden, Bild geprüft (Rückansicht, durchsichtig, T2 sichtbar) | Server bestanden |
| 6 | Ziel läuft weg | oben | 52,30 | 36,34 → 52,28.4 | Fehlschlag (T2 bei 52,-8) | bestanden | Server bestanden |
| 7 | Ziel läuft beim Ducken | rechts | 0,0 | -15,0 → 8.6,11 | folgt T1 bis 30,11, Klinge trifft T1 und T3 (ein Schnitt, zwei Ziele) | bestanden | – |
| 8 | Ziel beim Ducken entfernt | rechts | 0,0 | -15,0 → 8.6,0 | Sprung zum letzten Ort, Schnitt ins Leere, Fehlschlag | bestanden | – |
| 9 | kein Ziel im Kegel | links | 0,0 | 15,0 → -8.6,0 | Fehlschlag nach 30 Studs, gespiegeltes Profil und Band geprüft | bestanden, Bild geprüft | – |
| 10 | Abbruch in der Luft | rechts | 0,0 | – | Abbruch bei Höhe 9.9, Rauch in der Höhe, Steuerung frei | bestanden | – |
| 11 | Respawn beim Ducken | rechts | 0,0 | – | Wirkung abgebrochen; nächster Wurf trifft normal | bestanden | – |
| 12 | Ziel zu nah (6 Studs) | unten | 30,-6 | 14,-10 → 19,0 | Mindestsprung von 5 Studs; T1 steht danach zu nah am Griff, unter dem Klingenband, und wird nicht getroffen; die Klinge trifft stattdessen T3 | bestanden | – |
| 13 | Ziel läuft unter die Landung | rechts | 0,0 | -15,0 → 8.6,0 | Landung zerdrückt T2 (−10, nach außen gestoßen), Klinge trifft T1 | bestanden | – |
| – | Aufräumen | unten | 30,-28 | – | Abbruch im Schnitt: Teile vorher 85, nachher 85, 0 Ansichten | bestanden | – |
| – | Einzelbild | rechts | 0,0 | – | Erscheinen, Sprung im Scheitel, Schnitt bei −27°, +2° und +8° angehalten; die Klinge steht im Bild genau über T1, als der Server trifft | bestanden, Bild geprüft | – |

Die Ninken laufen nach dem Umbau unverändert (Kakashi rechts, Ziel weicht aus: Fehlschlag, T1 bei 30,8).

vfx test: v45 hat denselben Code. Die Fälle 1 bis 6 laufen dort über den Server identisch. Bilder sind weiter gesperrt: `CreateEditableImage` gibt zwar kein Fehler zurück, beim Zeichnen meldet Roblox aber „EditableImage is not accessible“.

Weitere Prüfungen:

- **Andere Live-Moves:** Sasuke (Mangekyō, Kage Summit) Slot 1 „Susanoo Arrow“ läuft in Pixel BAS über denselben Slot-Pfad (Bild geprüft).
- **Kunai-Werfer:** Der Werfer aus dem alten Test bleibt aktiv.
