"""Madara ultimate, Perfect Susanoo, version 6 (on top of shots4):
  - after the bite the dragon itself flies into the lens (the camera holds still) and its wood fills the frame
  - the blade sets down and grinds along the ground for a second (sparks, a glowing furrow, kicked-up grit),
    then the big blue blast erupts
  - the chest shot is calm: the panel reads, the gleam is a crisp star glint, only a few thin rays
Frames at 24 fps: S1 1-36 | S2 37-108 | S3 109-132 | orb 133-154 | S4 155-200 | S5 201-226 | S6 227-266
                  S7 267-306 | S8 307-370 | S9 371-394 | S10 395-444 | S11 445-480
Run: python shots5.py [--frames a-b] [--every n]"""
import sys, os, math, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pxlib import *
from engine import *
import shots as old
import shots2 as v3
import shots4 as v5
from shots4 import starburst, lumpy, XX, YY, base, dil, sample, disc_screen, ring_screen, WHITE, CYAN, CYAN2, BLUE

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "frames")

S1 = v5.S1


class S2(v5.S2):
    def frame(s, i, n):
        h = s.art.shape[0]
        A, Lg, HIT, FLY = 30, 40, 47, 54
        cx, cy, vis = track(i, [(0, (430, 400, 520), "s"), (18, (440, 250, 780), "o"), (A, (420, 280, 760), "s"),
                                (Lg, (300, 320, 640), "s"), (HIT, (210, 340, 600), "s")])
        rise = track(i, [(0, (175.0, 0.06), "s"), (18, (-14.0, -0.012), "o"), (28, (0.0, 0.0), "s")])
        cy = max(cy, rise[0] + vis * H / W / 2 + 1)
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        ex, ey = s.EN
        # rear back, lunge, bite, and then the dragon itself flies at the lens: it grows, its head swings to the
        # middle of the frame and past it, the camera holds still
        mv = track(i, [(0, (0.0, 0.0, 0.0, 1.0), "s"), (A, (0.0, 0.0, 0.0, 1.0), "s"), (Lg, (0.0, -30.0, -0.03, 1.0), "o"),
                       (HIT, (-118.0, 112.0, 0.05, 1.12), "i"), (FLY, (-104.0, 100.0, 0.04, 1.1), "o")])
        if i > FLY:
            u = ease_in((i - FLY) / (n - 1 - FLY))
            hx, hy = cam.cx, cam.cy  # aim the head at the middle of the screen
            tx, ty = hx - 196 + 60 * u, hy - 262 + 30 * u
            mv = (mv[0] + (tx - mv[0]) * ease(u * 1.6), mv[1] + (ty - mv[1] - rise[0]) * ease(u * 1.6),
                  0.04 - 0.12 * u, 1.1 + 1.55 * u)
        bob = 3 * math.sin((i - 28) * 0.3) if 28 < i < A else 0
        draw(img, cam, s.L_drag, ox=mv[0], oy=rise[0] + bob + mv[1], rot=rise[1] + mv[2], sc=mv[3], pivot=(196, 262))
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
            speed_lines(img, r, 16, -1.0, 0.95, hexc("#efe2c8"), (50, 160), WHITE)
        if i > FLY + 4:  # rushing at us
            u = (i - FLY) / (n - 1 - FLY)
            radial_lines(img, r, int(8 + 24 * u), W / 2, H / 2, 150 - 90 * u, 300, hexc("#efe2c8"))
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


S3, SOrb, S4 = v5.S3, v5.SOrb, v5.S4


# ===================================================================== S5: calm; the gleam reads
def diffuse_fill(img, hole, passes=400):
    """Fill thin holes by growing the surrounding colours inward, one pixel ring per pass."""
    img = img.copy()
    hole = hole.copy()
    for _ in range(passes):
        if not hole.any():
            break
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            src_known = np.roll(~hole, (dy, dx), (0, 1))
            take = hole & src_known
            if take.any():
                vals = np.roll(img, (dy, dx), (0, 1))
                img[take] = vals[take]
                hole = hole & ~take
    return img


