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
| H3 | zwei Verbündete | unten | 0,-30 | A1 +36, A3 +36 | bestanden | Server bestanden |
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
| S3 | Treffer | unten | 30,-28 | Spritzer T1, Rückstoß nach unten (30,5) | bestanden | Server bestanden |
| S4 | weicht aus | unten | 30,-28 | Fehlschlag | bestanden | Server bestanden |
| S5 | Treffer | oben | 52,30 | Spritzer T2, Rückstoß nach oben (52,2) | bestanden | Server bestanden |
| S6 | weicht aus | oben | 52,30 | Fehlschlag | bestanden | Server bestanden |
| S7 | Ziel läuft beim Aufrichten | rechts | 0,0 | Sie folgt; Landepunkt = Ort beim Ausspucken (30,11); Treffer | bestanden | – |
| S8 | Ziel beim Aufrichten entfernt | rechts | 0,0 | Spuckt auf den letzten Ort; Fehlschlag | bestanden | – |
| S9 | kein Ziel im Kegel | links | 0,0 | Spuckt 32 Studs weit; Fehlschlag | bestanden | – |
| S10 | Abbruch im Flug | rechts | 0,0 | Kein Spritzer, keine Pfütze, Rauch | bestanden | – |
| S11 | Ziel läuft in die Pfütze | rechts | 0,0 | T2 nach 0,8 s in die Pfütze gesetzt: −10 (Pfütze), T1 Spritzer | bestanden | – |

Gefundener und behobener Fehler: Ein Ziel genau im Zentrum eines Spritzers oder einer Landung wurde immer nach rechts gestoßen. Jetzt geht der Rückstoß entlang der Wurfrichtung.

Nicht im Bild geprüft: Katsuyu in der Vorder- und Rückansicht im Spiel. Bei diesem Durchgang blieb Pixel BAS im Spielmodus schwarz, nur die GUI war sichtbar, auch ganz ohne Wurf. Die Edit-Ansicht war normal. Das ist nachzuholen. Die Server-Fälle sind vollständig.

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
| A1 | Treffer | rechts | 0,0 | Spitze trägt T1 bis 31,4, Abwurf bis 35,4 | bestanden | Server bestanden |
| A2 | weicht beim Ausstoßen aus | rechts | 0,0 | Fehlschlag | bestanden | – |
| A3 | Treffer | unten | 30,-24 | T1 nach unten getragen (30,11.4) | bestanden | – |
| A4 | weicht aus | unten | 30,-24 | Fehlschlag | bestanden | Server bestanden |
| A5 | Treffer | oben | 52,30 | T2 nach oben getragen (52,-5.4) | bestanden | Server bestanden |
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
| K1 | Treffer | rechts | 0,0 | T1 gefangen | bestanden | Server bestanden |
| K2 | weicht aus | rechts | 0,0 | leerer Käfig, Fehlschlag | bestanden | – |
| K3 | Treffer | unten | 30,-24 | T1 gefangen | bestanden | Server bestanden |
| K4 | weicht aus | unten | 30,-24 | Fehlschlag | bestanden | – |
| K5 | Treffer | oben | 52,30 | T2 gefangen | bestanden | – |
| K6 | weicht aus | oben | 52,30 | Fehlschlag | bestanden | Server bestanden |
| K7 | Ziel läuft | rechts | 0,0 | Käfig bei 30,11 (dem verfolgten Ort); T1 bleibt im Käfig (bei 30,8.4 an der Wand) | bestanden | – |
| K8 | Ziel beim Ausholen entfernt | rechts | 0,0 | leerer Käfig am letzten Ort | bestanden | – |
| K9 | Abbruch im Käfig | rechts | 0,0 | T1 sofort frei | bestanden | – |

Nicht im Bild geprüft: Enma, der Stab und der Käfig im Spiel. Pixel BAS rendert in dieser Sitzung im Spielmodus keine 3D-Ansicht. Sogar ein neonroter Würfel und ein AlwaysOnTop-Billboard direkt vor der Kamera blieben unsichtbar; nur die Bildschirm-GUI erscheint. Geprüft sind nur die Bake-Blätter (`records/summon/enma_sheet.png`, `enma_turnaround.png`).

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
| D1 | Treffer | rechts | 0,0 | T1 geschnitten, zur Seite geschleudert (34.2,5.6); Höchstgeschwindigkeit 121 | bestanden | Server bestanden |
| D2 | weicht beim Loslaufen aus | rechts | 0,0 | Fehlschlag | bestanden | – |
| D3 | Treffer | unten | 30,-28 | T1 geschnitten | bestanden | – |
| D4 | weicht aus | unten | 30,-28 | Fehlschlag | bestanden | Server bestanden |
| D5 | Treffer | oben | 52,30 | T2 geschnitten | bestanden | Server bestanden |
| D6 | weicht aus | oben | 52,30 | Fehlschlag | bestanden | – |
| D7 | Ziel läuft beim Ausholen | rechts | 0,0 | Bahn schräg (0.94, 0.35) auf T1 bei 30,10.2; Treffer | bestanden | – |
| D8 | Ziel beim Ausholen entfernt | rechts | 0,0 | Lauf zum letzten Ort; Fehlschlag | bestanden | – |
| D9 | kein Ziel im Kegel | links | 0,0 | Fehlschlag | bestanden | – |
| D10 | zwei Ziele auf der Bahn | oben | 30,40 | T3 und T1 geschnitten | bestanden | – |
| D11 | Abbruch im Lauf | rechts | 0,0 | Rauch; nach 1,2 / 2,4 / 3,6 s 1 / 0 / 1 neue Teile (nur das Kunai des Werfers) | bestanden | – |

Nicht im Bild geprüft: Pixel BAS rendert im Spielmodus weiterhin keine 3D-Ansicht. Geprüft sind die Bake-Blätter (`records/summon/kamatari_sheet.png`, `kamatari_turnaround.png`).

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

Weitere Prüfungen:

- **Andere Live-Moves:** Sasuke (Mangekyō, Kage Summit) Slot 1 „Susanoo Arrow“ läuft in Pixel BAS über denselben Slot-Pfad (Bild geprüft).
- **Kunai-Werfer:** Der Werfer aus dem alten Test bleibt aktiv.
