"""Sasuke ultimate, version 3. Rules learnt from v2's faults:
  - no figure is cut out of a panel and moved: every panel is shown whole, motion comes from the camera (push-ins,
    pans, whip pans), from the panel's own effects animated in place, and from effects drawn exactly on the measured
    positions of what the panel already shows
  - no rotation; the camera never zooms past 1 screen pixel per art pixel
  - flashes, flushes and fades are mixed in after the palette snap, so there are no muddy in-between colours
  - every cut is motivated: a flash, a whip pan, flames or smoke filling the frame, or a push into the next subject
Beats (the reference from 2:07): his eyes / the seal, black flames / Amaterasu engulfs Kaguya / the Chidori in his
hand / the Susanoo, up to its eyes, whip / it flies at the sphere / the Chidori in its hand, a black core / his scream /
the hand into the wall / Kaguya in the dark, white / the sphere from outside, light breaks out / the burst.
Run: python sshots3.py [--frames a-b] [--every n]"""
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
from sshots import base, WHITE, CYAN, CYAN2, PINK, PINK2, PURP, PURP2

OUT = os.path.join(HERE, "frames")
RED = hexc("#ff3a4a")
FL = [hexc("#5a0e14"), hexc("#2a060c"), hexc("#0a0206")]  # black flame: dark red rim -> black core
SMOKE = [hexc("#24122e"), hexc("#3a1e4a")]


def cam_of(keys, i):
    """The camera: at native size (PX_RES >= 800 wide) one art pixel is one screen pixel, it only pans in whole
    pixels; otherwise it may zoom down to 480 wide."""
    cx, cy, vis = track(i, keys)
    if W >= 800:
        cam = clampcam(round(cx), round(cy), W, 840, 473)
        cam.cx, cam.cy = round(cam.cx - W / 2) + W / 2, round(cam.cy - H / 2) + H / 2
        return cam
    return clampcam(cx, cy, max(vis, 480), 840, 473)


def panel_glow(a, cx, cy, R):
    """The panel's own glowing effect near (cx, cy): bright cyan/white pixels, and their distance from the centre."""
    yy, xx = np.mgrid[0:473, 0:840]
    g = (((a[..., 2] > 190) & (a[..., 1] > 150) & (a[..., 0] < 200)) | (lum(a) > 225)) & (np.hypot(xx - cx, yy - cy) < R)
    return dil(g, 1) & (np.hypot(xx - cx, yy - cy) < R), np.hypot(xx - cx, yy - cy)


