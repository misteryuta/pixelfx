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

## Tsunade (Fifth Hokage), Shippūden: Katsuyu, zwei getrennte Aktionen

Aussehen (Narutopedia „Appearance“, Anime 96 / Shippūden 159):

- weiß mit drei blaugrünen, gezackten Streifen vom Kopf bis zum Schwanz (Mitte und Seiten)
- heller Fuß
- zwei graue Augenstiele mit Kugelenden, zwei kleine Fühler am Mund
- vordere Hälfte als S aufgerichtet, Kopf nach vorn geneigt

Rig: Wirbelkette mit Körperwelle, Seiten-, Vorder- und Rückansicht. Die Teilstücke sind dasselbe Rig, kleiner. Von hinten ist sie zu 30 % durchsichtig.

Verbündete für die Heilung: A1 (14,-14), A2 (16,12), A3 (-14,8). Sie haben 40 von 100 Leben, blauen Stoff, ein grünes Kreuz und einen Lebensbalken. Angriffe wählen und treffen sie nie.

### Slot 1: Katsuyu: Immense Network Healing (Manga 424 / Anime Shippūden 159)

Ablauf (Server):

1. Siegel
2. Erscheinen vor Tsunade
3. Teilung: Eine Welle läuft durch den Körper, Beulen heben sich.
4. Je Verbündetem in Reichweite (44 Studs, ±80°) kriecht ein Teilstück los und hinterlässt eine Schleimspur.
5. Das Stück legt sich auf den Verbündeten und leuchtet grün: +14 Leben pro Sekunde für 2,6 s.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| H1 | zwei Verbündete | rechts | 0,0 | A1 +36, A2 +36; A3 (hinter ihr) nicht | bestanden, Bild geprüft (Kriechen mit Spur, Liegen mit Leuchten) | Server bestanden |
| H2 | A2 verschwindet unterwegs | rechts | 0,0 | Das Stück dreht zum nächsten Verbündeten A1; A1 +60 (bis 100) | bestanden | – |
| H3 | zwei Verbündete | unten | 0,-30 | A1 +36, A3 +36 | bestanden, Bild geprüft (Vorderansicht vor Tsunade, nach der Korrektur durchsichtig; Stücke kriechen zu A1 und A3) | Server bestanden |
| H4 | zwei Verbündete | oben | 0,30 | A2 +36, A3 +36 | bestanden | Server bestanden |
| H5 | kein Verbündeter im Kegel | unten | 0,20 | Teilung, dann sieht sie sich um und geht: „kein Verbündeter in Reichweite“ | bestanden | Server bestanden |
| H6 | Verbündete laufen | rechts | 0,0 | Die Stücke folgen und bleiben auf ihnen (Stück und A1 beide bei 14,-4.4); je +36 | bestanden | – |
| H7 | alle Verbündeten weg | rechts | 0,0 | Beide Stücke kriechen zurück und verschmelzen mit ihr: „niemand erreicht“ | bestanden | – |
| H8 | Abbruch unterwegs | rechts | 0,0 | Rauch; Teile vorher 88, danach 88 (zusätzlich nur der kurze „TREFFER“-Text des Kunai-Werfers) | bestanden | – |

### Slot 3: Katsuyu Acid Slime (Tongue Tooth Sticky Acid, Manga 170 / Anime 96)

Ablauf (Server):

1. Erscheinen hinter Tsunade (bei Würfen nach oben oder unten neben ihr)
2. Aufrichten, zum Ziel gedreht und ihm folgend: Das ist das Signal. Gelber Zielring am Boden.
3. Ausspucken: Der Klumpen fliegt im Bogen vom Mund (aus dem Rig) zum Ring.
4. Spritzer mit 5,5 Studs Radius: 12 Schaden, Rückstoß weg vom Einschlag, im Zentrum entlang der Wurfrichtung.
5. Pfütze, 2,2 s: 7 Schaden pro Sekunde für jeden, der darin steht.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| S1 | Treffer | rechts | 0,0 | Spritzer T1, dann Pfütze (73 Leben) | bestanden, Bild geprüft (Zielring, Flug, Spritzer, Pfütze) | Server bestanden |
| S2 | Ziel weicht beim Ausspucken aus | rechts | 0,0 | Fehlschlag | bestanden | Server bestanden |
| S3 | Treffer | unten | 30,-28 | Spritzer T1, Rückstoß nach unten (30,5) | bestanden, Bild geprüft (Vorderansicht beim Aufrichten neben Tsunade, Zielring auf T1) | Server bestanden |
| S4 | weicht aus | unten | 30,-28 | Fehlschlag | bestanden | Server bestanden |
| S5 | Treffer | oben | 52,30 | Spritzer T2, Rückstoß nach oben (52,2) | bestanden, Bild geprüft (Rückansicht durchsichtig, Klumpen im Flug zum Ring bei T2) | Server bestanden |
| S6 | weicht aus | oben | 52,30 | Fehlschlag | bestanden | Server bestanden |
| S7 | Ziel läuft beim Aufrichten | rechts | 0,0 | Sie folgt; Landepunkt = Ort beim Ausspucken (30,11); Treffer | bestanden | – |
| S8 | Ziel beim Aufrichten entfernt | rechts | 0,0 | Spuckt auf den letzten Ort; Fehlschlag | bestanden | – |
| S9 | kein Ziel im Kegel | links | 0,0 | Spuckt 32 Studs weit; Fehlschlag | bestanden | – |
| S10 | Abbruch im Flug | rechts | 0,0 | Kein Spritzer, keine Pfütze, Rauch | bestanden | – |
| S11 | Ziel läuft in die Pfütze | rechts | 0,0 | T2 nach 0,8 s in die Pfütze gesetzt: −10 (Pfütze), T1 Spritzer | bestanden | – |

Gefundener und behobener Fehler: Ein Ziel genau im Zentrum eines Spritzers oder einer Landung wurde immer nach rechts gestoßen. Jetzt geht der Rückstoß entlang der Wurfrichtung.

Bildtest nachgeholt (2026-11-27, Pixel BAS v558): Vorder- und Rückansicht im Spiel geprüft (H3, S3, S5).

Befund und Korrektur: Bei der Heilung nach unten steht Katsuyu 8 Studs vor Tsunade in der Vorderansicht und verdeckte sie ganz. Jetzt wird sie zu 30 % durchsichtig, wenn sie in der Vorderansicht vor dem Beschwörer steht, so wie in der Rückansicht.

## Hiruzen Sarutobi: Monkey King Enma, zwei Moves

Aussehen (Narutopedia „Appearance“):

- weißes Fell an Körper und Schwanz, lange weiße Mähne bis auf den Rücken, Koteletten und Kinnbart
- olivfarbener Anzug mit Netzpanzer an Handgelenken und Knöcheln
- goldenes ärmelloses Kimono-Hemd mit Tigerstreifen und weißem Fellbesatz, rote Schärpe, Konoha-Stirnschutz

Rig mit Seiten-, Vorder- und Rückansicht. Der Stab ist schwarz mit goldenen Enden.

Der Stab wird als Kette von Teilen in Hiruzens Handhöhe gezeichnet: Griff mit zwei Fäusten in schwarzen Handschuhen, Schaftstücke, goldene Spitze. Jedes Teil wird auf den Bildschirmwinkel der Linie gedreht. Die Spitze liegt immer genau dort, wo der Server die Trefferzone hat. Dadurch geht auch jede Schrägrichtung.

