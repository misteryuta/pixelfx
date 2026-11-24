"""Madara ultimate, Perfect Susanoo, version 4: the animated panels (shots2) with the reference video's transitions.

Transition by transition, as the reference cuts them (redrawn in pixels, nothing copied):
  in      fade in from white onto Madara's face, the wind in his hair, his eye opens
  1 -> 2  cross-dissolve into the wide shot; the wood dragon rises out of the dust behind him
  2 -> 3  the dragon lunges at the camera until its wood fills the frame, hard cut to the Rinnegan
  3 -> O  the pupil's glow, cross-dissolve to the orb: a violet sphere on falling blue streaks
  O -> 4  the orb fades into the Susanoo's forehead as the Susanoo appears; slow push in, eyes ignite
  4 -> 5  hard cut to the chest under the stars; the flare grows, the camera dives into the blue
  5 -> 6  hard cut to the low angle over the enemy, slow push in
  6 -> 7  hard cut to the arm; the camera rolls, the blade comes out and whips up out of frame
  7 -> 8  the blade comes down slowly over the mountains, hits, the burst grows, the camera falls into it
  8 -> 9  white into the blast, rocks fly, the frame floods cyan
  9 -> 10 hard cut to the valley from above: a streak of light across it, a glowing ring rolls out, the crater
           opens, smoke rings and bursts, the cut mountain top slides; a last blast of rock, white.
Frames at 24 fps: S1 1-36 | S2 37-96 | S3 97-124 | orb 125-148 | S4 149-202 | S5 203-230 | S6 231-280
                  S7 281-324 | S8 325-372 | S9 373-398 | S10 399-480
Run: python shots3.py [--frames a-b] [--every n]"""
import sys, os, math, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pxlib import *
from engine import *
import shots as old
import shots2 as v3
from shots2 import base, dil, sample, disc_screen, ring_screen, WHITE, CYAN, CYAN2, BLUE
from shots import glint

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "frames")


def add_hi(layer, img2, mask2):
    """Give a layer a 2x level (from the source art) for deep zooms."""
    layer.lv.append((2.0, img2, mask2))
    layer.lv.sort(key=lambda t: t[0])


def up2(m):
    return np.repeat(np.repeat(m, 2, 0), 2, 1)


# ------------------------------------------------------------------ S1: as v3 (the eye opens), fades in from white
S1 = v3.S1


# ------------------------------------------------------------------ S2: the dragon rises, then lunges at the camera
class S2(v3.S2):
    def __init__(s):
        super().__init__()
        hi, _ = base("p02", 1680, seed=2)
        hi = snap(hi, s.pal)
        h2, w2 = s.drag.shape[0] * 2, s.drag.shape[1] * 2
        hi = hi[:h2, :w2]
        add_hi(s.L_drag, hi, up2(s.drag)[:hi.shape[0], :hi.shape[1]])
        plate_hi = np.repeat(np.repeat(s.plate, 2, 0), 2, 1)[:hi.shape[0], :hi.shape[1]]
        add_hi(s.L_plate, plate_hi, None)

    def frame(s, i, n):
        h = s.art.shape[0]
        L = n - 14  # the lunge starts here
        cx, cy, vis = track(i, [(0, (430, 400, 520), "s"), (18, (440, 250, 780), "o"), (L, (400, 255, 720), "s"),
                                (n - 1, (196, 262, 210), "i")])
        rise = track(i, [(0, (175.0, 0.06), "s"), (18, (-14.0, -0.012), "o"), (28, (0.0, 0.0), "s")])
        cy = max(cy, rise[0] + vis * H / W / 2 + 1)
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        bob = 3 * math.sin((i - 28) * 0.3) if 28 < i < L else 0
        # the lunge: the dragon itself surges toward the lens as the camera falls into its head
        lunge = ease_in((i - L) / 13) if i >= L else 0.0
        draw(img, cam, s.L_drag, oy=rise[0] + bob, rot=rise[1] - 0.05 * lunge, sc=1 + 0.35 * lunge, pivot=(196, 262))
        X, Y = cam.grid()
        gy = h * 0.92
        top = gy - 40 - 260 * ease_out(i / 26)
        life = 1 - ease((i - 24) / 26)
        if life > 0:
            nz = noise_at(X, Y + i * 3.2, 90, 56, 29, 2)
            env = np.clip((Y - top) / 120, 0, 1) * life
            d = nz * (0.3 + 0.8 * env)
            img[d > 0.52] = s.dcols[0]
            img[d > 0.64] = s.dcols[1]
        for k, (x, y, vx, vy, sw, sh, c) in enumerate(s.chips):
            t = i - (k % 6)
            if t < 0 or i >= L:
                continue
            px, py = cam.P(x + vx * t, y + vy * t + 0.55 * t * t)
            px, py = int(px), int(py)
            if 0 <= px < W - 6 and 0 <= py < H - 6:
                img[py:py + sh, px:px + sw] = s.wcols[c]
        if i >= L:
            r = np.random.default_rng(1200 + i)
            radial_lines(img, r, int(10 + 30 * lunge), W / 2, H / 2, 60 + 80 * (1 - lunge), 260, hexc("#efe2c8"))
        amp = 6 * (1 - i / 24) if i < 24 else (1 if i < 36 else (3 * lunge))
        return shift(img, *old.shake(i, amp, 2))


