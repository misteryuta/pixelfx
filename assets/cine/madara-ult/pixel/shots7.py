"""Madara ultimate, Perfect Susanoo, version 8 (on top of shots6), with the user's pixel sheets as a guide to timing
and readability (built from the user's panels, orb, turnaround and the rigs, not from those frames):
  - after the dragon flies into the lens, its body wipes past the camera before the cut
  - the orb turns red, and the Susanoo forms round it as a red core shrinking into its brow, blue flames licking up
  - in the chest shot cracks of light run out from the glint across the armour, and the camera pushes into them
  - the drawn blade swings across the frame on the grip, the arm with it, wind streaks behind the point
  - in the valley the camera pans to the big mountain on the right, which blows apart, into the close blast
Run: python shots7.py [--frames a-b] [--every n]"""
import sys, os, math, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pxlib import *
from engine import *
import shots as old
import shots2 as v3
import shots3 as v4
import shots4 as v5
import shots5 as v6
import shots6 as v7
from shots4 import starburst, lumpy, sprite_at, XX, YY, dil, sample, disc_screen, WHITE, CYAN, CYAN2, BLUE

HERE = os.path.dirname(os.path.abspath(__file__))
RED = [hexc("#5a0a1e"), hexc("#b01830"), hexc("#ea3a4a"), hexc("#ff9aa0")]
FLAME = [hexc("#10249a"), hexc("#2a5ae8"), hexc("#5aa0ff"), hexc("#b8e4ff")]


# ------------------------------------------------------------------ S2: the body wipes past the lens
class S2(v7.S2):
    def post_pose(s, p, i, n):
        W0 = n - 7
        if i >= W0:
            t = i - W0
            p["gx"] -= 46 * t + 4 * t * t  # the whole dragon slides by, the body filling the frame
            p["gy"] += 6 * t
        return p

    def frame(s, i, n):
        img = super().frame(i, n)
        if i >= n - 7:  # streaks along the wipe
            r = np.random.default_rng(1700 + i)
            speed_lines(img, r, 24, -1.0, 0.08, hexc("#efe2c8"), (80, 260), WHITE)
        return img


# ------------------------------------------------------------------ the orb turns red before the Susanoo forms
class SOrb(v7.SOrb):
    def __init__(s):
        super().__init__()
        s.pal = np.concatenate([s.pal, RED])

    def frame(s, i, n):
        img = super().frame(i, n)
        R0 = n - 9
        if i >= R0:
            u = ease((i - R0) / 8)
            pink = (img[..., 0] > 170) & (img[..., 2] > 140)
            rim = (img[..., 0] > 140) & (img[..., 1] < 120) & ~pink
            img[pink] = (img[pink] * (1 - u) + RED[2] * u).astype(np.int32)
            img[rim] = (img[rim] * (1 - u) + RED[1] * u).astype(np.int32)
            if u > 0.5:
                light = pink & (img[..., 1] > 120)
                img[light] = RED[3]
        return img


# ------------------------------------------------------------------ S4: the red core shrinks into the brow, flames
class S4(v4.S4):
    def __init__(s):
        super().__init__()
        s.pal = np.concatenate([s.pal, RED, FLAME])

    def extra(s, img, cam, i, n):
        # blue flames lick up round the Susanoo's silhouette (only over the dark sky, never over the armour)
        X, Y = cam.grid()
        dark = (img[..., 0] < 40) & (img[..., 1] < 50) & (img[..., 2] < 90)
        nz = noise_at(X * 1.0, Y + i * 9.0, 26, 60, 4100 + 0, 3)
        side = np.clip(np.abs(X - 566) / 520, 0, 1)
        low = np.clip((Y - 120) / 520, 0, 1)
        g = ease((i - 6) / 20)
        f = nz * (0.45 + 0.6 * np.maximum(side, low)) * g
        for k, thr in enumerate((0.52, 0.6, 0.68, 0.76)):
            img[dark & (f > thr)] = FLAME[k]
        # the red core: the orb, shrinking into the Susanoo's brow as it takes shape
        if i < 30:
            u = ease_in(i / 30)
            px, py = cam.P(566, 300)
            R = (66 * (1 - u) + 2) * cam.r * 2.08
            disc_screen(img, px, py, R + 3, RED[0])
            disc_screen(img, px, py, R, RED[1])
            disc_screen(img, px - R * 0.2, py - R * 0.2, R * 0.6, RED[2])
            disc_screen(img, px - R * 0.35, py - R * 0.35, R * 0.22, RED[3])