### Classic, Slot 2: Monkey King Enma: Adamantine Staff (Henge: Kongōnyoi, Manga 120 / Anime 71)

Ablauf:

1. Enma erscheint als Affe neben Hiruzen.
2. Er springt Hiruzen in die Hände, Puff: Hiruzen hält den Stab.
3. Ausholen: Hiruzen dreht sich zum Ziel und folgt ihm. Das ist das Signal.
4. Der Stab schießt aus (62 Studs/s, bis 30 Studs). Nur die Spitze trifft: Sie nimmt das Ziel mit bis zur vollen Länge und wirft es dann ab (14 Schaden, Rückstoß entlang des Stabs).
5. Der Stab fährt zurück, Puff.

Hiruzen bleibt währenddessen gesperrt.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| A1 | Treffer | rechts | 0,0 | Spitze trägt T1 bis 31,4, Abwurf bis 35,4 | bestanden, Bild geprüft (Stab aus Hiruzens Händen bis T1, goldene Spitze an T1) | Server bestanden |
| A2 | weicht beim Ausstoßen aus | rechts | 0,0 | Fehlschlag | bestanden | – |
| A3 | Treffer | unten | 30,-24 | T1 nach unten getragen (30,11.4) | bestanden, Bild geprüft (Enma in Affengestalt neben Hiruzen, Vorderansicht) | – |
| A4 | weicht aus | unten | 30,-24 | Fehlschlag | bestanden | Server bestanden |
| A5 | Treffer | oben | 52,30 | T2 nach oben getragen (52,-5.4) | bestanden, Bild geprüft (Stab senkrecht nach oben, T2 an der Spitze) | Server bestanden |
| A6 | weicht aus | oben | 52,30 | Fehlschlag | bestanden | – |
| A7 | Ziel läuft beim Ausholen | rechts | 0,0 | Stoß schräg (0.94, 0.34) auf T1 bei 30,11; Treffer | bestanden | – |
| A8 | Ziel beim Ausholen entfernt | rechts | 0,0 | Stoß zum letzten Ort; Fehlschlag | bestanden | – |
| A9 | kein Ziel im Kegel | links | 0,0 | Fehlschlag | bestanden | – |
| A10 | Abbruch, während T1 getragen wird | rechts | 0,0 | T1 sofort losgelassen (Held true → false) | bestanden | – |

### Shippūden (Prime), Slot 1: Monkey King Enma: Adamantine Prison Wall (Kongō Rōheki, Manga 122 / Anime 72)

Ablauf:

1. Enma erscheint und wird zum Stab, Hiruzen holt aus.
2. Der Stab fährt bis zur Stelle des Ziels aus.
3. Dort fallen die Klone als Pfosten ein und die Stäbe schieben sich zu einem Gitterkasten zusammen (Hälfte 3,4 Studs, hinter und vor dem Gefangenen gezeichnet).
4. Wer beim Schließen drin ist, wird 3 s festgehalten (4 Schaden). Sonst steht der Käfig kurz leer und verschwindet.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| K1 | Treffer | rechts | 0,0 | T1 gefangen | bestanden, Bild geprüft (Käfig mit schwarzen Stäben und goldenen Enden um T1, der Stab kurz in Hiruzens Händen) | Server bestanden |
| K2 | weicht aus | rechts | 0,0 | leerer Käfig, Fehlschlag | bestanden | – |
| K3 | Treffer | unten | 30,-24 | T1 gefangen | bestanden | Server bestanden |
| K4 | weicht aus | unten | 30,-24 | Fehlschlag | bestanden | – |
| K5 | Treffer | oben | 52,30 | T2 gefangen | bestanden | – |
| K6 | weicht aus | oben | 52,30 | Fehlschlag | bestanden | Server bestanden |
| K7 | Ziel läuft | rechts | 0,0 | Käfig bei 30,11 (dem verfolgten Ort); T1 bleibt im Käfig (bei 30,8.4 an der Wand) | bestanden | – |
| K8 | Ziel beim Ausholen entfernt | rechts | 0,0 | leerer Käfig am letzten Ort | bestanden | – |
| K9 | Abbruch im Käfig | rechts | 0,0 | T1 sofort frei | bestanden | – |

Bildtest nachgeholt (2026-11-27, Pixel BAS v558): Enma, der Stab und der Käfig im Spiel geprüft (A1, A3, A5, K1).

Befund und Korrektur: Enma erschien 3,5 Studs neben Hiruzen, und der Beschwörer verdeckte ihn zur Hälfte. Jetzt sind es 5,5 Studs (`side`); A1, A3, A5 und K1 sind danach erneut bestanden.

## Temari (Genin), Classic, Slot 1: Summoning: Quick Beheading Dance (Kirikiri Mai, Manga 214 / Anime 125)

Aussehen (Narutopedia „Appearance“, Anime 125): ein riesiges weißes Wiesel mit dunkelgrüner Augenklappe über dem linken Auge, schwarzer Weste mit rotem Rand und gelber Schnur auf dem Rücken und buschigem Schwanz. Die Sichel ist fast so lang wie er selbst: weiß umwickelter Griff, goldene Beschläge, breite gebogene Klinge. Beim Warten schweben kleine Sicheln und die Laterne mit „鎌“ um ihn. Rig mit Seiten-, Vorder- und Rückansicht.

Ablauf (Server):

1. Temaris Fächerschwung (Windstoß).
2. Kamatari erscheint im Wind vor ihr.
3. Er duckt sich mit zurückgezogener Sichel und dreht sich zum Ziel (folgt ihm). Am Boden zeigt sich der Windkorridor, 40 Studs lang, ±3,2 Studs breit: das Signal.
4. Lauf: Er wird auf der Bahn immer schneller (s = 18 t + 90 t², bis etwa 120 Studs/s). Die Sichel kreist, er wird blasser, die Nachbilder werden länger.
5. Jeder in Sichelreichweite der Bahn wird geschnitten (16 Schaden) und vom Wind zur Seite und etwas nach vorn geschleudert.
6. Am Ende schlittert er, Rauch. Die Schnittspuren bleiben kurz am Boden.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| D1 | Treffer | rechts | 0,0 | T1 geschnitten, zur Seite geschleudert (34.2,5.6); Höchstgeschwindigkeit 121 | bestanden, Bild geprüft (Lauf: blasser werdend, Nachbilder, Windspuren am Boden) | Server bestanden |
| D2 | weicht beim Loslaufen aus | rechts | 0,0 | Fehlschlag | bestanden | – |
| D3 | Treffer | unten | 30,-28 | T1 geschnitten | bestanden, Bild geprüft (Vorderansicht beim Ausholen mit Sichel, Laterne, Bahn zu T1) | – |
| D4 | weicht aus | unten | 30,-28 | Fehlschlag | bestanden | Server bestanden |
| D5 | Treffer | oben | 52,30 | T2 geschnitten | bestanden, Bild geprüft (Rückansicht im Lauf mit Nachbildern zu T2) | Server bestanden |
| D6 | weicht aus | oben | 52,30 | Fehlschlag | bestanden | – |
| D7 | Ziel läuft beim Ausholen | rechts | 0,0 | Bahn schräg (0.94, 0.35) auf T1 bei 30,10.2; Treffer | bestanden | – |
| D8 | Ziel beim Ausholen entfernt | rechts | 0,0 | Lauf zum letzten Ort; Fehlschlag | bestanden | – |
| D9 | kein Ziel im Kegel | links | 0,0 | Fehlschlag | bestanden | – |
| D10 | zwei Ziele auf der Bahn | oben | 30,40 | T3 und T1 geschnitten | bestanden | – |
| D11 | Abbruch im Lauf | rechts | 0,0 | Rauch; nach 1,2 / 2,4 / 3,6 s 1 / 0 / 1 neue Teile (nur das Kunai des Werfers) | bestanden | – |

