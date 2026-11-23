# Madara's Perfect Susanoo ultimate: the animation (3D shots, cameras, markers, VFX) and the ten insert stages.
# Companion of cine_madara.py (which builds the world and the rigs and calls animate()).
import bpy, math, random
import numpy as np
from mathutils import Vector, Euler
from cine_madara import (W, H, F0, F1, INSERTS, REF, lin, srgb, smooth, ease_out, ease_in, link, key, key_val, key_hide,
                         load_rgba, make_image, hsv, poly_mask, rect, dilate, inpaint, layer, components, noise_img,
                         flat_mat, emit_mat, card, cam, look_at, node)

R = random.Random(11)
SHOTS = {}  # name -> camera


# ================================================================ cameras and cuts
def marker(sc, name, f, camo):
    m = sc.timeline_markers.new(name, frame=f)
    m.camera = camo


def shot(sc, name, f0, f1, CC, path, lens=35, shake=None):
    """a 3D camera for frames f0..f1: path(u) -> (location, target, roll); shake(u) -> amplitude (m)."""
    c = cam("CAM_" + name, (0, 0, 0), (0, 0, 0), lens=lens, coll=CC)
    for f in range(f0, f1 + 1):
        u = (f - f0) / max(1, f1 - f0)
        loc, tgt, roll = path(u)
        loc = Vector(loc)
        if shake:
            a = shake(u)
            loc += Vector((R.uniform(-a, a), R.uniform(-a, a) * 0.3, R.uniform(-a, a)))
        c.location = loc
        look_at(c, tgt, roll)
        c.keyframe_insert("location", frame=f)
        c.keyframe_insert("rotation_euler", frame=f)
    marker(sc, name, f0, c)
    SHOTS[name] = c
    return c


def lerp(a, b, u):
    return tuple(x + (y - x) * u for x, y in zip(a, b))


