"""Sasuke ultimate, version 2: rebuilt after the reference's beats, shot by shot, with an impact build-up.
No pixel art is scaled or turned except Kaguya's fall; motion comes from integer moves, the camera and drawn effects.

  S1  his eyes (still), a glint ............................................... 1-20
  S2  the seal: the hands meet, a white flash, black flames burst out ......... 21-52
  S3  Amaterasu takes Kaguya: black spears strike into her, black flame spikes
      tear out of her, she tumbles down, dark smoke fills the frame ........... 53-104
  S4  Sasuke from above: the Chidori forms in his hand, a violet flash, white .. 105-150
  S5  violet streaks, the Susanoo with the Chidori, the camera climbs to its eye,
      a whip ..................................................................... 151-196
  S6  the winged Susanoo shoots at the sphere ................................... 197-230
  S7  the hand: the Chidori crackles, a black flame core forms inside it ....... 231-282
  S8  Sasuke screams, the frame flushes red ..................................... 283-314
  S9  the hand breaks the wall: cracks, light, rock ............................. 315-358
  S10 Kaguya in the dark, white light floods in ................................. 359-374
  S11 the sphere from outside: a cross of light, the beams break out, it glows . 375-426
  S12 it bursts: shards and light, white ........................................ 427-480
Run: python sshots2.py [--frames a-b] [--every n]"""
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
from sshots import base, chidori, black_flames, WHITE, CYAN, CYAN2, PINK, PINK2, PURP, PURP2, BLACKF

OUT = os.path.join(HERE, "frames")
RED = hexc("#ff3a4a")


def spike(img, x, y, ang, L, w, cols=(BLACKF[2], BLACKF[0])):
    """A black flame spike from (x,y) pointing along ang, with a dark red rim."""
    ca, sa = math.cos(ang), math.sin(ang)
    nx, ny = -sa, ca
    tip = (x + ca * L, y + sa * L)
    outer = [(x + nx * w, y + ny * w), (x + ca * L * 0.55 + nx * w * 0.5, y + sa * L * 0.55 + ny * w * 0.5), tip,
             (x + ca * L * 0.5 - nx * w * 0.6, y + sa * L * 0.5 - ny * w * 0.6), (x - nx * w, y - ny * w)]
    m = poly_mask(W, H, outer)
    img[dil(m, 1) & ~m] = cols[0]
    img[m] = cols[1]


# ------------------------------------------------------------------ S1 his eyes, still
class S1:
    def __init__(s):
        s.art, s.pal = base("p01")
        s.L = Layer(s.art, None, s.pal)
        s.pal = np.concatenate([s.pal, [WHITE]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 245, 800), "s"), (n - 1, (420, 248, 720), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        if i >= n - 7:
            g = 1 - abs((i - (n - 4)) / 3)
            for ex, ey in ((202, 248), (650, 250)):
                px, py = cam.P(ex, ey)
                glint(img, int(px), int(py), int(2 + 9 * max(0, g)), "#ffffff")
        return img


# ------------------------------------------------------------------ S2 the seal
class S2:
    CLAP = 5

    def __init__(s):
        s.art, s.pal = base("p02")
        s.L = Layer(s.art, None, s.pal)
        r = np.random.default_rng(210)
        s.sp = [(r.uniform(0, 2 * math.pi), r.uniform(0.7, 1.3), r.uniform(10, 22)) for _ in range(26)]
        s.pal = np.concatenate([s.pal, BLACKF, [WHITE]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 240, 760), "s"), (s.CLAP, (420, 236, 700), "o"), (n - 1, (420, 226, 600), "s")]),
                       840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        if i == s.CLAP:
            return blank(W, H, WHITE)
        if i > s.CLAP:  # black flames burst out from the hands and fly apart
            t = i - s.CLAP
            hx, hy = cam.P(420, 250)
            for a, k, w in s.sp:
                d = (30 + 34 * t) * k
                L = (60 + 10 * t) * k * max(0.0, 1 - t / 24)
                if L > 4:
                    spike(img, hx + math.cos(a) * d, hy + math.sin(a) * d * 0.7, a, L, w * max(0.3, 1 - t / 24))
            X, Y = cam.grid()
            d = np.hypot((X - 420) / 300, (Y - 220) / 250)
            black_flames(img, X, Y, i, np.clip(d - 0.6, 0, 1) * 1.4, 41)
        return shift(img, *old.shake(i, 4 if s.CLAP < i < s.CLAP + 5 else 1, 32))


