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

Weitere Prüfungen:

- **Andere Live-Moves:** Sasuke (Mangekyō, Kage Summit) Slot 1 „Susanoo Arrow“ läuft in Pixel BAS über denselben Slot-Pfad (Bild geprüft).
- **Kunai-Werfer:** Der Werfer aus dem alten Test bleibt aktiv.