def shimmer(img, m, i, seed):
    """Make a glowing effect flicker in place: its pixels step between their own colour, pale cyan and white."""
    r = np.random.default_rng(seed + i)
    n = noise_at(XX.astype(float), YY.astype(float), 6, 6, seed * 7 + i // 2, 1)
    img[m & (n > 0.62)] = CYAN2
    img[m & (n > 0.74)] = WHITE


def bolts_at(img, cx, cy, R, i, seed, n=5, cols=(CYAN, WHITE)):
    """A few thin forked bolts from (cx, cy), re-drawn every frame."""
    r = np.random.default_rng(seed * 1000 + i)
    for _ in range(n):
        a = r.uniform(0, 2 * math.pi)
        L = R * r.uniform(0.6, 1.2)
        pts = bolt(r, cx, cy, cx + math.cos(a) * L, cy + math.sin(a) * L, R * 0.15, 5)
        draw_pts(img, pts, cols[0], 2)
        draw_pts(img, pts, cols[1], 1)


def flames(img, X, Y, i, weight, seed, speed=6.0, cell=(18, 34)):
    """Black flames (Amaterasu): rising tongues, a dark red rim round a black core."""
    nz = noise_at(X, Y + i * speed, cell[0], cell[1], seed, 3)
    f = nz * (0.3 + 0.85 * weight)
    img[f > 0.55] = FL[0]
    img[f > 0.59] = FL[1]
    img[f > 0.64] = FL[2]


def tongues(img, x, y, size, t, seed, n=7):
    """A cluster of black flame tongues rising from (x, y): jagged, flickering, a dark red rim round a black core."""
    r = np.random.default_rng(seed)
    rf = np.random.default_rng(seed * 31 + int(t))
    for k in range(n):
        bx = x + r.uniform(-1, 1) * size * 0.6
        hh = size * r.uniform(0.6, 1.4) * (1 + 0.25 * math.sin(t * 1.1 + k * 2.3))
        ww = size * r.uniform(0.45, 0.7)
        lean = r.uniform(-0.25, 0.25)
        for col, kh, kw in ((FL[0], 1.0, 1.0), (FL[2], 0.9, 0.78)):
            H_, W_ = hh * kh, ww * kw
            pts = [(bx - W_ / 2, y + 2)]
            for q in range(1, 5):
                f = q / 5
                pts.append((bx - W_ / 2 * (1 - f) + lean * H_ * f + rf.uniform(-1.5, 1.5), y - H_ * f))
            pts.append((bx + lean * H_, y - H_))
            for q in range(4, 0, -1):
                f = q / 5
                pts.append((bx + W_ / 2 * (1 - f) + lean * H_ * f + rf.uniform(-1.5, 1.5), y - H_ * f))
            pts.append((bx + W_ / 2, y + 2))
            img[poly_mask(W, H, pts)] = col


# ------------------------------------------------------------------ the shots
class Shot:
    pal_extra = []

    def __init__(s, panel):
        s.art, s.pal = base(panel)
        s.L = Layer(s.art, None, s.pal)
        s.pal = np.concatenate([s.pal, np.array(list(s.pal_extra) + [WHITE, CYAN, CYAN2]).reshape(-1, 3)])

    def post(s, i, n):
        return []  # [(colour, amount)] mixed in after the snap


class S1(Shot):  # his eyes: a slow push, the eyes glint
    def __init__(s):
        super().__init__("p01")

    def frame(s, i, n):
        cam = cam_of([(0, (420, 240, 840), "s"), (n - 1, (420, 248, 700), "o")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        if i >= n - 8:
            g = math.sin(math.pi * (i - (n - 8)) / 8)
            for ex, ey in ((205, 244), (652, 248)):
                px, py = cam.P(ex, ey)
                glint(img, int(px), int(py), int(1 + 9 * g), "#ffffff")
        return img

    def post(s, i, n):
        return [(hexc("#05030a"), 1 - ease(i / 6))]


class S2(Shot):  # the seal: the hands meet, a flash, black flames rise round him and swallow the frame
    pal_extra = FL

    def __init__(s):
        super().__init__("p02")

    def frame(s, i, n):
        cam = cam_of([(0, (420, 236, 780), "s"), (n - 1, (420, 226, 620), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        if i >= 4:
            X, Y = cam.grid()
            d = np.hypot((X - 420) / 290, (Y - 230) / 240)
            cover = ease_in((i - (n - 10)) / 9) if i >= n - 10 else 0.0
            weight = np.clip(d - 0.62 + 0.25 * ease_out((i - 4) / 14), 0, 1) * 1.5 + cover * 1.5
            flames(img, X, Y, i, weight, 41)
        return shift(img, *old.shake(i, 3 if 4 <= i < 8 else 1, 32))

    def post(s, i, n):
        return [(WHITE, 1.0 if i in (4, 5) else (0.5 if i == 6 else 0.0))]


class S3(Shot):  # Amaterasu takes Kaguya: black flame darts strike her, she is set ablaze, smoke closes in
    pal_extra = FL + SMOKE
    HIT = 10

    def __init__(s):
        super().__init__("p03")
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        body = (lum(a) > 150) & (old.sat(a) < 0.45) & (xx > 130)
        keep = np.zeros_like(body)
        for ys, xs in old.components(close(body, 4)):
            if len(ys) > 3000:
                keep[ys, xs] = True
        s.body = keep
        s.hits = [(360, 300), (470, 220), (560, 330), (300, 380), (640, 250), (440, 400)]  # on her robe and sleeves
        d = np.full((473, 840), 1e9)
        for hx, hy in s.hits:
            d = np.minimum(d, np.hypot(xx - hx, yy - hy))
        s.dhit = d
        r = np.random.default_rng(303)
        ys, xs = np.nonzero(s.body)
        pick = r.choice(len(ys), 12, replace=False)
        s.fire = list(s.hits) + [(float(xs[j]), float(ys[j])) for j in pick]
        d0 = [0] * len(s.hits) + [int(4 + 28 * min(1, np.min([math.hypot(xs[j] - hx, ys[j] - hy) for hx, hy in s.hits]) / 220))
                                  for j in pick]
        s.fire_t = d0
        s.darts = [(hx, hy, math.atan2(hy - 40, hx - (900 if k % 2 else -60))) for k, (hx, hy) in enumerate(s.hits)]

    def frame(s, i, n):
        cam = cam_of([(0, (430, 260, 840), "s"), (n - 1, (450, 236, 640), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        # darts of black flame fly in from the dark and strike her
        for k, (hx, hy, a) in enumerate(s.darts):
            t0 = k * 1.2
            u = (i - t0) / (s.HIT - t0 + 1e-6)
            if 0 <= u < 1:
                ca, sa = math.cos(a), math.sin(a)
                d = (1 - ease_in(u)) * 420
                hx2, hy2 = hx - ca * d, hy - sa * d
                for q in range(18):  # a tapered streak: discs shrinking toward its tail
                    px, py = cam.P(hx2 - ca * q * 7, hy2 - sa * q * 7)
                    rr = (11 - q * 0.55) * cam.r
                    if rr > 0.6:
                        disc_screen(img, px, py, rr + 1.5, FL[0])
                        disc_screen(img, px, py, rr, FL[2])
        # black flames take hold where the darts struck and spread along her
        if i >= s.HIT - 1:
            t = i - s.HIT + 1
            for k, (hx, hy) in enumerate(s.fire):
                t0 = s.fire_t[k]
                if t < t0:
                    continue
                g = ease_out((t - t0) / 8)
                px, py = cam.P(hx, hy)
                tongues(img, px, py, (14 + 46 * g) * cam.r * 1.3, i, 3000 + k, 5)
            if i < s.HIT + 4:
                for hx, hy in s.hits:
                    px, py = cam.P(hx, hy)
                    starburst(img, px, py, 18 * cam.r * (1 + (i - s.HIT) * 0.3), [FL[0], FL[2]], 330 + i, 12, 0.9)
        # dark smoke rolls in at the end and fills the frame
        if i >= n - 14:
            X, Y = cam.grid()
            u = ease_in((i - (n - 14)) / 13)
            nz = noise_at(X, Y - i * 4.0, 60, 40, 36, 3)
            img[nz + u * 0.95 > 0.98] = SMOKE[1]
            img[nz + u * 0.95 > 1.06] = SMOKE[0]
        return shift(img, *old.shake(i, 3 if s.HIT <= i < s.HIT + 5 else 1, 33))

    def post(s, i, n):
        return [(SMOKE[0], ease_in((i - (n - 4)) / 3))]


class S4(Shot):  # the Chidori grows in his hand (the panel's own lightning, revealed and flickering), push in, flash
    C = (629.0, 221.0)

    def __init__(s):
        super().__init__("p04")
        s.glow, s.d = panel_glow(s.art, *s.C, 150)
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        ground = tones(a, ~dil(s.glow, 6) & (xx > 480) & (old.sat(a) > 0.25), 4, 401)
        plate = a.copy()
        fill_by_tones(plate, dil(s.glow, 2), xx.astype(float), yy.astype(float), ground, 40, 22, 402, angle=0.6)
        s.Lp = Layer(snap(plate, s.pal), None, s.pal)

    def frame(s, i, n):
        cam = cam_of([(0, (430, 236, 840), "s"), (n - 1, (600, 226, 560), "i")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.Lp)
        reach = 10 + 150 * ease_out(i / 16)
        art = np.zeros_like(img)
        draw(art, cam, s.L)
        m = sample(cam, dil(s.glow, 2) & (s.d < reach))
        img[m] = art[m]
        shimmer(img, sample(cam, s.glow & (s.d < reach)), i, 41)
        px, py = cam.P(*s.C)
        bolts_at(img, px, py, reach * cam.r * 0.9, i, 4, 4)
        return shift(img, *old.shake(i, 1 + (i > n - 10), 34))

    def post(s, i, n):
        return [(hexc("#05030a"), 1 - ease(i / 4)), (WHITE, ease_in((i - (n - 6)) / 5))]


class S5(Shot):  # from white: the Susanoo, the orb in its hand; the camera climbs to its eyes, then whips away
    C = (651.0, 274.0)

    def __init__(s):
        super().__init__("p05")
        s.glow, s.d = panel_glow(s.art, *s.C, 120)
        s.pal = np.concatenate([s.pal, [RED, PINK2]])

    def frame(s, i, n):
        W0 = n - 6
        cam = cam_of([(0, (640, 290, 520), "s"), (W0, (420, 160, 560), "s"), (n - 1, (760, 170, 560), "i")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        shimmer(img, sample(cam, s.glow), i, 51)
        px, py = cam.P(*s.C)
        bolts_at(img, px, py, 70 * cam.r, i, 5, 5)
        if i > n * 0.45:  # its eyes light up
            for ex, ey in ((369, 136), (402, 133)):
                qx, qy = cam.P(ex, ey)
                img[int(qy) - 1:int(qy) + 2, int(qx) - 2:int(qx) + 3] = RED
                if (i // 3) % 2:
                    glint(img, int(qx), int(qy), 3, "#ffd0d0")
        r = np.random.default_rng(500 + i)
        if i >= W0:
            speed_lines(img, r, 40, 1.0, 0.0, PINK2, (120, 360), WHITE)
        return img

    def post(s, i, n):
        return [(WHITE, 1 - ease(i / 7))]


class S6(Shot):  # it flies at the sphere: the camera rushes in toward the Chidori meeting the rim
    C = (262.0, 268.0)

    def __init__(s):
        super().__init__("p06")
        s.glow, s.d = panel_glow(s.art, *s.C, 45)
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        s.rim = (a[..., 0] > 190) & (a[..., 1] < 120) & (a[..., 2] < 190)
        s.air = (np.hypot(xx - 580, yy - 180) > 270)
        s.pal = np.concatenate([s.pal, [PINK, PINK2, hexc("#ff6a8a")]])

    def frame(s, i, n):
        cam = cam_of([(0, (420, 236, 840), "s"), (n - 1, (330, 250, 520), "i")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        r = np.random.default_rng(600 + i)
        clean = img.copy()
        speed_lines(img, r, 16, 1.0, -0.1, hexc("#c89ad8"), (60, 200))
        keep = ~sample(cam, s.air)
        img[keep] = clean[keep]
        if (i // 2) % 2:  # the sphere's rim burns brighter
            img[sample(cam, s.rim)] = hexc("#ff6a8a")
        shimmer(img, sample(cam, s.glow), i, 61)
        px, py = cam.P(*s.C)
        bolts_at(img, px, py, 34 * cam.r * (1 + 0.6 * i / n), i, 6, 6)
        return shift(img, *old.shake(i, 1 + (i > n - 8), 36))

    def post(s, i, n):
        return [(WHITE, ease_in((i - (n - 5)) / 4))]


class S7(Shot):  # the Chidori in its hand; a black core of Amaterasu forms in it
    C = (440.0, 270.0)
    pal_extra = FL + [hexc("#3a2050")]

    def __init__(s):
        super().__init__("p07")
        s.glow, s.d = panel_glow(s.art, *s.C, 420)

    def frame(s, i, n):
        cam = cam_of([(0, (430, 240, 840), "s"), (n - 1, (445, 262, 600), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        shimmer(img, sample(cam, s.glow), i, 71)
        px, py = cam.P(*s.C)
        bolts_at(img, px, py, 160 * cam.r, i, 7, 4)
        if i >= 16:
            g = ease_out((i - 16) / 16)
            R = 44 * g * cam.r * 1.4
            if R > 2:
                d = np.hypot(XX - px, YY - py)
                ang = np.arctan2(YY - py, XX - px)
                edge = R * (1 + 0.16 * np.sin(ang * 7 + i * 0.8))
                img[d < edge + 3] = FL[0]
                img[d < edge] = FL[2]
                sp = (np.abs(((ang + d / max(R, 1) * 5 - i * 0.35) % (2 * math.pi)) - math.pi) < 0.2) & (d < edge * 0.85)
                img[sp] = hexc("#3a2050")
        if i >= n - 5:
            r = np.random.default_rng(700 + i)
            speed_lines(img, r, 36, 1.0, 0.25, CYAN2, (120, 360), WHITE)
        return shift(img, *old.shake(i, 1 + (i > n - 6), 37))

    def post(s, i, n):
        return [(WHITE, 1 - ease(i / 5))]


class S8(Shot):  # his scream: a push in, the frame flushes red, a flash
    def __init__(s):
        super().__init__("p08")
        s.pal = np.concatenate([s.pal, [PINK, PINK2]])

    def frame(s, i, n):
        cam = cam_of([(0, (430, 236, 760), "s"), (n - 1, (360, 230, 520), "i")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        r = np.random.default_rng(800 + i)
        speed_lines(img, r, 18, 1.0, -0.12, PINK2, (60, 200), PINK)
        return shift(img, *old.shake(i, 2 + (i > n - 8), 38))

    def post(s, i, n):
        return [(hexc("#ff4a6a"), 0.06 + 0.2 * ease_in(i / n)), (WHITE, ease_in((i - (n - 4)) / 3))]


class S9(Shot):  # the hand drives into the wall: cracks of light from the palm, rock, the light breaks through
    C = (625.0, 330.0)
    pal_extra = [hexc("#1a0a24"), PURP2, PINK2]

    def __init__(s):
        super().__init__("p09")
        r = np.random.default_rng(90)
        s.cracks = []
        for k in range(9):
            a = -math.pi * 0.55 + (k / 8) * math.pi * 1.1 + r.uniform(-0.12, 0.12)
            x, y = s.C
            pts = [(x, y)]
            for _ in range(11):
                a += r.uniform(-0.35, 0.35)
                x, y = x + math.cos(a) * 14, y + math.sin(a) * 14
                pts.append((x, y))
            s.cracks.append(pts)
        s.rocks = [(r.uniform(-1.2, 1.2), r.uniform(3, 8), int(r.integers(2, 5))) for _ in range(36)]

    def frame(s, i, n):
        cam = cam_of([(0, (440, 240, 820), "s"), (n - 1, (580, 300, 560), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        g = ease_out(i / 18)
        for pts in s.cracks:
            m = max(2, int(len(pts) * g))
            for (x0, y0), (x1, y1) in zip(pts[:m - 1], pts[1:m]):
                a, b = cam.P(x0, y0), cam.P(x1, y1)
                draw_line(img, *a, *b, PURP2, 3)
                draw_line(img, *a, *b, WHITE, 1)
        px, py = cam.P(*s.C)
        bolts_at(img, px, py, 60 * cam.r, i, 9, 5, (PURP2, WHITE))
        for k, (a, sp, sz) in enumerate(s.rocks):
            t = i - (k % 6)
            if t <= 0:
                continue
            x = px + math.cos(math.pi + a) * sp * t * 2.0
            y = py + math.sin(math.pi + a) * sp * t * 1.4 + 0.35 * t * t
            if 0 <= x < W - sz and 0 <= y < H - sz:
                img[int(y):int(y) + sz, int(x):int(x) + sz] = hexc("#1a0a24")
        return shift(img, *old.shake(i, 2 + (i > n - 14) * 2, 39))

    def post(s, i, n):
        return [(WHITE, 1 - ease(i / 4)), (hexc("#f0e4ff"), ease_in((i - (n - 8)) / 7))]


class S10(Shot):  # Kaguya in the dark, white light floods across
    pal_extra = [hexc("#c8d0ff")]

    def __init__(s):
        super().__init__("p03")
        dark = (s.art * 0.45 + hexc("#0a0c1e") * 0.55).astype(np.int32)
        dp = kmeans_palette(dark, 24, seed=3)
        s.L = Layer(snap(dark, dp), None, dp)
        s.pal = np.concatenate([dp, [WHITE, hexc("#c8d0ff")]])

    def frame(s, i, n):
        cam = cam_of([(0, (460, 200, 700), "s"), (n - 1, (470, 196, 660), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        u = ease_in(i / (n - 1))
        X, Y = cam.grid()
        nz = noise_at(X, Y, 30, 30, 101, 2)
        front = W * (1 - 1.3 * u) + nz * 80 - 40
        sx = np.arange(W)[None, :]
        img[sx > front] = hexc("#c8d0ff")
        img[sx > front + 20] = WHITE
        return shift(img, *old.shake(i, 1, 40))

    def post(s, i, n):
        return []


class S11(Shot):  # the sphere from outside: a cross of light at the lightning star, the beams break out, it glows
    STAR = (530.0, 152.0)
    SPH = (590.0, 200.0, 230.0)
    pal_extra = [PINK, PINK2, PURP, PURP2, hexc("#ff2ad8")]

    def __init__(s):
        super().__init__("p10")
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        d = np.hypot(xx - s.SPH[0], yy - s.SPH[1])
        s.d = d
        s.beam = (lum(a) > 120) & (a[..., 2] > a[..., 1] + 30) & (d > s.SPH[2])
        sky = tones(a, ~dil(s.beam, 4) & (d > s.SPH[2] + 20) & (lum(a) < 140), 4, 111)
        plate = a.copy()
        fill_by_tones(plate, dil(s.beam, 2), xx.astype(float), yy.astype(float), sky, 160, 14, 112, angle=-0.3)
        s.plate = snap(plate, s.pal)

    def frame(s, i, n):
        cam = cam_of([(0, (520, 220, 800), "s"), (n - 1, (560, 205, 640), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        B0 = 14
        u = ease_out((i - B0) / 18) if i >= B0 else 0.0
        hide = sample(cam, dil(s.beam, 2) & (s.d > s.SPH[2] + 520 * u))
        img[hide] = sample(cam, s.plate)[hide]
        cx, cy = cam.P(*s.STAR)
        if i < B0 + 4:
            g = math.sin(math.pi * min(1.0, i / (B0 + 3)))
            for a in (0.785, 2.356, 3.927, 5.498):
                L = (16 + 80 * g) * cam.r
                draw_line(img, cx, cy, cx + math.cos(a) * L, cy + math.sin(a) * L, WHITE, 2)
            disc_screen(img, cx, cy, (3 + 5 * g) * cam.r, WHITE)
        return shift(img, *old.shake(i, 1 + (i > n - 12) * 2, 41))

    def post(s, i, n):
        return [(WHITE, 1 - ease(i / 5)), (hexc("#ff7ae8"), 0.55 * ease_in((i - (n - 16)) / 15))]


class S12:  # it bursts
    def __init__(s):
        r = np.random.default_rng(1200)
        s.shards = [(r.uniform(0, 2 * math.pi), r.uniform(0.1, 1.0), r.uniform(4, 14), int(r.integers(2, 7)))
                    for _ in range(60)]
        s.pal = np.array([hexc("#2a0a3a"), hexc("#8a4ad8"), PINK, PINK2, WHITE, hexc("#ff2ad8")])

    def frame(s, i, n):
        cx, cy = W * 0.55, H * 0.45
        u = ease_out(i / 14)
        img = blank(W, H, hexc("#2a0a3a"))
        starburst(img, cx, cy, 70 + 520 * u, [hexc("#ff2ad8"), PINK, PINK2, WHITE], 1250 + i // 2, 34, 0.7)
        r = np.random.default_rng(1260 + i)
        for k in range(24):
            a = r.uniform(0, 2 * math.pi)
            d0 = r.uniform(30, 120) + i * 8
            draw_line(img, cx + math.cos(a) * d0, cy + math.sin(a) * d0 * 0.7, cx + math.cos(a) * (d0 + 140),
                      cy + math.sin(a) * (d0 + 140) * 0.7, WHITE if k % 2 else PINK2, 2)
        for a, d0, sp, sz in s.shards:
            d = d0 * 90 + sp * i * 1.6
            x, y = cx + math.cos(a) * d, cy + math.sin(a) * d * 0.7
            if 0 <= x < W - sz and 0 <= y < H - sz:
                img[int(y):int(y) + sz, int(x):int(x) + sz] = hexc("#2a0a3a")
        return shift(img, *old.shake(i, max(0, 6 - i * 0.2), 42))

    def post(s, i, n):
        return [(hexc("#ff7ae8"), 0.5 * (1 - ease(i / 4))), (WHITE, ease((i - (n - 24)) / 18))]


SHOTS = [("S01", 1, 26, S1), ("S02", 27, 62, S2), ("S03", 63, 118, S3), ("S04", 119, 158, S4), ("S05", 159, 204, S5),
         ("S06", 205, 236, S6), ("S07", 237, 284, S7), ("S08", 285, 312, S8), ("S09", 313, 356, S9),
         ("S10", 357, 372, S10), ("S11", 373, 426, S11), ("S12", 427, 480, S12)]


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
                for col, k in sh.post(i, n):
                    k = min(1.0, max(0.0, k))
                    if k > 0:
                        img = np.round(img * (1 - k) + np.asarray(col) * k).astype(np.int32)
                save_frame(os.path.join(OUT, "%04d.png" % f), img)
    print("frames %d-%d done in %.1fs" % (lo, hi, time.time() - t0))


if __name__ == "__main__":
    main()