Bildtest nachgeholt (2026-11-27, Pixel BAS v558): Kamatari im Spiel geprüft (D1, D3, D5).

## Danzō Shimura (Izanagi / Sharingan Arm), Shippūden, Slot 3: Summoning: Baku (Manga 479)

Aussehen (Narutopedia „Appearance“, Anime-Bild „Baku Anime“):

- riesige elefantenartige Chimäre, dunkelorange
- Rüssel, Beine und Augenpartie hell, Beine und Füße getigert
- große Stoßzähne, Bart, lange schwarze Krallen
- Bandagen um den Kopf, Plattenpanzer an der Rüsselwurzel

Rig mit Seiten-, Vorder- und Rückansicht.

Ablauf (Server):

1. Erscheinen im Rauch hinter Danzō, bei Würfen nach oben oder unten neben ihm.
2. Stemmen (0,4 s): Er dreht sich zum Ziel und schiebt sich seitlich, bis die Maulachse durchs Ziel geht. Die Krallen graben sich ein (Risse am Boden).
3. Ansaugen (0,45 s): Der Kegel steht jetzt fest (32 Studs, ±20°), Staub strömt sichtbar zum Maul. Das ist das Signal.
4. Saugen (2,4 s): Maul weit offen, Rüssel hoch und ausblasend. Wer im Kegel ist, wird gefangen, bis vor das Maul gezogen, festgehalten und zermürbt (4 pro Sekunde). Wer einmal gefangen ist, bleibt es.
5. Loslassen mit kleinem Rückstoß, dann Rauch.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| B1 | Treffer | rechts | 0,0 | T1 von 30 bis vors Maul gezogen, losgelassen bei 10.3; −10 | bestanden, Bild geprüft (Profil, Rüssel hoch, Kegel am Boden) | Server bestanden |
| B2 | Ziel tritt beim Ansaugen aus dem Kegel | rechts | 0,0 | Fehlschlag | bestanden | Server bestanden |
| B3 | Treffer | unten | 30,-28 | Baku richtet sich von x 20 auf x 30 aus; T1 und T3 (auf derselben Achse) gezogen | bestanden, Bild geprüft (Vorderansicht, Krallenrisse, „GEZOGEN“) | – |
| B4 | T1 tritt heraus | unten | 30,-28 | T1 frei; T3 dahinter (nicht im Ausweich-Modus) wird gezogen | bestanden | – |
| B5 | Treffer | oben | 52,30 | T2 gezogen | bestanden, Bild geprüft (Rückansicht durchsichtig, Kegel nach oben) | Server bestanden |
| B6 | tritt heraus | oben | 52,30 | Fehlschlag | bestanden | – |
| B7 | Ziel läuft beim Stemmen | rechts | 0,0 | Er schiebt sich auf die Linie des Ziels (z 11), T1 gefangen | bestanden | – |
| B8 | Ziel beim Stemmen entfernt | rechts | 0,0 | Fehlschlag | bestanden | – |
| B9 | kein Ziel im Kegel | links | 0,0 | Fehlschlag | bestanden | – |
| B10 | Abbruch beim Saugen | rechts | 0,0 | Ziel sofort frei (Held true → false) | bestanden | – |

Gefundener und behobener Fehler:

- **Freigabe beim Abbruch:** Sie landete beim ersten Patch in Enmas Käfig-Code statt in der Abbruch-Funktion, weil dieselbe Ankerzeile zweimal vorkommt. Ein gezogenes Ziel blieb dadurch nach dem Abbruch gefangen (B10). Jetzt steht sie in `Sim:abort`. Der Käfig ist danach erneut geprüft (gefangen, freigegeben).

Bildtests: Ab dieser Sitzung rendert Pixel BAS wieder (Studio wurde neu gestartet). Die Bildtests von Katsuyu (vorn/hinten), Enma und Kamatari sind damit nachholbar.

## Jiraiya (Sage Mode), Shippūden, Slot 4: Barrier: Toad Gourd Prison (Kekkai: Gama Hyōrō, Manga 381 / Anime Shippūden 133)

Das ist der Shippūden-Ersatz für Gamaguchi Shibari, das Jiraiya schon in Classic hat.

Aussehen (Narutopedia-Infobox „Hyōtan Gama“): eine kleine Kröte in Kürbisform, magentarot, mit einem Kopf-Kolben auf einem Bauch-Kolben. Dazu ein grünes gemustertes Band an der Taille, zwei spitze Ohren, gelbe Augen, dunkle Winkel auf Gliedern und Rücken, lange Finger und der Stöpsel mit „酒“ im Maul. Rig mit Seiten-, Vorder- und Rückansicht; mit Inhalt wird der Bauch rund.

Ablauf (Server):

1. Puff, die Kröte sitzt vor Jiraiya, etwas zur Seite.
2. Öffnen (0,25 s): Sie dreht sich zum Ziel (folgt ihm), der Stöpsel ist raus.
3. Zielen (0,3 s): Die Linie steht fest und zeigt sich am Boden. Das ist das Signal.
4. Zunge mit 70 Studs/s, bis 24 Studs. Die Spitze packt, was sie erreicht, und wickelt sich darum.
5. Einholen, Schlucken: Das Ziel ist verschwunden (verborgen, festgehalten). Im Bauch 3 s Säure, 6 pro Sekunde.
6. Ausspucken vor die Kröte mit Rückstoß, Puff.
7. Fehlschlag: Die Zunge kommt leer zurück, der Stöpsel kommt wieder rein.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| G1 | Treffer | rechts | 8,0 | T1 gepackt, eingeholt, im Bauch (Hidden und Held true), ausgespuckt bei 19.9; −18 | bestanden, Bild geprüft (Zunge mit Umwicklung, „GEPACKT“) | Server bestanden |
| G2 | tritt beim Zielen von der Linie | rechts | 8,0 | Zunge leer zurück | bestanden | – |
| G3 | Treffer | unten | 30,-16 | T1 verschluckt | bestanden, Bild geprüft (Vorderansicht, voller Bauch, T1 unsichtbar) | – |
| G4 | weicht aus | unten | 30,-16 | Fehlschlag | bestanden | Server bestanden |
| G5 | Treffer | oben | 52,22 | T2 verschluckt | bestanden, Bild geprüft (Rückansicht, Zunge nach oben um T2) | Server bestanden |
| G6 | weicht aus | oben | 52,22 | Fehlschlag | bestanden | – |
| G7 | Ziel läuft beim Öffnen | rechts | 8,0 | Zunge schräg (0.94, 0.35) auf T1 bei 30,10.9; Treffer | bestanden | – |
| G8 | Ziel beim Öffnen entfernt | rechts | 8,0 | Zunge zum letzten Ort, leer | bestanden | – |
| G9 | kein Ziel im Kegel | links | 8,0 | Fehlschlag | bestanden | – |
| G10 | Abbruch im Bauch | rechts | 8,0 | Ziel sofort draußen, sichtbar und frei (vor dem Maul) | bestanden | – |
| G11 | Abbruch beim Einholen | rechts | 8,0 | Ziel frei | bestanden | – |