class S5(v3.S5):
    def __init__(s):
        super().__init__()
        a = s.art
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        L = lum(a)
        bright = (L > 190) | ((a[..., 1] > 190) & (a[..., 2] > 220) & (a[..., 0] < 170))
        big = np.zeros_like(bright)
        for ys, xs in old.components(bright):
            if len(ys) >= 30:  # stars stay, the flare, its rays and the white arcs go
                big[ys, xs] = True
        s.flare = dil(big, 1)
        plate = diffuse_fill(a, s.flare)
        d = np.hypot(xx - s.C[0], (yy - s.C[1]) * 1.4)
        for rr, col in ((150, "#0a1660"), (110, "#071040"), (70, "#050a2c")):  # a dark socket round the eye
            plate[d < rr] = hexc(col)
        s.L_plate = Layer(snap(plate, s.pal), None, s.pal)
        s.dist = np.hypot(xx - s.C[0], yy - s.C[1])
        s.EYE = [(-50, 6), (-24, -12), (18, -18), (52, -8), (26, 6), (-12, 12)]
        s.ecol = [hexc("#4a0610"), hexc("#c81e28"), hexc("#ff5a2a"), hexc("#ffc08a"), hexc("#1a0206")]
        s.pal = np.concatenate([s.pal, s.ecol, [hexc("#0a1660"), hexc("#071040"), hexc("#050a2c"), WHITE, CYAN2]])

    def frame(s, i, n):
        D = n - 6
        dive = ease_in((i - D) / 5) if i >= D else 0.0
        cx, cy, vis = track(i, [(0, (380, 330, 760), "s"), (D, (340, 370, 640), "s"), (n - 1, (320, 395, 500), "i")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1], margin=0.04)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        # the flare (the panel's own) blooms out of the eye only at the end, before the dive
        if i >= D - 6:
            u = ease_in((i - (D - 6)) / 11)
            m = sample(cam, s.flare & (s.dist < 40 + 260 * u))
            art = np.zeros((H, W, 3), np.int32)
            draw(art, cam, s.L_art)
            img[m] = art[m]
        # the red eye, glowing in the dark
        ex, ey = cam.P(*s.C)
        k = cam.r * 1.15
        pulse = 0.5 + 0.5 * math.sin(i * 0.6)
        pts = [(ex + x * k, ey + y * k) for x, y in s.EYE]
        glow = [(ex + x * k * 1.25, ey + y * k * 1.5) for x, y in s.EYE]
        img[poly_mask(W, H, glow)] = s.ecol[0]
        img[poly_mask(W, H, pts)] = s.ecol[1]
        inner = [(ex + x * k * 0.6 + 4 * k, ey + y * k * 0.45 - 1) for x, y in s.EYE]
        img[poly_mask(W, H, inner)] = s.ecol[2] if pulse > 0.3 else s.ecol[1]
        core = [(ex + x * k * 0.25 + 8 * k, ey + y * k * 0.2 - 2) for x, y in s.EYE]
        img[poly_mask(W, H, core)] = s.ecol[3]
        # the gleam: a crisp star on the eye's outer corner that swells and turns
        if i >= 6:
            g = ease_out((i - 6) / 8) * (0.85 + 0.15 * math.sin(i * 0.7))
            gx, gy = ex + 40 * k, ey - 10 * k
            a0 = 0.12 * math.sin(i * 0.15)
            for q in range(4):
                a = a0 + q * math.pi / 2
                L = (64 if q % 2 == 0 else 40) * g
                draw_line(img, gx, gy, gx + math.cos(a) * L, gy + math.sin(a) * L, WHITE, 2)
                draw_line(img, gx, gy, gx + math.cos(a) * L * 1.3, gy + math.sin(a) * L * 1.3, CYAN2, 1)
            disc_screen(img, gx, gy, 3 + 4 * g, WHITE)
        if i >= D:
            r = np.random.default_rng(55 + i)
            radial_lines(img, r, int(6 + 22 * dive), W / 2, H / 2, 60 + 80 * (1 - dive), 280, CYAN2)
        return shift(img, *old.shake(i, 1 if i >= D else 0, 5))


S6, S7 = v5.S6, v5.S7


