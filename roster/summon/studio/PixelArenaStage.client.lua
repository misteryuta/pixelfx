-- StarterPlayerScripts.PixelArenaStage (vfx test, 2026-11-26): a 2.5D training stage for the same summon moves the
-- game runs (Pixel BAS level 1): the same ReplicatedStorage.PixelArena client module, the same PixelArenaServer
-- simulation and hit decisions, the same packed rigs. Only the floor, the camera and the walking marker are local
-- to this place: a flat sand floor far away from the viewer's scene, Pixel BAS's camera (looking -Z, 50 deg down,
-- FOV 30), WASD to walk, the training panel of the arena (variant, slots 1-4, direction, repeat, pause, slow motion,
-- single frame, target tests). Opened with the "2.5D-TRAINING" button (top centre); the viewer GUI is hidden meanwhile.
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Input = game:GetService("UserInputService")
local AssetService = game:GetService("AssetService")

local player = Players.LocalPlayer
local O = Vector3.new(0, 600, 4000) -- the stage's floor origin (far from everything else)
local PITCH = math.rad(50)
local SPP = 10.7 / 72

-- the walking marker: a small ninja in four views, drawn pixel by pixel (silver hair, mask, green vest) - a stand-in
-- until the user's Kakashi turnaround is in (the summon is what this stage tests)
local function marker(view)
	local W, H = 24, 52
	local img = AssetService:CreateEditableImage({ Size = Vector2.new(W, H) })
	local px = buffer.create(W * H * 4)
	local function put(x, y, c) if x >= 0 and y >= 0 and x < W and y < H then local k = (y * W + x) * 4; buffer.writeu8(px, k, c[1]); buffer.writeu8(px, k + 1, c[2]); buffer.writeu8(px, k + 2, c[3]); buffer.writeu8(px, k + 3, 255) end end
	local function rect(x0, y0, x1, y1, c) for y = y0, y1 do for x = x0, x1 do put(x, y, c) end end end
	local hair, skin, mask, navy, vest, band, metal, ink = { 214, 218, 228 }, { 246, 214, 186 }, { 40, 44, 66 }, { 44, 52, 92 }, { 84, 112, 70 }, { 40, 46, 80 }, { 200, 204, 214 }, { 20, 18, 30 }
	-- legs, body, arms
	rect(7, 38, 10, 50, navy); rect(13, 38, 16, 50, navy); rect(6, 49, 10, 51, ink); rect(13, 49, 17, 51, ink)
	rect(5, 22, 18, 38, navy); rect(6, 23, 17, 36, vest)
	if view == "side" then rect(10, 24, 13, 36, navy) else rect(3, 23, 5, 35, navy); rect(18, 23, 20, 35, navy) end
	-- head
	rect(6, 9, 17, 21, (view == "back") and hair or skin)
	if view ~= "back" then
		rect(6, 15, 17, 21, mask)
		rect(6, 11, 17, 12, band); rect(9, 11, 14, 12, metal)
		if view == "front" then put(14, 13, ink); rect(8, 13, 10, 13, { 150, 40, 40 }) else put(16, 13, ink); rect(17, 14, 18, 20, mask) end
	end
	-- the hair: spikes swept up and to the left
	rect(5, 4, 18, 10, hair)
	for i = 0, 4 do rect(4 + i * 3, 0 + (i % 2), 6 + i * 3, 4, hair) end
	if view == "side" then rect(2, 5, 6, 9, hair) end
	-- outline
	local out = buffer.create(W * H * 4)
	buffer.copy(out, 0, px)
	for y = 0, H - 1 do for x = 0, W - 1 do
		local k = (y * W + x) * 4
		if buffer.readu8(px, k + 3) == 0 then
			for _, d in ipairs({ { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } }) do
				local nx, ny = x + d[1], y + d[2]
				if nx >= 0 and ny >= 0 and nx < W and ny < H and buffer.readu8(px, (ny * W + nx) * 4 + 3) > 0 then buffer.writeu8(out, k, 18); buffer.writeu8(out, k + 1, 15); buffer.writeu8(out, k + 2, 28); buffer.writeu8(out, k + 3, 255); break end
			end
		end
	end end
	img:WritePixelsBuffer(Vector2.zero, Vector2.new(W, H), out)
	return img, W, H
end

