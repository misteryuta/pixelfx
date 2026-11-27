// Slot mapping for the roster file `naruto_classic_and_shippuden_complete_roster.md` (2026-11-25).
// Key = era + the exact character cell of the roster table (era + full variant = identity; a name alone would mix up
// Sasuke's three versions). One entry per move column, in table order:
//   [clip, kind, status, note?, params?]
// clip   : baked pixelfx move (records/roblox4/manifest.json) that shows this technique, or null
// kind   : gameplay state the server applies (see KINDS in build.mjs)
// status : "ok"      clip shows this technique by this variant (counts as implemented)
//          "actor"   the technique is right, but the clip is baked with another/generic actor or the wrong eye;
//                    needs an actor pass (rebake) before it counts
//          "partial" a related clip (same family), not the listed technique; needs its own move
//          "new"     no clip yet
// note   : lore check (source, conflicts with the timeline, translation, anime/game-only details)
export const SLOTS = {
  // ───────────────────────────── CLASSIC ─────────────────────────────
  "classic|Orochimaru (Legendary)": { desc: "Sannin, Konoha Crush.", moves: [
    [null, "summon", "new", "Edo Tensei: im Konoha Crush ruft er die Ersten beiden Hokage."],
    ["orochimaru-kusanagi", "projectile", "ok", "Klinge aus dem Schlangenmaul."],
    [null, "seal", "new", "Gogyō Fūin auf Narutos Siegel, Wald des Todes."],
    [null, "defense", "new", "Rashōmon gegen Hiruzens Enma. Zeitkonflikt: das dreifache Rashōmon ist erst in Shippūden belegt (Manga 295); hier als Kuchiyose: Rashōmon gezeigt."],
  ] },
  "classic|Jiraiya (Legendary Sannin)": { desc: "Sannin, Suche nach Tsunade.", moves: [
    [null, "bind", "new", "Gamaguchi Shibari: Magen einer Kröte, gegen Itachi und Kisame."],
    [null, "strike", "new", "Jiraiyas eigenes Rasengan; der vorhandene Clip ist Narutos Version mit Schattendoppelgänger."],
    ["jiraiya-kuchiyose", "aoe", "ok", "Gamayu Endan mit Gamabunta gegen Orochimaru, Tanzaku."],
    ["jiraiya-kebari-senbon", "projectile", "ok", "Hari Jizō/Kebari Senbon, Haarnadeln."],
  ] },
  "classic|Tsunade (Fifth Hokage)": { desc: "Fünfte Hokage, Tanzaku-Kampf.", moves: [
    [null, "heal", "new", "Byakugō no In: Sōzō Saisei, erstmals gegen Orochimaru und Kabuto."],
    ["tsunade-tsuutenkyaku", "strike", "ok", "Tsūtenkyaku, Fersenhieb aus der Höhe."],
    ["tsunade-ranshinshou", "illusion", "ok", "Ranshinshō: vertauschte Nervensignale. Spielzustand: Steuerung vertauscht."],
    [null, "defense", "new", "Kuchiyose: Katsuyu (Tanzaku, Anime 96). Handlung: Katsuyu Daibunretsu, sie zerfällt bei einem Treffer in viele kleine Schnecken und weicht so aus (gegen Manda)."],
  ] },
  "classic|Hiruzen Sarutobi (Third Hokage)": { desc: "Dritter Hokage, Konoha Crush.", moves: [
    ["hiruzen-shiki-fuujin", "seal", "ok", "Shiki Fūjin gegen Orochimaru; versiegelt dessen Arme -> Spielzustand: Jutsu gesperrt."],
    ["hiruzen-enma", "strike", "ok", "Enma als Kongōnyoi (Henge: Kongōnyoi, Manga 120 / Anime 71): Enma erscheint als Affe, springt Hiruzen in die Hände und wird zum Stab, der sich ausfährt; die Spitze trifft und schiebt.", { summon: "hiruzen-enma-staff" }],
    ["fire-karyuu-endan", "projectile", "actor", "Katon: Karyū Endan; Clip mit Standard-Anwender. Hiruzen als Anwender: Anime-Konoha-Crush (zu belegen)."],
    [null, "projectile", "new", "Shuriken Kage Bunshin gegen Orochimaru."],
  ] },
  "classic|Hashirama Senju (First Hokage — Konoha Crush)": { desc: "Edo Tensei, Konoha Crush.", moves: [
    ["hashirama-jukai-kotan", "bind", "actor", "Jukai Kōtan im Barrierekampf. Clip zeigt Hashirama zu Lebzeiten, nicht den Edo-Körper (Risse)."],
    [null, "defense", "new", "Mokujōheki."],
    [null, "illusion", "new", "Kokuangyō: im Konoha Crush nur im Anime; Anwender laut Datei."],
    [null, "strike", "new", "Taijutsu-Kombination (keine benannte Technik, Darstellung als Edo-Taijutsu)."],
  ] },
  "classic|Tobirama Senju (Second Hokage — Konoha Crush)": { desc: "Edo Tensei, Konoha Crush.", moves: [
    ["tobirama-suiryuudan", "projectile", "actor", "Suiryūdan; Clip zeigt Tobirama lebend (kein Edo-Körper)."],
    [null, "aoe", "new", "Suishōha. Im Konoha Crush nicht im Manga belegt (Anime/Spiel)."],
    [null, "illusion", "new", "Datei: 'Infinite Darkness (Manga/Anime)'. Kokuangyō, Anime."],
    [null, "strike", "new", "Raijin no Ken: Anime (Kinkaku-Bogen-Rückblende), nicht im Konoha Crush."],
  ] },
  "classic|Kakashi Hatake (Team 7 Sensei)": { desc: "Team-7-Sensei, Land der Wellen.", moves: [
    ["kakashi-raikiri", "strike", "ok", "Raikiri gegen Haku/Zabuza."],
    [null, "projectile", "new", "Sharingan-Kopie von Zabuzas Suiryūdan, Spiegelduell."],
    [null, "bind", "ok", "Kuchiyose: Doton: Tsuiga no Jutsu (Manga 29 / Anime 17): acht Ninken spüren Zabuza unter der Erde auf, brechen gemeinsam heraus und halten ihn mit den Zähnen. Live-Beschwörung mit eigenem Rig (Seite/Front/Rücken).", { summon: "kakashi-ninken-tsuiga" }],
    [null, "buff", "new", "Kirigakure im Land der Wellen ist Zabuzas Technik; Kakashi als Anwender laut Datei (Sharingan-Kopie)."],
  ] },
  "classic|Might Guy (Jōnin)": { desc: "Jōnin, Team Guy.", moves: [
    [null, "transform", "new", "Zeitkonflikt: das sechste Tor zeigt Guy erst in Shippūden. Darstellung auf die belegte Shippūden-Version begrenzt."],
    ["taijutsu-dynamic-entry", "strike", "partial", "Dynamic Entry. Der vorhandene Clip ist ein generischer Taijutsu-Austausch."],
    [null, "strike", "new", "'Strong Fist Hurricane': Übersetzung uneindeutig (Konoha Gōriki Senpū)."],
  ] },
  "classic|Zabuza Momochi (Demon of the Hidden Mist)": { desc: "Dämon von Kiri, Land der Wellen.", moves: [
    ["zabuza-silent-kill", "illusion", "ok", "Kirigakure no Jutsu mit Muon Satsujin. Spielzustand: Ziel verliert ihn aus dem Blick."],
    ["zabuza-suirou", "bind", "ok", "Suirō no Jutsu gegen Kakashi: Hand bleibt im Wasser."],
    ["water-dragon", "projectile", "actor", "Suiryūdan; Clip mit Standard-Anwender."],
  ] },
  "classic|Kimimaro (Cursed Seal Stage 2)": { desc: "Sound Four-Bogen, Erdsiegel Stufe 2.", moves: [
    ["kimimaro-sawarabi", "aoe", "ok", "Sawarabi no Mai."],
    ["kimimaro-tessenka", "strike", "ok", "Tessenka no Mai: Hana."],
    [null, "strike", "new", "Karamatsu no Mai."],
  ] },
  "classic|Gaara (Chūnin Exams / Shukaku)": { desc: "Chūnin-Prüfung.", moves: [
    ["gaara-sabaku-sousou", "bind", "ok", "Sabaku Kyū + Sabaku Sōsō: ein Move, zwei Phasen."],
    [null, "transform", "new", "Tanuki Neiri: Gaara schläft, Shukaku übernimmt. 'Mini-Shukaku' = Teilverwandlung."],
    ["gaara-suna-no-tate", "defense", "ok", "Suna no Tate (automatisch)."],
  ] },
  "classic|Naruto Uzumaki (Final Valley)": { desc: "Tal des Endes, Ein-Schweif-Mantel.", moves: [
    [null, "strike", "new", "Rasengan im Ein-Schweif-Mantel gegen Sasuke."],
    ["naruto-uzumaki-rendan", "strike", "actor", "Uzumaki Naruto Rendan. Clip zeigt Naruto ohne Kyūbi-Mantel."],
    [null, "summon", "ok", "Kuchiyose: Gamabunta, der mit Gama Dosu Zan angreift (Toad Sword Beheading, Manga 135 / Anime 78): Sprung aufs Ziel, Landung, Schnitt mit der Dosu. Belegt im Konoha Crush, nicht im Tal des Endes.", { summon: "naruto-gamabunta-dosuzan" }],
  ] },
  "classic|Sasuke Uchiha (Final Valley)": { desc: "Tal des Endes, Fluchmal Stufe 2.", moves: [
    [null, "strike", "new", "Schwarzes Chidori im Fluchmal Stufe 2."],
    [null, "strike", "new", "Shishi Rendan."],
    ["fire-phoenix-flower", "projectile", "actor", "Hōsenka no Jutsu; Clip mit Standard-Anwender."],
  ] },
  "classic|Kabuto Yakushi (Chūnin Exams)": { desc: "Spion Orochimarus.", moves: [
    [null, "strike", "new", "Chakra no Mesu."],
    [null, "illusion", "new", "Nehan Shōja no Jutsu, Konoha Crush."],
  ] },
  "classic|Rock Lee (Inner Gates — Chūnin Exams)": { desc: "Chūnin-Prüfung gegen Gaara.", moves: [
    [null, "strike", "new", "Ura Renge, fünftes Tor."],
    ["lee-omote-renge", "strike", "ok", "Omote Renge."],
  ] },
  "classic|Haku (Hunter-nin)": { desc: "Falscher Jagd-Nin, Land der Wellen.", moves: [
    ["haku-makyou-hyoushou", "bind", "ok", "Makyō Hyōshō."],
    ["haku-sensatsu-suishou", "projectile", "ok", "Sensatsu Suishō."],
  ] },
  "classic|Neji Hyūga (Genin)": { desc: "Genin, Chūnin-Prüfung.", moves: [
    ["neji-64-palms", "seal", "ok", "Hakke Rokujūyon Shō: schließt Tenketsu -> Spielzustand: Jutsu gesperrt."],
    ["neji-kaiten", "defense", "ok", "Hakkeshō Kaiten."],
  ] },
  "classic|Kurenai Yūhi (Jōnin)": { desc: "Jōnin, Genjutsu-Spezialistin.", moves: [
    ["kurenai-jubaku-satsu", "illusion", "ok", "Magen: Jubaku Satsu gegen Itachi."],
    [null, "illusion", "new", "'Genjutsu Petal Escape': kein eindeutiger Manga-Beleg; Darstellung als Genjutsu-Ausweichen."],
  ] },
  "classic|Temari (Genin)": { desc: "Genin aus Suna.", moves: [
    ["temari-kamatari", "aoe", "ok", "Kuchiyose: Kirikiri Mai (Manga 214 / Anime 125, gegen Tayuya): Kamatari reitet den Wirbelwind des Fächers, wird auf seiner Bahn immer schneller und schneidet alles darin.", { summon: "temari-kamatari-dance" }],
    ["temari-kamaitachi", "projectile", "ok", "Fūton: Kamaitachi."],
  ] },
  "classic|Shikamaru Nara (Genin)": { desc: "Genin, Chūnin-Prüfung.", moves: [
    ["shikamaru-kagemane", "bind", "ok", "Kagemane no Jutsu: Verbindung über den Boden, gekoppelte Bewegung."],
  ] },
  "classic|Kankurō (Genin)": { desc: "Genin aus Suna, Puppenspieler.", moves: [
    ["kankuro-kuroari", "bind", "ok", "Kuroari + Karasu."],
  ] },
  "classic|Shino Aburame (Genin)": { desc: "Genin, Aburame.", moves: [
    ["shino-kikaichuu", "drain", "ok", "Kikaichū frisst Chakra."],
  ] },
  "classic|Kiba Inuzuka (Genin)": { desc: "Genin mit Akamaru.", moves: [
    ["kiba-gatsuuga", "strike", "ok", "Gatsūga mit Akamaru."],
  ] },
  "classic|Hinata Hyūga (Genin)": { desc: "Genin, Chūnin-Prüfung.", moves: [
    [null, "seal", "new", "Jūken auf die Tenketsu, gegen Neji."],
  ] },
  "classic|Tenten (Genin)": { desc: "Genin, Waffenspezialistin.", moves: [
    ["tenten-soushouryuu", "projectile", "ok", "Sōshōryū gegen Temari."],
  ] },
  "classic|Iruka Umino (Academy Instructor)": { desc: "Akademie-Lehrer.", moves: [
    [null, "aoe", "new", "Kibakufuda-Falle (Anime-Füller)."],
  ] },

  // ───────────────────────────── SHIPPŪDEN ─────────────────────────────
  "shippuden|Madara Uchiha (Uchiha Clan Leader — Flashback)": { desc: "Rückblende: Clanführer im Kampf gegen Hashirama.", moves: [
    [null, "aoe", "ok", "LIVE statt Cutscene (2026-11-25): eigenes blaues Complete-Body-Susanoo-Rig (Tengu-Nase, seitlich gebundenes Haar, Flügel, Rüstung, Katana mit Scheide). Hand greift am Scheidenmund, kurzes Innehalten, die Spitze verlässt die Scheide mit Lichtsaum, Seitenhieb durch den anvisierten Raum, Bodenwelle ab Kontakt, Staub verzögert; Ausweichen möglich. Madara mit Ewigem Mangekyō (Rückblende), nicht Rinnegan. Die alte 19,5-s-Cutscene ist aus dem Spiel genommen (Dateien bleiben in blender/).", { live: "madara-perfect-susanoo" }],
    ["madara-gouka-mekkyaku", "aoe", "ok", "Gōka Mekkyaku."],
    [null, "summon", "ok", "Kurama unter Kontrolle des Sharingan, Tal des Endes (Rückblende; Manga 399, 620, 621, 626). Kurama feuert einen Bijūdama wie gegen Hashiramas Holzdrachen (Manga 620 S. 14); ohne Susanoo-Rüstung, weil Slot 1 schon Perfect Susanoo ist.", { summon: "madara-kurama-bijuudama" }],
    [null, "defense", "new", "Uchiha Gaeshi mit dem Gunbai."],
  ] },
  "shippuden|Pain (Six Paths of Pain)": { desc: "Sechs Pfade, Angriff auf Konoha.", moves: [
    ["pain-shinra-tensei", "aoe", "ok", "Shinra Tensei."],
    ["pain-chibaku-tensei", "bind", "ok", "Chibaku Tensei gegen Naruto."],
    ["pain-banshou-tenin", "strike", "ok", "Banshō Ten'in."],
    ["nagato-gedo-mazo", "summon", "ok", "Kuchiyose: Gedō Mazō (Manga 447 / Anime Shippūden 173; über die Sechs Pfade beschwörbar, Manga 254): die Statue steigt hinter Pain auf, die schwarzen Empfänger stecken in seinem Rücken (ihr Preis), aus dem Maul fährt ein Chakra-Drache und entzieht dem Ziel das Chakra. Live-Beschwörung statt des Clips (der mit Nagato gebacken ist).", { summon: "pain-gedo-dragon" }],
  ] },
  "shippuden|Minato Namikaze (Fourth Hokage — Flashback)": { desc: "Rückblende: Nacht des Kyūbi-Angriffs.", moves: [
    ["minato-hiraishin", "teleport", "partial", "Hiraishin Level 2 ist eine eigene Stufe (Ziel per Berührung markiert); der Clip zeigt Kunai + Rasengan."],
    [null, "strike", "new", "Minatos Rasengan allein."],
    ["minato-hiraishin-rasengan", "teleport", "ok", "Kunai, Sprung zum Zeichen, Rasengan in den Rücken (gegen Tobi)."],
    ["hiruzen-shiki-fuujin", "seal", "actor", "Shiki Fūjin; Clip mit Hiruzen als Anwender."],
  ] },
  "shippuden|Itachi Uchiha (Mangekyō Sharingan)": { desc: "Akatsuki, Kampf gegen Sasuke.", moves: [
    ["itachi-tsukuyomi", "illusion", "ok", "Narutopedia: Blickkontakt, mit beiden Augen möglich; Zeitwahrnehmung unter seiner Kontrolle; normales Lösen wirkt nicht (im Spiel kein Kai). Mit Itachis eigener Figur.", { noKai: true }],
    ["itachi-amaterasu", "aoe", "ok", "Narutopedia: Amaterasu aus Itachis rechtem Auge, Flamme am Blickpunkt, er kann sie löschen. Mit Itachis eigener Figur, Effekte am echten Auge."],
    ["itachi-totsuka", "seal", "ok", "Narutopedia (Kap. 392/393): Klinge aus der Flüssigkeit des Sake-Krugs, Krug in einer zweiten Hand am rechten Unterarm, Getroffener wird in den Krug versiegelt. Itachi in seinem Susanoo (Modell 1,5-fach)."],
    [null, "defense", "ok", "Narutopedia (Yata Mirror, Debüt Kap. 392): Schild in der linken Susanoo-Hand, wechselt seine Natur und hebt jeden Angriff auf. Farben der Gegen-Natur (Wasser gegen Feuer, Wind gegen Blitz) sind eine Spiel-Darstellung. LIVE (2026-11-25): eigenes rotes Susanoo-Rig; die Reaktion entsteht an der Spiegelfläche, wenn der echte Angriff des Gegners geblockt wird.", { live: "itachi-yata-mirror" }],
  ] },
  "shippuden|Obito Uchiha (Tobi / Orange Mask)": { desc: "Tobi mit oranger Maske.", moves: [
    ["obito-kamui-surinuke", "intangible", "ok", "Kamui-Durchdringung."],
    ["obito-kamui-warp", "teleport", "ok", "Körper wird in die Augenöffnung der Maske gesogen, Austritt hinter dem Ziel. Eigener Ablauf, getrennt von der Durchdringung."],
    [null, "bind", "new", "Zeitkonflikt: Mokuton von Tobi erst gegen Konan und im Krieg."],
    [null, "aoe", "new", "'Fire Style: Bomb Blast Dance' ist nicht eindeutig belegt."],
  ] },
  "shippuden|Naruto Uzumaki (Sage Mode)": { desc: "Sennin-Modus, Kampf gegen Pain.", moves: [
    ["naruto-rasenshuriken", "projectile", "ok", "Senpō: Fūton Rasenshuriken."],
    ["naruto-oodama-rasengan", "strike", "partial", "Clip zeigt ein einzelnes Ōdama Rasengan, kein Rendan."],
    ["naruto-frog-kata", "strike", "ok", "Kawazu Kumite."],
    [null, "strike", "new", "Zwei Ōdama-Rasengan mit Doppelgängern."],
  ] },
  "shippuden|Killer B (Eight-Tails / Full Gyūki)": { desc: "Jinchūriki des Achtschwänzigen.", moves: [
    [null, "aoe", "new", "Bijūdama von Gyūki gegen Taka."],
    ["killerbee-lariat", "strike", "ok", "Raiton: Lariat im Bijū-Mantel."],
    ["killerbee-nanatou", "strike", "ok", "Nanatō."],
    [null, "teleport", "new", "Tintenkrake als Ersatzkörper."],
  ] },
  "shippuden|Sasuke Uchiha (Mangekyō Sharingan — Kage Summit)": { desc: "Mangekyō, Kage-Gipfel.", moves: [
    [null, "projectile", "ok", "LIVE (2026-11-25): eigenes lila Susanoo-Rig der Gipfel-Stufe (Hörner, Zahnkranz an der Kapuze, Kinnfortsatz). Narutopedia: Bogen am linken Handgelenk, Pfeil aus einer Kugel in der rechten Hand. Anlegen, Spannen, Zielen, Lösen mit eigenen Posen; der Pfeil fliegt als Projektil weiter, ein Schild stoppt ihn. Mangekyō (Kap. 480), nicht Ewiges.", { live: "sasuke-susanoo-arrow-summit" }],
    ["sasuke-enton-kagutsuchi-summit", "barrier", "ok", "Narutopedia: Blaze Release: Kagutsuchi (Anime-Englisch: Inferno Style: Flame Control), Debüt Manga Kap. 464 / Anime Folge 203. Amaterasu links, Formung rechts; Rippen-Susanoo mit Flammen (Kap. 463), Stachelbarriere vor sich, die schützt und durchbohrt (Kap. 464)."],
    ["sasuke-kirin", "aoe", "ok", "Kirin gegen Itachi."],
    [null, "aoe", "new", "Amaterasu aus Sasukes linkem Auge (Narutopedia, Kagutsuchi-Seite)."],
  ] },
  "shippuden|Ōnoki (Third Tsuchikage)": { desc: "Dritter Tsuchikage, Kage-Gipfel.", moves: [
    ["onoki-jinton", "aoe", "ok", "Jinton."],
    [null, "buff", "new", "Keijūgan: Ōnoki schwebt."],
    [null, "strike", "new", "Kajūgan; vorhandener Clip onoki-kajuugan zeigt die Kriegsform 'Chō Kajūgan'."],
    [null, "defense", "new", "Iwa Bunshin."],
  ] },
  "shippuden|A (Fourth Raikage — Lightning Mode)": { desc: "Vierter Raikage, Kage-Gipfel.", moves: [
    ["raikage-liger-bomb", "strike", "ok", "Liger Bomb."],
    ["raikage-guillotine", "strike", "ok", "Giro Chin Doroppu gegen Sasuke."],
    [null, "strike", "new", "Raiton: gerader Schlag."],
    [null, "teleport", "new", "Shunshin mit Raiton-Panzer."],
  ] },
  "shippuden|Might Guy (Seventh Gate — Kisame Fight)": { desc: "Kampf gegen Kisame.", moves: [
    ["guy-hirudora", "projectile", "ok", "Zeitkonflikt: der Kisame-Kampf liegt nach dem Gipfel, vor dem Krieg. Slot bleibt laut Datei."],
    ["guy-asa-kujaku", "strike", "ok", "Asa Kujaku, sechstes Tor."],
    [null, "strike", "new", "Doppelung: das Öffnen eines Tores (Classic: sechstes Tor) ist derselbe Spielzustand; das siebte Tor bleibt sichtbarer Zustand der Variante (Hirudora öffnet es). Ersatz: Dynamic Action, Salto auf das Ziel und Schlag-Tritt-Serie, gegen Kisames Doppelgänger (Shippūden Folge 13).", { replace: { name: "Dynamic Action", src: "Narutopedia: Dynamic Action, Anime Shippūden 13" } }],
    [null, "strike", "new", "Doppelung: Konoha Senpū ist dieselbe Drehtritt-Familie wie Classic 'Strong Fist Hurricane' (Konoha Gōriki Senpū). Ersatz: Konoha Saiha Shōfū, Ellbogenstoß mit Stützarm, zerbricht im Kisame-Kampf Yaguras Korallen.", { replace: { name: "Leaf Rock-Destroying Rise", src: "Narutopedia: Leaf Rock-Destroying Rise, Manga 505 / Anime Shippūden 250" } }],
  ] },
  "shippuden|Jiraiya (Sage Mode)": { desc: "Sennin-Modus gegen Pain.", moves: [
    ["jiraiya-goemon", "aoe", "ok", "Senpō: Goemon; 'Bath of Boiling Oil' als Übersetzung gleichgesetzt."],
    [null, "strike", "new", "Sennin-Ōdama Rasengan."],
    ["jiraiya-ult-gamarinshou", "illusion", "ok", "Magen: Gamarinshō (Demonic Illusion: Toad Confrontation Chant, Manga 379 / Anime Shippūden 132): Fukasaku und Shima auf Jiraiyas Schultern suchen die Harmonie (die Reichweite zeigt sich), dann fängt der Gesang jeden darin; vier Krötensamurai halten das Opfer in einem Wasserwürfel.", { summon: "jiraiya-frog-song" }],
    [null, "bind", "ok", "Doppelung: Gamaguchi Shibari hat Jiraiya schon in Classic. Ersatz: Kekkai: Gama Hyōtan Rō, eine kleine Kürbiskröte zieht das Ziel mit der Zunge zu sich und schließt es ein (gegen Pain).", { replace: { name: "Barrier: Toad Gourd Prison", src: "Narutopedia: Barrier: Toad Gourd Prison, Manga 381 / Anime Shippūden 133" }, summon: "jiraiya-gourd-prison" }],
  ] },
  "shippuden|Hiruzen Sarutobi (Prime — Flashback)": { desc: "Rückblende: Hiruzen in seiner besten Zeit.", moves: [
    [null, "bind", "ok", "Doppelung: Enma als Kongōnyoi (Stab) hat Hiruzen schon in Classic. Ersatz mit demselben Tier, anderer Handlung: Kongō Rōheki, Enma klont sich als Stab zu einem Gitterkäfig um das Ziel. Belegt im Konoha Crush (Manga 122); die Rückblende liegt davor.", { replace: { name: "Monkey King Enma: Adamantine Prison Wall", src: "Narutopedia: Adamantine Prison Wall, Manga 122 / Anime 72" }, summon: "hiruzen-enma-prison" }],
    [null, "aoe", "new", "'Five-Element Combo Blast': Spiel-/Animetechnik, nicht im Manga."],
    [null, "defense", "new", "Doppelung: Shuriken Kage Bunshin hat Hiruzen schon in Classic. Ersatz: Doton: Doryūheki, Erdwall aus dem Mund (Konoha Crush, Manga 120).", { replace: { name: "Earth Release: Earth-Style Wall", src: "Narutopedia: Earth Release: Earth-Style Wall, Manga 120 / Anime 71" } }],
  ] },
  "shippuden|Kisame Hoshigaki (Samehada Fusion)": { desc: "Mit Samehada verschmolzen.", moves: [
    ["kisame-shark-dance", "bind", "ok", "Suirō Samehada."],
    ["kisame-daikoudan", "projectile", "ok", "Suiton: Daikōdan."],
    [null, "projectile", "new", "Goshokuzame."],
  ] },
  "shippuden|Tsunade (Fifth Hokage)": { desc: "Fünfte Hokage, Kage-Gipfel.", moves: [
    [null, "heal", "ok", "Doppelung: Sōzō Saisei hat Tsunade schon in Classic. Ersatz: Katsuyu: Mōryōjika, Katsuyu teilt sich und je ein Teilkörper legt sich auf einen Verbündeten und heilt ihn (Pains Angriff auf Konoha).", { replace: { name: "Katsuyu: Immense Network Healing", src: "Narutopedia: Katsuyu: Immense Network Healing, Manga 424 / Anime Shippūden 159" }, summon: "tsunade-katsuyu-network" }],
    [null, "transform", "new", "Doppelung: Tsūtenkyaku hat Tsunade schon in Classic (Heavenly Spear Foot wäre derselbe Sturz-Tritt). Ersatz: Byakugō no Jutsu, die Zeichen breiten sich über den Körper, Dauer-Regeneration während des Kampfes (gegen Madara).", { replace: { name: "Strength of a Hundred Technique", src: "Narutopedia: Ninja Art Creation Rebirth — Strength of a Hundred Technique, Manga 577 / Anime Shippūden 333" } }],
    [null, "aoe", "ok", "Katsuyus Säure: Tongue Tooth Sticky Acid (Zesshi Nensan, Manga 170 / Anime 96, gegen Manda). Kein Doppel: Classic-Katsuyu ist die Teilung als Abwehr (Katsuyu Daibunretsu).", { summon: "tsunade-katsuyu-acid" }],
  ] },
  "shippuden|Orochimaru (Eight-Headed Serpent)": { desc: "Yamata no Jutsu gegen Sasuke.", moves: [
    ["orochimaru-yamata", "aoe", "ok", "Yamata no Jutsu."],
    ["orochimaru-kusanagi", "projectile", "partial", "Kein Doppel: Kū no Tachi (Manga 123) ist der aus dem Mund schnellende Langstoß; Classic 'Sword of Kusanagi' wird geführt. Braucht eigenen Clip, solange beide Slots denselben zeigen."],
    [null, "bind", "new", "Doppelung: Sanjū Rashōmon steht schon in Classic. Ersatz: Sen'ei Tajashu, viele Schlangen aus den Ärmeln binden das Ziel (Tenchi-Brücke).", { replace: { name: "Many Hidden Shadow Snake Hands", src: "Narutopedia: Many Hidden Shadow Snake Hands, Manga 290 / Anime Shippūden 39" } }],
  ] },
  "shippuden|Gaara (Fifth Kazekage)": { desc: "Fünfter Kazekage.", moves: [
    [null, "aoe", "new", "Ryūsa Bakuryū."],
    ["gaara-sabaku-taisou", "seal", "ok", "Sabaku Taisō: begraben und verdichtet."],
    ["gaara-suna-no-tate", "defense", "partial", "Kein Doppel: Zettai Bōgyo: Shukaku no Tate ist der große Schild für ein Gebiet, Classic Suna no Tate der automatische Eigenschutz. Braucht eigenen Clip."],
  ] },
  "shippuden|Shisui Uchiha (Body Flicker — Flashback)": { desc: "Rückblende.", moves: [
    ["shisui-kotoamatsukami", "illusion", "ok", "Kotoamatsukami. Spielzustand: Ziel greift nicht an."],
    ["shisui-shunshin", "strike", "ok", "Shunshin no Shisui."],
    ["fire-great-fireball", "projectile", "actor", "Gōkakyū; Clip mit Standard-Anwender."],
  ] },
  "shippuden|Kakashi Hatake (Mangekyō Sharingan)": { desc: "Mangekyō, Kampf gegen Pain.", moves: [
    ["kakashi-kamui", "aoe", "ok", "Kamui-Fernangriff."],
    [null, "bind", "new", "Doppelung: Raikiri hat Kakashi schon in Classic. Ersatz: Raiton Kage Bunshin, ein Blitz-Doppelgänger lähmt das Ziel bei Berührung (gegen Pain).", { replace: { name: "Lightning Release: Shadow Clone", src: "Narutopedia: Lightning Release: Shadow Clone Technique, Manga 422 / Anime Shippūden 159" } }],
    ["kakashi-raijuu-tsuiga", "projectile", "ok", "Raijū Tsuiga am Kage-Gipfel."],
  ] },
  "shippuden|Mei Terumī (Fifth Mizukage)": { desc: "Fünfte Mizukage, Kage-Gipfel.", moves: [
    ["mei-futton", "aoe", "ok", "Futton: Kōmu no Jutsu."],
    ["mei-yoton", "aoe", "ok", "Yōton: Yōkai no Jutsu."],
    ["water-dragon", "projectile", "actor", "Suiryūdan gegen Sasuke; Clip mit Standard-Anwender."],
  ] },
  "shippuden|Konan (Paper Person of God)": { desc: "Akatsuki, Engel von Amegakure.", moves: [
    ["konan-kami-no-shisha", "aoe", "ok", "Zeitkonflikt: 600 Milliarden Kibakufuda gegen Tobi nach dem Gipfel."],
    ["konan-shikigami", "bind", "ok", "Shikigami no Mai."],
    [null, "projectile", "new", "Papier-Chakram."],
  ] },
  "shippuden|Deidara (C4 Karura)": { desc: "Akatsuki, Kampf gegen Sasuke.", moves: [
    ["deidara-c4", "aoe", "ok", "C4 Karura."],
    [null, "aoe", "new", "C3."],
    ["deidara-c2-dragon", "projectile", "ok", "C2 Dragon."],
  ] },
  "shippuden|Sasori (Hundred Puppets)": { desc: "Akatsuki, Kampf gegen Sakura und Chiyo.", moves: [
    ["sasori-hyakki", "aoe", "ok", "Akahigi: Hyakki no Sōen."],
    ["sasori-satetsu", "projectile", "partial", "Clip zeigt Satetsu Shigure; 'World Method' ist Satetsu Kaihō."],
    [null, "projectile", "new", "Flammenwerfer aus Sasoris Körper."],
  ] },
  "shippuden|Kakuzu (Earth Grudge Fear)": { desc: "Akatsuki, Kampf gegen Team 10 und Kakashi.", moves: [
    [null, "defense", "new", "Doton: Domu."],
    ["kakuzu-zukokku", "aoe", "ok", "Fūton Atsugai mit Katon Zukokku."],
    [null, "projectile", "new", "Raiton: Gian."],
  ] },
  "shippuden|Fū (Seven-Tails / Chōmei)": { desc: "Jinchūriki des Siebenschwänzigen.", moves: [
    [null, "illusion", "new", "Rinpun Kakuremino. Fūs Kämpfe sind Anime-/Spielinhalt."],
    [null, "strike", "new", "Insektenbiss (Anime/Spiel)."],
    [null, "transform", "new", "Volle Verwandlung in Chōmei (Anime/Spiel)."],
  ] },
  "shippuden|Danzō Shimura (Izanagi / Sharingan Arm)": { desc: "Kage-Gipfel, Kampf gegen Sasuke.", moves: [
    [null, "intangible", "new", "Izanagi."],
    [null, "aoe", "new", "Fūton: Shinkū Taigyoku."],
    [null, "bind", "ok", "Kuchiyose: Baku (Manga 479, Kage-Gipfel, gegen Sasukes Susanoo): der Baku stemmt sich in den Boden und saugt mit offenem Maul alles im Kegel an, während er durch den Rüssel ausbläst.", { summon: "danzo-baku-suction" }],
  ] },
  "shippuden|Darui (Kage Summit Bodyguard)": { desc: "Leibwächter des Raikage beim Kage-Gipfel.", moves: [
    ["darui-laser-circus", "projectile", "ok", "Zeitkonflikt: Laser Circus ist im Krieg gegen Kinkaku belegt."],
    [null, "defense", "new", "Suiton: Mizu no Kabe."],
  ] },
  "shippuden|Yugito Nii (Two-Tails / Matatabi)": { desc: "Jinchūriki des Zweischwänzigen.", moves: [
    [null, "projectile", "new", "Blaues Feuer der Nekomata (Anime)."],
    [null, "transform", "new", "Volle Verwandlung in Matatabi."],
  ] },
  "shippuden|Rōshi (Four-Tails / Son Gokū)": { desc: "Jinchūriki des Vierschwänzigen.", moves: [
    [null, "transform", "new", "Yōton-Chakra-Modus."],
    [null, "projectile", "new", "Yōton-Gestein."],
  ] },
  "shippuden|Han (Five-Tails / Kokuō)": { desc: "Jinchūriki des Fünfschwänzigen.", moves: [
    [null, "buff", "new", "Futton-Kraftschub (Anime/Spiel)."],
    [null, "strike", "new", "Dampfgetriebener Schlag (Anime/Spiel)."],
  ] },
  "shippuden|Utakata (Six-Tails / Saiken)": { desc: "Jinchūriki des Sechsschwänzigen.", moves: [
    [null, "aoe", "new", "Seifenblasen-Explosion (Anime-Füller)."],
    [null, "aoe", "new", "Ätzender Nebel des Saiken (Anime/Spiel)."],
  ] },
  "shippuden|Rock Lee (Sixth Gate)": { desc: "Shippūden.", moves: [
    ["guy-asa-kujaku", "strike", "actor", "Zeitkonflikt: Lee nutzt Asa Kujaku erst im Krieg. Clip mit Guy."],
    ["lee-konoha-senpuu", "strike", "partial", "Clip zeigt Konoha Senpū, nicht Gōriki Senpū."],
  ] },
  "shippuden|Hidan (Jashin Ritual)": { desc: "Akatsuki.", moves: [
    ["hidan-jashin", "bind", "ok", "Jujutsu: Shiji Hyōketsu."],
    [null, "projectile", "new", "Sense am Seil."],
  ] },
  "shippuden|Suigetsu Hōzuki (Hydrification)": { desc: "Taka.", moves: [
    [null, "projectile", "new", "Suideppō."],
    [null, "strike", "new", "Kubikiribōchō."],
  ] },
  "shippuden|Jūgo (Sage Transformation)": { desc: "Taka.", moves: [
    [null, "projectile", "new", "Chakra-Kanone."],
    [null, "strike", "new", "Kolbenschlag."],
  ] },
  "shippuden|Sai (Root / Super Beast Imitating Drawing)": { desc: "Ne, Team Kakashi.", moves: [
    ["sai-chouju-giga", "projectile", "ok", "Chōjū Giga: Löwen."],
    [null, "seal", "new", "Tiger-Siegeltechnik; Anwender/Name nur im Anime (Füller)."],
  ] },
  "shippuden|Yamato (Wood Style)": { desc: "Team Kakashi.", moves: [
    ["yamato-shichuukaku", "bind", "ok", "Shichūrō."],
    [null, "defense", "new", "Mokujōheki."],
  ] },
  "shippuden|Neji Hyūga (Jōnin)": { desc: "Jōnin, Team Guy.", moves: [
    ["neji-kuushou", "projectile", "partial", "Doppelung: Hakke Rokujūyon Shō bleibt in Classic. Ersatz: Hakke Kūshō, ein einzelner gerichteter Fernstoß. Der Clip hängt Hakke Hasangeki an; der Slot braucht den Einzelstoß.", { replace: { name: "Eight Trigrams Vacuum Palm", src: "Narutopedia: Eight Trigrams Vacuum Palm, Manga 256 / Anime Shippūden 13" } }],
  ] },
  "shippuden|Asuma Sarutobi (Jōnin)": { desc: "Jōnin, Team 10.", moves: [
    ["asuma-hien", "aoe", "partial", "Clip kombiniert Hien und Haisekishō; der Slot ist nur Haisekishō."],
  ] },
  "shippuden|Shikamaru Nara (Jōnin)": { desc: "Team 10. Abweichung: vor dem Krieg ist Shikamaru Chūnin.", moves: [
    ["shikamaru-kage-nui", "bind", "ok", "Kage Nui: Schattenstränge steigen aus einer Schattenfläche und durchbohren das Ziel (gegen Hidan/Kakuzu). Eigene Silhouette und Trefferlogik, kein Kagemane."],
  ] },
  "shippuden|Temari (Wind Scythe / Jōnin)": { desc: "Suna.", moves: [
    [null, "aoe", "new", "'Great Cast Net': Übersetzung uneindeutig."],
  ] },
  "shippuden|Kurenai Yūhi (Genjutsu Master — Jōnin)": { desc: "Jōnin.", moves: [
    [null, "illusion", "open", "Doppelung: Jubaku Satsu hat Kurenai schon in Classic. Kein Shippūden-Ersatz belegt: ihre übrigen Genjutsu (Jubaku Messatsu, Jubaku Satsu Bakuhatsu, Hanabira Nogare) sind Part-I-Anime, in Shippūden nur Psycho Mind Transmission und Sensorik. Slot offen.", { replace: { name: null, src: "Narutopedia: Kurenai Yūhi, Technikliste mit Debüts" } }],
  ] },
  "shippuden|Kankurō (Kage Summit / Jōnin)": { desc: "Suna.", moves: [
    [null, "projectile", "new", "Doppelung: Kuroari + Karasu (Machine One Shot) hat Kankurō schon in Classic; Machine Triple Shot wäre nur ein zusätzlicher Treffer. Ersatz: Akahigi: Kiki Sankaku, die Sasori-Puppe wirft dreieckige Klingen mit Sprengkugeln aus Hals und Händen.", { replace: { name: "Red Secret Technique: Machinery Triangles", src: "Narutopedia: Red Secret Technique: Machinery Triangles, Manga 464 / Anime Shippūden 203" } }],
  ] },
  "shippuden|Chōji Akimichi (Chūnin — Pre-War)": { desc: "Team 10.", moves: [
    ["chouji-nikudan-sensha", "strike", "partial", "Clip zeigt Nikudan Sensha ohne Stacheln (Nikudan Hari Sensha)."],
  ] },
  "shippuden|Shizune (Medical Jōnin)": { desc: "Medizin-Ninja.", moves: [
    [null, "aoe", "new", "Dokugiri."],
  ] },
  "shippuden|Hinata Hyūga (Twin Lion Fists)": { desc: "Kampf gegen Pain.", moves: [
    ["hinata-twin-lions", "strike", "ok", "Jūho Sōshiken."],
  ] },
  "shippuden|Shino Aburame (Destruction Insects)": { desc: "Team 8.", moves: [
    ["shino-mushidama", "drain", "ok", "Hijutsu: Mushidama."],
  ] },
  "shippuden|Kabuto Yakushi (Snake Cloak)": { desc: "Kabuto mit Orochimarus Zellen.", moves: [
    [null, "drain", "new", "Doppelung: Chakra no Mesu hat Kabuto schon in Classic. Ersatz: Chakra Kyūin Fūin, ein Siegel auf dem Ziel zieht dessen Chakra zum Anwender (gegen Anko).", { replace: { name: "Chakra Draining Seal", src: "Narutopedia: Chakra Draining Seal, Manga 521 / Anime Shippūden 265" } }],
  ] },
  "shippuden|Anko Mitarashi (Special Jōnin)": { desc: "Spezial-Jōnin.", moves: [
    ["orochimaru-senei-jashu", "bind", "actor", "Sen'eijashu; der Clip zeigt Orochimaru als Anwender."],
  ] },
  "shippuden|Sakura Haruno (Chūnin)": { desc: "Team Kakashi, vor dem Krieg (ohne Byakugō).", moves: [
    ["sakura-ouka-shouraiken", "aoe", "ok", "Ōka Shōraiken."],
  ] },
  "shippuden|Kiba & Akamaru (Chūnin)": { desc: "Team 8.", moves: [
    ["kiba-garouga", "strike", "ok", "Garōga."],
  ] },
  "shippuden|Konohamaru Sarutobi (Rasengan)": { desc: "Kampf gegen Pain.", moves: [
    [null, "strike", "new", "Konohamarus Rasengan gegen den Naraka-Pfad."],
  ] },
  "shippuden|Tenten (Scroll Summoning — Chūnin)": { desc: "Team Guy.", moves: [
    [null, "bind", "new", "Kettenwaffe aus der Schriftrolle."],
  ] },
  "shippuden|Ino Yamanaka (Chūnin)": { desc: "Team 10.", moves: [
    ["ino-shintenshin", "illusion", "ok", "Shintenshin no Jutsu."],
  ] },
  "shippuden|Iruka Umino (Chūnin Instructor)": { desc: "Akademie-Lehrer.", moves: [
    [null, "defense", "new", "Barrieresiegel (Anime)."],
  ] },
};