# ------------------------------------------------------------------ S3 Amaterasu takes Kaguya
class S3:
    HIT, FALL = 6, 26

    def __init__(s):
        s.art, s.pal = base("p03")
        a = s.art
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        light = (lum(a) > 150) & (old.sat(a) < 0.45) & (xx > 140)
        body = close(light, 6)
        keep = np.zeros_like(body)
        for ys, xs in old.components(body):
            if len(ys) > 5000:
                keep[ys, xs] = True
        s.k = dil(keep, 2) & (keep | (lum(a) < 70) | ((a[..., 0] > 170) & (a[..., 1] > 120) & (a[..., 2] < 110)) |
                              ((a[..., 2] > a[..., 1] + 30) & (lum(a) < 110)))
        s.k = close(s.k, 3) & dil(keep, 4)
        sky = tones(a, ~dil(s.k, 8) & (xx > 300) & (lum(a) < 120), 4, 31)
        plate = a.copy()
        fill_by_tones(plate, dil(s.k, 2), xx.astype(float), yy.astype(float), sky, 150, 30, 32, angle=-0.25)
        s.Lp = Layer(snap(plate, s.pal), None, s.pal)
        s.Lk = Layer(a, s.k, s.pal)
        ys, xs = np.nonzero(s.k)
        s.C = (float(xs.mean()), float(ys.mean()))
        # points round her outline, for the flames that tear out of her
        edge = s.k & ~dil(~s.k, 0) if False else (s.k & ~ero_(s.k))
        ey, ex = np.nonzero(edge)
        pick = np.random.default_rng(33).choice(len(ey), 70, replace=False)
        s.edge = [(float(ex[j]), float(ey[j])) for j in pick]
        s.burn = noise_at(xx.astype(float), yy.astype(float), 14, 14, 34, 2)
        r = np.random.default_rng(35)
        s.spears = [(r.uniform(0, 2 * math.pi), r.uniform(0.8, 1.2)) for _ in range(9)]
        s.pal = np.concatenate([s.pal, BLACKF, [hexc("#2a1636"), hexc("#3e2050")]])

    def pose(s, i):
        u = ease_in((i - s.FALL) / 22) if i >= s.FALL else 0.0
        return 120 * u, 300 * u, 0.9 * u  # down-right, tumbling

    def frame(s, i, n):
        ox, oy, rot = s.pose(i)
        cam = clampcam(*track(i, [(0, (440, 230, 760), "s"), (s.FALL, (450, 240, 720), "s"), (n - 1, (520, 330, 720), "i")]),
                       840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.Lp)
        ok = draw(img, cam, s.Lk, ox=ox, oy=oy, rot=rot, pivot=s.C)
        # the burn spreads over her: black patches with a red rim, growing from where the spears struck
        if i >= s.HIT:
            g = ease((i - s.HIT) / 22)
            X, Y = cam.grid()
            c, sn = math.cos(-rot), math.sin(-rot)
            Xl = s.C[0] + (X - ox - s.C[0]) * c - (Y - oy - s.C[1]) * sn
            Yl = s.C[1] + (X - ox - s.C[0]) * sn + (Y - oy - s.C[1]) * c
            bx = np.clip(Xl.astype(int), 0, 839)
            by = np.clip(Yl.astype(int), 0, 472)
            b = s.burn[by, bx]
            th = 0.75 - 0.4 * g
            img[ok & (b > th)] = BLACKF[2]
            img[ok & (b > th + 0.04)] = BLACKF[0]
        cs, ss = math.cos(rot), math.sin(rot)

        def P(q):
            d = (q[0] - s.C[0], q[1] - s.C[1])
            return cam.P(s.C[0] + ox + d[0] * cs - d[1] * ss, s.C[1] + oy + d[0] * ss + d[1] * cs)
        cx, cy = P(s.C)
        # the spears: black flame strikes flying in from the dark and into her
        if i < s.HIT + 3:
            u = ease_in(min(1.0, i / s.HIT))
            for a, k in s.spears:
                d = (1 - u) * 340 * k + 20
                spike(img, cx + math.cos(a) * d, cy + math.sin(a) * d, a + math.pi, 70 * k, 9)
        # black flame spikes tear out of her, flickering, as long as she burns
        if i >= s.HIT:
            g = ease_out((i - s.HIT) / 8)
            r = np.random.default_rng(3300 + i)
            for (x, y) in s.edge:
                px, py = P((x, y))
                a = math.atan2(py - cy, px - cx) + r.uniform(-0.35, 0.35)
                L = (14 + 30 * r.random()) * g * (1.4 if i > s.FALL else 1.0)
                spike(img, px, py, a, L, 4 + 3 * r.random())
        # dark smoke closes in at the end
        if i >= n - 14:
            X, Y = cam.grid()
            u = ease_in((i - (n - 14)) / 13)
            nz = noise_at(X, Y - i * 5.0, 60, 40, 36, 3)
            img[nz + u * 0.9 > 0.95] = hexc("#2a1636")
            img[nz + u * 0.9 > 1.05] = hexc("#3e2050")
        return shift(img, *old.shake(i, 3 if s.HIT <= i < s.HIT + 5 else (2 if i >= s.FALL else 1), 33))


