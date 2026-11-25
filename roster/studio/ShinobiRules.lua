-- Shared battle rules (server decides, client shows). One entry per gameplay kind used in ShinobiRoster slots.
-- range: max distance (arena units) to the target when the cast starts; self = needs no target in range.
-- after: seconds the state keeps going after the clip ends (defence, phasing, buffs outlast their animation so they can
-- meet the rival's next attack); hold: extra bind time when the clip shows no release.
local Rules = {}

Rules.KINDS = {
	strike     = { label = "Nahkampf",       range = 170, dmg = 15, cost = 15, cd = 3 },
	projectile = { label = "Fernangriff",    range = 300, dmg = 14, cost = 18, cd = 4 },
	aoe        = { label = "Flaechenangriff", range = 260, dmg = 19, cost = 28, cd = 7 },
	bind       = { label = "Fessel",         range = 260, dmg = 7,  cost = 22, cd = 8, hold = 2 },
	illusion   = { label = "Genjutsu",       range = 300, dmg = 6,  cost = 22, cd = 9, dur = 4 },
	seal       = { label = "Versiegelung",   range = 200, dmg = 11, cost = 25, cd = 10, dur = 5 },
	defense    = { label = "Verteidigung",   self = true, cost = 12, cd = 7, after = 4 },
	-- a barrier that also wounds whoever runs into it (Sasuke's Kagutsuchi spike wall): shield from its first contact,
	-- damage on the later ones
	barrier    = { label = "Konter-Barriere", range = 220, dmg = 16, cost = 24, cd = 9, after = 3 },
	intangible = { label = "Durchdringung",  self = true, cost = 15, cd = 9, after = 3 },
	heal       = { label = "Heilung",        self = true, cost = 30, cd = 14, heal = 32 },
	teleport   = { label = "Teleport",       range = 9999, dmg = 12, cost = 18, cd = 6 },
	transform  = { label = "Verwandlung",    self = true, cost = 30, cd = 20, after = 12, mult = 1.35, guard = 0.8 },
	buff       = { label = "Verstaerkung",   self = true, cost = 15, cd = 12, after = 8, mult = 1.15 },
	summon     = { label = "Beschwoerung",   range = 9999, dmg = 21, cost = 35, cd = 14, after = 6 },
	drain      = { label = "Chakra-Entzug",  range = 260, dmg = 8,  cost = 15, cd = 7, drain = 20 },
}
-- the states a kind leaves behind, with their on-screen names
Rules.STATES = {
	bound = "GEFESSELT", illusion = "GENJUTSU", sealed = "VERSIEGELT", shield = "SCHILD", intangible = "DURCHLAESSIG",
	transformed = "VERWANDELT", buff = "VERSTAERKT", summon = "BESCHWOERUNG", channel = "HAELT FEST",
}

Rules.CK_MAX = 100
Rules.CK_REGEN = 7          -- per second
Rules.BREAK_COST = 25       -- chakra to break a genjutsu (Kai)
Rules.STRIKE = { range = 170, dmg = 7, contact = 0.32, len = 0.6, cd = 0.7 }
-- the training ground is 480 px wide (room to step out of a Complete Body Susanoo's reach)
Rules.STEP, Rules.MIN_X, Rules.MAX_X, Rules.MIN_GAP = 30, 20, 460, 24

function Rules.hp(ovr) return math.floor(100 + (ovr - 60) * 2.5) end
-- damage scales with OVR: 60 -> 0.6x, 100 -> 1.4x
function Rules.scale(ovr) return 0.6 + (ovr - 60) / 40 * 0.8 end

return Rules