Beim ersten Durchgang gefunden: Die Kröte folgte dem Ziel während des ganzen Signals, Ausweichen war damit wirkungslos (G2). Jetzt gibt es zwei Phasen: Öffnen (folgt) und Zielen (fest, Ausweichsignal).

## Jiraiya (Sage Mode), Shippūden, Slot 3: Frog Song Genjutsu (Demonic Illusion: Toad Confrontation Chant, Manga 379 / Anime Shippūden 132)

Aussehen (Narutopedia, Bild „Shima“):

- **Fukasaku:** grüne Kröte, weißer Irokesen, dicke weiße Brauen, kleiner Kinnbart
- **Shima:** blassgrünes Gesicht, violette Lippen, violette Locken wie Lockenwickler unter einem Haarnetz
- beide in Umhängen mit hohem Kragen, graue Ohrscheiben, schläfrige gelbe Augen

Beide sitzen auf Jiraiyas Schultern, wie im Sage Mode. Rigs mit Seiten-, Vorder- und Rückansicht; von hinten tauschen sie die Seiten.

Im Genjutsu: vier Krötensamurai (Haarknoten, blaue Rüstung, Schwert hoch) halten das Opfer in einem Wasserwürfel, der hinter und vor dem Opfer gezeichnet ist.

Ablauf (Server):

1. Puff, die Kröten auf den Schultern.
2. Harmoniesuche, 1,6 s: Noten steigen auf, die Reichweite (Kreis mit 20 Studs Radius, 10 Studs vor Jiraiya) zeigt sich am Boden und pulsiert. Das ist das Signal; laut Narutopedia verraten die beiden dabei ihre Position.
3. Gesang: Wer in diesem Moment in der Reichweite ist, ist gefangen und 3,5 s gehalten (5 Schaden). Verbündete nie.
4. Ende: Die Kröten husten (überanstrengte Kehlen), Puff.

Jiraiya bleibt während des Gesangs gesperrt.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| F1 | Treffer | rechts | 4,0 | T1 gefangen (Held true) | bestanden, Bild geprüft (Kröten, Reichweitenkreis, T1 im Kreis) | Server bestanden |
| F2 | läuft weg | rechts | 4,0 | niemand in Hörweite | bestanden | – |
| F3 | Treffer | unten | 30,-24 | T1 gefangen | bestanden | – |
| F4 | läuft weg | unten | 30,-24 | Fehlschlag | bestanden | Server bestanden |
| F5 | Treffer | oben | 52,22 | T2 gefangen | bestanden, Bild geprüft (Kröten von hinten, T2 im Wasserwürfel mit Samurai) | Server bestanden |
| F6 | läuft weg | oben | 52,22 | Fehlschlag (erst beim zweiten Durchgang: mit 15 Studs Weglauf blieb T2 genau auf dem Rand, jetzt 18) | bestanden | – |
| F7 | zwei in Hörweite | unten | 30,-2 | T1 und T3 gefangen | bestanden, Bild geprüft (beide im Wasserwürfel, Samurai) | – |
| F8 | Ziel läuft während der Harmoniesuche hinein | rechts | 4,0 | T2 (auf 26,12 gesetzt) und T1 gefangen; Verbündeter A2 im Kreis unberührt | bestanden | – |
| F9 | Abbruch im Bann | rechts | 4,0 | T1 sofort frei | bestanden | – |

## Madara Uchiha (Uchiha-Clan-Anführer, Rückblende), Shippūden, Slot 3: Nine-Tails Summoning

Belege (Narutopedia):

- Madara kontrolliert Kurama mit dem Sharingan im Kampf gegen Hashirama im späteren Tal des Endes (Manga 399, 620, 621, 626).
- Kurama kontert dort Hashiramas Holzdrachen mit einem Bijūdama (Manga 620, S. 14).
- Ohne Susanoo-Rüstung, weil Madaras Slot 1 schon Perfect Susanoo ist (höchstens ein Susanoo-Move pro Grundset).

Aussehen: rotoranger Fuchs, schwarzes Fell um die roten Augen bis zu den Ohren, neun lange Schwänze, menschenähnlicher Oberkörper mit Krallenhänden. Unter dem Sharingan zeigen die Augen drei Tomoe. Rig mit Seiten-, Vorder- und Rückansicht; die neun Schwänze sind glatte Röhren im Fächer. Von hinten ist er zu 35 % durchsichtig.

Ablauf (Server):

1. Rauch, Kurama hinter Madara (bei oben/unten neben ihm). Ein roter Tomoe-Blitz zeigt die Sharingan-Kontrolle.
2. Laden (0,7 s): Er geht auf alle viere, das Maul öffnet sich, Chakra sammelt sich zur schwarzen Kugel vor dem Maul. Er folgt dem Ziel.
3. Fixieren (0,45 s): Der rote Explosionsring liegt fest am Boden. Das ist das Signal.
4. Schlucken, dann Feuern: Die Kugel fliegt vom Maul zum Ring.
5. Explosion mit 7 Studs Radius: 28 Schaden, Rückstoß 10. Ein Krater bleibt kurz.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| K1 | Treffer | rechts | 0,0 | T1 getroffen, nach 40,0 geschleudert, 72 Leben | bestanden, Bild geprüft (Kurama geduckt, Kugel vor dem Maul, Ring bei T1) | Server bestanden |
| K2 | weicht beim Fixieren aus | rechts | 0,0 | Fehlschlag | bestanden | – |
| K3 | Treffer | unten | 30,-24 | T1 getroffen, nach unten geschleudert | bestanden, Bild geprüft (Vorderansicht, Explosionskuppel, Krater, „GETROFFEN“) | – |
| K4 | weicht aus | unten | 30,-24 | Fehlschlag | bestanden | Server bestanden |
| K5 | Treffer | oben | 52,30 | T2 getroffen, nach oben geschleudert | bestanden, Bild geprüft (Rückansicht durchsichtig, Kugel im Flug zum Ring) | Server bestanden |
| K6 | weicht aus | oben | 52,30 | Fehlschlag | bestanden | – |
| K7 | Ziel läuft | rechts | 0,0 | Ring beim Fixieren auf T1 (30,10.4); T1 läuft weiter aus dem Ring, Fehlschlag | bestanden | – |
| K8 | Ziel beim Laden entfernt | rechts | 0,0 | Kugel auf den letzten Ort, Fehlschlag | bestanden | – |
| K9 | kein Ziel im Kegel | links | 0,0 | Fehlschlag | bestanden | – |
| K10 | zwei im Explosionsradius | rechts | 0,0 | T1 und T3 (auf 33,4 gesetzt) getroffen | bestanden | – |
| K11 | Abbruch im Flug | rechts | 0,0 | Keine Explosion, kein Schaden | bestanden | – |

## Pain (Six Paths of Pain), Shippūden, Slot 4: Summoning: Gedo Statue (Kuchiyose: Gedō Mazō, Manga 447 / Anime Shippūden 173)

Belege (Narutopedia: Summoning: Demonic Statue of the Outer Path; Demonic Statue of the Outer Path; Viertes Databook S. 247):

- Nur das Rinnegan kann die Statue beschwören, auch über die Sechs Pfade.
- Statt Blut zahlt der Beschwörer mit Lebenskraft: Schwarze Empfänger aus ihrem Bauch stecken in seinem Rücken.
- Aus dem Maul kommt Chakra in Drachenform, das dem Ziel das Chakra entzieht.