# ================================================================ the 3D action
def animate_world(sc, MAD, SUS, DRAGON, EN, CC, CV):
    drag, dhead, djaw = DRAGON
    side, front = MAD["side"], MAD["front"]
    ms, mf = side["rig"], front["rig"]
    ms.location = mf.location = (0, 0, 0)
    EN.location = (70, 0, 0)
    sb, sa, sk, blade = SUS["body"], SUS["arm"], SUS["katana"], SUS["blade"]
    sb.location = (-2, 3.5, 0)
    fparts, aura = SUS["front_parts"], SUS["front_aura"]
    FY = {"helmet": 5.94, "chest": 5.97, "shoulders": 6.0}
    fy = lambda o: FY[o.name.split("_")[-1]]
    for o in fparts:
        o.location = (0, fy(o), 0)
    aura.location = (0, 6.3, -0.4)

    # --- who is seen when: Madara side card most of the time, front card for the close on him; Susanoo front for
    # the reveal and the calm wide, side for the wind-up and the cut
    def vis(ob, ranges):
        children = [ob] + list(ob.children_recursive)
        for o in children:
            key_hide(o, F0, True)
        for a, b in ranges:
            for o in children:
                key_hide(o, a, False)
                key_hide(o, b + 1, True)
    vis(ms, [(1, 94), (141, 480)])
    vis(mf, [(95, 140)])
    for o in fparts + [aura]:
        key_hide(o, F0, True); key_hide(o, 105, False); key_hide(o, 202, True)
    for o in [sb, sa, sk, blade] + list(blade.children):
        key_hide(o, F0, True); key_hide(o, 202, False)

    # --- Madara's rig: breathing, the mane and gunbai swaying in the wind, a small lift of the head; the side card
    # faces right toward the enemy
    for nm, R0 in (("side", side), ("front", front)):
        P = R0["parts"]
        for f in range(F0, F1 + 1, 2):
            t = f / 24
            w = 0.04 + 0.05 * smooth(300, 330, f)  # the wind of the cut
            key(P["hair"], f, rot=(0, math.sin(t * 3.1) * w, 0))
            key(P["gunbai"], f, rot=(0, math.sin(t * 2.3 + 1) * 0.03, 0))
            key(P["shoulders"], f, loc=(0, P["shoulders"].location.y, 0.01 * math.sin(t * 2.0)))
            key(P["hips"], f, rot=(0, math.sin(t * 2.6 + 2) * 0.02, 0))
            lift = 0.03 * smooth(8, 14, f) * (1 - smooth(60, 80, f))
            key(P["head"], f, loc=(0, P["head"].location.y, lift))
        # the violet of the Rinnegan washing over him as it opens (the eye insert), fading
        for o in P.values():
            mix = o.active_material.node_tree.nodes.get("tint")
            if mix:
                for f, v in ((F0, 0), (90, 0), (98, 0.35), (112, 0)):
                    key_val(mix.inputs[0], f, v)

    # --- 1-12: Madara stands; a short look and a flick of the hand (the hips turn); the enemy far off
    shot(sc, "SHOT_01_stand", 1, 12, CC, lambda u: ((-1.2 + 0.6 * u, -6.0, 1.25), (2.4, 0, 1.15), 0.0), lens=30)
    # --- 24-33: the ground in his gaze opens: cracks run out toward the enemy, dust lifts
    cr = emit_mat("M_crack", "#0c0a10")
    crl = emit_mat("M_crack_light", "#8a6a4a")
    for i in range(5):
        y = (i - 2) * 1.4
        c = card("crack%d" % i, 1.0, 0.55 if i % 2 else 0.3, cr if i % 2 else crl, pivot=(0, 0.5), coll=CV, upright=False)
        c.location = (3, y, 0.18 + 0.01 * i)
        c.rotation_euler = (0, 0, R.uniform(-0.25, 0.25))
        key(c, F0, scl=(0.01, 1, 1))
        key(c, 24 + i, scl=(0.01, 1, 1))
        key(c, 33, scl=(22 + 6 * i, 1, 1))
        key(c, 90, scl=(22 + 6 * i, 1, 1))
        key_hide(c, F0, False); key_hide(c, 95, True)
    shot(sc, "SHOT_02_cracks", 24, 33, CC, lambda u: ((4 + 3 * u, -5, 1.6), (14, 1, 0), 0.05), shake=lambda u: 0.04 * u, lens=28)
    # --- 51-78: the dragon bursts out of the ground behind him and rises with weight; rocks thrown up
    cu = drag.data
    for f, e in ((F0, 0.0), (48, 0.0), (66, 0.82), (72, 0.95), (78, 1.0)):
        cu.bevel_factor_end = e
        cu.keyframe_insert("bevel_factor_end", frame=f)
    for f, z in ((F0, -40), (48, -40), (66, -4), (72, 1.5), (78, 0)):
        key(drag, f, loc=(0, 0, z))
    hc = dhead.constraints[0]
    for f, o in ((F0, 0.0), (48, 0.0), (66, 0.82), (72, 0.95), (78, 1.0)):
        hc.offset_factor = o
        hc.keyframe_insert("offset_factor", frame=f)
    for f, r in ((F0, 0), (70, 0), (76, -0.5), (90, -0.5)):
        key(djaw, f, rot=(r, 0, 0))
    spikes = [o for o in drag.users_collection[0].objects if "path_u" in o]
    for s in spikes:
        key_hide(s, F0, True)
        key_hide(s, 48 + int(s["path_u"] / 0.82 * 18), False)
        key_hide(s, 119, True)
    for o in (drag, dhead, djaw):
        key_hide(o, F0, False)
        key_hide(o, 119, True)
    rk = emit_mat("M_rock", "#3a3040")
    for i in range(16):
        b = card("rock%d" % i, 1.4, 1.4, rk, pivot=(0.5, 0.5), coll=CV)
        p0 = Vector((-30 + R.uniform(-6, 6), 40 + R.uniform(-4, 4), -1))
        v = Vector((R.uniform(-14, 14), R.uniform(-6, 2), R.uniform(18, 34)))
        key_hide(b, F0, True); key_hide(b, 52, False); key_hide(b, 79, True)
        for f in range(52, 79, 2):
            a = (f - 52) / 24
            key(b, f, loc=p0 + v * a + Vector((0, 0, -30 * a * a))), key(b, f, rot=(0, a * 9 * (1 if i % 2 else -1), 0))
    shot(sc, "SHOT_03_dragon", 51, 78, CC, lambda u: ((4 + 3 * u, -26, 1.2 + 1.5 * u), (-12, 34, 8 + 22 * ease_out(u)), 0.04 * u), shake=lambda u: 0.3 * (1 - u), lens=24)

    # --- 95-118: close on Madara's face (front card); the violet pulse pulls in; then the Susanoo builds round him
    pulse = card("violet_pulse", 1.0, 1.0, flat_mat("M_pulse", disc_img("pulse_ring", "#b08aff", ring=0.82)), pivot=(0.5, 0.5), coll=CV)
    pulse.location = (0, -0.6, 1.8)
    for f, s in ((F0, 0.01), (94, 0.01), (95, 7.0), (104, 0.2), (106, 0.01)):
        key(pulse, f, scl=s)
    key_hide(pulse, F0, True); key_hide(pulse, 95, False); key_hide(pulse, 106, True)
    for i, o in enumerate(fparts):
        op = node(o.active_material, "opacity").outputs[0]
        a0 = 105 + i * 4
        for f, v in ((F0, 0), (a0, 0), (a0 + 1, 1)):
            key_val(op, f, v)
        key(o, F0, loc=(0, fy(o), -1.5))
        key(o, a0, loc=(0, fy(o), -1.5))
        key(o, a0 + 3, loc=(0, fy(o), 0))
    aop = node(aura.active_material, "opacity").outputs[0]
    for f, v in ((F0, 0), (113, 0), (116, 1)):
        key_val(aop, f, v)
    shot(sc, "SHOT_04_manifest", 95, 118, CC, lambda u: (lerp((0, -4.5, 1.8), (0, -44, 10), ease_in(smooth(0.45, 1.0, u))), lerp((0, 0, 1.7), (0, 6, 20), smooth(0.45, 1.0, u)), 0.0))
    # --- 141-153: the energy lights the ground and the lower armour; low by its feet
    glow = card("energy_glow", 1.0, 1.0, emit_mat("M_glow", "#bff0ff", 0.85), pivot=(0.5, 0.5), coll=CV)
    glow.location = (0, 2, 26)
    for f, s in ((F0, 0.01), (140, 0.01), (143, 22), (150, 8), (154, 0.01)):
        key(glow, f, scl=s)
    for o in fparts:
        mix = node(o.active_material, "tint")
        for f, v in ((F0, 0), (140, 0), (143, 0.65), (153, 0.15), (165, 0)):
            key_val(mix.inputs[0], f, v)
    shot(sc, "SHOT_05_energy", 141, 153, CC, lambda u: ((6 - 2 * u, -12, 0.5), (0, 6, 10 + 4 * u), 0.08), shake=lambda u: 0.06 * (1 - u))
    # --- 164-181: the whole silhouette, calm: the giant over Madara, the enemy a speck across the valley
    shot(sc, "SHOT_06_scale", 164, 181, CC, lambda u: ((34 - 4 * u, -78, 2.0), (16, 6, 21), 0.0))
    # --- 202-229: side on: the torso turns, the sword arm rises behind its head (wind-up); 249-278: the cut
    k = SUS["k"]
    for f in range(F0, F1 + 1):
        wind = smooth(204, 228, f)
        cut = ease_in(smooth(250, 279, f))
        follow = smooth(279, 300, f)
        arm = 0.0 + 2.35 * wind - 3.15 * cut - 0.2 * follow
        kat = -0.52 * wind + 0.2 * cut
        lean = -0.10 * wind + 0.22 * cut
        if f % 2 == 0 or 249 <= f <= 300:
            key(sa, f, rot=(0, arm, 0))
            key(sk, f, rot=(0, kat, 0))
            key(sb, f, rot=(0, lean, 0))
        # the chakra blade lengthens through the cut, then holds and fades
        L = 0.01 + 60 * smooth(256, 279, f) + 140 * smooth(279, 300, f)
        if f % 2 == 0 or 249 <= f <= 300:
            key(blade, f, scl=(L, 1.0 + 0.6 * smooth(256, 279, f), 1.0))
    shot(sc, "SHOT_07_windup", 202, 229, CC, lambda u: ((18 - 6 * u, -62, 8), (0, 3, 24 + 3 * u), -0.04 * u), lens=30)
    shot(sc, "SHOT_08_cut", 249, 278, CC, lambda u: ((14 + 14 * ease_in(u), -66 + 8 * u, 10 - 3 * u), (6 + 26 * ease_in(u), 2, 24 - 8 * u), 0.08 * u), shake=lambda u: 0.4 * ease_in(u), lens=30)

    # --- 299-306: the light of the cut runs across the valley; 321-370: the burst and the shock front
    line = card("cut_line", 1.0, 2.6, emit_mat("M_cutline", "#e8fbff"), pivot=(0, 0.5), coll=CV, upright=False)
    line.location = (20, 6, 0.2)
    line.rotation_euler = (0, 0, math.radians(4))
    for f, s in ((F0, 0.01), (298, 0.01), (306, 320), (360, 320), (400, 0.01)):
        key(line, f, scl=(s, 1, 1))
    lglow = card("cut_glow", 1.0, 9.0, emit_mat("M_cutglow", "#5ac8ff", 0.45), pivot=(0, 0.5), coll=CV, upright=False)
    lglow.parent = line
    lglow.location = (0, 0, -0.05)
    IMP = Vector((150, 26, 0))
    boom = card("boom", 1.0, 1.0, flat_mat("M_boom", disc_img("boom_disc", "#f4fdff", ragged=True, seed=3)), pivot=(0.5, 0.0), coll=CV)
    boom2 = card("boom2", 1.0, 1.0, flat_mat("M_boom2", disc_img("boom_disc2", "#5ad8ff", ragged=True, seed=4)), pivot=(0.5, 0.0), coll=CV)
    for b, sz in ((boom, 1.0), (boom2, 1.25)):
        b.location = IMP + Vector((0, -1.5 if b is boom else 0, -8))
        for f, s in ((F0, 0.01), (320, 0.01), (323, 60 * sz), (335, 90 * sz), (350, 40 * sz), (362, 0.01)):
            key(b, f, scl=(s, 1, s * 0.8))
    # the shock front: a flat ring racing out over the ground, and two darker dust fronts behind it
    def ring(name, col, alpha, r0, f0, f1, rmax):
        bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.06, major_segments=48, minor_segments=4)
        t = bpy.context.active_object
        t.name = name
        for c in t.users_collection:
            c.objects.unlink(t)
        CV.objects.link(t)
        t.data.materials.append(emit_mat("M_" + name, col, alpha))
        t.location = IMP + Vector((0, 0, 1))
        for f, s in ((F0, 0.01), (f0, r0), (f1, rmax)):
            key(t, f, scl=(s, s, max(0.5, s * 0.08)))
        key_hide(t, F0, True); key_hide(t, f0, False); key_hide(t, f1 + 6, True)
        return t
    smoke = card("smoke", 1.0, 1.0, flat_mat("M_smoke", disc_img("smoke_disc", "#6a6e86", ragged=True, seed=9)), pivot=(0.5, 0.0), coll=CV)
    smoke.location = IMP + Vector((0, 1.0, -6))
    for f, sz in ((F0, 0.01), (326, 0.01), (340, 70), (372, 110)):
        key(smoke, f, scl=(sz, 1, sz * 0.7))
    key_hide(smoke, F0, True); key_hide(smoke, 326, False); key_hide(smoke, 404, True)
    ring("shock", "#f4fdff", 1.0, 4, 322, 360, 360)
    ring("dust1", "#3a3c4e", 0.85, 3, 330, 370, 300)
    ring("dust2", "#2a2c3a", 0.85, 2, 338, 372, 240)
    for i in range(22):
        b = card("brock%d" % i, 3.0, 3.0, rk, pivot=(0.5, 0.5), coll=CV)
        v = Vector((R.uniform(-60, 60), R.uniform(-60, 30), R.uniform(30, 80)))
        key_hide(b, F0, True); key_hide(b, 322, False); key_hide(b, 372, True)
        for f in range(322, 372, 2):
            a = (f - 322) / 24
            key(b, f, loc=IMP + v * a + Vector((0, 0, -60 * a * a)), rot=(0, a * 7 * (1 if i % 2 else -1), 0))
    shot(sc, "SHOT_09_line", 299, 306, CC, lambda u: ((40, -150, 70), (150 * (0.4 + 0.6 * u), 30, 0), 0.0))
    shot(sc, "SHOT_10_burst", 321, 370, CC, lambda u: ((60 - 20 * u, -230, 80 + 20 * u), (150, 40, 10), 0.03), shake=lambda u: 2.4 * (1 - smooth(0, 0.4, u)) + 0.2)

    # --- 405-480: back down at ground level: dust through the foreground, late rocks landing, the aura dying away;
    # Madara calm, the enemy down across the valley along the cut
    for o in [sb, sa, sk]:
        op = node(o.active_material, "opacity").outputs[0]
        for f, v in ((F0, 1), (420, 1), (470, 0)):
            key_val(op, f, v)
    for o in [blade] + list(blade.children):
        key_hide(o, 405, True)
    key(EN, F0, rot=(0, 0, 0))
    key(EN, 404, rot=(0, 0, 0))
    key(EN, 405, rot=(0, math.radians(-88), 0), loc=(74, 0, 0.3))
    for i in range(3):
        im = noise_img("fgdust%d" % i, 120, 24, "#8a8ea8", 0.95, scale=4, seed=40 + i, thresh=0.62, col2="#b0b4c8")
        d = card("fgdust%d" % i, 9, 1.8, flat_mat("M_fgdust%d" % i, im), pivot=(0.5, 0.0), coll=CV)
        key_hide(d, F0, True); key_hide(d, 405, False)
        for f, x in ((405, -6 + i * 12), (480, 6 + i * 12)):
            key(d, f, loc=(x, -9 + i * 1.5, 0.1))
    for i in range(6):
        b = card("late%d" % i, 1.2, 1.2, rk, pivot=(0.5, 0.5), coll=CV)
        x = 30 + i * 9
        f0 = 412 + i * 9
        key_hide(b, F0, True); key_hide(b, f0, False)
        key(b, f0, loc=(x, 6, 14)); key(b, f0 + 8, loc=(x, 6, 0.6)); key(b, F1, loc=(x + 1, 6, 0.6))
    shot(sc, "SHOT_11_after", 405, 480, CC, lambda u: ((-4.5 + 0.8 * u, -9.0, 1.2), (4.5 + 0.8 * u, 3, 1.3), 0.0), shake=lambda u: 0.04 * (1 - u), lens=30)