# ===================================================================== S8: set down, grind along the ground, blast
class S8(v5.S8):
    HIT = 16
    GRIND = 24

    def frame(s, i, n):
        o, HIT, G = s.o, s.HIT, s.GRIND
        X0 = HIT + G  # the blast
        img = o.plate.copy()
        ang = -0.2 * (1 - ease_in(i / HIT)) if i < HIT else 0.0
        # grinding: the blade is dragged on along its own line, the point ploughing the ground
        slide = 0.0 if i < HIT else 46 * ease(min(1.0, (i - HIT) / G))
        tmp = np.zeros_like(img)
        a, b, (nx, ny), m = s.blade(tmp, ang)
        ex, ey = b[0] - a[0], b[1] - a[1]
        L = math.hypot(ex, ey)
        ux, uy = ex / L, ey / L
        ox, oy = int(round(ux * slide)), int(round(uy * slide))
        ys, xs = np.nonzero(m)
        ty, tx = ys + oy, xs + ox
        ok = (ty >= 0) & (ty < 315) & (tx >= 0) & (tx < 560)
        img[ty[ok], tx[ok]] = tmp[ys[ok], xs[ok]]
        a, b = (a[0] + ox, a[1] + oy), (b[0] + ox, b[1] + oy)
        # chakra wisps off the blade
        for k in range(7):
            t = 0.08 + k * 0.13
            bx, by = a[0] + ex * t, a[1] + ey * t + 3
            ph = i * 0.55 + k * 1.7
            Lw = 44 + 12 * math.sin(i * 0.3 + k)
            pts = []
            for j in range(16):
                q = j / 15
                pts.append((bx + 9 * math.sin(q * 5.0 + ph) * q + 14 * q * q, by - Lw * q))
            for j in range(15):
                draw_line(img, *pts[j], *pts[j + 1], WHITE if j < 10 else CYAN2, 3 if j < 4 else (2 if j < 9 else 1))
        cpx, cpy = o.IMP[0] - 30 + ox, o.IMP[1] + oy  # where the point bites the ground
        if HIT <= i < X0 + 4:
            t = i - HIT
            # the furrow it cuts, glowing behind the point
            gx0 = o.IMP[0] - 30
            draw_line(img, gx0, o.IMP[1] + 2, cpx, cpy + 2, CYAN, 5)
            draw_line(img, gx0 + 6, o.IMP[1] + 1, cpx, cpy + 1, WHITE, 2)
            # grit kicked up behind the point, rolling into a low cloud along the furrow
            for k in range(5):
                q = (k + 0.5) / 5
                px, py = gx0 + (cpx - gx0) * q, o.IMP[1] - 4
                rr = 8 + 5 * k * 0.6 + t * 0.7
                old_disc(img, px, py, rr, rr * 0.5, hexc("#4e5470"))
                old_disc(img, px - rr * 0.2, py - rr * 0.15, rr * 0.6, rr * 0.3, hexc("#6a7088"))
            # chips of rock flung up from the point, falling back (each frame's chips keep flying)
            for te in range(max(HIT, i - 14), i + 1):
                r = np.random.default_rng(2500 + te)
                c0x = o.IMP[0] - 30 + ux * (0 if te < HIT else 46 * ease(min(1.0, (te - HIT) / G)))
                for k in range(4):
                    vx, vy = r.uniform(-5, 1.5), r.uniform(-9, -4)
                    dt = i - te
                    px, py = c0x + vx * dt, o.IMP[1] + vy * dt + 0.6 * dt * dt
                    if 0 <= px < 556 and 0 <= py < 311:
                        sz = 1 + k % 3
                        img[int(py):int(py) + sz, int(px):int(px) + sz] = (hexc("#3a4058"), hexc("#8a90aa"))[k % 2]
            # a fan of sparks streaking off the point
            r = np.random.default_rng(2000 + i)
            for k in range(26):
                a2 = r.uniform(-math.pi * 0.98, -math.pi * 0.55)
                L1, L2 = r.uniform(4, 14), r.uniform(18, 60)
                draw_line(img, cpx + math.cos(a2) * L1, cpy + math.sin(a2) * L1, cpx + math.cos(a2) * L2,
                          cpy + math.sin(a2) * L2 * 0.7, (WHITE, CYAN2, CYAN)[k % 3])
            starburst_c(img, cpx, cpy - 4, 18 + 8 * math.sin(i * 1.7), (CYAN, CYAN2, WHITE), 2100 + i)
        if i >= X0:  # the blast erupts
            u = ease_out((i - X0) / 8)
            vis = o.bt < u * 1.3
            img[vis & o.burst] = o.art[vis & o.burst]
            front = (o.bt >= u * 1.3) & (o.bt < u * 1.3 + 0.04) & o.burst
            img[front] = WHITE
            for k, (x, y, vx, vy, sz, c) in enumerate(o.debris + o.debris):
                t = i - X0 - (k % 3)
                if t < 0:
                    continue
                qx, qy = int(x + vx * 1.6 * t), int(y + vy * 1.5 * t + 0.35 * t * t)
                if 0 <= qx < 556 and 0 <= qy < 311:
                    img[qy:qy + sz + 1, qx:qx + sz + 1] = (CYAN, BLUE, WHITE)[c]
            if i - X0 < 5:
                starburst_c(img, o.IMP[0] + 20, o.IMP[1] - 30, 40 + 140 * ease_out((i - X0) / 4), (CYAN, CYAN2, WHITE),
                            2300 + i, 26, 0.75)
            d = np.hypot(o.xx - o.IMP[0], (o.yy - o.IMP[1]) * 2.2)
            rr = 30 + (i - X0) * 34
            img[(d < rr) & (d >= rr - 4) & (o.yy > 150)] = CYAN2
        F = n - 8
        if i >= F:
            u = ease_in((i - F) / 7)
            d = np.hypot(o.xx - o.IMP[0], o.yy - o.IMP[1])
            img[d < u * 600] = WHITE
            img[(d < u * 600 + 18) & (d >= u * 600)] = CYAN2
        cx, cy = old.path(i, [(0, 20, 0), (HIT, 40, 26), (X0, 52, 32), (n, 70, 40)])
        amp = 0 if i < HIT else (2 if i < X0 else max(1, 7 - (i - X0) * 0.3))
        sx, sy = old.shake(i, amp, 8)
        out = crop(img, cx + sx, cy + sy, W, H)
        if i >= F:
            r = np.random.default_rng(890 + i)
            radial_lines(out, r, 26, o.IMP[0] - cx, o.IMP[1] - cy, 40 + 200 * (1 - ease_in((i - F) / 7)), 520, CYAN2)
        return out