local stage = nil
local hint = nil
local function open()
	if stage then return end
	-- the packed pixels are written into EditableImages; the place must allow that API (Game Settings > Security)
	local ok = pcall(function() AssetService:CreateEditableImage({ Size = Vector2.new(2, 2) }):Destroy() end)
	if not ok then
		if hint then hint:Destroy() end
		hint = Instance.new("ScreenGui")
		hint.Name, hint.ResetOnSpawn = "PixelArenaStageHint", false
		local l = Instance.new("TextLabel")
		l.Size, l.Position, l.AnchorPoint = UDim2.fromOffset(720, 60), UDim2.new(0.5, 0, 0, 50), Vector2.new(0.5, 0)
		l.BackgroundColor3, l.TextColor3, l.Font, l.TextSize, l.TextWrapped = Color3.fromRGB(16, 18, 38), Color3.new(1, 1, 1), Enum.Font.Arcade, 15, true
		l.Text = "2.5D-TRAINING BRAUCHT EDITABLEIMAGE: SPIELEINSTELLUNGEN > SICHERHEIT > MESH- UND BILD-APIS ERLAUBEN"
		l.Parent = hint
		hint.Parent = player.PlayerGui
		task.delay(6, function() if hint then hint:Destroy(); hint = nil end end)
		return false
	end
	stage = { conns = {} }
	local viewer = player.PlayerGui:FindFirstChild("JutsuViewer")
	stage.viewerWas = viewer and viewer.Enabled
	if viewer then viewer.Enabled = false end
	local folder = Instance.new("Folder")
	folder.Name = "PixelArenaStage"
	folder.Parent = workspace
	stage.folder = folder
	-- the floor: sand with a faint grid every 10 studs (the stage's own scale: 72 px fighters are ~10.7 studs)
	local floor = Instance.new("Part")
	floor.Anchored, floor.Size, floor.Position, floor.Color, floor.Material = true, Vector3.new(420, 2, 260), O + Vector3.new(40, -1, 0), Color3.fromRGB(214, 186, 132), Enum.Material.SmoothPlastic
	floor.Parent = folder
	for i = -20, 20 do
		local l = Instance.new("Part")
		l.Anchored, l.CanCollide, l.Size, l.Color, l.Material = true, false, Vector3.new(0.25, 0.05, 260), Color3.fromRGB(196, 166, 114), Enum.Material.SmoothPlastic
		l.Position = O + Vector3.new(i * 10, 0.02, 0)
		l.Parent = folder
		if i >= -12 and i <= 12 then
			local m = l:Clone()
			m.Size, m.Position = Vector3.new(420, 0.05, 0.25), O + Vector3.new(40, 0.02, i * 10)
			m.Parent = folder
		end
	end
	-- the walker
	local p, facing, locked = Vector2.new(0, 0), 3, false
	local anchor = Instance.new("Part")
	anchor.Anchored, anchor.CanCollide, anchor.Transparency, anchor.Size = true, false, 1, Vector3.one
	anchor.Parent = folder
	local bb = Instance.new("BillboardGui")
	bb.Adornee, bb.LightInfluence, bb.MaxDistance = anchor, 0, 1e5
	bb.Parent = anchor
	local il = Instance.new("ImageLabel")
	il.BackgroundTransparency, il.Size, il.ResampleMode = 1, UDim2.fromScale(1, 1), Enum.ResamplerMode.Pixelated
	il.Parent = bb
	local imgs = {}
	for _, v in ipairs({ "front", "back", "side" }) do imgs[v] = { marker(v) } end
	stage.imgs = imgs
	local cam = workspace.CurrentCamera
	cam.CameraType = Enum.CameraType.Scriptable
	cam.FieldOfView = 30
	local shakeA, shakeT = 0, 0
	local say = Instance.new("ScreenGui")
	say.Name, say.ResetOnSpawn = "PixelArenaStageSay", false
	local sayL = Instance.new("TextLabel")
	sayL.Size, sayL.Position, sayL.AnchorPoint = UDim2.fromOffset(640, 36), UDim2.new(0.5, 0, 0, 52), Vector2.new(0.5, 0)
	sayL.BackgroundColor3, sayL.BackgroundTransparency, sayL.Font, sayL.TextSize, sayL.TextColor3 = Color3.fromRGB(16, 18, 38), 0.15, Enum.Font.Arcade, 18, Color3.new(1, 1, 1)
	sayL.Text = "2.5D-TRAINING (VFX TEST)  -  WASD LAUFEN"
	sayL.Parent = say
	say.Parent = player.PlayerGui
	stage.say = say
	table.insert(stage.conns, RunService.RenderStepped:Connect(function(dt)
		if not locked then
			local mv = Vector2.zero
			if Input:IsKeyDown(Enum.KeyCode.D) then mv += Vector2.new(1, 0) end
			if Input:IsKeyDown(Enum.KeyCode.A) then mv -= Vector2.new(1, 0) end
			if Input:IsKeyDown(Enum.KeyCode.S) then mv += Vector2.new(0, 1) end
			if Input:IsKeyDown(Enum.KeyCode.W) then mv -= Vector2.new(0, 1) end
			if mv.Magnitude > 0 then
				p += mv.Unit * 14 * dt
				if math.abs(mv.X) > 0 then facing = mv.X > 0 and 3 or 2 else facing = mv.Y > 0 and 0 or 1 end
			end
		end
		local v = facing == 0 and "front" or facing == 1 and "back" or "side"
		local img = imgs[v]
		il.ImageContent = Content.fromObject(img[1])
		il.ImageRectSize = Vector2.new(facing == 2 and -img[2] or img[2], img[3])
		il.ImageRectOffset = Vector2.new(facing == 2 and img[2] or 0, 0)
		bb.Size = UDim2.fromScale(img[2] * SPP * 1.3, img[3] * SPP * 1.3)
		bb.StudsOffsetWorldSpace = Vector3.new(0, img[3] * SPP * 1.3 / 2 / math.cos(PITCH), 0)
		local feet = O + Vector3.new(p.X, 0, p.Y)
		anchor.Position = feet
		shakeT = math.max(0, shakeT - dt)
		local s = shakeT > 0 and Vector3.new(math.random() - 0.5, math.random() - 0.5, 0) * shakeA * 0.4 or Vector3.zero
		cam.CFrame = CFrame.lookAt(feet + Vector3.new(0, 96.5, 73) + s, feet + Vector3.new(0, 4, 0) + s)
	end))
	local ok, cleanup = pcall(function()
		return require(RS:WaitForChild("PixelArena")).mount({
			folder = folder, origin = O, start = Vector2.zero, pitch = PITCH,
			ground = function() return 0 end,
			pos = function() return p end,
			facing = function() return facing end,
			place = function(np, f) p = np; if f then facing = f end end,
			lock = function(on) locked = on end,
			say = function(text) sayL.Text = text or "2.5D-TRAINING (VFX TEST)  -  WASD LAUFEN" end,
			shake = function(a, t) shakeA, shakeT = a, t end,
		})
	end)
	if ok then stage.cleanup = cleanup else warn("PixelArena: " .. tostring(cleanup)) end
end
local function close()
	if not stage then return end
	for _, c in ipairs(stage.conns) do c:Disconnect() end
	if stage.cleanup then pcall(stage.cleanup) end
	for _, i in pairs(stage.imgs or {}) do i[1]:Destroy() end
	stage.folder:Destroy()
	stage.say:Destroy()
	local viewer = player.PlayerGui:FindFirstChild("JutsuViewer")
	if viewer and stage.viewerWas ~= nil then viewer.Enabled = stage.viewerWas end
	workspace.CurrentCamera.CameraType = Enum.CameraType.Custom
	stage = nil
end

local gui = Instance.new("ScreenGui")
gui.Name, gui.ResetOnSpawn, gui.DisplayOrder = "PixelArenaStageButton", false, 70
local b = Instance.new("TextButton")
b.Size, b.Position, b.AnchorPoint = UDim2.fromOffset(200, 30), UDim2.new(0.5, 0, 0, 12), Vector2.new(0.5, 0)
b.BackgroundColor3, b.TextColor3, b.Font, b.TextSize, b.Text = Color3.fromRGB(120, 70, 40), Color3.new(1, 1, 1), Enum.Font.Arcade, 16, "2.5D-TRAINING"
b.Parent = gui
b.Activated:Connect(function() if stage then close(); b.Text = "2.5D-TRAINING" elseif open() ~= false then b.Text = "ZURUECK ZUM VIEWER" end end)
gui.Parent = player:WaitForChild("PlayerGui")
-- test hook (Studio): open / close
local hook = Instance.new("BindableFunction")
hook.Name = "StageTest"
hook.Parent = gui
hook.OnInvoke = function(op) if op == "open" then if open() ~= false then b.Text = "ZURUECK ZUM VIEWER" end elseif op == "close" then close(); b.Text = "2.5D-TRAINING" end; return stage ~= nil end
player.CharacterAdded:Connect(function() if stage then close(); b.Text = "2.5D-TRAINING" end end)