# ------------------------------------------------------------------ S3: the Rinnegan; the pupil glows
class S3(v3.S3):
    def frame(s, i, n):
        cx, cy, vis = track(i, [(0, (520, 330, 760), "s"), (n - 1, (566, 418, 560), "s")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_art)
        dark = sample(cam, s.dark)
        for x, y0, Lr, v in s.rain:
            y = (y0 + i * v) % (2 * H) - H
            ys = np.arange(max(0, y), min(H, y + Lr))
            if len(ys):
                m = dark[ys, x]
                img[ys[m], x] = s.rc
        p = 0.3 + 0.3 * ease(i / n) + 0.15 * math.sin(i * 0.42)
        blend(img, (230, 214, 255), sample(cam, s.iris), p)
        if i >= 8:
            u = ease((i - 8) / (n - 9))
            px, py = cam.P(566, 418)
            r = 2 + u * 26
            disc_screen(img, px, py, r, hexc("#c4a8ff"), r * 0.9)
            disc_screen(img, px, py, r * 0.62, hexc("#e8dcff"), r * 0.56)
            disc_screen(img, px, py, r * 0.3, WHITE, r * 0.27)
        return shift(img, *old.shake(i, 0 if i < 12 else 1, 3))


# ------------------------------------------------------------------ the orb: a violet sphere on falling blue streaks
class SOrb:
    def __init__(s):
        r = np.random.default_rng(140)
        s.streaks = [(int(r.integers(0, W)), int(r.integers(-H, H)), int(r.integers(20, 90)), int(r.integers(8, 22)),
                      int(r.integers(0, 3))) for _ in range(150)]
        s.bg = np.array([4, 8, 40])
        s.scol = [hexc("#0c2a9a"), hexc("#1d4ce0"), hexc("#3a74ff")]
        s.ocol = [hexc("#8e3cc8"), hexc("#c860e6"), hexc("#ea98f4"), hexc("#ffd6ff"), WHITE]
        s.pal = np.array([s.bg] + s.scol + s.ocol)
        yy, xx = np.mgrid[0:H, 0:W]
        s.yy, s.xx = yy, xx

    def frame(s, i, n):
        img = blank(W, H, s.bg)
        for x, y0, L, v, c in s.streaks:
            y = (y0 + i * v) % (2 * H) - H
            img[max(0, y):max(0, min(H, y + L)), x] = s.scol[c]
        R = 62 - 14 * ease(i / n) + 2 * math.sin(i * 0.8)
        cx, cy = W / 2, H / 2 - 4
        d = np.hypot(s.xx + 0.5 - cx, s.yy + 0.5 - cy)
        img[d < R + 3] = s.ocol[0]
        img[d < R] = s.ocol[1]
        # light from the upper left: rings of lighter violet toward a white core
        d2 = np.hypot(s.xx + 0.5 - (cx - R * 0.22), s.yy + 0.5 - (cy - R * 0.22))
        img[(d < R) & (d2 < R * 0.78)] = s.ocol[2]
        img[(d < R) & (d2 < R * 0.42)] = s.ocol[3]
        img[(d < R) & (d2 < R * 0.16)] = s.ocol[4]
        return shift(img, *old.shake(i, 1 if i < 6 else 0, 140))


# ------------------------------------------------------------------ S4: the Susanoo appears, slow push in
class S4(v3.S4):
    def frame(s, i, n):
        cx, cy, vis = track(i, [(0, (566, 300, 1000), "s"), (n - 1, (566, 300, 700), "s")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        u = (i + 4) / 26
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        art = img.copy()
        draw(art, cam, s.L_art)
        rt = sample(cam, s.rt)
        vm = rt < u
        img[vm] = art[vm]
        lines = sample(cam, s.lines)
        front = (rt >= u) & (rt < u + 0.035) & lines
        img[front] = CYAN2
        img[front & (rt < u + 0.012)] = WHITE
        if i < 34:
            img[sample(cam, s.eyes) & vm] = np.array([40, 8, 30])
        for k, (x, y, vx, vy, c) in enumerate(s.sparks):
            t = (i + k * 3) % 40
            px, py = cam.P(x + vx * t, y + vy * t)
            px, py = int(px), int(py)
            if 0 <= px < W - 1 and 0 <= py < H - 1:
                img[py, px] = (WHITE, CYAN, CYAN2)[c]
                if c == 0:
                    img[py + 1, px] = CYAN
        if 34 <= i < 41:
            for ex in (530, 616):
                gx, gy = cam.P(ex, 296)
                glint(img, int(gx), int(gy), max(1, int((7 - (i - 34)) * cam.r * 1.4)), "#ffffff")
        if hasattr(s, "extra"):
            s.extra(img, cam, i, n)
        amp = 3 if 34 <= i < 38 else (1 if 38 <= i < 44 else 0)
        return shift(img, *old.shake(i, amp, 4))


# ------------------------------------------------------------------ S5: the chest; the flare grows, dive into the blue
class S5(v3.S5):
    def frame(s, i, n):
        D = n - 7  # the dive
        dive = ease_in((i - D) / 6) if i >= D else 0.0
        cx, cy, vis = track(i, [(0, (380, 300, 820), "s"), (D, (360, 330, 780), "s"), (n - 1, (470, 220, 480), "i")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1], roll=0.04 * dive, margin=0.08)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_art)
        bx, by = cam.P(*s.C)
        g = ease_out(i / 12)
        r = np.random.default_rng(55 + i // 2)
        for k in range(14):
            a = k * (2 * math.pi / 14) + i * 0.05 + r.uniform(-0.05, 0.05)
            L = r.uniform(140, 460) * g
            draw_line(img, bx, by, bx + math.cos(a) * L, by + math.sin(a) * L, WHITE if k % 2 else CYAN, 1 + (k % 3 == 0))
        disc_screen(img, bx, by, 6 + 30 * g, CYAN2)
        disc_screen(img, bx, by, 3 + 20 * g, WHITE)
        if i >= 6:
            rr = (i - 6) * 24 * cam.r
            ring_screen(img, bx, by, rr, 3, WHITE)
        for _ in range(int(40 * g)):
            img[int(r.integers(0, H)), int(r.integers(0, W))] = WHITE
        if i >= D:
            radial_lines(img, r, int(12 + 40 * dive), W / 2, H / 2, 30 + 90 * (1 - dive), 280, CYAN2)
        return shift(img, *old.shake(i, 3 if i < 6 else 1, 5))


# ------------------------------------------------------------------ S6: the low angle, slow push in
class S6(v3.S6):
    def frame(s, i, n):
        # push in over the Susanoo rising above the enemy (the rise is kept from v3)
        cx, cy, vis = track(i, [(0, (450, 240, 840), "s"), (n - 1, (430, 215, 680), "s")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        for x, y, L, v in s.wind:
            xx = int((x - i * v) % (W + 60)) - 30
            draw_line(img, xx, y, xx + L, y, hexc("#d4d6e2"))
        up = track(i, [(0, (60.0, 0.93, 0.04), "s"), (30, (0.0, 1.0, 0.0), "o")])
        breathe = 1.5 * math.sin(i * 0.25) if i > 30 else 0
        ok = draw(img, cam, s.L_su, oy=up[0] + breathe, sc=up[1], rot=up[2], pivot=(345, 470))
        p = 0.25 + 0.25 * math.sin(i * 0.5)
        X, Y = cam.grid()
        Yl = (Y - up[0] - breathe - 470) / up[1] + 470
        Xl = (X - 345) / up[1] + 345
        h, w = s.outline.shape
        sx, sy = np.clip(Xl.astype(int), 0, w - 1), np.clip(Yl.astype(int), 0, h - 1)
        blend(img, (210, 245, 255), s.outline[sy, sx] & ok, p)
        s.fog.apply(img, cx * cam.r * 1.4 - i * 3)
        if 18 <= i < 28 and i % 3 != 2:
            r = np.random.default_rng(600 + i)
            for _ in range(3):
                bx, by = cam.P(r.uniform(350, 500), r.uniform(90 + up[0], 225 + up[0]))
                draw_pts(img, bolt(r, bx, by, bx + r.uniform(-70, 70), by + r.uniform(-50, 50), 7, 6),
                         WHITE if r.random() < 0.6 else CYAN2)
        return shift(img, *old.shake(i, 2 if 18 <= i < 24 else 0, 6))


# ------------------------------------------------------------------ S7: the arm, the camera rolls, whip out
class S7(v3.S7):
    def frame(s, i, n):
        # v3's draw, seen through a slowly rolling camera
        roll = 0.07 * ease(i / n) - 0.03
        s._roll = roll
        return super().frame(i, n)


def _cam7(cx, cy, vis, w, h, roll=0.0, margin=0.0):
    return clampcam(cx, cy, vis, w, h, roll=roll, margin=margin)


# patch S7's camera to roll: v3.S7.frame builds it with clampcam(cx, cy, vis, w, h); wrap that one call
_orig7 = v3.S7.frame


def _frame7(s, i, n):
    roll = getattr(s, "_roll", 0.0)
    real = v3.clampcam
    v3.clampcam = lambda cx, cy, vis, w, h, roll_=roll, **k: real(cx, cy, vis, w, h, roll=roll_, margin=0.1)
    try:
        return _orig7(s, i, n)
    finally:
        v3.clampcam = real


v3.S7.frame = _frame7


# ------------------------------------------------------------------ S8: the blade comes down slowly, falls into the burst
class S8:
    HIT = 18

    def __init__(s):
        s.o = old.S8()
        s.pal = s.o.pal

    def frame(s, i, n):
        o, HIT = s.o, s.HIT
        img = o.plate.copy()
        ang = -0.2 * (1 - ease_in(i / HIT)) if i < HIT else 0.0
        a, b, (nx, ny), m = o.blade(img, ang)
        r = np.random.default_rng(800 + i // 2)
        for k in range(5):
            t = 0.12 + k * 0.19 + r.uniform(-0.03, 0.03)
            x0, y0 = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            draw_pts(img, bolt(r, x0 - nx * 30, y0 - ny * 30, x0 + 6, y0 + 22, 4, 4), WHITE, 2 if k % 2 else 1)
        if i >= HIT:
            u = ease_out((i - HIT) / 12)
            vis = o.bt < u * 1.25
            img[vis & o.burst] = o.art[vis & o.burst]
            front = (o.bt >= u * 1.25) & (o.bt < u * 1.25 + 0.03) & o.burst
            img[front] = WHITE
            for k, (x, y, vx, vy, sz, c) in enumerate(o.debris):
                t = i - HIT - (k % 4)
                if t < 0:
                    continue
                qx, qy = int(x + vx * t), int(y + vy * t + 0.35 * t * t)
                if 0 <= qx < 556 and 0 <= qy < 311:
                    img[qy:qy + sz, qx:qx + sz] = (CYAN, BLUE, WHITE)[c]
        F = n - 10  # fall into the burst: the white swallows the frame from the impact
        if i >= F:
            u = ease_in((i - F) / 9)
            d = np.hypot(o.xx - o.IMP[0], o.yy - o.IMP[1])
            img[d < u * 600] = WHITE
            img[(d < u * 600 + 18) & (d >= u * 600)] = CYAN2
        cx, cy = old.path(i, [(0, 20, 0), (HIT, 40, 26), (n, 70, 40)])
        amp = 0 if i < HIT else max(1, 6 - (i - HIT) * 0.25)
        sx, sy = old.shake(i, amp, 8)
        out = crop(img, cx + sx, cy + sy, W, H)
        if i >= F:
            rr = np.random.default_rng(890 + i)
            ix, iy = o.IMP[0] - cx, o.IMP[1] - cy
            radial_lines(out, rr, 26, ix, iy, 40 + 200 * (1 - ease_in((i - F) / 9)), 520, CYAN2)
        return out


# ------------------------------------------------------------------ S9: the blast from inside, flooding cyan
class S9(v3.S9):
    def frame(s, i, n):
        if i == 0:
            return blank(W, H, WHITE)
        if i == 1:
            i = 2  # no black-and-white impact frame here: the reference goes straight into the blast
        return super().frame(i, n)


# ------------------------------------------------------------------ S10: the valley from above
class S10(v3.S10):
    def __init__(s):
        super().__init__()
        s.end = S9()
        a = s.art
        s.su = (a[..., 2] > a[..., 0] + 60) & (a[..., 2] > 140)
        s.su = dil(s.su, 2)
        s.nz = noise_at(S10.xxs.astype(float), S10.yys.astype(float), 14, 14, 1401, 2)
        s.pal = np.concatenate([s.pal, s.end.pal, [hexc("#7ff2ff"), hexc("#1a2036"), hexc("#8a90aa")]])

    def frame(s, i, n):
        E = n - 14  # the closing blast
        cx, cy, vis = track(i, [(0, (420, 290, 800), "s"), (E, (400, 300, 720), "s"), (n - 1, (360, 300, 600), "i")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        sl = track(i, [(0, (0.0, 0.0, 0.0), "s"), (30, (0.0, 0.0, 0.0), "s"), (E, (30.0, 13.0, 0.035), "o")])
        draw(img, cam, s.L_slab, ox=sl[0], oy=sl[1], rot=sl[2], pivot=(470, 160))
        sx, sy = cam.P(*s.SC)
        floor = np.zeros((H, W), bool)
        _, fy = cam.P(0, 252)
        floor[max(0, int(fy)):] = True
        # the slash: a streak of light races across the valley through the Susanoo
        if i < 10:
            u = ease_out(i / 8)
            x0 = -40 + (W + 80) * u
            draw_line(img, x0 - 260, sy - 2, x0, sy - 2, CYAN2, 3)
            draw_line(img, x0 - 120, sy - 2, x0, sy - 2, WHITE, 3)
        # a glowing ring rolls out over the valley floor
        if 4 <= i < 26:
            t = (i - 4) / 22
            rr = 20 + 520 * ease_out(t)
            th = max(2, int(14 * (1 - t)))
            ring_screen(img, sx, sy, rr * cam.r, th, hexc("#7ff2ff"), rr * cam.r * 0.3, floor)
            ring_screen(img, sx, sy, rr * cam.r - th, 2, WHITE, (rr * cam.r - th) * 0.3, floor)
        # the crater opens round the Susanoo
        if i >= 12:
            c = ease_out((i - 12) / 30)
            rx = 70 * c * cam.r
            m = disc_mask(W, H, sx, sy + 6 * cam.r, rx, rx * 0.3)
            img[m & ~sample(cam, s.slab) & ~sample(cam, s.su)] = hexc("#1a2036")
        if (i // 4) % 2:
            img[sample(cam, s.rings)] = hexc("#e2e4f0")
        for k, st in enumerate((14, 22, 32)):
            t = i - st
            if t < 0:
                continue
            rr = (12 + t * (10 - k * 1.5)) * cam.r
            if rr > 520:
                continue
            th = 4 if rr < 160 else (3 if rr < 300 else 2)
            ring_screen(img, sx, sy, rr, th, WHITE if rr < 260 else hexc("#c8cbdc"), rr * 0.26, floor)
        # the land heaves white smoke at the edges
        if 30 <= i < E + 6:
            t = (i - 30) / 30
            for k, (bx, by, s0) in enumerate(((60, 420, 1.0), (180, 450, 0.8), (760, 400, 0.9), (690, 445, 0.7))):
                rr = 70 * s0 * ease_out(t) * cam.r
                if rr < 2:
                    continue
                px, py = cam.P(bx, by)
                d = np.hypot((S10.xxs - px) / rr, (S10.yys - py) / (rr * 0.6))
                lump = d + (s.nz - 0.5) * 0.9
                img[lump < 1.0] = hexc("#c8cbdc")
                d2 = np.hypot((S10.xxs - px + rr * 0.2) / rr, (S10.yys - py + rr * 0.15) / (rr * 0.6))
                img[d2 + (s.nz - 0.5) * 0.9 < 0.7] = hexc("#eef0f8")
        if 30 <= i < E:
            r = np.random.default_rng(1000 + i // 2)
            for _ in range(5):
                t = r.uniform(0, 1)
                x, y = 170 + 300 * t + sl[0], 190 - 40 * t + sl[1] + r.uniform(0, 10)
                px, py = cam.P(x, y)
                rr = r.uniform(3, 8) * cam.r * 1.5
                disc_screen(img, px, py, rr, s.dcols[int(r.integers(0, 2))], rr * 0.7)
        s.fog.apply(img, cx * cam.r * 1.3 + i // 2)
        # the closing blast: grey-white burst, dark rocks fly at the lens, then white
        if i >= E:
            u = (i - E) / 13
            # a spiky burst (two tones), the blast's own rocks thrown at the lens as dark shapes
            R = 30 + 620 * ease_in(u)
            bx0, by0 = cam.P(300 + sl[0], 150 + sl[1])  # the cut mountain blows apart
            r = np.random.default_rng(1300 + (i - E) // 2)
            for col, kR in ((hexc("#8a90aa"), 1.0), (hexc("#c8cbdc"), 0.82), (hexc("#eef0f8"), 0.6)):
                pts = []
                for k in range(28):
                    a = k * 2 * math.pi / 28
                    rad = R * kR * (1.0 if k % 2 else r.uniform(0.55, 0.75))
                    pts.append((bx0 + math.cos(a) * rad, by0 + math.sin(a) * rad * 0.62))
                img[poly_mask(W, H, pts)] = col
            rr = np.random.default_rng(1350)
            for k, (L, x0, y0, bw, bh) in enumerate(s.end.rocks):
                a = k * 2 * math.pi / len(s.end.rocks) + rr.uniform(-0.3, 0.3)
                sp = rr.uniform(220, 420)
                sc = (0.2 + 0.7 * u) * rr.uniform(0.7, 1.1)
                px, py = bx0 + math.cos(a) * (30 + sp * u), by0 + math.sin(a) * (20 + sp * u) * 0.7
                cam2 = Cam(bw / 2 - (px - W / 2) / sc, bh / 2 - (py - H / 2) / sc, W / sc)
                tmp = np.zeros((H, W, 3), np.int32)
                ok = draw(tmp, cam2, L, rot=rr.uniform(-1, 1) * u * 2, pivot=(bw / 2, bh / 2))
                img[ok] = hexc("#1a2036")
            if i >= n - 3:
                img[:] = WHITE
        amp = 1 if i < 20 else (3 if i >= E else 0)
        return shift(img, *old.shake(i, amp, 10, 2))


S10.xxs = np.mgrid[0:H, 0:W][1]
S10.yys = np.mgrid[0:H, 0:W][0]

FADES = {
    "S01_face": lambda i, n: ("#f4fbff", 1 - ease(i / 8)),
    "S09_blast": lambda i, n: ("#7ff2ff", ease((i - (n - 9)) / 8)),
}
# shot -> frames of cross-dissolve from the previous shot (which keeps running underneath)
DISSOLVE = {"S02_dragon": 8, "S00_orb": 8, "S04_form": 10}

SHOTS = [("S01_face", 1, 36, S1), ("S02_dragon", 37, 96, S2), ("S03_eye", 97, 124, S3), ("S00_orb", 125, 148, SOrb),
         ("S04_form", 149, 202, S4), ("S05_burst", 203, 230, S5), ("S06_tower", 231, 280, S6),
         ("S07_draw", 281, 324, S7), ("S08_cut", 325, 372, S8), ("S09_blast", 373, 398, S9),
         ("S10_after", 399, 480, S10)]


def render(cache, k, f):
    name, f0, f1, cls = SHOTS[k]
    if name not in cache:
        t1 = time.time()
        cache[name] = cls()
        print(name, "ready in %.1fs" % (time.time() - t1), flush=True)
    sh = cache[name]
    i, n = f - f0, f1 - f0 + 1
    img = sh.frame(i, n)
    img = snap(np.clip(img, 0, 255), sh.pal)
    fd = FADES.get(name)
    if fd:
        col, kk = fd(i, n)
        if kk > 0:
            img = np.round(img * (1 - kk) + hexc(col) * kk).astype(np.int32)
    return img


def main():
    a = sys.argv
    lo, hi, every = 1, 480, 1
    if "--frames" in a:
        lo, hi = map(int, a[a.index("--frames") + 1].split("-"))
    if "--every" in a:
        every = int(a[a.index("--every") + 1])
    os.makedirs(OUT, exist_ok=True)
    cache = {}
    t0 = time.time()
    for f in range(lo, hi + 1, every):
        for k, (name, f0, f1, cls) in enumerate(SHOTS):
            if f0 <= f <= f1:
                img = render(cache, k, f)
                dk = DISSOLVE.get(name, 0)
                if dk and f - f0 < dk and k > 0:
                    pf1 = SHOTS[k - 1][2]
                    prev = render(cache, k - 1, pf1 + 1 + (f - f0)) if False else None
                    pname, pf0, pf1, pcls = SHOTS[k - 1]
                    if pname not in cache:
                        cache[pname] = pcls()
                    ps = cache[pname]
                    pimg = ps.frame(pf1 - pf0 + 1 + (f - f0), pf1 - pf0 + 1)
                    pimg = snap(np.clip(pimg, 0, 255), ps.pal)
                    u = ease((f - f0 + 1) / (dk + 1))
                    img = np.round(pimg * (1 - u) + img * u).astype(np.int32)
                save_frame(os.path.join(OUT, "%04d.png" % f), img)
    print("frames %d-%d done in %.1fs" % (lo, hi, time.time() - t0))


if __name__ == "__main__":
    main()
