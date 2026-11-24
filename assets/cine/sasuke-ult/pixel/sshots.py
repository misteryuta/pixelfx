"""Sasuke ultimate (replaces Chidori Planet Splitter): the user's ten storyboard panels as animated shots on one
1-pixel grid, cut after the reference's beats (built from the user's panels, not from the game's frames).

  S1  eyes: the Sharingan turns, the Rinnegan glows ............................ 1-30
  S2  the seal: black flames (Amaterasu) lick up round him, then swallow the frame 31-66
  S3  Kaguya: her hair streams, black flames creep up her robe ................. 67-110
  S4  Sasuke from above, the Chidori crackling in his hand, flaring to white .... 111-150
  S5  the Susanoo, the Chidori orb in its palm, eyes burning .................... 151-198
  S6  the winged Susanoo shoots at the sphere ................................... 199-228
  S7  the Chidori in the Susanoo's hand, close .................................. 229-282
  S8  Sasuke screams ............................................................. 283-312
  S9  the hand drives into the sphere's wall ................................... 313-366
  S10 light bursts out of the sphere .............................................. 367-420
  S11 the sphere blows apart, white ............................................... 421-480
Run: python sshots.py [--frames a-b] [--every n]"""
import sys, os, math, time
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "madara_px"))
from pxlib import *
from engine import *
import shots as old
from shots2 import tones, sample, disc_screen, ring_screen, dil, close
from shots4 import starburst, lumpy, XX, YY
from shots import glint

OUT = os.path.join(HERE, "frames")
WHITE, CYAN, CYAN2 = hexc("#f6f4ff"), hexc("#5ce6ff"), hexc("#bff6ff")
PINK, PINK2, PURP, PURP2 = hexc("#ff6cf0"), hexc("#ffc8fa"), hexc("#b04ce8"), hexc("#e2a8ff")
BLACKF = [hexc("#070308"), hexc("#1c0a16"), hexc("#3a0e1a")]  # Amaterasu: black with a dark red edge


def base(n):
    return np.load(os.path.join(HERE, "cache", "%s_b840.npy" % n)).astype(np.int32), \
        np.load(os.path.join(HERE, "cache", "%s_b840.pal.npy" % n))


def chidori(img, cx, cy, R, i, seed, cols=(CYAN, CYAN2, WHITE), n=9, core=True):
    """Crackling lightning out of a point: jagged forked bolts, re-drawn every frame, a hot core."""
    r = np.random.default_rng(seed * 1000 + i)
    for k in range(n):
        a = r.uniform(0, 2 * math.pi)
        L = R * r.uniform(0.5, 1.25)
        x1, y1 = cx + math.cos(a) * L, cy + math.sin(a) * L
        pts = bolt(r, cx, cy, x1, y1, R * 0.12, 6)
        draw_pts(img, pts, cols[0], 3)
        draw_pts(img, pts, cols[2], 1)
        if r.random() < 0.6:  # a fork
            j = len(pts) // 2
            bx, by = pts[j]
            a2 = a + r.uniform(-0.9, 0.9)
            p2 = bolt(r, bx, by, bx + math.cos(a2) * L * 0.5, by + math.sin(a2) * L * 0.5, R * 0.08, 4)
            draw_pts(img, p2, cols[1], 1)
    if core:
        disc_screen(img, cx, cy, R * 0.32 * r.uniform(0.85, 1.15), cols[0])
        disc_screen(img, cx, cy, R * 0.2 * r.uniform(0.85, 1.15), cols[1])
        disc_screen(img, cx, cy, R * 0.11, cols[2])
    for _ in range(int(R * 0.6)):  # sparks
        a = r.uniform(0, 2 * math.pi)
        d = R * r.uniform(0.3, 1.5)
        x, y = int(cx + math.cos(a) * d), int(cy + math.sin(a) * d)
        if 0 <= x < W and 0 <= y < H:
            img[y, x] = cols[r.integers(0, 3)]