def ero_(m):
    return ~dil(~m, 1)


# ------------------------------------------------------------------ S4 the Chidori forms
class S4:
    def __init__(s):
        s.art, s.pal = base("p04")
        s.L = Layer(s.art, None, s.pal)
        s.C = (642.0, 214.0)
        s.pal = np.concatenate([s.pal, [CYAN, CYAN2, WHITE, PINK, PINK2]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 820), "s"), (n - 1, (540, 222, 620), "i")]), 840, 473,
                       roll=-0.05 * ease(i / n), margin=0.06)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        px, py = cam.P(*s.C)
        g = ease_out(i / 18)
        chidori(img, px, py, (16 + 60 * g) * cam.r * 1.2 * (1 + 0.12 * math.sin(i * 1.7)), i, 4, n=int(4 + 8 * g))
        F = n - 9
        if i >= F:  # a violet flash, then white
            u = (i - F) / 8
            k = min(1.0, u * 1.6)
            tint = PINK if u < 0.6 else WHITE
            img[:] = (img * (1 - k) + tint * k).astype(np.int32)
        if i < 3:
            img[:] = (img * (i / 3) + hexc("#2a1636") * (1 - i / 3)).astype(np.int32)
        return shift(img, *old.shake(i, 1 + (i > n - 12) * 2, 34))