Aussehen: riesige, mumienartige Gestalt in stumpfem Mauvegrau, der Unterkörper wie eine Robe, fingerartige Stacheln am Rücken. Über den neun Augen liegt eine Augenbinde. Lange Arme mit Eisenschellen und abgerissenen Kettengliedern. Geschlossen beißt sie auf eine Schriftrolle, die zwei Seile unter der Binde halten; beim Angriff fällt die Rolle, und das Maul öffnet sich mit gezackten Zähnen. Rig mit Seiten-, Vorder- und Rückansicht; von hinten ist sie zu 35 % durchsichtig.

Ablauf (Server):

1. Siegel (0,4 s).
2. Aufsteigen (0,9 s): Die Statue steigt hinter Pain aus dem Boden (bei oben/unten neben ihm), mit Staub und Bodenrissen. Eine dünne schwarze Schnur führt in Pains Rücken; das ist der Preis.
3. Verfolgen (0,5 s): Sie dreht sich zum Ziel und folgt ihm.
4. Fixieren (0,4 s): Die Rolle fällt, das Maul öffnet sich. Die Bahn des Drachen liegt violett am Boden. Das ist das Signal: aus der Bahn treten.
5. Flug: Der Chakra-Drache schlängelt mit 30 Studs/s aus dem Maul die Bahn entlang (bis 34 Studs, Breite 2,4). Sein Kopf packt, wen er erreicht.
6. Umschlingen (2,5 s): Der Drache windet sich um das Ziel und zieht 8 Leben pro Sekunde ab („CHAKRA ENTZOGEN“). Das Ziel ist festgehalten.
7. Der Drache kehrt ins Maul zurück, die Statue versinkt im Boden.

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| D1 | Treffer | rechts | 0,0 | T1 gepackt und ausgesaugt, 80 Leben | bestanden, Bild geprüft (Drache im Flug auf der Bahn) | Server bestanden |
| D2 | weicht beim Fixieren aus | rechts | 0,0 | Fehlschlag | bestanden | – |
| D3 | Treffer | unten | 30,-24 | T1 gepackt | bestanden, Bild geprüft (Vorderansicht beim Verfolgen, dann Umschlingen) | – |
| D4 | weicht aus | unten | 30,-24 | Fehlschlag | bestanden | Server bestanden |
| D5 | Treffer | oben | 52,30 | T2 gepackt | bestanden, Bild geprüft (Rückansicht durchsichtig, Umschlingen) | Server bestanden |
| D6 | weicht aus | oben | 52,30 | Fehlschlag | bestanden | – |
| D7 | Ziel läuft | rechts | 0,0 | Bahn beim Fixieren auf (0,94; 0,35), T1 bei 30,10.4; T1 läuft aus der Bahn, Fehlschlag | bestanden | – |
| D8 | Ziel beim Verfolgen entfernt | rechts | 0,0 | Fehlschlag | bestanden | – |
| D9 | kein Ziel im Kegel | links | 0,0 | Fehlschlag | bestanden | – |
| D10 | Abbruch beim Umschlingen | rechts | 0,0 | Ziel freigegeben (Held false) | bestanden | – |

Korrektur nach dem ersten Bild: Die Empfänger sahen wie Störbalken quer über dem Gesicht aus. Jetzt ist es eine einzelne dünne Schnur, die nur beim Aufsteigen und Verfolgen sichtbar ist.

## Tsunade (Fifth Hokage), Classic, Slot 4: Summoning: Katsuyu mit Slug Great Division (Katsuyu Daibunretsu, Manga 170 / Anime 96)

Beleg (Narutopedia: Slug Great Division, Tō no Sho S. 204): Wird Katsuyu körperlich angegriffen, teilt sie sich in unzählige kleinere Katsuyu, und der Angriff verpufft. Die Teile vereinigen sich wieder, wann sie wollen, und sie kann das beliebig wiederholen, bis der Angreifer aufgibt. Kein Doppel zu Shippūden: Dort heilt die Teilung Verbündete (Mōryōjika, Slot 1), hier ist sie Abwehr.

Testangreifer: Die Puppen werfen Kunai auf den Beschwörer. Möglich ist das über den Server-Befehl `throw` (Puppe, Zielpunkt), über die Modi `throw` und `throwwalk` (alle 1,3 s, der erste Wurf 1,2 s nach Beginn eines Casts) und über den neuen Knopf „WIRFT“ im Panel. Die werfende Puppe trägt dann den blauen Gurt und den Kunai in der Hand. Ein Kunai fliegt mit 32 Studs/s, reicht bis zu 44 Studs weit und trifft den Beschwörer innerhalb von 1,4 Studs.

Ablauf (Server):

1. Siegel (0,35 s), Rauch.
2. Katsuyu erscheint 8 Studs vor Tsunade, hoch aufgerichtet, in Wurfrichtung (0,55 s).
3. Wache (5,5 s): Katsuyu gleitet um Tsunade herum (1,1 rad/s) und bleibt zwischen ihr und dem nächsten Gegner im Umkreis von 42 Studs. Ist der Gegner weg, hält sie die Seite, auf der sie ihn zuletzt gesehen hat.
4. Ein Wurf, der ihren Körper erreicht (dünn am Schwanz, voll ab der aufgerichteten Säule), löst die Teilung aus (0,45 s): 26 kleine Schnecken springen von der Wurflinie weg, und der Kunai fällt zwischen ihnen zu Boden. Danach kriechen sie zurück (0,9 s), und sie ist wieder ganz. Ein weiterer Wurf, während sie geteilt ist, verpufft ebenso.
5. Ist die Wache vorbei, geht sie im Rauch. Ein Treffer danach fällt nur noch ab und löst keine neue Teilung aus, damit ein Dauerwerfer sie nicht festhält.

Ein Angriff von einer Seite, die sie noch nicht erreicht hat, trifft Tsunade („GETROFFEN“).

| # | Fall | Richtung | Start | Ergebnis (Server) | Pixel BAS | vfx test |
|---|---|---|---|---|---|---|
| G1 | Wurf von vorn (T1 auf 30,0) | rechts | 0,0 | abgewehrt, Teilung bei 1,77 s, wieder ganz bei 3,13 s | bestanden, Bild geprüft (Kunai im Flug; Teilung: kleine Schnecken weichen der Linie aus, Kunai fällt) | Server bestanden |
| G2 | Wurf von hinten (T1 auf -30,0) | rechts | 0,0 | durchgekommen: Sie ist bei 1,5 s erst ein Stück herum | bestanden | – |
| G3 | Wurf von vorn | unten | 30,-24 | abgewehrt | bestanden, Bild geprüft (Teilung, Schnecken links und rechts der Wurflinie) | – |
| G4 | Wurf von hinten (T1 auf 30,-54) | unten | 30,-24 | durchgekommen | bestanden | Server bestanden |
| G5 | Wurf von vorn (T2, T3 entfernt) | oben | 52,30 | abgewehrt | bestanden, Bild geprüft (Rückansicht durchsichtig, T2 dahinter sichtbar; Teilung) | Server bestanden |
| G6 | Wurf von hinten (T2 auf 52,60) | oben | 52,30 | durchgekommen | bestanden | – |
| G7 | T1 läuft und wirft (throwwalk) | rechts | 0,0 | folgt ihm, 5 von 5 abgewehrt, Abgang bei 7,13 s | bestanden | – |
| G8 | T1 wechselt bei 2,0 s nach hinten | rechts | 0,0 | Wurf bei 2,2 s durchgekommen; bei 5,0 s steht sie auf -8,0, Wurf bei 5,2 s abgewehrt | bestanden | – |
| G9 | T1 läuft, T1 und T3 bei 1,6 s entfernt | rechts | 0,0 | hält die letzte Seite (7,52; 2,73), nichts abgewehrt | bestanden | – |
| G10 | zwei Würfe im Abstand von 0,3 s | rechts | 0,0 | beide abgewehrt, der zweite trifft sie geteilt | bestanden | – |
| G11 | Abbruch während der Teilung | rechts | 0,0 | Abbruch, keine Reste (0 Ansichten) | bestanden | – |
| G12 | Würfe am Ende (6,2 s und 6,85 s) | rechts | 0,0 | der erste fällt beim Abgang an ihr ab, der zweite trifft Tsunade, als sie weg ist | bestanden | – |