def black_flames(img, X, Y, i, weight, seed=1, speed=7.0):
    """Amaterasu: black flame tongues rising, a dark red rim, where weight (0..1 per pixel) allows."""
    nz = noise_at(X, Y + i * speed, 22, 46, seed, 3)
    f = nz * (0.35 + 0.75 * weight)
    img[f > 0.56] = BLACKF[2]
    img[f > 0.6] = BLACKF[1]
    img[f > 0.64] = BLACKF[0]


# ------------------------------------------------------------------ S1 the eyes
class S1:
    def __init__(s):
        s.art, s.pal = base("p01")
        s.L = Layer(s.art, None, s.pal)
        a = s.art
        s.rin = (a[..., 2] > 150) & (a[..., 0] > 120) & (a[..., 1] < a[..., 2] - 25) & (np.mgrid[0:473, 0:840][1] > 420)
        s.SH = (202.0, 248.0, 33.0)
        s.pal = np.concatenate([s.pal, [WHITE, PURP2, hexc("#ff4040")]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 245, 840), "s"), (n - 1, (420, 248, 700), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        # the Sharingan turns: sample its disc rotated
        X, Y = cam.grid()
        cx, cy, r = s.SH
        inside = (X - cx) ** 2 + (Y - cy) ** 2 < r * r
        a = i * 0.16
        c, si = math.cos(a), math.sin(a)
        sx = cx + (X - cx) * c - (Y - cy) * si
        sy = cy + (X - cx) * si + (Y - cy) * c
        ix, iy = np.clip(sx.astype(int), 0, 839), np.clip(sy.astype(int), 0, 472)
        rot = s.art[iy, ix]
        redish = inside & (rot[..., 0] > 140) & (rot[..., 1] < 80)
        keep = inside & ((s.art[np.clip(Y.astype(int), 0, 472), np.clip(X.astype(int), 0, 839)][..., 0] > 140) |
                         redish)
        img[keep] = rot[keep]
        p = 0.25 + 0.25 * math.sin(i * 0.5)
        blend(img, (226, 200, 255), sample(cam, s.rin), p)
        if i >= n - 8:
            g = (i - (n - 8)) / 7
            for ex, ey in ((202, 248), (650, 250)):
                px, py = cam.P(ex, ey)
                glint(img, int(px), int(py), int(2 + 10 * g), "#ffffff")
        return shift(img, *old.shake(i, 1 if i > n - 6 else 0, 31))


# ------------------------------------------------------------------ S2 the seal, black flames
class S2:
    def __init__(s):
        s.art, s.pal = base("p02")
        s.L = Layer(s.art, None, s.pal)
        s.pal = np.concatenate([s.pal, BLACKF, [WHITE]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 230, 700), "s"), (n - 1, (420, 220, 560), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        X, Y = cam.grid()
        d = np.hypot((X - 420) / 300, (Y - 200) / 260)
        cover = ease_in((i - (n - 8)) / 7) if i >= n - 8 else 0.0  # at the end the flames swallow the frame
        weight = np.clip(d - 0.55, 0, 1) * 1.6 + cover * 1.4
        black_flames(img, X, Y, i, weight, 41)
        if i == 0:
            img[:] = WHITE
        for ex, ey in ((374, 246), (465, 249)):  # the eyes flare as the hands meet
            if 2 <= i < 10:
                px, py = cam.P(ex, ey)
                glint(img, int(px), int(py), int(8 - (i - 2)), "#ffffff")
        return shift(img, *old.shake(i, 3 if i < 6 else 1, 32))


# ------------------------------------------------------------------ S3 Kaguya
class S3:
    def __init__(s):
        s.art, s.pal = base("p03")
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        s.hair = (lum(a) > 175) & (xx > 395) & (yy < 190) & (yy > 15)
        s.hair = dil(s.hair, 1) & (lum(a) > 110) & (xx > 390) & (yy < 195)
        s.L = Layer(a, None, s.pal)
        s.pal = np.concatenate([s.pal, BLACKF, [hexc("#2a0c3a")]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 280, 780), "s"), (n - 1, (440, 230, 700), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        # her hair streams in the wind: a wave travelling along it, growing toward the ends
        X, Y = cam.grid()
        amp = np.clip((X - 395) / 200, 0, 1.3) * 6
        Yh = Y - amp * np.sin(X * 0.045 - i * 0.55)
        ix, iy = np.clip(X.astype(int), 0, 839), np.clip(Yh.astype(int), 0, 472)
        m = s.hair[iy, ix] & (X > 380) & (Y < 230)
        img[m] = s.art[iy, ix][m]
        # black flames creep up from below
        g = ease((i - 6) / 30)
        weight = np.clip((Y - (473 - 190 * g)) / 120, 0, 1)
        black_flames(img, X, Y, i, weight * 1.3, 43, 6.0)
        if i < 4:
            img[:] = (img * (i / 4)).astype(np.int32)
        return shift(img, *old.shake(i, 1 if i > n - 6 else 0, 33))


# ------------------------------------------------------------------ S4 Sasuke from above, the Chidori
class S4:
    def __init__(s):
        s.art, s.pal = base("p04")
        s.L = Layer(s.art, None, s.pal)
        s.C = (642.0, 214.0)
        s.pal = np.concatenate([s.pal, [CYAN, CYAN2, WHITE]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 800), "s"), (n - 1, (520, 225, 600), "i")]), 840, 473,
                       roll=-0.04 * ease(i / n), margin=0.06)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        px, py = cam.P(*s.C)
        chidori(img, px, py, 70 * cam.r * (1 + 0.15 * math.sin(i)), i, 4, n=10)
        if i >= n - 8:  # it flares to white
            u = ease_in((i - (n - 8)) / 7)
            disc_screen(img, px, py, 20 + 560 * u, CYAN2)
            disc_screen(img, px, py, 560 * u, WHITE)
        return shift(img, *old.shake(i, 1 + (i > n - 10) * 2, 34))