# ------------------------------------------------------------------ S5 the Susanoo, up to its eye, whip
class S5:
    def __init__(s):
        s.art, s.pal = base("p05")
        s.L = Layer(s.art, None, s.pal)
        s.C = (652.0, 269.0)
        s.pal = np.concatenate([s.pal, [CYAN, CYAN2, WHITE, PINK, PINK2, RED]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (600, 290, 640), "s"), (22, (480, 220, 760), "s"), (n - 6, (385, 150, 500), "i"),
                                  (n - 1, (520, 150, 500), "i")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        px, py = cam.P(*s.C)
        chidori(img, px, py, 80 * cam.r * (1 + 0.12 * math.sin(i * 1.3)), i, 5, n=11)
        if i > 24:  # the eyes burn red
            for ex, ey in ((369, 136), (402, 133)):
                qx, qy = cam.P(ex, ey)
                disc_screen(img, qx, qy, 3 * cam.r * 1.6, RED)
                if (i // 2) % 2:
                    glint(img, int(qx), int(qy), 3, "#ffd0d0")
        r = np.random.default_rng(500 + i)
        if i < 8:  # out of the white: violet streaks
            k = 1 - i / 8
            img[:] = (img * (1 - k) + PINK2 * k).astype(np.int32)
            speed_lines(img, r, 30, 1.0, -0.35, PINK, (80, 260), WHITE)
        if i >= n - 5:
            speed_lines(img, r, 30, 1.0, 0.0, PINK2, (100, 300), WHITE)
        return shift(img, *old.shake(i, 1, 35))


# ------------------------------------------------------------------ S6 it shoots at the sphere
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
        s.su = dil(keep, 2) & (keep | (lum(a) < 70)) & (xx < 310)
        bg = tones(a, (xx < 330) & ~dil(s.su, 8) & (lum(a) < 130), 3, 61)
        plate = a.copy()
        fill_by_tones(plate, dil(s.su, 2), xx.astype(float), yy.astype(float), bg, 260, 26, 62, angle=0.3)
        s.Lp = Layer(snap(plate, s.pal), None, s.pal)
        s.Ls = Layer(a, s.su, s.pal)
        s.rim = (a[..., 0] > 180) & (a[..., 1] < 120)
        s.sph = np.hypot(xx - 650, yy - 230) < 345
        s.pal = np.concatenate([s.pal, [CYAN, CYAN2, WHITE, PINK, PINK2]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 840), "s"), (n - 1, (470, 236, 740), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.Lp)
        r = np.random.default_rng(600 + i)
        clean = img.copy()
        speed_lines(img, r, 14, 1.0, -0.06, hexc("#c89ad8"), (60, 200))
        sph = sample(cam, s.sph)  # streaks only in the air, never across the sphere
        img[sph] = clean[sph]
        if (i // 2) % 2:
            img[sample(cam, s.rim)] = PINK
        u = ease_in(i / (n - 1))
        dx = round(170 * u)
        draw(img, cam, s.Ls, ox=dx, oy=-round(12 * u))
        hx, hy = cam.P(256 + dx, 234 - 12 * u)
        chidori(img, hx, hy, 34 * cam.r * (1 + 0.5 * u), i, 6, n=7)
        for _ in range(int(10 * u)):  # sparks streaming back off the Chidori
            y = hy + r.uniform(-20, 20)
            x = hx - r.uniform(10, 120)
            draw_line(img, x, y, x - r.uniform(10, 40), y, CYAN2)
        return shift(img, *old.shake(i, 1 + int(u * 2), 36))


# ------------------------------------------------------------------ S7 the hand: Chidori, a black flame core
class S7:
    def __init__(s):
        s.art, s.pal = base("p07")
        s.L = Layer(s.art, None, s.pal)
        s.C = (480.0, 280.0)
        s.pal = np.concatenate([s.pal, [CYAN, CYAN2, WHITE], BLACKF, [hexc("#3a2050")]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 840), "s"), (n - 1, (470, 262, 600), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        px, py = cam.P(*s.C)
        chidori(img, px, py, 150 * cam.r * (1 + 0.1 * math.sin(i * 1.7)), i, 7, n=13)
        r = np.random.default_rng(700 + i)
        for _ in range(3):
            a = r.uniform(0, 2 * math.pi)
            pts = bolt(r, px, py, px + math.cos(a) * 320, py + math.sin(a) * 200, 18, 9)
            draw_pts(img, pts, CYAN, 3)
            draw_pts(img, pts, WHITE, 1)
        if i >= 18:  # Amaterasu folds into the Chidori: a black flame core with a turning spiral
            g = ease_out((i - 18) / 14)
            R = 46 * g * cam.r * 1.5
            if R > 2:
                d = np.hypot(XX - px, YY - py)
                ang = np.arctan2(YY - py, XX - px)
                edge = R * (1 + 0.18 * np.sin(ang * 7 + i * 0.8))
                img[d < edge + 3] = BLACKF[2]
                img[d < edge] = BLACKF[0]
                spiral = (np.abs(((ang + d / max(R, 1) * 5 - i * 0.35) % (2 * math.pi)) - math.pi) < 0.22) & (d < edge * 0.85)
                img[spiral] = hexc("#3a2050")
                for k in range(5):  # flame licks off the top
                    a = -math.pi / 2 + (k - 2) * 0.35 + r.uniform(-0.1, 0.1)
                    spike(img, px + math.cos(a) * R * 0.8, py + math.sin(a) * R * 0.8, a, R * r.uniform(0.6, 1.1), R * 0.2)
        if i >= n - 3:
            img[:] = WHITE
        return shift(img, *old.shake(i, 2, 37))


# ------------------------------------------------------------------ S8 the scream
class S8:
    def __init__(s):
        s.art, s.pal = base("p08")
        s.L = Layer(s.art, None, s.pal)
        s.pal = np.concatenate([s.pal, [PINK, PINK2, WHITE, RED, hexc("#ff5a7a")]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (420, 236, 760), "s"), (n - 8, (380, 240, 620), "s"), (n - 1, (330, 200, 480), "i")]),
                       840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        k = 0.08 + 0.06 * (0.5 + 0.5 * math.sin(i * 0.9)) + 0.3 * ease_in((i - (n - 10)) / 9)
        img[:] = (img * (1 - k) + hexc("#ff5a7a") * k).astype(np.int32)  # the frame flushes red
        r = np.random.default_rng(800 + i)
        speed_lines(img, r, 22, 1.0, -0.12, PINK2, (60, 200), PINK)
        px, py = cam.P(326, 193)
        if i % 4 < 2:
            glint(img, int(px), int(py), 4, "#ff8080")
        return shift(img, *old.shake(i, 3, 38))


# ------------------------------------------------------------------ S9 the hand breaks the wall
class S9:
    def __init__(s):
        s.art, s.pal = base("p09")
        s.L = Layer(s.art, None, s.pal)
        s.HIT = (628.0, 281.0)
        r = np.random.default_rng(90)
        s.cracks = []
        for k in range(9):
            a = -math.pi / 2 + (k / 8) * math.pi + r.uniform(-0.15, 0.15)
            pts = [(s.HIT[0], s.HIT[1])]
            x, y = s.HIT
            for _ in range(10):
                a += r.uniform(-0.4, 0.4)
                x, y = x + math.cos(a) * 16, y + math.sin(a) * 16
                pts.append((x, y))
            s.cracks.append(pts)
        s.rocks = [(r.uniform(-1.4, 1.4), r.uniform(4, 11), int(r.integers(2, 6))) for _ in range(40)]
        s.pal = np.concatenate([s.pal, [PINK, PINK2, WHITE, PURP2, CYAN, CYAN2, hexc("#1a0a24")]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (430, 236, 820), "s"), (n - 1, (560, 260, 600), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        hx, hy = cam.P(*s.HIT)
        g = ease_out(i / 16)
        for pts in s.cracks:  # the wall cracks out from the palm, lit from inside
            m = max(2, int(len(pts) * g))
            for (x0, y0), (x1, y1) in zip(pts[:m - 1], pts[1:m]):
                a, b = cam.P(x0, y0), cam.P(x1, y1)
                draw_line(img, *a, *b, PURP2, 3)
                draw_line(img, *a, *b, WHITE, 1)
        chidori(img, hx, hy, 60 * cam.r * (1 + 0.2 * math.sin(i)), i, 9, cols=(CYAN, CYAN2, WHITE), n=9)
        for k, (a, sp, sz) in enumerate(s.rocks):  # rock thrown back out of the wall
            t = i - (k % 6)
            if t <= 0:
                continue
            x = hx + math.cos(math.pi + a) * sp * t * 2.2
            y = hy + math.sin(math.pi + a) * sp * t * 1.6 + 0.4 * t * t
            if 0 <= x < W - sz and 0 <= y < H - sz:
                img[int(y):int(y) + sz, int(x):int(x) + sz] = hexc("#1a0a24")
        F = n - 8
        if i >= F:  # the light breaks through
            u = ease_in((i - F) / 7)
            disc_screen(img, hx, hy, 20 + 560 * u, CYAN2)
            disc_screen(img, hx, hy, 520 * u, WHITE)
        return shift(img, *old.shake(i, 2 + (i > n - 16) * 3, 39))


# ------------------------------------------------------------------ S10 Kaguya in the dark, white floods in
class S10:
    def __init__(s):
        s.art, s.pal = base("p03")
        s.L = Layer(s.art, None, s.pal)
        s.pal = np.concatenate([s.pal, [WHITE, hexc("#101428"), hexc("#c8d0ff")]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (460, 200, 700), "s"), (n - 1, (470, 196, 660), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        img[:] = (img * 0.45 + hexc("#101428") * 0.55).astype(np.int32)
        u = ease_in(i / (n - 1))
        X, Y = cam.grid()
        nz = noise_at(X, Y, 30, 30, 101, 2)
        front = W * (1 - 1.3 * u) + nz * 80 - 40
        sx = np.arange(W)[None, :]
        img[sx > front] = hexc("#c8d0ff")
        img[sx > front + 20] = WHITE
        return shift(img, *old.shake(i, 1, 40))


# ------------------------------------------------------------------ S11 the sphere from outside
class S11:
    def __init__(s):
        s.art, s.pal = base("p10")
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        s.SPH = (560.0, 215.0, 165.0)
        d = np.hypot(xx - s.SPH[0], yy - s.SPH[1])
        s.d = d
        s.beam = (lum(a) > 120) & (a[..., 2] > a[..., 1] + 30) & (d > s.SPH[2] + 6)
        sky = tones(a, ~dil(s.beam, 4) & (d > s.SPH[2] + 20) & (lum(a) < 140), 4, 111)
        plate = a.copy()
        fill_by_tones(plate, dil(s.beam, 2), xx.astype(float), yy.astype(float), sky, 160, 14, 112, angle=-0.3)
        s.plate = snap(plate, s.pal)
        s.L = Layer(a, None, s.pal)
        s.pal = np.concatenate([s.pal, [PINK, PINK2, WHITE, PURP, PURP2, hexc("#ff2ad8")]])

    def frame(s, i, n):
        cam = clampcam(*track(i, [(0, (500, 230, 800), "s"), (n - 1, (540, 222, 680), "s")]), 840, 473)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        B0 = 14
        u = ease_out((i - B0) / 18) if i >= B0 else 0.0
        hide = sample(cam, dil(s.beam, 2) & (s.d > s.SPH[2] + 520 * u))
        img[hide] = sample(cam, s.plate)[hide]
        cx, cy = cam.P(s.SPH[0], s.SPH[1])
        if i < B0 + 4:  # a cross of light opens at its heart
            g = math.sin(math.pi * min(1.0, i / (B0 + 3)))
            for a in (0, math.pi / 2, math.pi, 3 * math.pi / 2):
                L = 20 + 90 * g
                draw_line(img, cx, cy, cx + math.cos(a + 0.785) * L, cy + math.sin(a + 0.785) * L, WHITE, 2)
            ring_screen(img, cx, cy, 6 + 14 * g, 2, PINK2)
            disc_screen(img, cx, cy, 3 + 4 * g, WHITE)
        G0 = n - 18
        if i >= G0:  # it glows, pink from within
            k = ease_in((i - G0) / 17)
            inside = (XX - cx) ** 2 + (YY - cy) ** 2 < (s.SPH[2] * cam.r) ** 2
            sel = inside
            img[sel] = (img[sel] * (1 - 0.7 * k) + hexc("#ff2ad8") * 0.7 * k).astype(np.int32)
            if k > 0.5:
                bright = inside & (lum(img) > 150)
                img[bright] = PINK2
        if i < 4:
            img[:] = (img * (i / 4) + WHITE * (1 - i / 4)).astype(np.int32)
        return shift(img, *old.shake(i, 1 + (i > n - 10) * 2, 41))


# ------------------------------------------------------------------ S12 it bursts
class S12:
    def __init__(s):
        r = np.random.default_rng(1200)
        s.shards = [(r.uniform(0, 2 * math.pi), r.uniform(0.1, 1.0), r.uniform(4, 14), int(r.integers(2, 7)))
                    for _ in range(160)]
        s.pal = np.array([hexc("#1a1028"), hexc("#3a2050"), hexc("#5a2a78"), hexc("#2a0a3a"), PURP, PINK, PINK2, WHITE,
                          hexc("#8a4ad8"), hexc("#ff2ad8")])

    def frame(s, i, n):
        cx, cy = W * 0.52, H * 0.5
        u = ease_out(i / 14)
        img = blank(W, H, hexc("#2a0a3a"))
        starburst(img, cx, cy, 70 + 520 * u, [hexc("#ff2ad8"), PINK, PINK2, WHITE], 1250 + i // 2, 34, 0.7)
        r = np.random.default_rng(1260 + i)
        for k in range(26):  # streaks of light racing out
            a = r.uniform(0, 2 * math.pi)
            d0 = r.uniform(30, 120) + i * 8
            draw_line(img, cx + math.cos(a) * d0, cy + math.sin(a) * d0 * 0.7, cx + math.cos(a) * (d0 + 140),
                      cy + math.sin(a) * (d0 + 140) * 0.7, WHITE if k % 2 else PINK2, 2)
        for a, d0, sp, sz in s.shards:  # shards of the sphere thrown out
            d = d0 * 90 + sp * i * 1.6
            x, y = cx + math.cos(a) * d, cy + math.sin(a) * d * 0.7
            szz = int(sz + i * 0.08)
            if 0 <= x < W - szz and 0 <= y < H - szz:
                img[int(y):int(y) + szz, int(x):int(x) + szz] = hexc("#2a0a3a")
        return shift(img, *old.shake(i, max(0, 6 - i * 0.2), 42))


FADES = {"S12": lambda i, n: ("#f6f4ff", ease((i - (n - 26)) / 18))}
SHOTS = [("S01", 1, 20, S1), ("S02", 21, 52, S2), ("S03", 53, 104, S3), ("S04", 105, 150, S4), ("S05", 151, 196, S5),
         ("S06", 197, 230, S6), ("S07", 231, 282, S7), ("S08", 283, 314, S8), ("S09", 315, 358, S9),
         ("S10", 359, 374, S10), ("S11", 375, 426, S11), ("S12", 427, 480, S12)]


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
