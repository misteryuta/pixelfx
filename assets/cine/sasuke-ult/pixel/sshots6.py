"""Sasuke ultimate, version 6: real motion on top of the v5 script.
Every shot with a figure is split into a background plate and the figure (clean masks from segment.py). The figure
moves against a background that moves differently (parallax, scrolling ground and sky), hair and cloth sway in the
wind (row offsets in whole pixels), fast moves leave smear silhouettes, and nothing is rotated or scaled up.
Run: python sshots6.py [--frames a-b] [--every n] [--target png]"""
import sys, os, math, time
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "madara_px"))
sys.path.insert(0, HERE)
from pxlib import *
from engine import *
import shots as old
from shots2 import tones, sample, disc_screen, ring_screen, dil, close
from shots4 import starburst, XX, YY
import sshots3 as v3
import sshots4 as v4
import sshots5 as v5
from sshots3 import cam_of, WHITE, CYAN, CYAN2, PINK, PINK2, SMOKE
from sshots5 import VIOLET, still, _real_shake


def fg_of(n):
    return np.load(os.path.join(HERE, "cache", "%s_fg.npy" % n))


def plate_of(art, fg, pal, seed, angle=0.0, cell=(60, 24), grow=3, extra=None, region=None):
    """The background with the figure filled out in the background's own tones (whole bands of them)."""
    yy, xx = np.mgrid[0:473, 0:840]
    ex = extra if extra is not None else np.zeros(fg.shape, bool)
    hole = dil(fg, grow) | ex
    t = tones(art, ~dil(fg, grow + 6) & ~ex & (region if region is not None else True), 5, seed)
    p = art.copy()
    fill_by_tones(p, hole, xx.astype(float), yy.astype(float), t, cell[0], cell[1], seed + 1, angle=angle)
    return snap(p, pal)


def tiled(plate, axis=1):
    """The plate and its mirror side by side, so it can scroll without a seam."""
    return np.concatenate([plate, np.flip(plate, axis)], axis)


def draw_scroll(img, cam, L, w, sx=0.0, sy=0.0, axis=1):
    """Draw a mirrored-tiled layer scrolled by (sx, sy), wrapping."""
    if axis == 1:
        o = -(sx % w)
        draw(img, cam, L, ox=o, oy=sy)
        draw(img, cam, L, ox=o + w, oy=sy)
    else:
        o = -(sy % w)
        draw(img, cam, L, ox=sx, oy=o)
        draw(img, cam, L, ox=sx, oy=o + w)


def swayed(art, mask, i, amp, wl=0.035, speed=0.3, ref=(0, 0), grow=(1.0, 0.0)):
    """Art with the masked pixels shifted sideways by a travelling wave (whole pixels), more toward their free end."""
    out = art.copy()
    ys, xs = np.nonzero(mask)
    f = np.clip(((ys - ref[1]) * grow[0] + (xs - ref[0]) * grow[1]) / 140.0, 0, 1.2)
    dx = np.round(amp * f * np.sin(i * speed - ys * wl)).astype(int)
    nx = np.clip(xs + dx, 0, art.shape[1] - 1)
    out[ys, nx] = art[ys, xs]
    return out


def smear(img, cam, L, offs, col):
    """Silhouettes of the figure at earlier positions, flat in one colour (a motion smear)."""
    for ox, oy in offs:
        tmp = np.zeros((H, W, 3), np.int32)
        ok = draw(tmp, cam, L, ox=ox, oy=oy)
        free = ok & (img.sum(2) >= 0)
        img[free] = col


# ------------------------------------------------------------------ S1: the eyes, hair moving in the wind
class S1(v5.S1):
    def __init__(s):
        super().__init__()
        a = s.art
        s.hair = (lum(a) < 80) & (a[..., 2] > a[..., 0]) & (np.mgrid[0:473, 0:840][0] < 260)

    def frame(s, i, n):
        cam = cam_of([(0, (420, 244, 800), "s"), (n - 1, (420, 248, 740), "s")], i)
        art = swayed(s.art, s.hair, i, 2, 0.05, 0.25, ref=(0, 0), grow=(0.0, 0.0))
        art = swayed(s.art, s.hair, i, 2, 0.05, 0.25) if False else art
        ys, xs = np.nonzero(s.hair)
        dx = np.round(2 * np.sin(i * 0.25 - ys * 0.05) * np.clip((260 - ys) / 160, 0, 1)).astype(int)
        art = s.art.copy()
        art[ys, np.clip(xs + dx, 0, 839)] = s.art[ys, xs]
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, Layer(art, None, s.pal, levels=(1.0,)))
        return img


