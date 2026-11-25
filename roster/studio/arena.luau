-- Playtest arena: you against a rival, hand to hand, in the jutsu viewer's stage. The sprites are baked from the same
-- pixelfx rig as the taijutsu scenes (one atlas, the rival mirrored and tinted). Every exchange is fed back the
-- Nintendo way: a freeze on contact (longer for heavier blows), the picture jolting with it, a spark where it landed,
-- a sound on that very frame, a little zoom-punch on the big ones. Casting a jutsu (U Katon, O Raiton) makes the rival
-- answer with his own, and the two clash: the cinematic clash plays, the stronger nature wins, the loser takes it.
-- Arena.mount(stage, deps) -> { open(), close(), isOpen() }; deps: { playSfx(tag), playClip(key, done) }.
local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local Arena = {}

local ATLAS = "rbxassetid://104168316280258"
local FXATLAS = "rbxassetid://118220631677922"
local CW, CH, FX, FY, FPS = 76, 60, 26, 55, 15
local ROWS = { idle = { 0, 8, true }, walk = { 1, 6, true }, dash = { 2, 4, true }, jab = { 3, 5 }, cross = { 4, 6 }, kick = { 5, 7 }, block = { 6, 2 }, duck = { 7, 2 }, hit = { 8, 5 }, down = { 9, 12 }, cast = { 10, 6 }, win = { 11, 7 } }
local SPARK = { hit = 0, big = 1, block = 2 }
-- the blows: how long, when they can land (s), how far they reach (px from the feet), damage, whether ducking beats them
local MOVES = {
	jab = { dur = 0.33, a0 = 0.07, a1 = 0.2, reach = 26, dmg = 6, high = true, sfx = "punch", stop = 0.06 },
	cross = { dur = 0.4, a0 = 0.1, a1 = 0.24, reach = 29, dmg = 8, high = true, sfx = "punch", stop = 0.08 },
	kick = { dur = 0.47, a0 = 0.2, a1 = 0.33, reach = 32, dmg = 12, high = false, sfx = "kick", stop = 0.12, knock = true },
}
local WORLD = 300

local function new(class, props, parent)
	local o = Instance.new(class)
	for k, v in pairs(props) do o[k] = v end
	o.Parent = parent
	return o
end

