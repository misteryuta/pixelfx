-- ServerScriptService.PixelArenaServer (2026-11-26): the server side of the summon moves. A client asks to cast a
-- move from its variant's slot (where it stands on the stage and which way it faces); the server checks the slot,
-- the cooldown and that nothing of that player's is still running, then runs the move in its own simulation
-- (PixelArena.Sim) and decides what is hit. The training panel's time controls (pause, slow motion, single frame)
-- and the target tests (walk, dodge, remove, reset) are honoured in Studio and for the place's owner only.
local RS = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local Arena = RS:WaitForChild("PixelArena")
local Defs = require(Arena:WaitForChild("Defs"))
local Roster = require(Arena:WaitForChild("Roster"))
local Sim = require(Arena:WaitForChild("Sim"))

local state = RS:FindFirstChild("PixelArenaState") or Instance.new("Folder")
state.Name = "PixelArenaState"
state.Parent = RS
local remote = RS:FindFirstChild("PixelArenaRemote") or Instance.new("RemoteEvent")
remote.Name = "PixelArenaRemote"
remote.Parent = RS

local sim = Sim.new(state, Defs)
local cooldown = {} -- [userId][moveId] = sim time when ready
local log = {}

local function tester(player)
	return RunService:IsStudio() or player.UserId == game.CreatorId
end
-- the slot's move as the roster has it (variant id + slot number -> summon id)
local function slotMove(variantId, slot)
	local v = Roster.byId[variantId]
	local s = v and v.slots[slot]
	return s and s.summon or nil
end

remote.OnServerEvent:Connect(function(player, op, a, b, c, d)
	if op == "cast" then
		-- a = variant id, b = slot, c = Vector2 position on the stage, d = Vector2 direction
		local moveId = slotMove(a, b)
		if not moveId or typeof(c) ~= "Vector2" or typeof(d) ~= "Vector2" or d.Magnitude < 0.5 then
			remote:FireClient(player, "refused", "Slot " .. tostring(b) .. " hat keine Live-Beschwörung")
			return
		end
		local M = Defs.moves[moveId]
		cooldown[player.UserId] = cooldown[player.UserId] or {}
		local ready = cooldown[player.UserId][moveId] or 0
		if sim:busy(player.UserId) then remote:FireClient(player, "refused", "läuft noch"); return end
		if sim.t < ready then remote:FireClient(player, "refused", ("Abklingzeit %.1f s"):format(ready - sim.t)); return end
		cooldown[player.UserId][moveId] = sim.t + M.cooldown
		local cast = sim:cast(player.UserId, moveId, c, d.Unit)
		remote:FireClient(player, "cast", cast.id, M.lock)
	elseif op == "abort" then
		sim:abort(player.UserId)
	elseif op == "respawn" then
		sim:abort(player.UserId)
		cooldown[player.UserId] = {}
	elseif tester(player) then
		if op == "time" then state:SetAttribute("TimeScale", math.clamp(tonumber(a) or 1, 0.05, 2)); state:SetAttribute("Paused", false)
		elseif op == "pause" then state:SetAttribute("Paused", a == true)
		elseif op == "frame" then state:SetAttribute("Paused", true); sim:step(0, 1 / 20)
		elseif op == "targets" then sim:setTargetMode(a, b)
		elseif op == "tplace" then sim:placeTarget(a, b)
		elseif op == "cooldowns" then cooldown[player.UserId] = {} end
	end
end)
Players.PlayerRemoving:Connect(function(p) sim:abort(p.UserId); cooldown[p.UserId] = nil end)
RunService.Heartbeat:Connect(function(dt) sim:step(dt) end)