# ================================================================ the inserts
class Stage:
    """one insert: a stack of 480x270 layers in pixel units under an orthographic camera far from the world."""

    def __init__(self, sc, i, CI):
        self.i, self.CI = i, CI
        self.bx = 20000.0 + i * 1500.0
        self.a, self.b = INSERTS[i]
        self.cam = cam("CAM_INSERT_%02d" % i, (self.bx, 0, 200), (0, 0, 0), ortho=W, coll=CI)
        marker(sc, "INSERT_%02d" % i, self.a, self.cam)
        self.z = 0.0

    def frames(self):
        for f in range(self.a, self.b + 1):
            yield f, (f - self.a) / max(1, self.b - self.a)

    def pos(self, px, py):
        return Vector((self.bx - W / 2 + px, H / 2 - py, self.z))

    def add(self, name, arr, pivot=(240, 135), **mk):
        """a full-frame layer image, pivot in panel pixels; returns the object (origin at the pivot)."""
        img = make_image("ins%02d_%s" % (self.i, name), arr)
        mat = flat_mat("M_ins%02d_%s" % (self.i, name), img, **mk)
        h, w = arr.shape[:2]
        ob = card("ins%02d_%s" % (self.i, name), w, h, mat, pivot=(pivot[0] / w, 1 - pivot[1] / h), coll=self.CI, upright=False)
        self.z += 1.0
        ob.location = self.pos(*pivot)
        ob["base"] = tuple(ob.location)
        return ob

    def quad(self, name, w, h, col, alpha=1.0, pivot=(0.5, 0.5)):
        ob = card("ins%02d_%s" % (self.i, name), w, h, emit_mat("M_ins%02d_%s" % (self.i, name), col, alpha), pivot=pivot, coll=self.CI, upright=False)
        self.z += 1.0
        ob.location = self.pos(240, 135)
        return ob

    def at(self, ob, f, dx=0.0, dy=0.0, rot=0.0, s=1.0, sx=None, sy=None):
        b = Vector(ob["base"]) if "base" in ob else ob.location
        key(ob, f, loc=(b.x + dx, b.y - dy, b.z), rot=(0, 0, -rot), scl=(sx if sx is not None else s, sy if sy is not None else s, 1))

    def move(self, ob, f, px, py):
        z = ob.location.z
        ob.location = (self.bx - W / 2 + px, H / 2 - py, z)
        ob.keyframe_insert("location", frame=f)

    def place(self, ob, px, py):
        ob.location = self.pos(px, py)
        ob["base"] = tuple(ob.location)

    def opacity(self, ob, f, v):
        key_val(node(ob.active_material, "opacity").outputs[0], f, v)