# ------------------------------------------------------------------ S2: the seal; he settles into it, the flames behind drift
class S2(v5.S2):
    def __init__(s):
        super().__init__()
        s.fg = fg_of("p02")
        s.plate = tiled(plate_of(s.art, s.fg, s.pal, 201, angle=0.3), 0)
        s.Lb = Layer(s.plate, None, s.pal, levels=(1.0,))
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        s.hair = s.fg & (lum(a) < 90) & (a[..., 2] > a[..., 0]) & (yy < 250)

    def frame(s, i, n):
        cam = cam_of([(0, (420, 232, 720), "s"), (n - 1, (420, 230, 700), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw_scroll(img, cam, s.Lb, 946, sx=0, sy=-i * 1.5, axis=0)  # the flames behind rise slowly
        rise = round(10 * (1 - ease_out(i / 14)))  # he settles into the seal
        ys, xs = np.nonzero(s.hair)
        art = s.art.copy()
        dx = np.round(2 * np.sin(i * 0.3 - ys * 0.04) * np.clip((250 - ys) / 150, 0, 1)).astype(int)
        art[ys, np.clip(xs + dx, 0, 839)] = s.art[ys, xs]
        draw(img, cam, Layer(art, s.fg, s.pal, levels=(1.0,)), oy=rise)
        return img


# ------------------------------------------------------------------ S4: in the air over the ground, the ground rushing past
class S4(v5.S4):
    def __init__(s):
        super().__init__()
        s.fg = fg_of("p04")
        glowish = (s.art[..., 2] > s.art[..., 0] + 10) | (lum(s.art) > 200)
        ground = plate_of(s.art, s.fg, s.pal, 401, angle=0.6, cell=(40, 22), grow=4, extra=dil(glowish, 3))
        s.gt = tiled(tiled(ground, 1), 0)
        s.Lg = Layer(s.gt, None, s.pal, levels=(1.0,))

    def frame(s, i, n):
        cam = cam_of([(0, (430, 250, 820), "s"), (n - 1, (520, 232, 660), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        # the ground far below rushes back under him (he dives forward and down)
        sx, sy = i * 9.0, i * 6.0
        o1, o2 = -(sx % 1680), -(sy % 946)
        for dx in (0, 1680):
            for dy in (0, 946):
                draw(img, cam, s.Lg, ox=o1 + dx, oy=o2 + dy)
        r = np.random.default_rng(1400 + i)
        speed_lines(img, r, 10, -0.83, -0.55, hexc("#d8b890"), (40, 120))  # over the ground, under him
        # the figure: the rope swings, the Chidori grows (v5's art), and he drifts into the attack
        art = s.plate2.copy()
        ys, xs = np.nonzero(s.rope)
        f = np.clip((ys - 300) / 120.0, 0, 1) + np.clip((200 - xs) / 140.0, 0, 1) * 0.6
        dx = np.round(5 * f * np.sin(i * 0.4 - ys * 0.025)).astype(int)
        art[ys, np.clip(xs + dx, 0, 839)] = s.full[ys, xs]
        reach = 6 + 120 * ease_out((i - 6) / 16) if i >= 6 else 0
        m = dil(s.glow, 2) & (s.d < reach)
        art[m] = s.art[m]
        fgm = s.fg | (dil(s.glow, 2) & (s.d < reach))
        drift = (round(-30 * (1 - ease_out(i / 20))), round(-20 * (1 - ease_out(i / 20))))
        L = Layer(art, fgm, s.pal, levels=(1.0, 0.75, 0.5))
        if i < 10:
            smear(img, cam, Layer(art, fgm, s.pal, levels=(1.0,)), [(drift[0] - 14, drift[1] - 9)], hexc("#3a2a44"))
        draw(img, cam, L, ox=drift[0], oy=drift[1])
        if reach > 0:
            v3.shimmer(img, sample(cam, s.glow & (s.d < reach)), i, 41)
            px, py = cam.P(s.C[0] + drift[0], s.C[1] + drift[1])
            v3.bolts_at(img, px, py, min(reach, 50) * cam.r, i, 4, 5)
        V0 = n - 14
        if i >= V0:
            u = ease_in((i - V0) / 13)
            X, Y = cam.grid()
            d = np.hypot((XX - W / 2) / (W / 2), (YY - H / 2) / (H / 2))
            nz = noise_at(X, Y + i * 6.0, 30, 46, 406, 3)
            v = d + nz * 0.5 + u * 1.6
            for k, th in enumerate((1.5, 1.62, 1.74, 1.86)):
                img[v > th] = VIOLET[3 - k]
        return img


# ------------------------------------------------------------------ S6: the Susanoo flies at the sphere
class S6(v5.S6):
    def __init__(s):
        super().__init__()
        s.fgm = fg_of("p06")
        yy, xx = np.mgrid[0:473, 0:840]
        s.fgm &= xx < 330
        sky = (xx < 360) & (np.hypot(xx - 580, yy - 180) > 300) & (s.art[..., 1] > 40)
        s.plate = plate_of(s.art, s.fgm, s.pal, 601, angle=0.2, cell=(260, 26), region=sky)
        s.Lb = Layer(tiled(s.plate, 1), None, s.pal, levels=(1.0, 0.75, 0.5))
        s.Lf = Layer(s.art, s.fgm, s.pal, levels=(1.0, 0.75, 0.5))

    def frame(s, i, n):
        cam = cam_of([(0, (430, 236, 840), "s"), (n - 1, (420, 240, 760), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.Lb, ox=0)
        if (i // 3) % 2:
            img[sample(cam, s.rim & (np.mgrid[0:473, 0:840][1] > 330))] = hexc("#ff6a8a")
        u = ease_in(i / (n - 1))
        fx, fy = round(-70 + 190 * u), round(16 - 30 * u)  # it flies from far back toward the sphere, accelerating

        draw(img, cam, s.Lf, ox=fx, oy=fy)
        v3.shimmer(img, sample(cam, dil(s.glow, 1)), i, 61) if False else None
        px, py = cam.P(s.C[0] + fx, s.C[1] + fy)
        g = 0.5 + 0.5 * math.sin(i * 0.5)
        disc_screen(img, px, py, (5 + 3 * g) * cam.r * 1.4, CYAN2)
        disc_screen(img, px, py, (3 + 2 * g) * cam.r * 1.4, WHITE)
        v3.bolts_at(img, px, py, 30 * cam.r, i, 6, 4)
        r = np.random.default_rng(600 + i)
        clean = img.copy()
        speed_lines(img, r, 8 + int(10 * u), 1.0, -0.15, hexc("#c89ad8"), (60, 220))
        keep = ~sample(cam, s.air)
        img[keep] = clean[keep]
        return img


# ------------------------------------------------------------------ S7: his face lunges forward, the sky streams past
class S7(v5.S7):
    def __init__(s):
        super().__init__()
        s.fg = fg_of("p08")
        bgc = tones(s.art, ~dil(s.fg, 4), 4, 801)
        s.plate = plate_of(s.art, s.fg, s.pal, 801, angle=-0.1, cell=(200, 12))
        s.Lb = Layer(tiled(s.plate, 1), None, s.pal, levels=(1.0, 0.75, 0.5))
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        s.hair = s.fg & (lum(a) < 80) & (a[..., 2] > a[..., 0])

    def frame(s, i, n):
        cam = cam_of([(0, (420, 236, 720), "s"), (n - 10, (380, 240, 600), "s"), (n - 1, (360, 236, 520), "o")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw_scroll(img, cam, s.Lb, 840, sx=i * 14.0, sy=0)  # the sky streams past
        ys, xs = np.nonzero(s.hair)
        art = s.art.copy()
        dx = np.round(-4 * (0.5 + 0.5 * np.sin(i * 0.6 - ys * 0.05)) * np.clip((xs - 200) / 400, 0, 1)).astype(int)
        art[ys, np.clip(xs + dx, 0, 839)] = s.art[ys, xs]
        lunge = round(26 * (1 - ease_out(i / 10)))  # he pushes forward into the shout
        draw(img, cam, Layer(art, s.fg, s.pal, levels=(1.0, 0.75, 0.5)), ox=lunge)
        r = np.random.default_rng(800 + i)
        speed_lines(img, r, 16, 1.0, -0.1, PINK2, (80, 260), PINK)
        return img


# ------------------------------------------------------------------ S8: the Susanoo drives its hand into the wall
class S8(v5.S8):
    def __init__(s):
        super().__init__()
        s.fg = fg_of("p09")
        yy, xx = np.mgrid[0:473, 0:840]
        s.wall = ~s.fg & (xx > 480)
        s.plate = plate_of(s.art, s.fg, s.pal, 901, angle=0.0, cell=(240, 10))
        s.Lb = Layer(s.plate, None, s.pal, levels=(1.0, 0.75, 0.5))
        s.Lf = Layer(s.art, s.fg, s.pal, levels=(1.0, 0.75, 0.5))
        dark = (s.art * 0.35 + hexc("#0a0614") * 0.65).astype(np.int32)
        s.Lfd = Layer(snap(dark, s.Ld.lv[-1][2] if False else kmeans_palette(dark, 20, seed=4)), s.fg, None, levels=(1.0,))

    def frame(s, i, n):
        H0 = s.HIT
        cam = cam_of([(0, (470, 250, 760), "s"), (H0, (560, 290, 600), "i"), (n - 1, (600, 310, 520), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        # the wall's dark flames churn upward
        X, Y = cam.grid()
        if i < H0:
            draw(img, cam, s.Lb)
            w = sample(cam, np.mgrid[0:473, 0:840][1] > 560)
            ix = np.clip(X.astype(int), 0, 839)
            iy = np.clip((Y + i * 5).astype(int) % 473, 0, 472)
            img[w] = s.art[iy, ix][w]
            push = round(-24 * (1 - ease_in(i / H0)))
            if i >= H0 - 4:
                smear(img, cam, s.Lf, [(push - 16, 0)], hexc("#2a1640"))
            draw(img, cam, s.Lf, ox=push)
            hx, hy = cam.P(s.C[0] + push, s.C[1])
            v3.bolts_at(img, hx, hy, 60 * cam.r, i, 9, 6, (v3.PURP2, WHITE))
            return img
        return v5.S8.frame(s, i, n)


# ------------------------------------------------------------------ S9: the sphere; the clouds stream past
class S9(v5.S9):
    def __init__(s):
        super().__init__()
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        cl = (lum(a) > 150) & (old.sat(a) < 0.35) & (s.d > s.SPH[2] + 10)
        s.cloud = dil(cl, 1) & (cl | (lum(a) < 90)) & (s.d > s.SPH[2] + 5)
        sky = tones(a, ~dil(s.cloud | s.beam, 5) & (s.d > s.SPH[2] + 20), 4, 921)
        p = s.plate.copy()
        fill_by_tones(p, dil(s.cloud, 2), xx.astype(float), yy.astype(float), sky, 160, 14, 922, angle=-0.3)
        s.plate = snap(p, s.pal)
        s.Lc = Layer(a, s.cloud, s.pal, levels=(1.0, 0.75, 0.5))

    def frame(s, i, n):
        img = v3.S11.frame(s, i, n)
        cam = cam_of([(0, (520, 220, 800), "s"), (n - 1, (560, 205, 640), "s")], i)
        c0 = sample(cam, dil(s.cloud, 1))
        img[c0] = sample(cam, s.plate)[c0]
        draw(img, cam, s.Lc, ox=round(-i * 2.5))
        return img


SHOTS = [(nm, a, b, {"S01": S1, "S02": S2, "S04": S4, "S06": S6, "S07": S7, "S08": S8, "S09": S9}.get(nm, c))
         for nm, a, b, c in v5.SHOTS]


def main():
    v4.SHOTS[:] = SHOTS
    v4.main()


if __name__ == "__main__":
    main()