function Arena.mount(stage, deps)
	local root = new("Frame", { Name = "Arena", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromHex("#0f1020"), BorderSizePixel = 0, ZIndex = 20, Visible = false, ClipsDescendants = true }, stage)
	new("UICorner", { CornerRadius = UDim.new(0, 10) }, root)
	new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Color3.fromHex("#2a2148"), Color3.fromHex("#0c0c18")) }, root)
	local world = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 21 }, root)
	local zoom = new("UIScale", { Scale = 1 }, world)
	local floorL = new("Frame", { BackgroundColor3 = Color3.fromHex("#3a3460"), BorderSizePixel = 0, ZIndex = 21 }, world)
	local floorF = new("Frame", { BackgroundColor3 = Color3.fromHex("#0a0a14"), BorderSizePixel = 0, ZIndex = 21 }, world)
	local function label(props, parent)
		local t = new("TextLabel", { BackgroundTransparency = 1, Font = Enum.Font.GothamBlack, TextColor3 = Color3.new(1, 1, 1), TextStrokeTransparency = 0.4, ZIndex = 30 }, parent or root)
		for k, v in pairs(props) do t[k] = v end
		return t
	end
	-- the HUD: names, health, chakra, the combo count, a big word in the middle, the controls
	local function bar(x, align, color, name)
		local f = new("Frame", { Size = UDim2.new(0.4, 0, 0, 16), Position = UDim2.new(x, 0, 0, 34), AnchorPoint = Vector2.new(align, 0), BackgroundColor3 = Color3.fromHex("#1a1a2a"), BorderSizePixel = 0, ZIndex = 30 }, root)
		new("UICorner", { CornerRadius = UDim.new(0, 4) }, f)
		local fill = new("Frame", { Size = UDim2.fromScale(1, 1), AnchorPoint = Vector2.new(align, 0), Position = UDim2.fromScale(align, 0), BackgroundColor3 = color, BorderSizePixel = 0, ZIndex = 31 }, f)
		new("UICorner", { CornerRadius = UDim.new(0, 4) }, fill)
		label({ Text = name, TextSize = 16, Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 0, -20), TextXAlignment = align == 0 and Enum.TextXAlignment.Left or Enum.TextXAlignment.Right }, f)
		return fill
	end
	local hpP = bar(0.04, 0, Color3.fromHex("#7ae07a"), "DU")
	local hpR = bar(0.96, 1, Color3.fromHex("#ff8a4a"), "RIVALE")
	local ckBack = new("Frame", { Size = UDim2.new(0.25, 0, 0, 6), Position = UDim2.new(0.04, 0, 0, 54), BackgroundColor3 = Color3.fromHex("#1a1a2a"), BorderSizePixel = 0, ZIndex = 30 }, root)
	local ck = new("Frame", { Size = UDim2.fromScale(0, 1), BackgroundColor3 = Color3.fromHex("#5ab0ff"), BorderSizePixel = 0, ZIndex = 31 }, ckBack)
	label({ Text = "CHAKRA", TextSize = 10, Font = Enum.Font.GothamBold, Size = UDim2.fromOffset(60, 10), Position = UDim2.new(1, 6, 0, -2), TextXAlignment = Enum.TextXAlignment.Left }, ckBack)
	local comboL = label({ Text = "", TextSize = 26, Font = Enum.Font.Arcade, TextColor3 = Color3.fromHex("#ffd040"), Size = UDim2.fromOffset(200, 30), Position = UDim2.new(0.04, 0, 0, 66), TextXAlignment = Enum.TextXAlignment.Left })
	local bigL = label({ Text = "", TextSize = 54, Font = Enum.Font.Arcade, Size = UDim2.new(1, 0, 0, 60), Position = UDim2.fromScale(0, 0.3) })
	local smallL = label({ Text = "", TextSize = 22, Font = Enum.Font.Arcade, TextColor3 = Color3.fromHex("#9adaff"), Size = UDim2.new(1, 0, 0, 26), Position = UDim2.fromScale(0, 0.42) })
	label({ Text = "A/D laufen   J Schlag (3x = Kombo)   K Tritt   L blocken (halten)   S ducken (halten)   U Katon   O Raiton   R neu   ESC zurueck", TextSize = 13, Font = Enum.Font.GothamMedium, TextColor3 = Color3.fromHex("#9a9ec0"), TextStrokeTransparency = 1, Size = UDim2.new(1, 0, 0, 18), Position = UDim2.new(0, 0, 1, -24) })

	local S, GY = 4, 300
	local function fighter(rival)
		local shadow = new("Frame", { BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.55, BorderSizePixel = 0, ZIndex = 22 }, world)
		new("UICorner", { CornerRadius = UDim.new(1, 0) }, shadow)
		local img = new("ImageLabel", { BackgroundTransparency = 1, Image = ATLAS, ImageRectSize = Vector2.new(CW, CH), ResampleMode = Enum.ResamplerMode.Pixelated, ZIndex = rival and 23 or 24 }, world)
		if rival then img.ImageColor3 = Color3.fromRGB(255, 170, 120) end
		return { img = img, shadow = shadow, rival = rival, x = 0, hp = 100, ck = 0, state = "idle", t = 0, face = rival and -1 or 1, landed = false, queue = nil, combo = 0, push = 0, think = 0, react = nil }
	end
	local P, R = fighter(false), fighter(true)
	local sparks = {}
	local freeze, shakeT, shakeA, bigT, smallT, over, clashing, comboT = 0, 0, 0, 0, 0, false, false, 0
	local keys = {}

	local function setState(f, s)
		if f.state == s then return end
		f.state, f.t, f.landed = s, 0, false
	end
	local function layout()
		local W, H = root.AbsoluteSize.X, root.AbsoluteSize.Y
		S = math.max(2, math.floor(math.min(H / 110, W / (WORLD * 0.75))))
		GY = math.floor(H * 0.74)
		floorL.Size = UDim2.new(1, 0, 0, 2)
		floorL.Position = UDim2.fromOffset(0, GY)
		floorF.Position = UDim2.fromOffset(0, GY + 2)
		floorF.Size = UDim2.new(1, 0, 0, H - GY)
		for _, f in ipairs({ P, R }) do f.img.Size = UDim2.fromOffset(CW * S, CH * S) end
	end
	root:GetPropertyChangedSignal("AbsoluteSize"):Connect(layout)
	local function screenX(x)
		return root.AbsoluteSize.X / 2 + (x - WORLD / 2) * S
	end
	local function draw(f)
		local row = ROWS[f.state] or ROWS.idle
		local n = math.floor(f.t * FPS)
		if row[3] then n = n % row[2] else n = math.min(n, row[2] - 1) end
		local flip = f.face < 0
		f.img.ImageRectOffset = Vector2.new(n * CW + (flip and CW or 0), row[1] * CH)
		f.img.ImageRectSize = Vector2.new(flip and -CW or CW, CH)
		local sx = screenX(f.x)
		f.img.Position = UDim2.fromOffset(math.floor(sx - (flip and (CW - FX) or FX) * S), GY - FY * S)
		f.shadow.Size = UDim2.fromOffset(20 * S, 3 * S)
		f.shadow.Position = UDim2.fromOffset(math.floor(sx - 10 * S), GY - math.floor(1.5 * S))
	end
	local function spark(kind, x, y)
		local img = new("ImageLabel", { BackgroundTransparency = 1, Image = FXATLAS, ImageRectSize = Vector2.new(48, 48), ResampleMode = Enum.ResamplerMode.Pixelated, ZIndex = 26, Size = UDim2.fromOffset(48 * S, 48 * S) }, world)
		img.Position = UDim2.fromOffset(math.floor(screenX(x) - 24 * S), math.floor(GY + y * S - 24 * S))
		table.insert(sparks, { img = img, t = 0, row = SPARK[kind] })
	end
	local function big(text, color, t)
		bigL.Text, bigL.TextColor3, bigT = text, color or Color3.new(1, 1, 1), t or 0.9
	end
	local function small(text, t)
		smallL.Text, smallT = text, t or 0.6
	end
	local function hitFeel(stop, amp, zoomK)
		freeze = math.max(freeze, stop)
		shakeT, shakeA = math.max(shakeT, stop + 0.08), math.max(shakeA, amp)
		if zoomK then zoom.Scale = zoomK end
	end

	-- one blow landing (or not) on the other fighter, the moment its active window opens
	local function resolve(a, d, mv)
		local dist = math.abs(a.x - d.x)
		if dist > mv.reach then return end
		a.landed = true
		local cx = (a.x + d.x) / 2 + a.face * 4
		local facing = (d.face == -a.face)
		if d.state == "duck" and mv.high then
			small("AUSGEWICHEN!")
			deps.playSfx("whoosh")
			return
		end
		if d.state == "block" and facing then
			d.hp = math.max(1, d.hp - 1)
			d.push = a.face * 70
			spark("block", cx, -27)
			deps.playSfx("block")
			hitFeel(0.05, 2)
			small("GEBLOCKT")
			return
		end
		local heavy = mv.knock or a.combo >= 2
		d.hp -= mv.dmg + (heavy and 4 or 0)
		spark(heavy and "big" or "hit", cx, mv.high and -29 or -24)
		deps.playSfx(heavy and "heavy" or mv.sfx)
		hitFeel(heavy and 0.16 or mv.stop, heavy and 5 or 3, heavy and 1.07 or 1.03)
		a.combo += 1
		if not a.rival then comboT = 1.2; comboL.Text = a.combo >= 2 and (a.combo .. " HITS!") or "" end
		if heavy or d.hp <= 0 then
			setState(d, "down")
			d.push = a.face * 150
			deps.playSfx("land")
		else
			setState(d, "hit")
			d.push = a.face * 60
		end
		if d.hp <= 0 then
			d.hp = 0
			over = true
			task.delay(0.9, function() setState(a, "win"); big(a.rival and "VERLOREN" or "K.O.!", a.rival and Color3.fromHex("#ff6a5a") or Color3.fromHex("#ffd040"), 99) end)
		end
	end

	local function attack(f, name)
		if f.state == "jab" or f.state == "cross" or f.state == "kick" then
			-- a press during a blow chains the next one
			if f.t > MOVES[f.state].a0 then f.queue = name end
			return
		end
		if f.state ~= "idle" and f.state ~= "walk" and f.state ~= "block" and f.state ~= "duck" then return end
		if f.state ~= "block" then f.combo = 0 end
		setState(f, name)
		deps.playSfx("whoosh")
	end

	local function startClash(elem)
		if clashing or over or P.ck < 50 or P.state == "down" or P.state == "cast" then return end
		clashing = true
		P.ck -= 50
		local pick
		if elem == "fire" then
			pick = math.random() < 0.5 and { "clash-fire-wind", "KATON VS FUUTON", true } or { "clash-water-fire", "KATON VS SUITON", false }
		else
			pick = { "clash-lightning-earth", "RAITON VS DOTON", true }
		end
		setState(P, "cast")
		setState(R, "cast")
		deps.playSfx("cast")
		big(pick[2], Color3.fromHex("#9adaff"), 1.0)
		task.delay(0.9, function()
			root.Visible = false
			deps.playClip(pick[1], function()
				root.Visible = true
				local loser = pick[3] and R or P
				loser.hp = math.max(0, loser.hp - 30)
				setState(loser, "down")
				setState(pick[3] and P or R, "idle")
				small(pick[3] and "DEIN JUTSU IST STAERKER!" or "SEIN JUTSU IST STAERKER!", 1.4)
				if loser.hp <= 0 then
					over = true
					big(pick[3] and "K.O.!" or "VERLOREN", pick[3] and Color3.fromHex("#ffd040") or Color3.fromHex("#ff6a5a"), 99)
				end
				clashing = false
			end)
		end)
	end

	local function reset()
		P.x, R.x = WORLD / 2 - 40, WORLD / 2 + 40
		P.hp, R.hp, P.ck, R.ck = 100, 100, 50, 100
		setState(P, "idle"); setState(R, "idle")
		P.combo, R.combo, over, clashing = 0, 0, false, false
		big("FIGHT!", Color3.fromHex("#ffd040"), 1.0)
		deps.playSfx("clash")
	end

	-- the rival: closes in, throws blows in short strings, sometimes blocks or ducks what you throw
	local function thinkRival(dt)
		local f, dist = R, math.abs(R.x - P.x)
		f.face = P.x < f.x and -1 or 1
		if over or clashing then return end
		if f.state == "block" or f.state == "duck" then
			f.hold = (f.hold or 0) - dt
			if f.hold <= 0 then setState(f, "idle") end
			return
		end
		if f.state ~= "idle" and f.state ~= "walk" then return end
		-- reacting to your blow
		local mv = MOVES[P.state]
		if mv and P.t < mv.a0 and dist < mv.reach + 4 and not f.react then
			f.react = true
			local roll = math.random()
			if roll < 0.3 then setState(f, "block"); f.hold = 0.5 return
			elseif roll < 0.6 and mv.high then setState(f, "duck"); f.hold = 0.4 return end
		end
		if not mv then f.react = nil end
		f.think -= dt
		if dist > 27 then
			setState(f, "walk")
			f.x += f.face * 48 * dt
		elseif f.think <= 0 then
			f.think = 0.55 + math.random() * 0.8
			local r = math.random()
			if r < 0.55 then
				local pick = r < 0.25 and "jab" or r < 0.42 and "cross" or "kick"
				attack(f, pick)
				if math.random() < 0.35 then f.queue = pick == "jab" and "cross" or "kick" end
			elseif r < 0.7 then
				setState(f, "walk")
				f.x -= f.face * 14
			else
				setState(f, "idle")
			end
		elseif f.state == "walk" then
			setState(f, "idle")
		end
	end

	local function step(f, dt)
		f.t += dt
		local mv = MOVES[f.state]
		if mv then
			local other = f == P and R or P
			if not f.landed and f.t >= mv.a0 and f.t <= mv.a1 then resolve(f, other, mv) end
			if f.t >= mv.dur then
				if f.queue then
					local q = f.queue
					f.queue = nil
					setState(f, q)
					deps.playSfx("whoosh")
				else
					setState(f, "idle")
				end
			end
		elseif f.state == "hit" and f.t > 0.33 then setState(f, "idle")
		elseif f.state == "down" and f.t > 1.1 and f.hp > 0 then setState(f, "idle")
		elseif f.state == "cast" and not clashing then setState(f, "idle")
		end
		-- knockback slides out
		if f.push ~= 0 then
			f.x += f.push * dt
			f.push *= math.exp(-dt * 7)
			if math.abs(f.push) < 2 then f.push = 0 end
		end
		f.x = math.clamp(f.x, 16, WORLD - 16)
	end

	local conn
	local function tick(dt)
		if not root.Visible then return end
		-- hit-stop: everything holds, only the jolt plays
		if freeze > 0 then
			freeze -= dt
		else
			-- you
			if not over and not clashing and P.state ~= "hit" and P.state ~= "down" and not MOVES[P.state] then
				local dir = (keys[Enum.KeyCode.D] or keys[Enum.KeyCode.Right]) and 1 or (keys[Enum.KeyCode.A] or keys[Enum.KeyCode.Left]) and -1 or 0
				if keys[Enum.KeyCode.L] then setState(P, "block")
				elseif keys[Enum.KeyCode.S] or keys[Enum.KeyCode.Down] then setState(P, "duck")
				elseif dir ~= 0 then setState(P, "walk"); P.x += dir * 62 * dt
				elseif P.state ~= "cast" then setState(P, "idle") end
			end
			P.face = R.x < P.x and -1 or 1
			thinkRival(dt)
			step(P, dt)
			step(R, dt)
			-- keep them from walking through each other
			local gap = R.x - P.x
			if math.abs(gap) < 24 then
				local m = (24 - math.abs(gap)) / 2 * (gap >= 0 and 1 or -1)
				P.x -= m; R.x += m
			end
			P.ck = math.min(100, P.ck + dt * 6)
			if comboT > 0 then comboT -= dt; if comboT <= 0 then comboL.Text = ""; P.combo = 0 end end
		end
		for i = #sparks, 1, -1 do
			local s = sparks[i]
			s.t += dt
			local n = math.floor(s.t * FPS)
			if n >= 5 then s.img:Destroy(); table.remove(sparks, i)
			else s.img.ImageRectOffset = Vector2.new(n * 48, s.row * 48) end
		end
		-- the jolt and the zoom easing back
		if shakeT > 0 then
			shakeT -= dt
			local k = shakeA * math.max(0, shakeT) / 0.2
			world.Position = UDim2.fromOffset(math.floor((math.random() * 2 - 1) * k), math.floor((math.random() * 2 - 1) * k * 0.6))
		else
			world.Position = UDim2.new()
			shakeA = 0
		end
		zoom.Scale += (1 - zoom.Scale) * math.min(1, dt * 10)
		if bigT > 0 then bigT -= dt; bigL.TextTransparency = bigT < 0.25 and 1 - bigT / 0.25 or 0 else bigL.Text = "" end
		if smallT > 0 then smallT -= dt; smallL.TextTransparency = smallT < 0.2 and 1 - smallT / 0.2 or 0 else smallL.Text = "" end
		draw(P)
		draw(R)
		hpP.Size = UDim2.fromScale(P.hp / 100, 1)
		hpR.Size = UDim2.fromScale(R.hp / 100, 1)
		ck.Size = UDim2.fromScale(P.ck / 100, 1)
		ck.BackgroundColor3 = P.ck >= 50 and Color3.fromHex("#5ab0ff") or Color3.fromHex("#34507a")
	end

	local api = {}
	local inputs = {}
	function api.isOpen() return root.Visible or clashing end
	function api.open()
		root.Visible = true
		layout()
		reset()
		if not conn then conn = RunService.RenderStepped:Connect(tick) end
	end
	function api.close()
		root.Visible = false
		keys = {}
	end
	table.insert(inputs, UIS.InputBegan:Connect(function(input, processed)
		if not root.Visible or processed then return end
		local k = input.KeyCode
		keys[k] = true
		if over and k ~= Enum.KeyCode.R and k ~= Enum.KeyCode.Escape then return end
		if k == Enum.KeyCode.J then
			local name = (P.state == "jab" and "cross") or (P.state == "cross" and "kick") or "jab"
			attack(P, name)
		elseif k == Enum.KeyCode.K then attack(P, "kick")
		elseif k == Enum.KeyCode.U then startClash("fire")
		elseif k == Enum.KeyCode.O then startClash("lightning")
		elseif k == Enum.KeyCode.R then reset()
		elseif k == Enum.KeyCode.Escape then api.close(); if deps.onExit then deps.onExit() end
		end
	end))
	table.insert(inputs, UIS.InputEnded:Connect(function(input) keys[input.KeyCode] = nil end))
	return api
end

return Arena