def lightning(stage, name, pts, col="#ffffff", width=1.2, origin=None):
    """a jagged bolt along pts (panel pixels), as a curve with a flat bevel; its origin at origin (panel pixels)."""
    ox, oy = origin or pts[0]
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, (x, y) in zip(sp.points, pts):
        p.co = (x - ox, -(y - oy), 0, 1)
    cu.bevel_depth = width
    cu.bevel_resolution = 0
    ob = link(bpy.data.objects.new(name, cu), stage.CI)
    stage.z += 1
    ob.location = stage.pos(ox, oy)
    cu.materials.append(emit_mat("M_" + name, col))
    return ob


def jag(x0, y0, x1, y1, n=7, amp=5, seed=0):
    r = random.Random(seed)
    return [(x0 + (x1 - x0) * i / n + (r.uniform(-amp, amp) if 0 < i < n else 0), y0 + (y1 - y0) * i / n + (r.uniform(-amp, amp) if 0 < i < n else 0)) for i in range(n + 1)]


def blink(ob, frames_on):
    key_hide(ob, F0, True)
    for a, b in frames_on:
        key_hide(ob, a, False)
        key_hide(ob, b + 1, True)


def panel(i):
    return load_rgba(f"{REF}\\p{i:02d}.png", (W, H))


def inserts(sc, CI):
    # ---------------------------------------------------------------- 01: Madara before the summoning
    st = Stage(sc, 1, CI)
    a = panel(1)
    hu, sa, va = hsv(a)
    skin = (a[..., 0] > a[..., 2] + 0.08) & (va > 0.65) & (sa < 0.45)
    hair = (va < 0.42) & (hu > 190) & (hu < 260)
    cloth = (va < 0.45) & (sa < 0.35) & (hu > 230)
    head = (skin | hair | cloth) & rect(70, 0, 400, 270)
    head = dilate(head, 1) & ~((a[..., 0] > 0.45) & (a[..., 0] > a[..., 2] + 0.15) & (sa > 0.35))  # not the red armour
    tip = head & hair & poly_mask([(110, 160), (205, 160), (205, 270), (100, 270)])
    bg = st.add("bg", inpaint(a, head))
    fog_back = st.add("fog_back", load_noise_layer("fog_back", "#7a7f98", 0.9, seed=21, thresh=0.56, band=0.4))
    h_ = st.add("head", layer(a, head & ~tip), pivot=(250, 270))
    t_ = st.add("tip", layer(a, tip), pivot=(160, 160))
    fog_front = st.add("fog_front", load_noise_layer("fog_front", "#9aa0b8", 0.95, seed=22, thresh=0.62, band=0.28))
    for f, u in st.frames():
        st.at(h_, f, dy=-3 * ease_out(u))
        st.at(t_, f, dy=-3 * ease_out(u), dx=-4 * smooth(0.3, 0.9, u), rot=math.radians(-3) * smooth(0.3, 0.9, u))
        st.at(fog_back, f, dx=-40 + 30 * u)
        st.at(fog_front, f, dx=60 - 90 * u, dy=6)

    # ---------------------------------------------------------------- 02: the wooden dragon breaks out
    st = Stage(sc, 2, CI)
    a = panel(2)
    hu, sa, va = hsv(a)
    tan = (hu > 18) & (hu < 48) & (sa > 0.18) & (va > 0.45)
    dragon = dilate(tan, 2) & ~rect(140, 225, 200, 270)
    madara = rect(140, 222, 205, 270) & ~tan & (sa > 0.25)
    jaw = dragon & poly_mask([(40, 196), (210, 190), (230, 262), (40, 268)])
    bg = st.add("bg", inpaint(a, dragon | madara))
    d_ = st.add("dragon", layer(a, dragon & ~jaw), pivot=(140, 200), uv_wave=True)
    j_ = st.add("jaw", layer(a, jaw), pivot=(205, 200))
    m_ = st.add("madara", layer(a, madara))
    rocks = []
    rk = "#4a3c40"
    for k in range(9):
        q = st.quad("rock%d" % k, R.randint(5, 10), R.randint(5, 10), rk)
        rocks.append((q, R.uniform(40, 460), R.uniform(-20, 80), R.uniform(0.0, 0.4)))
    dust = st.add("dust", load_noise_layer("dust2", "#9a8c84", 0.9, seed=23, thresh=0.6, band=0.35))
    wave = node(d_.active_material, "phase").outputs[0], node(d_.active_material, "amp").outputs[0]
    for f, u in st.frames():
        e = ease_out(smooth(0, 0.7, u))
        st.at(d_, f, dx=-90 * (1 - e), dy=70 * (1 - e), rot=math.radians(6) * (1 - e))
        st.at(j_, f, dx=-90 * (1 - e), dy=70 * (1 - e), rot=math.radians(6) * (1 - e) + math.radians(12) * smooth(0.45, 0.8, u))
        key_val(wave[0], f, u * 6.0)
        key_val(wave[1], f, 0.025 * (1 - smooth(0.6, 1, u)))
        for q, x, y0, d in rocks:
            v = smooth(d, 1, u)
            st.move(q, f, x + (x - 240) * 0.1 * v, y0 + 300 * v * v)
        st.at(dust, f, s=0.7 + 0.5 * u, dy=-10 * u)
        st.opacity(dust, f, 1.0 if u > 0.2 else 0.0)

    # ---------------------------------------------------------------- 03: the Rinnegan, macro
    st = Stage(sc, 3, CI)
    a = panel(3)
    hu, sa, va = hsv(a)
    C = (240, 175)  # the iris centre in the panel
    yy, xx = np.mgrid[0:H, 0:W]
    iris = ((hu > 240) & (hu < 290) & (va > 0.45) & (sa > 0.15)) & (((xx - C[0]) / 70) ** 2 + ((yy - C[1]) / 40) ** 2 < 1)
    bg = st.add("bg", a.copy())
    # the plain iris over the rings: the rings show from the centre outward as a circle opens
    plain = a.copy()
    plain[..., :3] = srgb("#a898ee")
    steps = []
    for r in range(0, 64, 4):
        steps.append(st.add("iris_r%02d" % r, layer(plain, dilate(iris, 1) & (((xx - C[0]) ** 2 + (yy - C[1]) ** 2) > r * r)), pivot=C))
        st.z -= 1.0
    # the lid: skin closing over the top of the eye, lifting
    lidc = a[(slice(205, 215), slice(150, 180))].reshape(-1, 4).mean(0)
    lid = np.zeros((H, W, 4), np.float32); lid[..., :3] = lidc[:3]
    lidm = poly_mask([(150, 120), (330, 110), (330, 168), (150, 175)])
    lid[..., 3] = lidm
    li = st.add("lid", lid, pivot=(240, 150))
    strand = np.zeros((H, W, 4), np.float32); strand[..., :3] = srgb("#0c0c14")
    strand[..., 3] = poly_mask([(220, 0), (300, 0), (290, 270), (200, 270)])
    sd = st.add("strand", strand)
    gla = np.zeros((H, W, 4), np.float32); gla[..., :3] = srgb("#d8c0ff")
    gla[..., 3] = poly_mask([(200, 90), (214, 90), (284, 270), (270, 270)]) & (hsv(a)[2] < 0.5)
    gl = st.add("glint", gla)
    rain = st.add("rain", rain_layer("rain3"), wrap=True)
    st.z += 1.0
    for f, u in st.frames():
        rev = smooth(0.35, 0.8, u)
        idx = int(rev * len(steps))
        for k, o in enumerate(steps):
            key_hide(o, f, k != idx)
        st.at(sd, f, dx=-200 * ease_in(smooth(0.0, 0.45, u)))
        st.at(li, f, dy=-46 * ease_out(smooth(0.2, 0.55, u)))
        st.opacity(li, f, 1.0 if u < 0.55 else 0.0)
        st.at(gl, f, dx=-80 + 160 * smooth(0.55, 0.85, u))
        st.opacity(gl, f, 1.0 if 0.55 < u < 0.85 else 0.0)
        st.at(rain, f, dy=(f * 9) % 30)

    # ---------------------------------------------------------------- 04: the blue Susanoo appears
    st = Stage(sc, 4, CI)
    a = panel(4)
    hu, sa, va = hsv(a)
    fig = (va > 0.38) | (sa < 0.3)
    bgm = ~fig
    bgimg = a.copy(); bgimg[fig, :3] = srgb("#0a0e3a"); bgimg[..., 3] = 1
    st.add("bg", bgimg)
    parts = [("helmet", rect(130, 0, 350, 150)), ("chest", rect(150, 150, 330, 270)), ("shoulders", ~rect(130, 0, 350, 270))]
    obs = []
    for k, (nm, m) in enumerate(parts):
        o = st.add(nm, layer(a, m & fig))
        obs.append(o)
    for f, u in st.frames():
        for k, o in enumerate(obs):
            a0 = [0.0, 0.25, 0.5][k]
            v = smooth(a0, a0 + 0.12, u)
            snap = (1 - ease_out(smooth(a0, a0 + 0.12, u)))
            dx = [0, 0, 0][k] if k < 2 else 0
            st.at(o, f, dy=10 * snap if k < 2 else 0, sx=1 + 0.08 * snap if k == 2 else 1, sy=1)
            st.opacity(o, f, 1.0 if v > 0.05 else 0.0)
        st.cam.data.ortho_scale = W * (0.86 + 0.14 * ease_out(u))
        st.cam.data.keyframe_insert("ortho_scale", frame=f)

    # ---------------------------------------------------------------- 05: the energy gathers
    st = Stage(sc, 5, CI)
    a = panel(5)
    hu, sa, va = hsv(a)
    core = (va > 0.9) & (sa < 0.25)
    CP = (180, 228)
    st.add("bg", inpaint(a, core & rect(60, 120, 330, 270)))
    co = st.add("core", layer(a, core), pivot=CP)
    sparks = [st.quad("sp%d" % k, 3, 3, "#e8fbff") for k in range(26)]
    seeds = [(R.uniform(0, 2 * math.pi), R.uniform(90, 220)) for _ in sparks]
    arcs = [lightning(st, "arc%d" % k, [(CP[0] + math.cos(t) * r, CP[1] + math.sin(t) * r * 0.6) for t in np.linspace(-2.6 + k, -0.6 + k, 9)], "#ffffff", 1.0, origin=CP) for k, r in ((0, 120), (1, 150))]
    flash = st.quad("flash", W, H, "#d8f6ff", 1.0)
    streak = st.quad("streak", W * 1.2, 6, "#ffffff", 1.0)
    st.place(streak, 240, CP[1])
    for f, u in st.frames():
        for q, (t, r) in zip(sparks, seeds):
            rr = r * (1 - ease_in(u))
            st.move(q, f, CP[0] + math.cos(t) * rr, CP[1] + math.sin(t) * rr * 0.7)
        st.at(co, f, s=0.5 + 0.7 * ease_in(smooth(0.3, 0.75, u)))
        for k, ar in enumerate(arcs):
            s = 1.0 - 0.35 * u
            ar.scale = (s, s, 1)
            ar.keyframe_insert("scale", frame=f)
        key_hide(flash, f, not (0.62 <= u <= 0.75))
        st.at(streak, f, sx=0.05 + 1.0 * smooth(0.75, 1, u))
        key_hide(streak, f, u < 0.72)

    # ---------------------------------------------------------------- 06: scale, the low angle
    st = Stage(sc, 6, CI)
    a = panel(6)
    hu, sa, va = hsv(a)
    sus = (hu > 195) & (hu < 240) & (sa > 0.35) & (va > 0.3) & rect(40, 20, 440, 270)
    enemy = (va < 0.22) & rect(370, 175, 425, 268)
    bg = st.add("bg", inpaint(a, sus | enemy))
    so = st.add("susanoo", layer(a, sus), pivot=(240, 270))
    en = st.add("enemy", layer(a, enemy))
    d1 = st.add("dust_a", load_noise_layer("dust6a", "#aab0c8", 0.95, seed=31, thresh=0.58, band=0.3))
    d2 = st.add("dust_b", load_noise_layer("dust6b", "#c8ccdc", 0.95, seed=32, thresh=0.64, band=0.22))
    for f, u in st.frames():
        st.at(so, f, dy=-7 * ease_out(u), s=1.0 + 0.04 * u, rot=math.radians(-1.5) * u)
        st.at(d1, f, dx=120 - 300 * u, dy=40)
        st.at(d2, f, dx=200 - 520 * u, dy=70)
        st.cam.data.ortho_scale = W * (1.0 - 0.07 * u)
        st.cam.data.keyframe_insert("ortho_scale", frame=f)

    # ---------------------------------------------------------------- 07: the hand closes on the grip, the blade drawn
    st = Stage(sc, 7, CI)
    a = panel(7)
    hu, sa, va = hsv(a)
    bladem = (va > 0.8) & (hu > 175) & (hu < 210) & (sa > 0.15)
    armm = (hu > 200) & (hu < 240) & (sa > 0.45) & ~bladem
    hand = armm & rect(255, 120, 430, 270)
    st.add("bg", inpaint(a, bladem | armm))
    bo = st.add("blade", layer(a, bladem))
    ar = st.add("arm", layer(a, armm & ~hand))
    hd = st.add("hand", layer(a, hand), pivot=(300, 200))
    zaps = [lightning(st, "zap%d" % k, jag(200 + 30 * k, 60 + 20 * k, 300 + 20 * k, 150, 6, 6, k), "#e8fbff", 0.8) for k in range(2)]
    ux, uy = -0.62, -0.78  # the blade's axis (toward its tip, up and left)
    for f, u in st.frames():
        st.at(hd, f, rot=math.radians(-5) * smooth(0.15, 0.45, u))
        d = 120 * ease_in(smooth(0.4, 1.0, u))
        st.at(bo, f, dx=ux * d, dy=uy * d)
        for k, z in enumerate(zaps):
            key_hide(z, f, not ([0.5, 0.72][k] <= u <= [0.6, 0.82][k]))

    # ---------------------------------------------------------------- 08: the blade meets the land
    st = Stage(sc, 8, CI)
    a = panel(8)
    hu, sa, va = hsv(a)
    band = poly_mask([(0, 135), (330, 175), (330, 228), (0, 188)])
    bladem = band & (sa > 0.35) | (band & (va > 0.9))
    burst = ((va > 0.85) | ((hu > 165) & (hu < 215) & (sa > 0.3) & (va > 0.5))) & rect(280, 100, 480, 270) & ~band
    burst = dilate(burst, 1) & rect(280, 100, 480, 270)
    st.add("bg", inpaint(a, bladem | burst))
    bo = st.add("blade", layer(a, bladem))
    bu = st.add("burst", layer(a, burst), pivot=(300, 215))
    spray = [st.quad("spray%d" % k, 3, 3, "#bff6ff") for k in range(20)]
    sv = [(R.uniform(60, 240), R.uniform(-160, -20)) for _ in spray]
    for f, u in st.frames():
        app = ease_out(smooth(0, 0.42, u))
        st.at(bo, f, dx=-330 * (1 - app), dy=-60 * (1 - app))
        c = smooth(0.42, 0.75, u)
        st.at(bu, f, s=0.02 + 0.98 * ease_out(c), dx=(R.uniform(-1, 1) if c > 0 else 0))
        st.opacity(bu, f, 1.0 if c > 0 else 0.0)
        for q, (vx, vy) in zip(spray, sv):
            tt = max(0.0, u - 0.45) * 1.2
            st.move(q, f, 300 + vx * tt, 215 + vy * tt + 300 * tt * tt)
            key_hide(q, f, u < 0.45)

    # ---------------------------------------------------------------- 09: the burst and the rock
    st = Stage(sc, 9, CI)
    a = panel(9)
    hu, sa, va = hsv(a)
    white = (va > 0.9) & (sa < 0.2)
    cyan = (hu > 170) & (hu < 200) & (sa > 0.45) & (va > 0.75)
    rocks = (va > 0.2) & (va < 0.62) & (hu > 205) & (hu < 240) & (sa > 0.2) & rect(60, 0, 480, 270)
    comps = [c for c in components(rocks, 40)][:10]
    CP = (250, 175)
    st.add("bg", inpaint(a, white | cyan | rocks))
    wh = st.add("white", layer(a, white), pivot=CP)
    cy = st.add("cyan", layer(a, cyan), pivot=CP)
    robs = []
    for k, m in enumerate(comps):
        ys, xs = np.nonzero(m)
        cx, cyy = float(xs.mean()), float(ys.mean())
        robs.append((st.add("rock%d" % k, layer(a, m), pivot=(cx, cyy)), cx, cyy))
    flash = st.quad("flash", W, H, "#f4fdff", 1.0)
    big = st.quad("bigrock", 140, 110, "#1e2a52", 1.0)
    st.place(big, 240, 140)
    for f, u in st.frames():
        st.at(wh, f, s=0.3 + 0.7 * ease_out(smooth(0, 0.3, u)))
        st.at(cy, f, s=0.2 + 0.95 * ease_out(smooth(0.05, 0.6, u)))
        for o, cx, cyy in robs:
            v = ease_out(smooth(0.15, 1.0, u))
            st.at(o, f, dx=(cx - CP[0]) * 0.5 * v, dy=(cyy - CP[1]) * 0.5 * v, rot=v * 1.6 * (1 if cx > CP[0] else -1), s=0.7 + 0.35 * v)
            st.opacity(o, f, 1.0 if u > 0.12 else 0.0)
        key_hide(flash, f, not (0.3 <= u <= 0.42))
        st.at(big, f, dx=-300 + 520 * smooth(0.82, 1.0, u), s=0.6 + 2.2 * smooth(0.82, 1.0, u))
        key_hide(big, f, u < 0.82)

    # ---------------------------------------------------------------- 10: the shock front over the valley
    st = Stage(sc, 10, CI)
    a = panel(10)
    hu, sa, va = hsv(a)
    fronts = (va > 0.82) & (sa < 0.22)
    O = (195, 235)
    st.add("bg", inpaint(a, fronts))
    fr = st.add("fronts", layer(a, fronts), pivot=O)
    du1 = st.add("dustfront1", ring_layer("dustfront1", O, "#3a3c50"), pivot=O)
    du2 = st.add("dustfront2", ring_layer("dustfront2", O, "#2c2e3e"), pivot=O)
    for f, u in st.frames():
        st.at(fr, f, s=0.25 + 0.75 * ease_out(smooth(0, 0.55, u)))
        st.at(du1, f, s=0.1 + 1.0 * ease_out(smooth(0.25, 0.8, u)))
        st.opacity(du1, f, 1.0 if 0.25 < u < 0.92 else 0.0)
        st.at(du2, f, s=0.1 + 0.9 * ease_out(smooth(0.4, 0.95, u)))
        st.opacity(du2, f, 1.0 if 0.4 < u < 0.98 else 0.0)


