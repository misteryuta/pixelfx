"""Madara ultimate, Perfect Susanoo, version 7 (on top of shots5):
  - the wood dragon is a rig: five body segments, the head and a hinged lower jaw, chained from the body (anchored
    off the right edge) to the head. It rises out of the dust undulating, rears back with its jaws open, strikes
    down at the enemy and snaps them shut, shakes him, then turns and flies at the lens with its mouth open:
    per-segment perspective (the head grows most, the body trails), the camera holds still.
  - the chest shot follows the reference's beats on the user's panel: the starfield and the crystal with Madara
    inside it, a small red glint at the lower left, then the flare erupts from it (rays, a lens line across the
    frame), and fades back, specks drifting, the camera pushing in.
Run: python shots6.py [--frames a-b] [--every n]"""
import sys, os, math, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pxlib import *
from engine import *
import shots as old
import shots2 as v3
import shots4 as v5
import shots5 as v6
from shots4 import starburst, XX, YY, base, dil, sample, disc_screen, WHITE, CYAN, CYAN2, BLUE
from shots3 import add_hi, up2

HERE = os.path.dirname(os.path.abspath(__file__))

# ------------------------------------------------------------------ the dragon rig (panel 2, base 840)
# segments from the root (off the right edge) to the head; each turns about its right-hand joint
SEGS = [("B4", 760, 841, (840, 150)), ("B3", 670, 760, (760, 180)), ("B2", 580, 670, (670, 215)),
        ("B1", 490, 580, (580, 250)), ("B0", 400, 490, (490, 280)), ("HEAD", -1, 400, (400, 300))]
JAW_POLY = [(96, 420), (160, 404), (232, 408), (300, 410), (334, 428), (334, 474), (90, 474)]
HINGE = (318, 410)
OVER = 10  # each segment reaches this far into its parent so turning never opens a seam


