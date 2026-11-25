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
    [null, "defense", "new", "Rashōmon dreifach gegen Hiruzens Enma."],
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
    [null, "summon", "new", "Kuchiyose: Katsuyu (Tanzaku)."],
  ] },
  "classic|Hiruzen Sarutobi (Third Hokage)": { desc: "Dritter Hokage, Konoha Crush.", moves: [
    ["hiruzen-shiki-fuujin", "seal", "ok", "Shiki Fūjin gegen Orochimaru; versiegelt dessen Arme -> Spielzustand: Jutsu gesperrt."],
    ["hiruzen-enma", "strike", "ok", "Enma als Kongōnyoi."],
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
    [null, "bind", "new", "Doton: Tsuiga no Jutsu, Ninken halten Zabuza."],
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
    [null, "summon", "new", "Gamabunta: belegt im Konoha Crush, nicht im Tal des Endes."],
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
    ["temari-kamatari", "aoe", "ok", "Kuchiyose: Kirikiri Mai."],
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
    [null, "summon", "new", "Kurama unter Kontrolle des Sharingan, Tal des Endes (Rückblende)."],
    [null, "defense", "new", "Uchiha Gaeshi mit dem Gunbai."],
  ] },
  "shippuden|Pain (Six Paths of Pain)": { desc: "Sechs Pfade, Angriff auf Konoha.", moves: [
    ["pain-shinra-tensei", "aoe", "ok", "Shinra Tensei."],
    ["pain-chibaku-tensei", "bind", "ok", "Chibaku Tensei gegen Naruto."],
    ["pain-banshou-tenin", "strike", "ok", "Banshō Ten'in."],
    ["nagato-gedo-mazo", "summon", "actor", "Gedō Mazō; der Clip ist mit Nagato als Rufer gebacken."],
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
    [null, "transform", "new", "Kyōmon, siebtes Tor."],
    ["lee-konoha-senpuu", "strike", "actor", "Konoha Senpū; Clip mit Rock Lee."],
  ] },
  "shippuden|Jiraiya (Sage Mode)": { desc: "Sennin-Modus gegen Pain.", moves: [
    ["jiraiya-goemon", "aoe", "ok", "Senpō: Goemon; 'Bath of Boiling Oil' als Übersetzung gleichgesetzt."],
    [null, "strike", "new", "Sennin-Ōdama Rasengan."],
    ["jiraiya-ult-gamarinshou", "illusion", "ok", "Magen: Gamarinshō."],
    [null, "bind", "new", "Gamaguchi Shibari."],
  ] },
  "shippuden|Hiruzen Sarutobi (Prime — Flashback)": { desc: "Rückblende: Hiruzen in seiner besten Zeit.", moves: [
    ["hiruzen-enma", "strike", "ok", "Enma als Kongōnyoi."],
    [null, "aoe", "new", "'Five-Element Combo Blast': Spiel-/Animetechnik, nicht im Manga."],
    [null, "projectile", "new", "Shuriken Kage Bunshin."],
  ] },
  "shippuden|Kisame Hoshigaki (Samehada Fusion)": { desc: "Mit Samehada verschmolzen.", moves: [
    ["kisame-shark-dance", "bind", "ok", "Suirō Samehada."],
    ["kisame-daikoudan", "projectile", "ok", "Suiton: Daikōdan."],
    [null, "projectile", "new", "Goshokuzame."],
  ] },
  "shippuden|Tsunade (Fifth Hokage)": { desc: "Fünfte Hokage, Kage-Gipfel.", moves: [
    [null, "heal", "new", "Sōzō Saisei."],
    ["tsunade-tsuutenkyaku", "strike", "ok", "Tsūtenkyaku."],
    [null, "aoe", "new", "Katsuyus Säure (Zesshi Nensan)."],
  ] },
  "shippuden|Orochimaru (Eight-Headed Serpent)": { desc: "Yamata no Jutsu gegen Sasuke.", moves: [
    ["orochimaru-yamata", "aoe", "ok", "Yamata no Jutsu."],
    ["orochimaru-kusanagi", "projectile", "ok", "Kusanagi aus dem Mund."],
    [null, "defense", "new", "Rashōmon."],
  ] },
  "shippuden|Gaara (Fifth Kazekage)": { desc: "Fünfter Kazekage.", moves: [
    [null, "aoe", "new", "Ryūsa Bakuryū."],
    ["gaara-sabaku-taisou", "seal", "ok", "Sabaku Taisō: begraben und verdichtet."],
    ["gaara-suna-no-tate", "defense", "ok", "Zettai Bōgyo."],
  ] },
  "shippuden|Shisui Uchiha (Body Flicker — Flashback)": { desc: "Rückblende.", moves: [
    ["shisui-kotoamatsukami", "illusion", "ok", "Kotoamatsukami. Spielzustand: Ziel greift nicht an."],
    ["shisui-shunshin", "strike", "ok", "Shunshin no Shisui."],
    ["fire-great-fireball", "projectile", "actor", "Gōkakyū; Clip mit Standard-Anwender."],
  ] },
  "shippuden|Kakashi Hatake (Mangekyō Sharingan)": { desc: "Mangekyō, Kampf gegen Pain.", moves: [
    ["kakashi-kamui", "aoe", "ok", "Kamui-Fernangriff."],
    ["kakashi-raikiri", "strike", "ok", "Raikiri."],
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
    [null, "bind", "new", "Kuchiyose: Baku."],
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
    ["neji-64-palms", "seal", "ok", "Hakke Rokujūyon Shō."],
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
    ["kurenai-jubaku-satsu", "illusion", "ok", "Magen: Jubaku Satsu."],
  ] },
  "shippuden|Kankurō (Kage Summit / Jōnin)": { desc: "Suna.", moves: [
    ["kankuro-kuroari", "bind", "ok", "Kuroari + Karasu."],
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
    [null, "strike", "new", "Chakra no Mesu."],
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