def load_noise_layer(name, col, alpha, seed=1, thresh=0.5, band=1.0):
    """a full-frame pixel fog / dust band (lower half heavier)."""
    r = np.random.RandomState(seed)
    g = r.rand(30, 54)
    ys = np.linspace(0, 28.99, H)
    xs = np.linspace(0, 52.99, W)
    y0, x0 = ys.astype(int), xs.astype(int)
    fy, fx = (ys - y0)[:, None], (xs - x0)[None, :]
    v = (g[y0][:, x0] * (1 - fx) + g[y0][:, x0 + 1] * fx) * (1 - fy) + (g[y0 + 1][:, x0] * (1 - fx) + g[y0 + 1][:, x0 + 1] * fx) * fy
    yrel = np.arange(H)[:, None] / H
    v = v * (0.4 + 0.8 * yrel) * (yrel > 1 - band)
    a = np.zeros((H, W, 4), np.float32)
    a[..., :3] = srgb(col)
    a[..., 3] = np.where(v > thresh, alpha, 0)
    return a


def rain_layer(name):
    a = np.zeros((H + 30, W, 4), np.float32)
    a[..., :3] = srgb("#4a5a80")
    r = np.random.RandomState(9)
    for _ in range(70):
        x = r.randint(0, W)
        y = r.randint(0, H + 30)
        L = r.randint(10, 26)
        a[y:y + L, x, 3] = 1
    return a


