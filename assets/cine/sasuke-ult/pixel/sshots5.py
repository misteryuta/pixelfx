"""Sasuke ultimate, version 5: the user's shot script, on the user's panels.

  S1  his eyes: Mangekyou right, Rinnegan left; calm, held for a breath ............... 1-36
  S2  the seal closes; the camera stays still .......................................... 37-64
  S3  dark chakra rises round the opponent: Amaterasu spikes thrust through (swappable) .. 65-116
  S4  Sasuke in the air turning into the attack, the rope belt swinging; the Chidori
      ignites in his left hand, short sparks between the fingers; violet chakra closes in . 117-160
  S5  the violet chakra parts on his Susanoo ............................................. 161-190
  S6  wide: the winged Susanoo small before the vast sphere, its charged hand the brightest
      point in the frame .................................................................. 191-240
  S7  his face, close: the jaw sets, he shouts ............................................ 241-268
  S8  side on, the open hand hits the sphere: the FIRST shake; the crackle cuts off, for a
      moment only the spot under the palm glows; then light ................................ 269-336
  S9  violet light breaks out of the sphere ............................................... 337-392
  S10 the shockwave races over the ground, debris rises against the white final flash ...... 393-480
No camera shake, impact frame or flash before the hit. Run: python sshots5.py [--frames a-b] [--every n] [--target png]"""
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
from shots import glint
import sshots3 as v3
import sshots4 as v4
from sshots3 import Shot, cam_of, WHITE, CYAN, CYAN2, PINK, PINK2, PURP, PURP2, SMOKE

VIOLET = [hexc("#2a0e4a"), hexc("#5a1e9a"), hexc("#9a4ae8"), hexc("#d8a8ff")]
_real_shake = old.shake


def still(fn):
    """Run a frame with the camera shake switched off (nothing shakes before the hit)."""
    def run(*a, **k):
        old.shake = lambda *x, **y: (0, 0)
        try:
            return fn(*a, **k)
        finally:
            old.shake = _real_shake
    return run