# ------------------------------------------------------------------ S5: cracks of light, then into them
class S5(v7.S5):
    def __init__(s):
        super().__init__()
        r = np.random.default_rng(530)
        s.cracks = []

        def grow(x, y, a, L, depth, order):
            pts = [(x, y)]
            for _ in range(int(L / 9)):
                a += r.uniform(-0.45, 0.45)
                x, y = x + math.cos(a) * 9, y + math.sin(a) * 9
                pts.append((x, y))
            s.cracks.append((pts, order))
            if depth < 3:
                for _ in range(2 if depth < 2 else 1):
                    j = int(r.integers(1, len(pts)))
                    grow(pts[j][0], pts[j][1], a + r.choice([-1, 1]) * r.uniform(0.5, 1.1), L * 0.6, depth + 1,
                         order + j / len(pts))
        cx, cy = s.C
        for a in (-1.25, -0.75, -0.25, -1.8):
            grow(cx, cy, a, 230, 0, 0.0)
        s.maxo = max(o for _, o in s.cracks) + 1

    def cam_keys(self, n):
        return [(0, (430, 260, 820), "s"), (n - 8, (440, 250, 660), "s"), (n - 1, (360, 330, 480), "i")]

    def extra(s, img, cam, i, n):
        u = ease((i - 10) / 10)
        if u <= 0:
            return
        for pts, order in s.cracks:
            vis = u * s.maxo * 1.2 - order
            if vis <= 0:
                continue
            m = max(2, int(len(pts) * min(1.0, vis)))
            for (x0, y0), (x1, y1) in zip(pts[:m - 1], pts[1:m]):
                a, b = cam.P(x0, y0), cam.P(x1, y1)
                draw_line(img, *a, *b, CYAN2, 2)
                draw_line(img, *a, *b, WHITE, 1)
        if i >= n - 8:
            r = np.random.default_rng(540 + i)
            radial_lines(img, r, 6 + 3 * (i - (n - 8)), W / 2, H / 2, 70, 300, CYAN2)