def ring_layer(name, O, col):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.hypot((xx - O[0]) / 1.6, (yy - O[1]) / 0.55)
    r = np.random.RandomState(len(name))
    n = r.rand(H, W)
    a = np.zeros((H, W, 4), np.float32)
    a[..., :3] = srgb(col)
    a[..., 3] = ((d > 150) & (d < 190) & (n > 0.25)).astype(np.float32)
    return a


def animate(sc, MAD, SUS, DRAGON, EN, CW, CC, CV, CI):
    animate_world(sc, MAD, SUS, DRAGON, EN, CC, CV)
    inserts(sc, CI)


def disc_img(name, col, ring=0.0, ragged=False, seed=1, n=96):
    """a filled disc (or a ring of the given inner fraction), its rim ragged like a blast if asked."""
    yy, xx = np.mgrid[0:n, 0:n]
    d = np.hypot(xx - n / 2 + 0.5, yy - n / 2 + 0.5) / (n / 2)
    if ragged:
        ang = np.arctan2(yy - n / 2, xx - n / 2)
        r = np.random.RandomState(seed)
        k = r.rand(12)
        d = d * (1 + 0.12 * np.sin(ang * 7 + k[0] * 6) + 0.08 * np.sin(ang * 13 + k[1] * 6))
    a = np.zeros((n, n, 4), np.float32)
    a[..., :3] = srgb(col)
    a[..., 3] = ((d < 1) & (d >= ring)).astype(np.float32)
    return make_image(name, a)