class S1(v3.S1):  # the eyes, calm; held a breath
    def frame(s, i, n):
        cam = cam_of([(0, (420, 244, 800), "s"), (n - 1, (420, 248, 740), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        return img


class S2(v3.S2):  # the seal: still camera; the panel's dark flames drift up a little
    def frame(s, i, n):
        cam = cam_of([(0, (420, 232, 720), "s"), (n - 1, (420, 230, 700), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        return img

    def post(s, i, n):
        return []


class S3(v4.S3):  # Amaterasu through the opponent, without shake or impact frame
    impact = False

    def frame(s, i, n, layers=None):
        return still(super().frame)(i, n, layers)

    def post(s, i, n):
        return [(SMOKE[0], ease_in((i - (n - 4)) / 3))]


class S4(v3.S4):  # in the air: the rope swings, the Chidori ignites with short sparks, violet chakra closes in
    def __init__(s):
        super().__init__()
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        rope = (a[..., 0] > a[..., 1] + 25) & (a[..., 2] > a[..., 1] + 30) & (lum(a) > 70) & (lum(a) < 200)
        box = (xx > 60) & (xx < 335) & (yy > 205) & (yy < 430)
        s.rope = dil(rope & box, 1) & box & (rope | (lum(a) < 60))
        ground = tones(a, ~dil(s.rope, 4) & (yy > 200) & (xx < 400) & (old.sat(a) > 0.3), 4, 404)
        plate = s.Lp.lv[-1][1].copy()
        fill_by_tones(plate, s.rope, xx.astype(float), yy.astype(float), ground, 40, 22, 405, angle=0.6)
        s.plate2 = snap(plate, s.pal)
        s.full = a.copy()
        s.pal = np.concatenate([s.pal, VIOLET])

    def frame(s, i, n):
        # the art with the rope swung: rows of the rope shifted by whole pixels, more toward its free end
        art = s.plate2.copy()
        ys, xs = np.nonzero(s.rope)
        f = np.clip((ys - 300) / 120.0, 0, 1) + np.clip((200 - xs) / 140.0, 0, 1) * 0.6
        dx = np.round(4 * f * np.sin(i * 0.32 - ys * 0.025)).astype(int)
        nx = np.clip(xs + dx, 0, 839)
        art[ys, nx] = s.full[ys, xs]
        reach = 6 + 120 * ease_out((i - 6) / 16) if i >= 6 else 0
        m = dil(s.glow, 2) & (s.d < reach)
        art[m] = s.art[m]
        L = Layer(art, None, s.pal, levels=(1.0, 0.75, 0.5))
        cam = cam_of([(0, (430, 250, 820), "s"), (n - 1, (520, 232, 660), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, L)
        if reach > 0:
            v3.shimmer(img, sample(cam, s.glow & (s.d < reach)), i, 41)
            px, py = cam.P(*s.C)
            v3.bolts_at(img, px, py, min(reach, 50) * cam.r, i, 4, 5)  # short sparks between the fingers
        V0 = n - 14
        if i >= V0:  # violet chakra closes in from the edges
            u = ease_in((i - V0) / 13)
            X, Y = cam.grid()
            d = np.hypot((XX - W / 2) / (W / 2), (YY - H / 2) / (H / 2))
            nz = noise_at(X, Y + i * 6.0, 30, 46, 406, 3)
            v = d + nz * 0.5 + u * 1.6
            for k, th in enumerate((1.5, 1.62, 1.74, 1.86)):
                img[v > th] = VIOLET[3 - k]  # a pale front, deep violet behind it
        return img

    def post(s, i, n):
        return [(hexc("#05030a"), 1 - ease(i / 4))]


class S5(v4.S5):  # the violet chakra parts on the Susanoo
    def __init__(s):
        super().__init__()
        s.pal = np.concatenate([s.pal, VIOLET])

    def frame(s, i, n):
        cam = cam_of([(0, (520, 230, 760), "s"), (n - 1, (470, 220, 700), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        v3.shimmer(img, sample(cam, s.glow), i, 51)
        px, py = cam.P(*s.C)
        v3.bolts_at(img, px, py, 60 * cam.r, i, 5, 5)
        if i > n * 0.45:
            img[sample(cam, s.eye)] = hexc("#ff3a5a")
        u = 1 - ease_out(i / 18)
        if u > 0:  # the chakra clears outward from the centre
            X, Y = cam.grid()
            d = np.hypot((XX - W / 2) / (W / 2), (YY - H / 2) / (H / 2))
            nz = noise_at(X, Y + i * 6.0, 30, 46, 406, 3)
            v = d + nz * 0.5 + u * 2.4 - 0.9
            for k, th in enumerate((0.9, 1.02, 1.14, 1.26)):
                img[v > th] = VIOLET[3 - k]
        return img

    def post(s, i, n):
        return []


class S6(v3.S6):  # wide: the Susanoo small before the sphere, its hand the brightest point
    def frame(s, i, n):
        cam = cam_of([(0, (430, 236, 840), "s"), (n - 1, (390, 240, 700), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        if (i // 3) % 2:
            img[sample(cam, s.rim)] = hexc("#ff6a8a")
        v3.shimmer(img, sample(cam, s.glow), i, 61)
        px, py = cam.P(*s.C)
        g = 0.5 + 0.5 * math.sin(i * 0.5)
        disc_screen(img, px, py, (5 + 3 * g) * cam.r * 1.4, CYAN2)
        disc_screen(img, px, py, (3 + 2 * g) * cam.r * 1.4, WHITE)
        v3.bolts_at(img, px, py, 30 * cam.r, i, 6, 4)
        return img

    def post(s, i, n):
        return []


class S7(v3.S8):  # his face: the jaw sets, the shout; the Susanoo surges (streaks at the end)
    def frame(s, i, n):
        cam = cam_of([(0, (420, 236, 720), "s"), (n - 10, (380, 240, 600), "s"), (n - 1, (360, 236, 520), "o")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        if i >= n - 10:
            r = np.random.default_rng(800 + i)
            speed_lines(img, r, 26, 1.0, -0.12, PINK2, (80, 260), PINK)
        return img

    def post(s, i, n):
        return []


class S8(v3.S9):  # the hit, side on
    HIT = 10

    def __init__(s):
        super().__init__()
        a = s.art
        dark = (a * 0.35 + hexc("#0a0614") * 0.65).astype(np.int32)
        dp = kmeans_palette(dark, 20, seed=4)
        s.Ld = Layer(snap(dark, dp), None, dp)
        s.pal = np.concatenate([s.pal, dp, [PURP2, PINK2, WHITE, VIOLET[2], VIOLET[3]]])

    def frame(s, i, n):
        H0 = s.HIT
        cam = cam_of([(0, (470, 250, 760), "s"), (H0, (560, 290, 600), "i"), (n - 1, (600, 310, 520), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        hx, hy = cam.P(*s.C)
        if i < H0:  # the hand drives in, crackling
            draw(img, cam, s.L)
            v3.bolts_at(img, hx, hy, 60 * cam.r, i, 9, 6, (PURP2, WHITE))
            return img
        t = i - H0
        if t < 14:  # the crackle stops; only the spot under the palm glows
            draw(img, cam, s.Ld)
            R = (14 + 10 * ease_out(t / 6)) * cam.r * 1.4
            disc_screen(img, hx, hy, R * 1.6, VIOLET[1])
            disc_screen(img, hx, hy, R * 1.1, VIOLET[2])
            disc_screen(img, hx, hy, R * 0.6, VIOLET[3])
            disc_screen(img, hx, hy, R * 0.3, WHITE)
            return shift(img, *_real_shake(i, max(0, 5 - t * 0.6), 81))
        draw(img, cam, s.L)  # then the light: cracks race out from the palm, rock flies
        g = ease_out((t - 14) / 14)
        for pts in s.cracks:
            m = max(2, int(len(pts) * g))
            for (x0, y0), (x1, y1) in zip(pts[:m - 1], pts[1:m]):
                a, b = cam.P(x0, y0), cam.P(x1, y1)
                draw_line(img, *a, *b, PURP2, 3)
                draw_line(img, *a, *b, WHITE, 1)
        starburst(img, hx, hy, (24 + 40 * g) * cam.r * 1.4, [VIOLET[2], VIOLET[3], WHITE], 8200 + t // 2, 16, 1.0)
        for k, (a, sp, sz) in enumerate(s.rocks):
            tt = t - 14 - (k % 6)
            if tt <= 0:
                continue
            x = hx + math.cos(math.pi + a) * sp * tt * 2.0
            y = hy + math.sin(math.pi + a) * sp * tt * 1.4 + 0.35 * tt * tt
            if 0 <= x < W - sz and 0 <= y < H - sz:
                img[int(y):int(y) + sz, int(x):int(x) + sz] = hexc("#1a0a24")
        return shift(img, *_real_shake(i, 3, 82))

    def post(s, i, n):
        return [(WHITE, 1.0 if i == s.HIT else 0.0), (hexc("#f0e4ff"), ease_in((i - (n - 6)) / 5))]


class S9(v3.S11):  # violet light breaks out of the sphere
    def frame(s, i, n):
        img = v3.S11.frame(s, i, n)
        return img

    def post(s, i, n):
        return [(WHITE, 1 - ease(i / 5)), (hexc("#ff7ae8"), 0.4 * ease_in((i - (n - 14)) / 13))]


def rock(cx, cy, r, seed):
    rr = np.random.default_rng(seed)
    return [(cx + math.cos(a) * r * rr.uniform(0.6, 1.0), cy + math.sin(a) * r * rr.uniform(0.55, 0.95))
            for a in np.linspace(0, 2 * math.pi, 7, endpoint=False) + rr.uniform(0, 1)]


class S10(v3.S11):  # the shockwave races over the ground, debris rises against the white final flash
    def __init__(s):
        super().__init__()
        r = np.random.default_rng(1010)
        s.debris = [(r.uniform(-40, W + 40), r.uniform(2.2, 5.5), r.uniform(5, 16), r.uniform(0, 10), int(r.integers(0, 999)))
                    for _ in range(34)]
        s.pal = np.concatenate([s.pal, [hexc("#1a0a24"), hexc("#3a1e4a"), VIOLET[2], VIOLET[3], hexc("#e8d8ff")]])

    def frame(s, i, n):
        cam = cam_of([(0, (560, 205, 640), "s"), (n - 1, (520, 215, 760), "o")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        cx, cy = cam.P(s.SPH[0], s.SPH[1])
        u = ease_out(i / 22)
        gy = H * 0.93
        rr = 30 + 640 * u  # the shockwave: a band of light racing out over the ground, dust kicked up behind it
        for k, (col, th) in enumerate(((hexc("#3a1e4a"), 26), (VIOLET[2], 10), (WHITE, 3))):
            ring_screen(img, cx, gy, rr - k * 4, max(2, int(th * (1 - u * 0.6))), col, (rr - k * 4) * 0.14)
        F = 16
        if i >= F:  # the white final flash: a violet-white burst swallowing the frame
            k = ease_in((i - F) / 18)
            starburst(img, cx, cy, 40 + 700 * k, [VIOLET[2], VIOLET[3], hexc("#e8d8ff"), WHITE], 1050 + (i - F) // 2, 28, 0.8)
        if i >= F + 6:  # debris lifts against the white as dark silhouettes, drifting up and out
            for x0, vy, rad, ph, sd in s.debris:
                t = i - F - 6 - ph
                if t < 0:
                    continue
                y = H + rad - vy * t
                x = x0 + (x0 - cx) * 0.006 * t
                if -rad < y < H + rad:
                    img[poly_mask(W, H, rock(x, y, rad, sd))] = hexc("#1a0a24")
        return shift(img, *_real_shake(i, max(0, 4 - i * 0.1), 83))

    def post(s, i, n):
        return [(WHITE, 0.6 * ease((i - (n - 14)) / 12))]


SHOTS = [("S01", 1, 36, S1), ("S02", 37, 64, S2), ("S03", 65, 116, S3), ("S04", 117, 160, S4), ("S05", 161, 190, S5),
         ("S06", 191, 240, S6), ("S07", 241, 268, S7), ("S08", 269, 336, S8), ("S09", 337, 392, S9),
         ("S10", 393, 480, S10)]


def main():
    v4.SHOTS[:] = SHOTS
    v4.main()


if __name__ == "__main__":
    main()