def starburst_c(img, cx, cy, R, cols, seed, spikes=18, squash=0.8):
    """starburst() on a canvas of any size."""
    h, w = img.shape[:2]
    r = np.random.default_rng(seed)
    for col, kR in zip(cols, (1.0, 0.72, 0.45)):
        pts = []
        for k in range(spikes):
            a = k * 2 * math.pi / spikes + r.uniform(-0.05, 0.05)
            rad = R * kR * (1.0 if k % 2 else r.uniform(0.4, 0.65))
            pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad * squash))
        img[poly_mask(w, h, pts)] = col


def old_disc(img, cx, cy, rx, ry, col):
    h, w = img.shape[:2]
    img[disc_mask(w, h, cx, cy, rx, ry)] = col


S9, S10, S11 = v5.S9, v5.S10, v5.S11

FADES = dict(v5.FADES)
DISSOLVE = dict(v5.DISSOLVE)
SHOTS = [("S01_face", 1, 36, S1), ("S02_dragon", 37, 108, S2), ("S03_eye", 109, 132, S3), ("S00_orb", 133, 154, SOrb),
         ("S04_form", 155, 200, S4), ("S05_burst", 201, 226, S5), ("S06_tower", 227, 266, S6),
         ("S07_draw", 267, 306, S7), ("S08_cut", 307, 370, S8), ("S09_blast", 371, 394, S9),
         ("S10_after", 395, 444, S10), ("S11_end", 445, 480, S11)]


def main():
    v5.SHOTS[:] = SHOTS
    v5.FADES.clear()
    v5.FADES.update(FADES)
    v5.main()


if __name__ == "__main__":
    main()