# ------------------------------------------------------------------ S7: the draw, then the swing across
class S7(v3.S7):
    G = (575.0, 262.0)  # the grip, in arm space (base 840)
    SW0, SW1 = 18, 30

    def __init__(s):
        super().__init__()
        a = s.art
        h, w = a.shape[:2]
        f = s.B / 560
        poly = poly_mask(w, h, [(x * f, y * f) for x, y in [(432, 250), (470, 238), (562, 282), (562, 316), (500, 316)]])
        light = (a[..., 2] > 200) & (a[..., 1] > 150) & (lum(a) > 120)
        s.lower = np.zeros_like(s.arm)  # the part under the fist stays with the arm: swinging it read as stray shards
        s.arm_only = s.arm & ~s.lower
        s.L_arm = Layer(a, s.arm_only, s.pal)
        s.L_low = Layer(a, s.lower, s.pal)

    def swing(s, i):
        return -1.0 * ease((i - s.SW0) / (s.SW1 - s.SW0))

    def frame(s, i, n):
        cx, cy, vis = track(i, [(0, (560, 250, 500), "s"), (18, (500, 250, 760), "o"), (n - 6, (470, 250, 800), "s"),
                                (n - 1, (300, 120, 800), "i")])
        roll = 0.07 * ease(i / n) - 0.03
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1], roll=roll, margin=0.1)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        rot = track(i, [(0, (0.035,), "s"), (16, (-0.02,), "o"), (24, (-0.012,), "s")])[0]
        sw = s.swing(i)
        k = 225 * (1 - ease_out((i - 4) / 12)) if i >= 4 else 225
        X, Y = cam.grid()
        px, py = s.piv
        c, sn = math.cos(-rot), math.sin(-rot)
        Xa = px + (X - px) * c - (Y - py) * sn  # arm space
        Ya = py + (X - px) * sn + (Y - py) * c
        gx, gy = s.G
        c2, s2 = math.cos(-sw), math.sin(-sw)
        Xb = gx + (Xa - gx) * c2 - (Ya - gy) * s2  # blade space (the swing about the grip undone)
        Yb = gy + (Xa - gx) * s2 + (Ya - gy) * c2
        h, w = s.blade.shape
        bx, by = Xb - s.AX[0] * k, Yb - s.AX[1] * k
        ix, iy = np.floor(bx).astype(int), np.floor(by).astype(int)
        ax, ay = np.floor(Xb).astype(int), np.floor(Yb).astype(int)
        ok = (ix >= 0) & (ix < w) & (iy >= 0) & (iy < h) & (ax >= 0) & (ax < w) & (ay >= 0) & (ay < h)
        ix, iy, ax, ay = np.clip(ix, 0, w - 1), np.clip(iy, 0, h - 1), np.clip(ax, 0, w - 1), np.clip(ay, 0, h - 1)
        ok &= s.blade[iy, ix] & s.strip[ay, ax]
        img[ok] = s.art[iy, ix][ok]
        # the lower blade under the fist swings with it
        lx, ly = np.floor(Xb).astype(int), np.floor(Yb).astype(int)
        ok2 = (lx >= 0) & (lx < w) & (ly >= 0) & (ly < h)
        lx, ly = np.clip(lx, 0, w - 1), np.clip(ly, 0, h - 1)
        ok2 &= s.lower[ly, lx]
        img[ok2] = s.art[ly, lx][ok2]
        draw(img, cam, s.L_arm, rot=rot, pivot=s.piv)
        r = np.random.default_rng(700 + i)
        if 4 <= i < 16:
            for _ in range(8):
                o = r.uniform(-60, 60)
                x0, y0 = cam.P(440 + s.AX[1] * o, 150 - s.AX[0] * o)
                L = r.uniform(50, 140)
                draw_line(img, x0, y0, x0 - s.AX[0] * L, y0 - s.AX[1] * L, CYAN2 if r.random() < 0.5 else WHITE)
        # wind streaks behind the swinging point: arcs along the tip's path
        if s.SW0 <= i < s.SW1 + 6:
            tip = (376.0, 44.0)

            def tip_at(a):
                cc, ss = math.cos(a + rot), math.sin(a + rot)
                d = (tip[0] - gx, tip[1] - gy)
                q = (gx + d[0] * cc - d[1] * ss, gy + d[0] * ss + d[1] * cc)
                return cam.P(q[0], q[1])
            for j in range(4):
                a0 = s.swing(i - 3 - j)
                a1 = sw
                pts = [tip_at(a0 + (a1 - a0) * q / 8) for q in range(9)]
                off = j * 6
                for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
                    draw_line(img, x0, y0 + off, x1, y1 + off, WHITE if j == 0 else CYAN2, 2 if j == 0 else 1)
        if i >= 15 and (i // 2) % 3 != 2:
            for _ in range(2):
                x0, y0 = cam.P(r.uniform(450, 630), r.uniform(180, 290))
                draw_pts(img, bolt(r, x0, y0, x0 + r.uniform(-60, 60), y0 - r.uniform(30, 80), 6, 5), WHITE)
        if i >= n - 6:
            speed_lines(img, r, 18, -s.AX[0], -s.AX[1], CYAN2, (60, 200), WHITE)
        amp = 3 if 15 <= i < 19 else (2 if s.SW0 + 6 <= i < s.SW1 + 2 else 0)
        return shift(img, *old.shake(i, amp, 7))


# ------------------------------------------------------------------ S10: pan to the right mountain, it blows apart
class S10(v7.S10):
    B0 = 38  # the blast on the right mountain

    def __init__(s):
        super().__init__()
        s.end = v4.S9()  # its rock sprites
        s.pal = np.concatenate([s.pal, [hexc("#1a2036"), hexc("#8a90aa")]])

    def cam_keys(self, n):
        return [(0, (420, 290, 800), "s"), (34, (440, 270, 740), "s"), (n - 1, (640, 210, 520), "i")]

    def extra(s, img, cam, i, n):
        if i < s.B0:
            return
        t = i - s.B0
        bx, by = cam.P(650, 185)
        R = (16 + 60 * ease_out(t / 5)) * cam.r * 1.6
        starburst(img, bx, by, R, [hexc("#c8cbdc"), hexc("#eef0f8"), WHITE], 3000 + t // 2, 24, 0.7)
        lumpy(img, bx, by + R * 0.45, R * 1.1, R * 0.22, hexc("#eef0f8"), s.nz, 0.8)
        rr = np.random.default_rng(3050)
        for k, (L, x0, y0, bw, bh) in enumerate(s.end.rocks * 2):
            a = rr.uniform(-math.pi, 0.2)
            sp = rr.uniform(6, 16)
            sc = min(0.6, 0.18 + 0.03 * t) * rr.uniform(0.7, 1.1)
            px, py = bx + math.cos(a) * sp * t, by + math.sin(a) * sp * t + 0.4 * t * t
            sprite_at(img, L, bw, bh, px, py, sc, rr.uniform(-1, 1) * 0.1 * t, hexc("#1a2036"))


S1, S3, S6, S8, S9, S11 = v7.S1, v7.S3, v7.S6, v7.S8, v7.S9, v7.S11
SHOTS = [("S01_face", 1, 36, S1), ("S02_dragon", 37, 108, S2), ("S03_eye", 109, 132, S3), ("S00_orb", 133, 154, SOrb),
         ("S04_form", 155, 200, S4), ("S05_burst", 201, 226, S5), ("S06_tower", 227, 266, S6),
         ("S07_draw", 267, 306, S7), ("S08_cut", 307, 370, S8), ("S09_blast", 371, 394, S9),
         ("S10_after", 395, 444, S10), ("S11_end", 445, 480, S11)]


def main():
    v5.SHOTS[:] = SHOTS
    v5.FADES.clear()
    v5.FADES.update(v6.FADES)
    v5.main()


if __name__ == "__main__":
    main()