Korrekturen beim Testen:
- Ihr Körper zählte erst überall mit voller Breite, auch am Schwanz. Dann deckte sie Tsunade schon nach einer Vierteldrehung von hinten. Jetzt ist er am Schwanz dünn (2 Studs).
- Ein Dauerwerfer konnte ihren Abgang endlos hinauszögern. Nach Ablauf der Wache gibt es keine neue Teilung mehr.
- Die Teilstücke waren so groß wie die Heilstücke aus Shippūden und lasen sich nicht als „unzählige kleine“. Jetzt sind es 26 kleinere (`slug_bit`, k 0,11).

<!-- ARENA:BEGIN -->
## Eigene Fähigkeiten aller Varianten in vier Richtungen (automatischer Server-Playtest)

Bestand: Pixel BAS hat außer dem Training (PixelArena: Registry `Defs`/`Roster`, Slot-Eingabe 1–4 im Panel, Server-Cast-Handler `PixelArenaServer`) kein eigenes Kampfsystem. Der Shop führt die Signature-Moves je Variante nur als Namen (`SignatureMoveData`). Maßgeblich sind daher die 195 Roster-Slots: 181 als eigene Moves, 13 als Beschwörungen, offen ist 1 (Kurenai, Shippūden: Doppelungsregel, kein belegter Ersatz).

Jede Fähigkeit wird über ihren Slot ausgelöst, der Server entscheidet Treffer, Schaden und Zustände. Geprüft werden je Richtung (rechts, links, unten, oben) ein Treffer und ein Fehlschlag. Beim Fehlschlag weicht das Ziel beim Signal aus. Bei Abwehr-Moves wirft im Treffer-Fall die Puppe Kunai auf den Anwender, im Fehlschlag-Fall greift niemand an. Ein Buff oder eine Selbstheilung allein hat keinen Fehlschlag-Fall.

Zusätzlich prüft der Lauf zwei Sonderfälle an je einem Vertreter pro Mechanik: Drehen direkt vor dem Cast und einen Zielwechsel während der Vorbereitung. Bei jedem Move läuft außerdem ein Abbruch mitten in der Aktion. Danach dürfen kein Cast, kein festgehaltenes Ziel und keine Client-Ansicht übrig bleiben.

**Abnahme (Pixel BAS, 2026-11-28):** 181 von 181 Fähigkeiten bestehen in allen vier Richtungen, 1629 von 1629 Läufen verhalten sich wie erwartet.