class Rig:
    def __init__(s, art, drag, hi, pal):
        h, w = art.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        jaw = poly_mask(w, h, JAW_POLY) & drag
        s.layers = []
        for name, x0, x1, piv in SEGS:
            m = drag & (xx >= x0 - OVER // 2) & (xx < x1 + OVER) & ~jaw
            L = Layer(art, m, pal)
            add_hi(L, hi, up2(m)[:hi.shape[0], :hi.shape[1]])
            s.layers.append((name, L, piv))
        # the mouth behind the jaw: dark, shown only as the jaw drops
        mouth = art.copy()
        mouth[:] = hexc("#1a0a06")
        mouth[jaw & (yy < 428)] = hexc("#3a140a")
        mm = dil(jaw, 2) & (xx < 340)
        s.L_mouth = Layer(mouth, mm, None)
        s.L_jaw = Layer(art, jaw, pal)
        add_hi(s.L_jaw, hi, up2(jaw)[:hi.shape[0], :hi.shape[1]])
        s.head_c = (210.0, 330.0)

    def solve(s, pose):
        """pose: gx, gy, groot (root turn), ang[6] (per joint, positive lifts the head), sc[6], jaw.
        Returns per segment (pivot rest, world pos of pivot, total angle, scale)."""
        out = []
        P = (pose["gx"] + SEGS[0][3][0], pose["gy"] + SEGS[0][3][1])
        th = pose["groot"]
        for k, (name, L, piv) in enumerate(s.layers):
            if k > 0:
                pp = s.layers[k - 1][2]
                d = (piv[0] - pp[0], piv[1] - pp[1])
                c, si = math.cos(th), math.sin(th)
                sk = pose["sc"][k - 1]
                P = (P[0] + (d[0] * c - d[1] * si) * sk, P[1] + (d[0] * si + d[1] * c) * sk)
            th = th + pose["ang"][k]
            out.append((piv, P, th, pose["sc"][k]))
        return out

    def world(s, sol, k, q):
        piv, P, th, sc = sol[k]
        c, si = math.cos(th), math.sin(th)
        d = (q[0] - piv[0], q[1] - piv[1])
        return (P[0] + (d[0] * c - d[1] * si) * sc, P[1] + (d[0] * si + d[1] * c) * sc)

    def teeth(s, img, cam, tf, x0, x1, y, dirn):
        """A zigzag row of wooden fangs along y from x0 to x1 (local), pointing down (1) or up (-1)."""
        k = 0
        x = x0
        while x < x1:
            wdt = 13 if k % 2 == 0 else 9
            hgt = (14 if k % 2 == 0 else 9) * dirn
            pts = [tf((x, y)), tf((x + wdt / 2, y + hgt)), tf((x + wdt, y))]
            spts = [cam.P(*p) for p in pts]
            img[poly_mask(W, H, spts)] = hexc("#2a1810")
            inner = [cam.P(*tf((x + 1.5, y))), cam.P(*tf((x + wdt / 2, y + hgt * 0.8))), cam.P(*tf((x + wdt - 1.5, y)))]
            img[poly_mask(W, H, inner)] = hexc("#e8d6b4")
            x += wdt + 2
            k += 1

    def draw(s, img, cam, pose):
        sol = s.solve(pose)
        for k, (name, L, piv) in enumerate(s.layers):
            pv, P, th, sc = sol[k]
            if name == "HEAD":
                # mouth and jaw first (behind the head's upper jaw), jaw turning down about its hinge
                draw(img, cam, s.L_mouth, ox=P[0] - pv[0], oy=P[1] - pv[1], rot=th, sc=sc, pivot=pv)
                hx, hy = s.world(sol, k, HINGE)
                jth = th - pose["jaw"]

                def jaw_world(q):
                    c, si = math.cos(jth), math.sin(jth)
                    d = (q[0] - HINGE[0], q[1] - HINGE[1])
                    return (hx + (d[0] * c - d[1] * si) * sc, hy + (d[0] * si + d[1] * c) * sc)
                if pose["jaw"] > 0.04:  # teeth: the upper row hangs into the mouth, the lower row rides the jaw
                    s.teeth(img, cam, lambda q: s.world(sol, k, q), 122, 300, 407, 1)
                draw(img, cam, s.L_jaw, ox=hx - HINGE[0], oy=hy - HINGE[1], rot=jth, sc=sc, pivot=HINGE)
                if pose["jaw"] > 0.04:
                    s.teeth(img, cam, jaw_world, 118, 306, 421, -1)
            draw(img, cam, L, ox=P[0] - pv[0], oy=P[1] - pv[1], rot=th, sc=sc, pivot=pv)
        return sol


def lerp_pose(a, b, u):
    return {k: ([x + (y - x) * u for x, y in zip(a[k], b[k])] if isinstance(a[k], list) else a[k] + (b[k] - a[k]) * u)
            for k in a}


def P_(gx=0.0, gy=0.0, groot=0.0, ang=None, sc=None, jaw=0.0):
    return dict(gx=gx, gy=gy, groot=groot, ang=ang or [0.0] * 6, sc=sc or [1.0] * 6, jaw=jaw)


class S2(v5.S2):
    def __init__(s):
        super().__init__()
        hi = s.L_drag.lv[-1][1]  # the 2x art the parent prepared
        s.rig = Rig(s.art, s.drag, hi, s.pal)
        s.pal = np.concatenate([s.pal, [hexc("#1a0a06"), hexc("#3a140a"), hexc("#2a1810"), hexc("#e8d6b4")]])

    def pose(s, i, n):
        A, Lg, HIT, FLY = 30, 40, 47, 54
        keys = [
            (0, P_(gy=175, groot=0.05, ang=[0, 0.02, 0.04, 0.06, 0.08, 0.12], jaw=0.25), "s"),
            (18, P_(gy=-14, groot=-0.01, ang=[0, -0.01, 0.0, 0.02, 0.03, 0.04], jaw=0.1), "o"),
            (28, P_(), "s"),
            (A, P_(), "s"),
            (Lg, P_(gx=10, gy=-24, groot=-0.02, ang=[0, 0.02, 0.04, 0.06, 0.09, 0.14], jaw=0.38), "o"),
            (HIT - 2, P_(gx=-40, gy=40, groot=0.01, ang=[0, -0.02, -0.04, -0.06, -0.09, -0.12], jaw=0.42), "i"),
            (HIT, P_(gx=-46, gy=46, groot=0.01, ang=[0, -0.02, -0.04, -0.07, -0.1, -0.13], jaw=0.0), "i"),
            (FLY, P_(gx=-40, gy=40, groot=0.0, ang=[0, -0.01, -0.03, -0.05, -0.07, -0.08], jaw=0.05), "o"),
        ]
        if i <= FLY:
            for (a, pa, _), (b, pb, e) in zip(keys[:-1], keys[1:]):
                if i <= b:
                    p = lerp_pose(pa, pb, EASE[e]((i - a) / max(1, b - a)))
                    break
            else:
                p = keys[-1][1]
            if HIT <= i < FLY:  # it shakes him in its jaws
                j = 0.04 * math.sin((i - HIT) * 2.2) * (1 - (i - HIT) / (FLY - HIT))
                p["ang"][5] += j
                p["ang"][4] -= j * 0.5
        else:
            u = ease_in((i - FLY) / (n - 1 - FLY))
            p = lerp_pose(keys[-1][1], P_(gx=0, gy=0, groot=-0.05, ang=[0, 0.03, 0.05, 0.07, 0.09, 0.16],
                                         sc=[1.05, 1.15, 1.3, 1.5, 1.75, 2.1], jaw=0.42), ease(min(1.0, u * 1.3)))
            p["sc"] = [1 + (x - 1) * u for x in [1.05, 1.15, 1.3, 1.5, 1.75, 2.1]]
        # always a slow wave travelling down the body
        if i > 6:
            amp = 0.025 if i < FLY else 0.04
            for k in range(1, 6):
                p["ang"][k] += amp * math.sin(i * 0.33 - k * 0.9)
        return p

    def frame(s, i, n):
        h = s.art.shape[0]
        A, Lg, HIT, FLY = 30, 40, 47, 54
        cx, cy, vis = track(i, [(0, (430, 400, 520), "s"), (18, (440, 250, 780), "o"), (A, (420, 280, 760), "s"),
                                (Lg, (330, 320, 660), "s"), (HIT, (250, 330, 620), "s")])
        p = s.pose(i, n)
        cy = max(cy, p["gy"] + vis * H / W / 2 + 1) if i < 18 else cy
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        if i > FLY:
            # aim the flight: the head comes at the middle of the frame
            sol = s.rig.solve(p)
            hx, hy = s.rig.world(sol, 5, s.rig.head_c)
            u = ease((i - FLY) / (n - 1 - FLY) * 1.4)
            p["gx"] += (cam.cx - hx) * u
            p["gy"] += (cam.cy + 20 - hy) * u
        if hasattr(s, "post_pose"):
            p = s.post_pose(p, i, n)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        ex, ey = s.EN
        sol = s.rig.draw(img, cam, p)
        if i < HIT:
            draw(img, cam, s.L_en, ox=ex + (1 if Lg <= i and i % 2 else 0), oy=ey)
        X, Y = cam.grid()
        top = h * 0.92 - 40 - 260 * ease_out(i / 26)
        life = 1 - ease((i - 16) / 16)
        if life > 0:
            nz = noise_at(X, Y + i * 3.2, 90, 56, 29, 2)
            env = np.clip((Y - top) / 120, 0, 1) * life
            d = nz * (0.3 + 0.8 * env)
            img[d > 0.52] = s.dcols[0]
            img[d > 0.64] = s.dcols[1]
        for k, (x, y, vx, vy, sw, sh, c) in enumerate(s.chips):
            t = i - (k % 6)
            if t < 0 or t > 40:
                continue
            px, py = cam.P(x + vx * t, y + vy * t + 0.55 * t * t)
            px, py = int(px), int(py)
            if 0 <= px < W - 6 and 0 <= py < H - 6:
                img[py:py + sh, px:px + sw] = s.wcols[c]
        r = np.random.default_rng(1500 + i)
        if Lg <= i < HIT:
            speed_lines(img, r, 14, -1.0, 0.95, hexc("#efe2c8"), (50, 160), WHITE)
        if i > FLY + 3:
            u = (i - FLY) / (n - 1 - FLY)
            radial_lines(img, r, int(8 + 26 * u), W / 2, H / 2, 150 - 90 * u, 300, hexc("#efe2c8"))
        if HIT <= i < HIT + 22:
            t = i - HIT
            bx, by = cam.P(ex + s.en_w / 2, ey + s.en_h / 2)
            if t < 9:
                R = (20 + 70 * ease_out(t / 4)) * (1 - ease_in((t - 4) / 5) if t > 4 else 1)
                starburst(img, bx, by, R, [hexc("#c9a878"), hexc("#efe2c8"), WHITE], 1600 + t // 2, 22, 0.8)
            rr = np.random.default_rng(1650)
            for k in range(34):
                a = rr.uniform(-math.pi, 0.4)
                sp = rr.uniform(4, 13)
                px, py = bx + math.cos(a) * sp * t, by + math.sin(a) * sp * t + 0.5 * t * t
                if 0 <= px < W - 4 and 0 <= py < H - 4:
                    sz = 1 + k % 3
                    img[int(py):int(py) + sz, int(px):int(px) + sz + 1] = s.splint[k % 3]
        amp = 6 * (1 - i / 24) if i < 24 else (0 if i < Lg else (2 if i < HIT else max(1 if i > FLY else 0, 6 - (i - HIT) * 0.4)))
        return shift(img, *old.shake(i, amp, 2))


# ------------------------------------------------------------------ the chest shot after the reference's beats
class S5(v6.S5):
    CRYSTAL = (465.0, 180.0)

    def __init__(s):
        super().__init__()
        a = s.art
        h, w = a.shape[:2]
        # the plate without the dark socket: the panel with its flare taken out, as v6 does before the socket
        plate = v6.diffuse_fill(a, s.flare)
        s.L_plate = Layer(snap(plate, s.pal), None, s.pal)
        # Madara inside the crystal: the user's turnaround, front view, small and seen through the blue
        t = np.load(os.path.join(HERE, "cache", "turn.npy"))
        crop = t[10:880, 40:420]
        mad = resample_r(crop[..., :3], 38, 87)
        alpha = mask_resample(crop[..., 3] > 128, 38, 87)
        tint = (mad * 0.45 + np.array([40, 90, 200]) * 0.55).astype(np.int32)
        s.L_mad = Layer(tint, alpha, None, levels=(1.0,))
        r = np.random.default_rng(510)
        s.specks = [(r.uniform(0, w), r.uniform(0, h), r.uniform(0.3, 1.2), r.uniform(0.8, 2.2), int(r.integers(1, 3)))
                    for _ in range(120)]
        s.pal = np.concatenate([s.pal, [hexc("#ff3a3a"), hexc("#ffb0a0"), hexc("#7a1020"), hexc("#3a64c8"),
                                        hexc("#6a8ad8")]])

    def frame(s, i, n):
        G0, F0, F1 = 3, 9, 17  # red glint, flare erupts, flare at full
        keys = s.cam_keys(n) if hasattr(s, "cam_keys") else [(0, (430, 260, 820), "s"), (n - 1, (440, 250, 640), "s")]
        cx, cy, vis = track(i, keys)
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1], margin=0.02)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        # Madara floating in the crystal
        mx, my = s.CRYSTAL
        draw(img, cam, s.L_mad, ox=mx - 19, oy=my - 44 + 2 * math.sin(i * 0.3))
        # specks drifting down through the stars
        for x, y, vx, vy, sz in s.specks:
            px, py = cam.P((x + vx * i) % 840, (y + vy * i) % 473)
            if 0 <= px < W - 2 and 0 <= py < H - 2:
                img[int(py):int(py) + sz, int(px):int(px) + sz] = hexc("#dfe8ff")
        bx, by = cam.P(*s.C)
        # the red glint at the lower left
        if G0 <= i < F0 + 2:
            g = ease_out((i - G0) / 4)
            disc_screen(img, bx, by, 6 * g + 1, hexc("#7a1020"), (6 * g + 1) * 0.6)
            disc_screen(img, bx, by, 3 * g + 1, hexc("#ff3a3a"), (3 * g + 1) * 0.6)
            img[int(by), int(bx)] = hexc("#ffb0a0")
        # the flare erupts out of it and settles back
        if i >= F0:
            up = ease_out((i - F0) / (F1 - F0))
            down = ease((i - F1) / (n - F1)) if i > F1 else 0.0
            u = up * (1 - 0.8 * down)
            m = sample(cam, s.flare & (s.dist < 30 + 420 * u))
            art = np.zeros((H, W, 3), np.int32)
            draw(art, cam, s.L_art)
            img[m] = art[m]
            # long rays and a lens line across the frame
            L = (60 + 260 * u)
            for q, (a, lw) in enumerate(((-math.pi / 2, 2), (-math.pi / 2 - 0.5, 1), (-math.pi / 2 + 0.6, 1), (-0.25, 1),
                                        (math.pi + 0.25, 1))):
                draw_line(img, bx, by, bx + math.cos(a) * L * (1 if q == 0 else 0.6), by + math.sin(a) * L * (1 if q == 0 else 0.6),
                          WHITE, lw)
            ly = int(by + 18 * cam.r)
            half = (80 + 420 * u)
            draw_line(img, bx - half, ly, bx + half, ly, WHITE, 2 if u > 0.5 else 1)
            draw_line(img, bx - half * 1.2, ly + 2, bx + half * 1.2, ly + 2, CYAN2, 1)
        if hasattr(s, "extra"):
            s.extra(img, cam, i, n)
        return shift(img, *old.shake(i, 2 if F0 <= i < F0 + 4 else 0, 5))


S1, S3, SOrb, S4, S6, S7, S8, S9, S10, S11 = v6.S1, v6.S3, v6.SOrb, v6.S4, v6.S6, v6.S7, v6.S8, v6.S9, v6.S10, v6.S11
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