# ------------------------------------------------------------------ S5 the Susanoo with the orb
class S5:
    def __init__(s):
        s.art, s.pal = base("p05")
        s.L = Layer(s.art, None, s.pal)
        s.C = (652.0, 269.0)
        a = s.art
        s.eyes = (a[..., 0] > 170) & (a[..., 1] < 120) & (a[..., 2] < 160) & (np.mgrid[0:473, 0:840][1] < 500)
        s.pal = np.concatenate([s.pal, [CYAN, CYAN2, WHITE, hexc("#ff3a3a"), PURP2]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 820), "s"), (n - 8, (470, 230, 680), "s"), (n - 1, (620, 240, 640), "i")]),
                       840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        img[sample(cam, s.eyes)] = hexc("#ff3a3a") if (i // 3) % 2 else img[sample(cam, s.eyes)]
        px, py = cam.P(*s.C)
        chidori(img, px, py, 80 * cam.r * (1 + 0.12 * math.sin(i * 1.3)), i, 5, n=11)
        if i >= n - 4:
            r = np.random.default_rng(500 + i)
            speed_lines(img, r, 12, 1.0, -0.05, PURP2, (80, 240), WHITE)
        if i < 6:  # out of the white of S4
            k = 1 - i / 6
            img[:] = (img * (1 - k) + WHITE * k).astype(np.int32)
        return shift(img, *old.shake(i, 1, 35))


# ------------------------------------------------------------------ S6 the winged Susanoo shoots at the sphere
class S6:
    def __init__(s):
        s.art, s.pal = base("p06")
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        su = (xx < 300) & (a[..., 2] > a[..., 1] + 30) & (lum(a) > 120)
        su = close(su, 2)
        keep = np.zeros_like(su)
        for ys, xs in old.components(su):
            if len(ys) > 800:
                keep[ys, xs] = True
        s.su = dil(keep, 1) & (keep | (lum(a) < 60)) & (xx < 310)
        bg = tones(a, (xx < 330) & ~dil(s.su, 6) & (lum(a) < 120), 3, 61)
        plate = a.copy()
        fill_by_tones(plate, dil(s.su, 2), xx.astype(float), yy.astype(float), bg, 200, 18, 62, angle=0.35)
        s.Lp = Layer(snap(plate, s.pal), None, s.pal)
        s.Ls = Layer(a, s.su, s.pal)
        s.SPH = (650.0, 230.0, 330.0)
        s.pal = np.concatenate([s.pal, [CYAN, CYAN2, WHITE, PINK, PINK2]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 840), "s"), (n - 1, (470, 236, 720), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.Lp)
        r = np.random.default_rng(600 + i)  # speed lines in the air only (the sphere covers them)
        speed_lines(img, r, 18, 1.0, -0.06, hexc("#c89ad8"), (60, 200))
        # the sphere's surface churns: sample it turned a little about its centre
        X, Y = cam.grid()
        cx, cy, R = s.SPH
        ins = (X - cx) ** 2 + (Y - cy) ** 2 < (R * 0.92) ** 2
        a = i * 0.012
        c, si = math.cos(a), math.sin(a)
        sx = cx + (X - cx) * c - (Y - cy) * si
        sy = cy + (X - cx) * si + (Y - cy) * c
        ix, iy = np.clip(sx.astype(int), 0, 839), np.clip(sy.astype(int), 0, 472)
        img[ins] = s.art[iy, ix][ins]
        # it shoots forward, growing as it nears the wall
        u = ease_in(i / (n - 1))
        draw(img, cam, s.Ls, ox=150 * u, oy=-10 * u, sc=1 + 0.25 * u, pivot=(250, 240))
        hx, hy = cam.P(256 + 150 * u + 6 * u, 234 - 10 * u)
        chidori(img, hx, hy, 34 * cam.r * (1 + 0.6 * u), i, 6, n=7)
        return shift(img, *old.shake(i, 1 + u * 2, 36))


# ------------------------------------------------------------------ S7 the Chidori in the hand, close
class S7:
    def __init__(s):
        s.art, s.pal = base("p07")
        s.L = Layer(s.art, None, s.pal)
        s.C = (480.0, 280.0)
        s.pal = np.concatenate([s.pal, [CYAN, CYAN2, WHITE]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 840), "s"), (n - 1, (470, 260, 620), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        px, py = cam.P(*s.C)
        chidori(img, px, py, 150 * cam.r * (1 + 0.1 * math.sin(i * 1.7)), i, 7, n=13)
        r = np.random.default_rng(700 + i)
        for _ in range(3):  # long arcs whipping out across the frame
            a = r.uniform(0, 2 * math.pi)
            pts = bolt(r, px, py, px + math.cos(a) * 320, py + math.sin(a) * 200, 18, 9)
            draw_pts(img, pts, CYAN, 3)
            draw_pts(img, pts, WHITE, 1)
        if i >= n - 3:
            img[:] = WHITE
        return shift(img, *old.shake(i, 2, 37))


# ------------------------------------------------------------------ S8 Sasuke screams
class S8:
    def __init__(s):
        s.art, s.pal = base("p08")
        s.L = Layer(s.art, None, s.pal)
        s.pal = np.concatenate([s.pal, [PINK, PINK2, WHITE, hexc("#ff4040")]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 760), "s"), (n - 1, (400, 260, 600), "i")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        r = np.random.default_rng(800 + i)
        speed_lines(img, r, 22, 1.0, -0.12, PINK2, (60, 200), PINK)
        px, py = cam.P(326, 193)
        if i % 4 < 2:
            glint(img, int(px), int(py), 4, "#ff8080")
        return shift(img, *old.shake(i, 3, 38))


# ------------------------------------------------------------------ S9 the hand drives into the wall
class S9:
    def __init__(s):
        s.art, s.pal = base("p09")
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        su = (xx < 600) & (a[..., 2] > a[..., 1] + 20) & (lum(a) > 70)
        su = close(su, 3)
        keep = np.zeros_like(su)
        for ys, xs in old.components(su):
            if len(ys) > 4000:
                keep[ys, xs] = True
        s.su = dil(keep, 1) & (keep | (lum(a) < 50)) & (xx < 690)
        s.wall = (xx > 560) & ~dil(s.su, 3) & ((lum(a) < 95) | ((a[..., 0] > 150) & (a[..., 1] < 90)))
        s.wall = close(s.wall, 2) & (xx > 560)
        bg = tones(a, (xx < 560) & ~dil(s.su, 6), 3, 91)
        plate = a.copy()
        fill_by_tones(plate, dil(s.su, 2), xx.astype(float), yy.astype(float), bg, 220, 8, 92)
        s.Lp = Layer(snap(plate, s.pal), None, s.pal)
        s.Ls = Layer(a, s.su, s.pal)
        s.HIT = (628.0, 281.0)
        s.EYE = (345.0, 170.0)
        s.pal = np.concatenate([s.pal, [PINK, PINK2, WHITE, PURP2]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 820), "s"), (n - 1, (500, 250, 640), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.Lp)
        # the wall's dark flames flow upward
        X, Y = cam.grid()
        ix, iy = np.clip(X.astype(int), 0, 839), np.clip((Y + i * 4) % 473, 0, 472).astype(int)
        w = sample(cam, s.wall)
        img[w] = s.art[iy, ix][w]
        push = 14 * ease_out(i / 10) + 3 * math.sin(i * 0.9)
        draw(img, cam, s.Ls, ox=push)
        hx, hy = cam.P(s.HIT[0] + push, s.HIT[1])
        chidori(img, hx, hy, 70 * cam.r, i, 9, cols=(PURP, PINK2, WHITE), n=10, core=False)
        ex, ey = cam.P(s.EYE[0] + push, s.EYE[1])
        if (i // 2) % 2:
            glint(img, int(ex), int(ey), 5, "#ffd8ff")
        if i >= n - 4:
            img[:] = WHITE
        return shift(img, *old.shake(i, 2 + (i > n - 14) * 2, 39))


# ------------------------------------------------------------------ S10 light bursts out of the sphere
class S10:
    def __init__(s):
        s.art, s.pal = base("p10")
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        s.SPH = (560.0, 215.0, 165.0)
        d = np.hypot(xx - s.SPH[0], yy - s.SPH[1])
        s.beam = (lum(a) > 120) & (a[..., 2] > a[..., 1] + 30) & (d > s.SPH[2] + 6)
        s.ang = np.arctan2(yy - s.SPH[1], xx - s.SPH[0])
        s.d = d
        s.L = Layer(a, None, s.pal)
        sky = tones(a, ~dil(s.beam, 4) & (d > s.SPH[2] + 20) & (lum(a) < 140), 4, 101)
        plate = a.copy()
        fill_by_tones(plate, dil(s.beam, 2), xx.astype(float), yy.astype(float), sky, 160, 14, 102, angle=-0.3)
        s.plate = snap(plate, s.pal)
        s.pal = np.concatenate([s.pal, [PINK, PINK2, WHITE, PURP, PURP2]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 800), "s"), (n - 1, (520, 225, 640), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        # the beams break out: hidden at first, then they shoot outward from the sphere
        u = ease_out((i - 4) / 16)
        reach = s.SPH[2] + 520 * u
        hide = sample(cam, dil(s.beam, 2) & (s.d > reach))
        img[hide] = sample(cam, s.plate)[hide]
        cx, cy = cam.P(s.SPH[0], s.SPH[1])
        chidori(img, cx, cy, s.SPH[2] * cam.r * 0.9, i, 10, cols=(PURP, PINK2, WHITE), n=8, core=False)
        if i >= n - 10:
            g = ease_in((i - (n - 10)) / 9)
            disc_screen(img, cx, cy, s.SPH[2] * cam.r * (0.3 + 0.9 * g), PINK2)
            disc_screen(img, cx, cy, s.SPH[2] * cam.r * (0.15 + 0.8 * g), WHITE)
        if i < 4:
            k = 1 - i / 4
            img[:] = (img * (1 - k) + WHITE * k).astype(np.int32)
        return shift(img, *old.shake(i, 1 + (i > n - 12) * 3, 40))


# ------------------------------------------------------------------ S11 the sphere blows apart
class S11:
    def __init__(s):
        s.nz = noise_at(XX.astype(float), YY.astype(float), 18, 18, 1101, 2)
        s.pal = np.array([hexc("#1a1028"), hexc("#3a2050"), hexc("#5a2a78"), hexc("#2a0a3a"), PURP, PINK, PINK2, WHITE,
                          hexc("#8a4ad8"), hexc("#ff2ad8")])

    def frame(s, i, n):
        img = blank(W, H, hexc("#1a1028"))
        n2 = noise_at(XX.astype(float) + i * 14, YY.astype(float), 80, 14, 1102, 2)
        img[n2 > 0.6] = hexc("#3a2050")
        cx, cy = W * 0.5, H * 0.52
        d = np.hypot(XX - cx, (YY - cy) * 1.15)
        B = 16  # it bursts here
        r = np.random.default_rng(1160 + i)
        if i < B:  # the sphere throbs, its cracks glowing brighter
            R = 92 + 4 * math.sin(i * 1.4)
            glow = 0.4 + 0.6 * (i / B)
            img[d < R + 10] = hexc("#5a2a78")
            img[d < R] = hexc("#2a0a3a")
            nz = noise_at(XX.astype(float), YY.astype(float) - i * 2, 16, 16, 1103 + i // 3, 2)
            img[(d < R) & (nz > 0.72 - 0.18 * glow)] = hexc("#ff2ad8")
            img[(d < R) & (nz > 0.8 - 0.18 * glow)] = PINK2
            for k in range(14):
                a = k * 2 * math.pi / 14 + i * 0.05
                L = R + 40 + 120 * glow * r.uniform(0.6, 1.0)
                draw_line(img, cx + math.cos(a) * R, cy + math.sin(a) * R, cx + math.cos(a) * L, cy + math.sin(a) * L,
                          PINK if k % 2 else PINK2)
            return shift(img, *old.shake(i, 1 + i // 5, 41))
        t = i - B
        u = ease_out(t / 12)
        starburst(img, cx, cy, 60 + 460 * u, [hexc("#8a4ad8"), PINK, PINK2, WHITE], 1150 + t // 2, 30, 0.75)
        # dark shards of the sphere thrown out through the blast
        frag = (s.nz > 0.66) & (d > 40 + 260 * u) & (d < 120 + 330 * u)
        img[frag] = hexc("#5a2a78")
        radial_lines(img, r, 24, cx, cy, 60 + 120 * u, 380, WHITE)
        if t < 10:
            ring_screen(img, cx, cy, 80 + t * 40, 5, WHITE, (80 + t * 40) * 0.6)
        return shift(img, *old.shake(i, max(0, 7 - t * 0.25), 41))


FADES = {
    "S01": lambda i, n: ("#05030a", 1 - ease(i / 6)),
    "S11": lambda i, n: ("#f6f4ff", ease((i - (n - 24)) / 18)),
}
SHOTS = [("S01", 1, 30, S1), ("S02", 31, 66, S2), ("S03", 67, 110, S3), ("S04", 111, 150, S4), ("S05", 151, 198, S5),
         ("S06", 199, 228, S6), ("S07", 229, 282, S7), ("S08", 283, 312, S8), ("S09", 313, 366, S9),
         ("S10", 367, 420, S10), ("S11", 421, 480, S11)]


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
        for name, f0, f1, cls in SHOTS:
            if f0 <= f <= f1:
                if name not in cache:
                    cache[name] = cls()
                sh = cache[name]
                i, n = f - f0, f1 - f0 + 1
                img = snap(np.clip(sh.frame(i, n), 0, 255), sh.pal)
                fd = FADES.get(name)
                if fd:
                    col, k = fd(i, n)
                    if k > 0:
                        img = np.round(img * (1 - k) + hexc(col) * k).astype(np.int32)
                save_frame(os.path.join(OUT, "%04d.png" % f), img)
    print("frames %d-%d done in %.1fs" % (lo, hi, time.time() - t0))


if __name__ == "__main__":
    main()