| Variante | Slot | Move | Ablauf (Server) | rechts | links | unten | oben | Abbruch |
|---|---|---|---|---|---|---|---|---|
| A (Fourth Raikage — Lightning Mode) | 2 | Guillotine Drop | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| A (Fourth Raikage — Lightning Mode) | 1 | Liger Bomb | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| A (Fourth Raikage — Lightning Mode) | 3 | Lightning Straight | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| A (Fourth Raikage — Lightning Mode) | 4 | Body Flicker Blitz | blink | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Anko Mitarashi (Special Jōnin) | 1 | Hidden Shadow Snake Hands | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Asuma Sarutobi (Jōnin) | 1 | Fire Style: Burning Ash | zone → blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Killer B (Eight-Tails / Full Gyūki) | 3 | Acrobat (Seven Swords Dance) | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Killer B (Eight-Tails / Full Gyūki) | 1 | Tailed Beast Ball | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Killer B (Eight-Tails / Full Gyūki) | 4 | Ink Clone Sealing | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Killer B (Eight-Tails / Full Gyūki) | 2 | Lariat | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Chōji Akimichi (Chūnin — Pre-War) | 1 | Spiky Human Boulder | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Danzō Shimura (Izanagi / Sharingan Arm) | 1 | Izanagi Reality Rewrite | guard → heal | ✓ self / ✓ | ✓ self / ✓ | ✓ self / ✓ | ✓ self / ✓ | ✓ |
| Danzō Shimura (Izanagi / Sharingan Arm) | 2 | Wind Style: Vacuum Great Sphere | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Darui (Kage Summit Bodyguard) | 1 | Storm Release: Laser Circus | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Darui (Kage Summit Bodyguard) | 2 | Water Style: Water Wall | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Deidara (C4 Karura) | 3 | C2 Dragon | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Deidara (C4 Karura) | 2 | C3 Eighteen | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Deidara (C4 Karura) | 1 | C4 Karura (Microscopic Bombs) | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Fū (Seven-Tails / Chōmei) | 2 | Bug Bite | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Fū (Seven-Tails / Chōmei) | 3 | Full Chōmei Transformation | buff → blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Fū (Seven-Tails / Chōmei) | 1 | Secret Technique: Scale Powder | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Gaara (Fifth Kazekage) | 1 | Sand Tsunami | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Gaara (Chūnin Exams / Shukaku) | 1 | Sand Coffin & Sand Burial | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Gaara (Fifth Kazekage) | 2 | Grand Sand Mausoleum Seal | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Gaara (Fifth Kazekage) | 3 | Absolute Sand Shield | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Gaara (Chūnin Exams / Shukaku) | 3 | Sand Shield | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Gaara (Chūnin Exams / Shukaku) | 2 | Playing Possum (Mini-Shukaku) | buff → shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Might Guy (Seventh Gate — Kisame Fight) | 2 | Morning Peacock | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Might Guy (Seventh Gate — Kisame Fight) | 3 | Dynamic Action | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Might Guy (Jōnin) | 2 | Dynamic Entry | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Might Guy (Jōnin) | 3 | Strong Fist Hurricane | rush → blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Might Guy (Seventh Gate — Kisame Fight) | 1 | Hirudora (Daytime Tiger) | buff → shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Might Guy (Jōnin) | 1 | Sixth Gate: Gate of Joy | buff | ✓ selbst+T1 / – | ✓ selbst+T1 / – | ✓ selbst+T1 / – | ✓ selbst+T2 / – | ✓ |
| Might Guy (Seventh Gate — Kisame Fight) | 4 | Leaf Rock-Destroying Rise | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Haku (Hunter-nin) | 1 | Secret Technique: Crystal Ice Mirrors | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Haku (Hunter-nin) | 2 | Thousand Flying Water Needles of Death | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Han (Five-Tails / Kokuō) | 1 | Boil Release: Unrivaled Strength | buff | ✓ selbst / – | ✓ selbst / – | ✓ selbst / – | ✓ selbst / – | ✓ |
| Han (Five-Tails / Kokuō) | 2 | Erupting Propulsion Fist | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hashirama Senju (First Hokage — Konoha Crush) | 1 | Wood Style: Deep Forest Emergence | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hashirama Senju (First Hokage — Konoha Crush) | 3 | Bringer-of-Darkness Technique | state | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hashirama Senju (First Hokage — Konoha Crush) | 2 | Wood Locking Wall | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hashirama Senju (First Hokage — Konoha Crush) | 4 | Taijutsu Combo | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hidan (Jashin Ritual) | 2 | Triple-Bladed Scythe Throw | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hidan (Jashin Ritual) | 1 | Curse Technique: Death Controlling Possessed Blood | rush → state | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hinata Hyūga (Genin) | 1 | Gentle Fist: Tenketsu Strike | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hinata Hyūga (Twin Lion Fists) | 1 | Gentle Step Twin Lion Fists | buff → rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hiruzen Sarutobi (Prime — Flashback) | 3 | Earth Release: Earth-Style Wall | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hiruzen Sarutobi (Prime — Flashback) | 2 | Five-Element Combo Blast | shot → line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hiruzen Sarutobi (Third Hokage) | 3 | Fire Style: Dragon Flame Bomb | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hiruzen Sarutobi (Third Hokage) | 1 | Reaper Death Seal | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Hiruzen Sarutobi (Third Hokage) | 4 | Shuriken Shadow Clone | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Ino Yamanaka (Chūnin) | 1 | Mind Transfer Jutsu | state | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Iruka Umino (Chūnin Instructor) | 1 | String Light Formation (Barrier Seal) | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Iruka Umino (Academy Instructor) | 1 | Shurikenjutsu: Paper Bomb Trap | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Itachi Uchiha (Mangekyō Sharingan) | 2 | Amaterasu | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Itachi Uchiha (Mangekyō Sharingan) | 3 | Susanoo: Totsuka Blade | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Itachi Uchiha (Mangekyō Sharingan) | 1 | Tsukuyomi | state | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Itachi Uchiha (Mangekyō Sharingan) | 4 | Yata Mirror Defense | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Jiraiya (Legendary Sannin) | 1 | Summoning: Toad Mouth Bind | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Jiraiya (Legendary Sannin) | 3 | Fire Style: Toad Oil Flame Bullet | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Jiraiya (Sage Mode) | 1 | Sage Art: Bath of Boiling Oil | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Jiraiya (Legendary Sannin) | 4 | Hair Needle Senbon | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Jiraiya (Sage Mode) | 2 | Massive Rasengan | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Jiraiya (Legendary Sannin) | 2 | Rasengan | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Jūgo (Sage Transformation) | 1 | Multiple Lotus Chakra Cannon | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Jūgo (Sage Transformation) | 2 | Full Curse Mark Piston Punch | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kabuto Yakushi (Snake Cloak) | 1 | Chakra Draining Seal | rush → heal | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kabuto Yakushi (Chūnin Exams) | 1 | Chakra Scalpel | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kabuto Yakushi (Chūnin Exams) | 2 | Temple of Nirvana (Feather Illusion) | state | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kakashi Hatake (Team 7 Sensei) | 2 | Sharingan Copy: Water Dragon | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kakashi Hatake (Team 7 Sensei) | 4 | Hidden Mist Jutsu | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kakashi Hatake (Mangekyō Sharingan) | 1 | Kamui Snipe | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kakashi Hatake (Mangekyō Sharingan) | 3 | Lightning Beast Tracking Fang | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kakashi Hatake (Team 7 Sensei) | 1 | Lightning Blade (Raikiri) | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kakashi Hatake (Mangekyō Sharingan) | 2 | Lightning Release: Shadow Clone | clones | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kakuzu (Earth Grudge Fear) | 1 | Earth Style: Earth Spear | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kakuzu (Earth Grudge Fear) | 3 | Lightning Style: False Darkness | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kakuzu (Earth Grudge Fear) | 2 | Fire/Wind Combo: Searing Migraine | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kankurō (Genin) | 1 | Black Secret Technique: Machine One Shot (Crow & Black Ant) | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kankurō (Kage Summit / Jōnin) | 1 | Red Secret Technique: Machinery Triangles | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kiba & Akamaru (Chūnin) | 1 | Two-Headed Wolf: Fang Passing Fang | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kiba Inuzuka (Genin) | 1 | Fang Over Fang | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kimimaro (Cursed Seal Stage 2) | 3 | Dance of the Larch | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kimimaro (Cursed Seal Stage 2) | 1 | Dance of the Seedling Fern (Bracken Dance) | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kimimaro (Cursed Seal Stage 2) | 2 | Dance of the Clematis: Flower | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kisame Hoshigaki (Samehada Fusion) | 2 | Super Shark Bomb | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kisame Hoshigaki (Samehada Fusion) | 3 | Five Feeding Sharks | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kisame Hoshigaki (Samehada Fusion) | 1 | Water Prison Shark Dance | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Konan (Paper Person of God) | 3 | Paper Chakram | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Konan (Paper Person of God) | 1 | Sacred Paper Emissary (600 Billion Bombs) | zone → blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Konan (Paper Person of God) | 2 | Shikigami Dance | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Konohamaru Sarutobi (Rasengan) | 1 | Rasengan | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kurenai Yūhi (Jōnin) | 1 | Demonic Illusion: Tree Binding Death | state → blink | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Kurenai Yūhi (Jōnin) | 2 | Genjutsu Petal Escape | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Rock Lee (Sixth Gate) | 1 | Morning Peacock | buff → rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Rock Lee (Inner Gates — Chūnin Exams) | 2 | Primary Lotus | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Rock Lee (Sixth Gate) | 2 | Leaf Strong Whirlwind | rush → blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Rock Lee (Inner Gates — Chūnin Exams) | 1 | Hidden Lotus (Reverse Lotus) | buff → rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Madara Uchiha (Uchiha Clan Leader — Flashback) | 2 | Majestic Destroyer Flame | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Madara Uchiha (Uchiha Clan Leader — Flashback) | 4 | Gunbai Reflection | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Madara Uchiha (Uchiha Clan Leader — Flashback) | 1 | Perfect Susanoo | blast → line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Mei Terumī (Fifth Mizukage) | 1 | Boil Release: Skilled Mist | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Mei Terumī (Fifth Mizukage) | 3 | Water Dragon Pillar | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Mei Terumī (Fifth Mizukage) | 2 | Lava Release: Melting Apparition | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Minato Namikaze (Fourth Hokage — Flashback) | 1 | Flying Raijin Level 2 | shot → blink | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Minato Namikaze (Fourth Hokage — Flashback) | 3 | Flying Raijin: Guiding Thunder | rush → blink | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Minato Namikaze (Fourth Hokage — Flashback) | 2 | Rasengan | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Minato Namikaze (Fourth Hokage — Flashback) | 4 | Reaper Death Seal | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Naruto Uzumaki (Sage Mode) | 3 | Frog Kumite | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Naruto Uzumaki (Sage Mode) | 2 | Massive Rasengan Barrage | clones | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Naruto Uzumaki (Sage Mode) | 1 | Wind Style: Rasenshuriken | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Naruto Uzumaki (Sage Mode) | 4 | Sage Art: Two Great Ball Rasengan | rush → blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Naruto Uzumaki (Final Valley) | 2 | Uzumaki Barrage | clones | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Naruto Uzumaki (Final Valley) | 1 | One-Tailed Vermilion Rasengan | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Neji Hyūga (Genin) | 1 | Eight Trigrams Sixty-Four Palms | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Neji Hyūga (Genin) | 2 | Eight Trigrams Palms Revolving Heaven | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Neji Hyūga (Jōnin) | 1 | Eight Trigrams Vacuum Palm | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Obito Uchiha (Tobi / Orange Mask) | 4 | Fire Style: Bomb Blast Dance | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Obito Uchiha (Tobi / Orange Mask) | 1 | Kamui Intangibility | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Obito Uchiha (Tobi / Orange Mask) | 2 | Kamui Warp | blink | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Obito Uchiha (Tobi / Orange Mask) | 3 | Wood Style: Cutting Sprigs | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Ōnoki (Third Tsuchikage) | 4 | Rock Clone | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Ōnoki (Third Tsuchikage) | 1 | Particle Style: Atomic Dismantling Jutsu | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Ōnoki (Third Tsuchikage) | 3 | Added-Weight Rock | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Ōnoki (Third Tsuchikage) | 2 | Light-Weight Rock (Flight) | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Orochimaru (Legendary) | 1 | Summoning: Impure World Reincarnation (Edo Tensei) | buff → line → line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Orochimaru (Legendary) | 3 | Five Elements Seal | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Orochimaru (Legendary) | 2 | Sword of Kusanagi | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Orochimaru (Eight-Headed Serpent) | 2 | Kusanagi Sword: Longsword of the Sky | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Orochimaru (Legendary) | 4 | Triple Rashōmon | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Orochimaru (Eight-Headed Serpent) | 3 | Many Hidden Shadow Snake Hands | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Orochimaru (Eight-Headed Serpent) | 1 | Eight Branches Technique | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Pain (Six Paths of Pain) | 3 | Banshō Ten'in | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Pain (Six Paths of Pain) | 2 | Chibaku Tensei (Planetary Devastation) | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Pain (Six Paths of Pain) | 1 | Shinra Tensei (Almighty Push) | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Rōshi (Four-Tails / Son Gokū) | 1 | Lava Release Chakra Mode | buff | ✓ selbst+T1 / – | ✓ selbst+T1 / – | ✓ selbst+T1 / – | ✓ selbst+T2 / – | ✓ |
| Rōshi (Four-Tails / Son Gokū) | 2 | Scorching Stream Rock | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sai (Root / Super Beast Imitating Drawing) | 1 | Ninja Art: Super Beast Imitating Drawing (Lions) | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sai (Root / Super Beast Imitating Drawing) | 2 | Sealing Technique: Tiger Vision Staring Bullet | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sakura Haruno (Chūnin) | 1 | Cherry Blossom Impact | rush → blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasori (Hundred Puppets) | 3 | Flamethrower Jet | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasori (Hundred Puppets) | 1 | Red Secret Technique: Performance of a Hundred Puppets | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasori (Hundred Puppets) | 2 | Third Kazekage: Iron Sand World Method | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasuke Uchiha (Mangekyō Sharingan — Kage Summit) | 4 | Amaterasu | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasuke Uchiha (Mangekyō Sharingan — Kage Summit) | 2 | Inferno Style: Flame Control | guard → shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasuke Uchiha (Final Valley) | 3 | Fire Style: Phoenix Flower Jutsu | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasuke Uchiha (Mangekyō Sharingan — Kage Summit) | 3 | Kirin | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasuke Uchiha (Final Valley) | 1 | Cursed Seal Stage 2: Onyx Chidori | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasuke Uchiha (Final Valley) | 2 | Lion's Barrage | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Sasuke Uchiha (Mangekyō Sharingan — Kage Summit) | 1 | Susanoo Arrow | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Shikamaru Nara (Genin) | 1 | Shadow Possession Jutsu | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Shikamaru Nara (Jōnin) | 1 | Shadow Stitching Jutsu | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Shino Aburame (Genin) | 1 | Parasitic Destruction Insect Swarm | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Shino Aburame (Destruction Insects) | 1 | Secret Technique: Insect Sphere | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Shisui Uchiha (Body Flicker — Flashback) | 2 | Body Flicker Afterimage Clones | clones | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Shisui Uchiha (Body Flicker — Flashback) | 3 | Fire Style: Great Fireball | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Shisui Uchiha (Body Flicker — Flashback) | 1 | Kotoamatsukami | state | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Shizune (Medical Jōnin) | 1 | Ninja Art: Poison Fog | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Suigetsu Hōzuki (Hydrification) | 2 | Executioner's Blade: Great Cleave | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Suigetsu Hōzuki (Hydrification) | 1 | Hydrification Water Gun | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Temari (Wind Scythe / Jōnin) | 1 | Wind Style: Great Cast Net | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Temari (Genin) | 2 | Wind Scythe Jutsu | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Tenten (Scroll Summoning — Chūnin) | 1 | Manipulated Tools: Heavenly Chain of Destruction | bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Tenten (Genin) | 1 | Rising Twin Dragons | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Tobirama Senju (Second Hokage — Konoha Crush) | 3 | Infinite Darkness (Manga/Anime) | state | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Tobirama Senju (Second Hokage — Konoha Crush) | 4 | Sword of the Thunder God | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Tobirama Senju (Second Hokage — Konoha Crush) | 1 | Water Style: Water Dragon Jutsu | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Tobirama Senju (Second Hokage — Konoha Crush) | 2 | Water Shockwave | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Tsunade (Fifth Hokage) | 2 | Strength of a Hundred Technique | buff | ✓ selbst / – | ✓ selbst / – | ✓ selbst / – | ✓ selbst / – | ✓ |
| Tsunade (Fifth Hokage) | 3 | Nervous System Rupture | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Tsunade (Fifth Hokage) | 1 | Creation Rebirth | heal | ✓  / – | ✓  / – | ✓  / – | ✓  / – | ✓ |
| Tsunade (Fifth Hokage) | 2 | Heaven Kick of Pain | rush | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Utakata (Six-Tails / Saiken) | 2 | Corrosive Alkali Mist | zone | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Utakata (Six-Tails / Saiken) | 1 | Soap Bubble Explosion | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Yamato (Wood Style) | 2 | Wood Locking Wall | guard | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Yamato (Wood Style) | 1 | Wood Style: Four-Pillar Prison | blast | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Yugito Nii (Two-Tails / Matatabi) | 1 | Mouse Hairball (Blue Fire) | shot | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Yugito Nii (Two-Tails / Matatabi) | 2 | Full Matatabi Transformation | buff → line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Zabuza Momochi (Demon of the Hidden Mist) | 1 | Hidden Mist Jutsu | zone → blink | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Zabuza Momochi (Demon of the Hidden Mist) | 2 | Water Prison Jutsu | rush → bind | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |
| Zabuza Momochi (Demon of the Hidden Mist) | 3 | Water Style: Water Dragon Jutsu | line | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T1 / ✓ | ✓ T2 / ✓ | ✓ |

Offene Fälle (Figur | Move | Richtung | beobachteter Fehler):
- keine

**Bildtests noch offen:** Pixel BAS zeigt im Spielmodus kein 3D-Bild, die Karte bleibt schwarz. Die Konsole meldet dazu „experience doesn't have access permission to use asset id …“, also fehlende Asset-Freigaben. vfx test erlaubt kein EditableImage (Game Settings > Security), deshalb zeigt es nur die Server-Logik und die DEBUG-Ansicht. Geprüft sind die gebackenen Blätter (`records/summon/<figur>_sheet.png`).
<!-- ARENA:END -->

Weitere Prüfungen:

- **Andere Live-Moves:** Sasuke (Mangekyō, Kage Summit) Slot 1 „Susanoo Arrow“ läuft in Pixel BAS über denselben Slot-Pfad (Bild geprüft).
- **Kunai-Werfer:** Der Werfer aus dem alten Test bleibt aktiv.
