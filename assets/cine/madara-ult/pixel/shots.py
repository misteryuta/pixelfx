"""Madara ultimate, Perfect Susanoo: ten pixel-exact shots in the order of the user's storyboard
(top-left, top-right, next row left, right, ...). 20 s, 24 fps, frames 1..480, 480x270.

  S1  p01  Madara's face in the fog, Rinnegan glows ........................ 1-36
  S2  p02  the wood dragon tears out of the ground, camera tilts up ........ 37-84
  S3  p03  the Rinnegan close up; its light swells and fills the frame ..... 85-120
  S4  p04  the Perfect Susanoo forms out of that light, the eyes ignite .... 121-192
  S5  p05  chakra bursts at its chest ...................................... 193-222
  S6  p06  from below: the Susanoo towers over the enemy .................. 223-276
  S7  p07  its hand closes on the grip and the blade slides out ........... 277-318
  S8  p08  the blade sweeps down over the mountains and hits the land ..... 319-366
  S9  p09  the land explodes, rocks fly ................................... 367-396
  S10 p10  the valley afterwards, shock rings, Madara's Susanoo alone ..... 397-480

Every frame lives on one 1-pixel grid: art is resampled once per shot, effects are rasterised directly, the
camera moves by whole pixels, and the finished frame is snapped to the shot's palette.
Run: python shots.py [--frames a-b] [--every n]"""
import sys, os, math, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pxlib import *

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "frames")
import os as _os
W, H = (int(v) for v in _os.environ.get("PX_RES", "480x270").split("x"))


def ease(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


def ease_out(u):
    u = min(1.0, max(0.0, u))
    return 1 - (1 - u) ** 3


def ease_in(u):
    u = min(1.0, max(0.0, u))
    return u ** 3


def path(i, keys):
    """keys: [(frame, x, y), ...] -> whole-pixel camera position, smoothstep between keys."""
    if i <= keys[0][0]:
        return int(keys[0][1]), int(keys[0][2])
    for (a, x0, y0), (b, x1, y1) in zip(keys[:-1], keys[1:]):
        if i <= b:
            u = ease((i - a) / max(1, b - a))
            return int(round(x0 + (x1 - x0) * u)), int(round(y0 + (y1 - y0) * u))
    return int(keys[-1][1]), int(keys[-1][2])


def shake(i, amp, seed=0, hold=1):
    if amp < 0.5:
        return 0, 0
    r = np.random.default_rng(seed * 1000 + i // hold)
    a = int(round(amp))
    return int(r.integers(-a, a + 1)), int(r.integers(-a, a + 1))


def load(n, w=560, h=315, k=40, seed=1):
    key = os.path.join(HERE, "cache", "%s_%d.npy" % (n, w))
    if os.path.exists(key) and os.path.exists(key + ".pal.npy"):
        return np.load(key).astype(np.int32), np.load(key + ".pal.npy")
    src = np.load(os.path.join(HERE, "cache", n + ".npy"))
    a, pal = clean_art(src, w, h, k=k, seed=seed)
    np.save(key, a)
    np.save(key + ".pal.npy", pal)
    return a, pal


def sat(img):
    mx, mn = img.max(2), img.min(2)
    return (mx - mn) / np.maximum(mx, 1)


def mirror_fill(img, mask, direction, unknown=None, sides=(1, -1)):
    """Fill masked pixels by mirroring the nearest unmasked pixels across the hole's edge along `direction`
    (a unit vector, both ways); keeps cloud/mountain texture continuous instead of smearing it."""
    out = img.copy()
    h, w = mask.shape
    dx, dy = direction
    unk = mask if unknown is None else (unknown | mask)
    ys, xs = np.nonzero(mask)
    for y, x in zip(ys, xs):
        best = None
        for sgn in sides:
            for d in range(1, 400):
                px, py = int(round(x + sgn * dx * d)), int(round(y + sgn * dy * d))
                if not (0 <= px < w and 0 <= py < h):
                    break
                if not unk[py, px]:
                    if best is None or d < best[0]:
                        best = (d, sgn)
                    break
        if best is None:
            continue
        d, sgn = best
        for k in (2 * d, d):  # mirrored pixel, else the edge pixel
            px, py = int(round(x + sgn * dx * k)), int(round(y + sgn * dy * k))
            if 0 <= px < w and 0 <= py < h and not unk[py, px]:
                out[y, x] = img[py, px]
                break
    return out


def components(mask):
    """4-connected components -> list of (ys, xs) arrays."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    comps = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        n = len(comps) + 1
        stack = [(y0, x0)]
        lab[y0, x0] = n
        pts = []
        while stack:
            y, x = stack.pop()
            pts.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    stack.append((yy, xx))
        p = np.array(pts)
        comps.append((p[:, 0], p[:, 1]))
    return comps


class Fog:
    """Scrolling pixel fog: long horizontal wisps, two hard tones, only in a band toward the bottom."""

    def __init__(self, w, h, seed, y0, y1, cols=("#8a8ca0", "#b4b6c6"), cx=90, cy=9, thr=(0.6, 0.7)):
        self.n = value_noise2(w * 3, h, cx, cy, seed, octaves=2)
        yy = np.arange(h)[:, None].astype(float)
        self.wt = np.clip((yy - y0) / max(1, y1 - y0), 0, 1)
        self.cols = [hexc(c) for c in cols]
        self.thr = thr

    def apply(self, img, ox, amount=1.0):
        h, w = img.shape[:2]
        x0 = int(ox) % (self.n.shape[1] - w)
        v = self.n[:h, x0:x0 + w] * (0.55 + 0.45 * self.wt[:h]) * (self.wt[:h] > 0) * amount
        img[v > self.thr[0]] = self.cols[0]
        img[v > self.thr[1]] = self.cols[1]


def stars(w, h, n, seed, col="#dfe8ff"):
    r = np.random.default_rng(seed)
    return [(int(r.integers(0, w)), int(r.integers(0, h)), int(r.integers(0, 4))) for _ in range(n)]


def glint(img, x, y, size, col):
    c = hexc(col)
    h, w = img.shape[:2]
    for k in range(-size, size + 1):
        for px, py in ((x + k, y), (x, y + k)):
            if 0 <= px < w and 0 <= py < h:
                img[py, px] = c


WHITE, CYAN, CYAN2, BLUE = hexc("#f4fbff"), hexc("#5ce6ff"), hexc("#b8f4ff"), hexc("#2a6cff")

# ============================================================== shots

class S1:  # Madara's face, fog, Rinnegan
    def __init__(s):
        s.art, s.pal = load("p01")
        s.fogA = Fog(560, 315, 11, 200, 315, cols=("#7c7e92", "#a4a6b8"))
        s.fogB = Fog(560, 315, 12, 240, 315, cols=("#9497aa", "#c0c2d0"), cx=60, cy=6)
        a = s.art
        yy, xx = np.mgrid[0:315, 0:560]
        s.iris = ((xx - 335) ** 2 / 26 ** 2 + (yy - 122) ** 2 / 14 ** 2 < 1) & (a[..., 2] > a[..., 0] + 15) & (a[..., 2] > 150) & (a[..., 0] > 90)
        s.pal = np.concatenate([s.pal, [hexc("#e8dcff"), hexc("#c9b2ff"), WHITE, hexc("#7c7e92"), hexc("#a4a6b8"),
                                        hexc("#9497aa"), hexc("#c0c2d0")]])

    def frame(s, i, n):
        img = s.art.copy()
        # the Rinnegan's rings brighten from the middle of the shot
        p = ease((i - 8) / 20) * (0.55 + 0.25 * math.sin(i * 0.9))
        if p > 0:
            blend(img, (232, 220, 255), s.iris, p * 0.6)
        if i >= 24:
            glint(img, 331, 118, 2 + (i % 4 == 0), "#ffffff")
        s.fogA.apply(img, 40 + i * 1)
        s.fogB.apply(img, 200 + i * 2)
        cx, cy = path(i, [(0, 70, 34), (n, 44, 24)])
        sx, sy = shake(i, 0 if i < 27 else 1 + (i - 27) * 0.35, 1, 1)
        return crop(img, cx + sx, cy + sy, W, H)


class S2:  # the wood dragon
    def __init__(s):
        s.art, s.pal = load("p02", 640, 360, seed=2)
        r = np.random.default_rng(22)
        s.dust = [(r.uniform(60, 600), r.uniform(330, 372), r.uniform(-0.6, 0.6), r.uniform(-2.2, -0.8),
                   r.uniform(8, 22), r.integers(0, 2)) for _ in range(72)]
        s.chips = [(r.uniform(80, 620), r.uniform(-40, 120), r.uniform(-1, 1), r.uniform(0.5, 2.5),
                    r.integers(1, 4), r.integers(1, 3), r.integers(0, 2)) for _ in range(60)]
        s.dcols = [hexc("#6a5e58"), hexc("#8c7e74"), hexc("#ad9d8c")]
        s.wcols = [hexc("#c9a878"), hexc("#7a5c3c")]

    def frame(s, i, n):
        img = s.art.copy()
        h, w = img.shape[:2]
        # dust boils up out of the broken ground
        for k, (x, y, vx, vy, rad, c) in enumerate(s.dust):
            t = i - (k % 8)
            if t < 0:
                continue
            life = 1 - t / 46
            if life <= 0:
                continue
            rr = (rad + t * 0.45) * min(1.0, life * 3)
            px, py = x + vx * t, y + vy * t
            img[disc_mask(w, h, px, py, rr, rr * 0.8)] = s.dcols[min(2, c)]
            img[disc_mask(w, h, px - rr * 0.25, py - rr * 0.25, rr * 0.55, rr * 0.45)] = s.dcols[min(2, c + 1)]
        # wood splinters rain down
        for k, (x, y, vx, vy, sw, sh, c) in enumerate(s.chips):
            t = i + k % 10
            px, py = int(x + vx * t), int(y + vy * t + 0.09 * t * t)
            if 0 <= px < w - 4 and 0 <= py < h - 4:
                img[py:py + sh, px:px + sw] = s.wcols[c]
        cx, cy = path(i, [(0, 70, 90), (30, 130, 4), (n, 140, 0)])
        amp = 5 * (1 - i / 26) if i < 26 else 1
        sx, sy = shake(i, amp, 2)
        return crop(img, cx + sx, cy + sy, W, H)


class S3:  # Rinnegan close-up; its light fills the frame
    def __init__(s):
        s.art, s.pal = load("p03", seed=3)
        a = s.art
        s.bg = lum(a) < 28
        yy, xx = np.mgrid[0:315, 0:560]
        s.yy, s.xx = yy, xx
        s.iris = ((xx - 283) ** 2 / 62 ** 2 + (yy - 209) ** 2 / 26 ** 2 < 1) & (a[..., 2] > a[..., 0] + 20) & (a[..., 2] > 150)
        r = np.random.default_rng(33)
        s.rain = [(int(r.integers(0, 560)), int(r.integers(-315, 315)), int(r.integers(8, 26)), int(r.integers(9, 15)))
                  for _ in range(90)]
        s.pal = np.concatenate([s.pal, [hexc("#e8dcff"), hexc("#c4a8ff"), hexc("#9f7cf0"), WHITE]])
        s.rc = hexc("#3c4660")

    def frame(s, i, n):
        img = s.art.copy()
        for x, y0, L, v in s.rain:
            y = (y0 + i * v) % 630 - 315
            ys = np.arange(max(0, y), min(315, y + L))
            if len(ys):
                m = s.bg[ys, x]
                img[ys[m], x] = s.rc
        # the rings pulse outward
        p = 0.3 + 0.25 * math.sin(i * 0.42)
        blend(img, (230, 214, 255), s.iris, p)
        cx, cy = path(i, [(0, 26, 8), (n, 44, 40)])
        # the pupil's light swells, then fills the screen (the bridge into S4)
        u = ease_in((i - 18) / (n - 19))
        if i >= 18:
            r = 3 + u * 360
            d = np.hypot(s.xx + 0.5 - 283, (s.yy + 0.5 - 209) * 1.15)
            img[(d < r) & (d >= r - 10)] = hexc("#9f7cf0")
            img[d < r - 10] = hexc("#c4a8ff")
            img[d < (r - 10) * 0.75] = hexc("#e8dcff")
            img[d < (r - 10) * 0.35] = WHITE
        sx, sy = shake(i, 0 if i < 20 else 1 + u * 2, 3)
        return crop(img, cx + sx, cy + sy, W, H)


class S4:  # Perfect Susanoo forms out of the light
    def __init__(s):
        s.art, s.pal = load("p04", seed=4)
        a = s.art
        L = lum(a)
        yy, xx = np.mgrid[0:315, 0:560]
        d = np.hypot(xx - 285, (yy - 150) * 1.3) / 330
        nz = value_noise(560, 315, 14, 44, octaves=2)
        s.rt = np.clip(d * 0.7 + nz * 0.3 + np.where(L > 150, 0.0, 0.12), 0, 1.2)
        s.eyes = (a[..., 0] > 150) & (a[..., 1] < 110) & (a[..., 2] < 140)
        s.lines = L > 120
        plate = np.zeros_like(a)
        plate[:] = np.array([5, 8, 30])
        for x, y, b in stars(560, 315, 120, 45):
            plate[y, x] = hexc("#cfe0ff") if b else hexc("#6a86d0")
        s.plate = plate
        r = np.random.default_rng(46)
        s.sparks = [(r.uniform(40, 520), r.uniform(60, 330), r.uniform(-0.3, 0.3), r.uniform(-3.5, -1.2), r.integers(0, 3))
                    for _ in range(90)]
        s.pal = np.concatenate([s.pal, [hexc("#e8dcff"), hexc("#c4a8ff"), WHITE, CYAN, CYAN2,
                                        np.array([5, 8, 30]), hexc("#cfe0ff"), hexc("#6a86d0")]])

    def frame(s, i, n):
        u = (i - 2) / 30
        img = np.where((s.rt < u)[..., None], s.art, s.plate)
        front = (s.rt >= u) & (s.rt < u + 0.035) & s.lines
        img[front] = CYAN2
        img[front & (s.rt < u + 0.012)] = WHITE
        if i < 52:  # eyes dark until they ignite
            img[s.eyes & (s.rt < u)] = np.array([40, 8, 30])
        for k, (x, y, vx, vy, c) in enumerate(s.sparks):
            t = (i + k * 3) % 40
            px, py = int(x + vx * t), int(y + vy * t)
            if 0 <= px < 559 and 0 <= py < 314 and i < 60:
                img[py, px] = (WHITE, CYAN, CYAN2)[c]
                if c == 0:
                    img[py + 1, px] = CYAN
        if 52 <= i < 58:
            for ex in (265, 308):
                glint(img, ex, 148, 6 - (i - 52), "#ffffff")
        cx, cy = path(i, [(0, 40, 45), (n, 40, 8)])
        sx, sy = shake(i, 3 if 52 <= i < 56 else (1 if 56 <= i < 62 else 0), 4)
        return crop(img, cx + sx, cy + sy, W, H)


class S5:  # chakra bursts at the chest
    def __init__(s):
        s.art, s.pal = load("p05", seed=5)
        yy, xx = np.mgrid[0:315, 0:560]
        s.d = np.hypot(xx + 0.5 - 210, yy + 0.5 - 265)
        s.ang = np.arctan2(yy + 0.5 - 265, xx + 0.5 - 210)
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2]])

    def frame(s, i, n):
        if i == 0:
            return blank(W, H, WHITE)
        img = s.art.copy()
        # rays spin out of the burst
        r = np.random.default_rng(55 + i // 2)
        for k in range(14):
            a = k * (2 * math.pi / 14) + i * 0.05 + r.uniform(-0.05, 0.05)
            L = r.uniform(120, 420)
            draw_line(img, 210, 265, 210 + math.cos(a) * L, 265 + math.sin(a) * L,
                      WHITE if k % 2 else CYAN, 1 + (k % 3 == 0))
        # a shock ring races out
        rr = 18 + i * 16
        img[(s.d < rr) & (s.d >= rr - 4)] = WHITE
        img[(s.d < rr - 4) & (s.d >= rr - 7)] = CYAN
        for _ in range(40):
            img[int(r.integers(0, 315)), int(r.integers(0, 560))] = WHITE
        # bright out to white: the bridge into S6
        if i >= 22:
            wr = ease_in((i - 22) / (n - 23)) * 520
            img[s.d < wr] = WHITE
            img[(s.d < wr + 14) & (s.d >= wr)] = CYAN2
        cx, cy = path(i, [(0, 20, 30), (n, 52, 42)])
        sx, sy = shake(i, max(0, 4 - i * 0.2), 5)
        return crop(img, cx + sx, cy + sy, W, H)


class S6:  # from below: the Susanoo towers over the enemy
    def __init__(s):
        s.art, s.pal = load("p06", seed=6)
        a = s.art
        s.outline = (lum(a) > 150) & (a[..., 2] > a[..., 0] + 40) & (np.mgrid[0:315, 0:560][1] < 380)
        s.fog = Fog(560, 315, 61, 215, 315, cols=("#9a9cae", "#c8cad6"))
        r = np.random.default_rng(66)
        s.wind = [(r.uniform(0, 560), r.uniform(150, 310), r.uniform(10, 40), r.uniform(8, 16)) for _ in range(26)]
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2, hexc("#9a9cae"), hexc("#c8cad6")]])

    def frame(s, i, n):
        img = s.art.copy()
        p = 0.25 + 0.25 * math.sin(i * 0.7)
        blend(img, (210, 245, 255), s.outline, p)
        s.fog.apply(img, 300 - i * 2)
        for x, y, L, v in s.wind:
            xx = int((x - i * v) % 620) - 30
            draw_line(img, xx, y, xx + L, y, hexc("#d4d6e2"))
        if 20 <= i < 30 and i % 3 != 2:  # lightning crackles round the Susanoo as it moves
            r = np.random.default_rng(600 + i)
            for _ in range(3):
                x0, y0 = r.uniform(230, 330), r.uniform(60, 150)
                draw_pts(img, bolt(r, x0, y0, x0 + r.uniform(-50, 50), y0 + r.uniform(-40, 40), 6, 6),
                         WHITE if r.random() < 0.6 else CYAN2)
        cx, cy = path(i, [(0, 80, 45), (8, 80, 45), (40, 4, 0), (n, 0, 0)])
        sx, sy = shake(i, 2 if 20 <= i < 26 else 0, 6)
        return crop(img, cx + sx, cy + sy, W, H)


class S7:  # the hand closes on the grip, the blade slides out
    AX = np.array([118.0, 124.0]) / np.hypot(118, 124)  # tip -> hand along the blade

    def __init__(s):
        s.art, s.pal = load("p07", seed=7)
        a = s.art
        poly = poly_mask(560, 315, [(226, 28), (276, 30), (402, 152), (390, 160), (356, 176), (346, 182)])
        s.blade = poly & ((sat(a) > 0.5) | (lum(a) > 185))
        s.blade = poly & dilate_mask(s.blade, 1)
        s.strip = poly
        s.plate = mirror_fill(a, s.blade, (-s.AX[1], s.AX[0]))
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2]])

    def frame(s, i, n):
        img = s.plate.copy()
        # draw: the blade pixels slide out of the fist along the blade's axis, whole pixels only
        k = int(round(150 * (1 - ease_out((i - 5) / 11)))) if i >= 5 else 150
        ox, oy = int(round(s.AX[0] * k)), int(round(s.AX[1] * k))
        ys, xs = np.nonzero(s.blade)
        ty, tx = ys + oy, xs + ox
        ok = (ty >= 0) & (ty < 315) & (tx >= 0) & (tx < 560)
        ty, tx, ys, xs = ty[ok], tx[ok], ys[ok], xs[ok]
        keep = s.strip[ty, tx]
        img[ty[keep], tx[keep]] = s.art[ys[keep], xs[keep]]
        if 5 <= i < 17:  # speed lines along the blade while it draws
            r = np.random.default_rng(700 + i)
            for _ in range(7):
                o = r.uniform(-30, 30)
                bx, by = 300 + s.AX[1] * o, 100 - s.AX[0] * o
                L = r.uniform(30, 90)
                draw_line(img, bx, by, bx - s.AX[0] * L, by - s.AX[1] * L, CYAN2 if r.random() < 0.5 else WHITE)
        if i >= 16 and (i // 2) % 3 != 2:
            r = np.random.default_rng(710 + i // 2)
            for _ in range(2):
                x0, y0 = r.uniform(300, 420), r.uniform(120, 190)
                draw_pts(img, bolt(r, x0, y0, x0 + r.uniform(-40, 40), y0 - r.uniform(20, 60), 5, 5), WHITE)
        cx, cy = path(i, [(0, 30, 22), (n, 56, 34)])
        amp = 3 if 16 <= i < 20 else (1 if 20 <= i < 26 else 0)
        sx, sy = shake(i, amp, 7)
        return crop(img, cx + sx, cy + sy, W, H)


class S8:  # the blade sweeps down and hits the land
    IMP = (392, 252)

    def __init__(s):
        s.art, s.pal = load("p08", seed=8)
        a = s.art
        yy, xx = np.mgrid[0:315, 0:560]
        s.yy, s.xx = yy, xx
        poly = poly_mask(560, 315, [(0, 104), (404, 186), (404, 270), (0, 194)])
        up = poly_mask(560, 315, [(0, 70), (404, 150), (404, 270), (0, 194)])
        bladeish = (sat(a) > 0.45) | (lum(a) > 228)
        s.bmask = (poly & bladeish) | (up & (lum(a) > 228))
        s.bmask = dilate_mask(s.bmask, 2) & up
        pblade = poly_mask(560, 315, [(0, 104), (398, 188), (350, 254), (0, 186)])
        s.burst = (xx > 318) & bladeish & ~pblade
        s.burst = dilate_mask(s.burst, 1) & (xx > 316) & ~pblade
        s.burst &= yy < 292  # the dark ground strip stays
        plate = mirror_fill(a, s.bmask, (0.2 / 1.0198, -1.0 / 1.0198), unknown=s.burst, sides=(1,))
        fill = s.burst & ~s.bmask
        sky = fill & (yy < 200)
        plate = mirror_fill(plate, sky, (1.0, 0.0), unknown=fill)
        land = (fill | (s.bmask & (xx >= 300))) & (yy >= 200)
        native = ~(s.bmask | s.burst)
        ly, lx = np.nonzero(land)
        sx = np.clip(lx - 250, 0, 559)
        ok = native[ly, sx]
        plate[ly[ok], lx[ok]] = a[ly[ok], sx[ok]]
        plate[ly[~ok], lx[~ok]] = plate[ly[~ok], sx[~ok]]
        s.plate = plate
        nz = value_noise(560, 315, 10, 81, octaves=2)
        s.bt = np.hypot(xx - s.IMP[0], (yy - s.IMP[1]) * 1.4) / 300 + nz * 0.18
        # the blade's four tone bands, sampled from the panel
        s.bands = [hexc("#5ee8fb"), hexc("#2f9cf2"), hexc("#1446f0"), hexc("#0414b8")]
        r = np.random.default_rng(88)
        s.debris = [(s.IMP[0] + r.uniform(-10, 60), s.IMP[1] - r.uniform(0, 20), r.uniform(-2, 7), r.uniform(-9, -3),
                     r.integers(1, 4), r.integers(0, 3)) for _ in range(70)]
        s.pal = np.concatenate([s.pal, s.bands, [WHITE, CYAN, CYAN2, BLUE, np.array([6, 8, 20])]])

    def blade(s, img, ang):
        # the final blade: top edge (8,115)->(395,197), 64 px thick, pivoting about a point far off left
        px, py = -520.0, 20.0
        top0 = np.array([[8.0, 115.0], [424.0, 203.0]])
        c, si = math.cos(ang), math.sin(ang)
        rot = lambda p: (px + (p[0] - px) * c - (p[1] - py) * si, py + (p[0] - px) * si + (p[1] - py) * c)
        a, b = rot(top0[0]), rot(top0[1])
        ex, ey = b[0] - a[0], b[1] - a[1]
        L = math.hypot(ex, ey)
        nx, ny = -ey / L, ex / L  # downwards normal
        T = 64
        a0 = (a[0] - ex / L * 300, a[1] - ey / L * 300)
        poly = [a0, b, (b[0] + nx * T, b[1] + ny * T), (a0[0] + nx * T, a0[1] + ny * T)]
        m = poly_mask(560, 315, poly)
        dist = ((s.xx + 0.5 - a[0]) * nx + (s.yy + 0.5 - a[1]) * ny) / T
        band = np.clip((dist * 4).astype(int), 0, 3)
        for k in range(4):
            img[m & (band == k)] = s.bands[k]
        img[m & (dist < 0.06)] = CYAN2
        return a, b, (nx, ny), m

    def frame(s, i, n):
        HIT = 10
        if i in (HIT, HIT + 1):  # impact frame: the blade and the land as black shapes on white
            img = s.plate.copy()
            bl = np.zeros_like(img)
            _, _, _, m = s.blade(bl, 0.0)
            land = (lum(img) < 70) & (s.yy > 150)
            ink, paper = np.array([6, 8, 20]), WHITE
            if i == HIT + 1:
                ink, paper = paper, ink
            out = np.where(land[..., None], ink, paper)
            out[m] = ink
            out[s.burst & (s.bt < 0.12)] = ink
            cx, cy = 42, 30
            return crop(out, cx, cy, W, H)
        img = s.plate.copy()
        ang = -0.17 * (1 - ease_in(i / HIT)) if i < HIT else 0.0
        a, b, (nx, ny), m = s.blade(img, ang)
        if 1 <= i < HIT:  # speed lines trailing above the falling blade
            r = np.random.default_rng(830 + i)
            ex, ey = b[0] - a[0], b[1] - a[1]
            for k in range(9):
                o = r.uniform(6, 26 + 40 * i / HIT)
                t0 = r.uniform(-0.3, 0.7)
                L = r.uniform(0.15, 0.4)
                x0, y0 = a[0] + ex * t0 - nx * o, a[1] + ey * t0 - ny * o
                draw_line(img, x0, y0, x0 + ex * L, y0 + ey * L, CYAN2 if k % 3 else WHITE)
        # lightning ticks along the blade's top edge
        r = np.random.default_rng(800 + i // 2)
        for k in range(5):
            t = 0.12 + k * 0.19 + r.uniform(-0.03, 0.03)
            x0, y0 = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            draw_pts(img, bolt(r, x0 - nx * 30, y0 - ny * 30, x0 + 6, y0 + 22, 4, 4), WHITE, 2 if k % 2 else 1)
        if i > HIT + 1:
            u = ease_out((i - HIT - 2) / 14)
            vis = s.bt < u * 1.25
            img[vis & s.burst] = s.art[vis & s.burst]
            front = (s.bt >= u * 1.25) & (s.bt < u * 1.25 + 0.03) & s.burst
            img[front] = WHITE
            for k, (x, y, vx, vy, sz, c) in enumerate(s.debris):
                t = i - HIT - 2 - (k % 4)
                if t < 0:
                    continue
                qx, qy = int(x + vx * t), int(y + vy * t + 0.35 * t * t)
                if 0 <= qx < 556 and 0 <= qy < 311:
                    img[qy:qy + sz, qx:qx + sz] = (CYAN, BLUE, WHITE)[c]
        # brightening into the explosion
        if i >= n - 8:
            wr = ease_in((i - (n - 8)) / 7) * 560
            d = np.hypot(s.xx - s.IMP[0], s.yy - s.IMP[1])
            img[d < wr] = WHITE
            img[(d < wr + 16) & (d >= wr)] = CYAN2
        cx, cy = path(i, [(0, 30, 10), (HIT, 42, 30), (n, 60, 36)])
        amp = 0 if i < HIT else max(1, 6 - (i - HIT) * 0.25)
        sx, sy = shake(i, amp, 8)
        return crop(img, cx + sx, cy + sy, W, H)


class S9:  # the land explodes, rocks fly
    C = (300, 170)

    def __init__(s):
        s.art, s.pal = load("p09", seed=9)
        a = s.art
        L, S_ = lum(a), sat(a)
        yy, xx = np.mgrid[0:315, 0:560]
        rockish = ((L < 95) | ((L >= 95) & (L < 175) & (S_ < 0.5) & (a[..., 2] > a[..., 0]))) & (xx > 150) & (yy < 262)
        s.rocks = []
        allm = np.zeros((315, 560), bool)
        for ys, xs in components(rockish):
            area = len(ys)
            if area < 70 or area > 9000:
                continue
            bw, bh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
            if area / (bw * bh) < 0.42 or ys.max() >= 300 or xs.min() <= 151:
                continue
            s.rocks.append((ys, xs, a[ys, xs]))
            allm[ys, xs] = True
        s.allm = dilate_mask(allm, 1)
        # fill behind the rocks: white blast with cyan blobs, like the panel
        plate = a.copy()
        plate[s.allm] = WHITE
        r = np.random.default_rng(99)
        for _ in range(140):
            x, y = r.uniform(150, 560), r.uniform(0, 300)
            m = disc_mask(560, 315, x, y, r.uniform(2, 6)) & s.allm
            plate[m] = CYAN if r.random() < 0.7 else CYAN2
        s.plate = plate
        s.cyan = (a[..., 1] > 180) & (a[..., 0] < 120)
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2, np.array([16, 34, 84])]])

    def frame(s, i, n):
        if i == 0:
            return blank(W, H, WHITE)
        if i == 1:  # impact frame: the rocks as navy silhouettes on white
            out = blank(560, 315, WHITE)
            for ys, xs, c in s.rocks:
                out[ys, xs] = np.array([16, 34, 84])
            return crop(out, 40, 24, W, H)
        img = s.plate.copy()
        if (i // 2) % 2:
            img[s.cyan] = CYAN2
        t = i - 2
        for k, (ys, xs, c) in enumerate(s.rocks):
            mx, my = xs.mean(), ys.mean()
            dx, dy = mx - s.C[0], my - s.C[1]
            dl = max(1.0, math.hypot(dx, dy))
            sp = 3.2 + (k % 3) * 1.4
            off = -26 + t * sp
            ox, oy = int(round(dx / dl * off)), int(round(dy / dl * off + 0.04 * t * t))
            ty, tx = ys + oy, xs + ox
            ok = (ty >= 0) & (ty < 315) & (tx >= 0) & (tx < 560)
            img[ty[ok], tx[ok]] = c[ok]
        r = np.random.default_rng(900 + i)
        for _ in range(10):  # radial speed lines
            a = r.uniform(0, 2 * math.pi)
            r0 = r.uniform(60, 200)
            draw_line(img, s.C[0] + math.cos(a) * r0, s.C[1] + math.sin(a) * r0,
                      s.C[0] + math.cos(a) * (r0 + 80), s.C[1] + math.sin(a) * (r0 + 80), WHITE)
        cx, cy = path(i, [(0, 40, 24), (n, 46, 30)])
        sx, sy = shake(i, max(1, 6 - i * 0.2), 9)
        return crop(img, cx + sx, cy + sy, W, H)


class S10:  # the valley afterwards
    SC = (212, 214)

    def __init__(s):
        s.art, s.pal = load("p10", seed=10)
        a = s.art
        yy, xx = np.mgrid[0:315, 0:560]
        s.yy, s.xx = yy, xx
        s.rings = (lum(a) > 228) & (yy > 80) & (yy < 160) & (xx > 280)
        s.fog = Fog(560, 315, 101, 235, 315, cols=("#b8bccd", "#eef0f8"), cx=110, cy=10)
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2, hexc("#b8bccd"), hexc("#eef0f8"), hexc("#e2e4f0"), hexc("#c8cbdc")]])

    def frame(s, i, n):
        img = s.art.copy()
        if (i // 4) % 2:
            img[s.rings] = hexc("#e2e4f0")
        for k, st in enumerate((0, 10, 22)):  # shock rings roll out from the Susanoo over the valley
            t = i - st
            if t < 0:
                continue
            r = 8 + t * (7 - k)
            if r > 360:
                continue
            th = 4 if r < 160 else (3 if r < 300 else 2)
            m = ring_mask(560, 315, s.SC[0], s.SC[1], r, th, r * 0.26) & (s.yy > 168)
            img[m] = WHITE if r < 260 else hexc("#c8cbdc")
        s.fog.apply(img, 100 + i // 2)
        if 56 <= i < 62:
            glint(img, 184, 208, 4 - abs(i - 58), "#ffffff")
        cx, cy = path(i, [(0, 76, 44), (n, 36, 14)])
        amp = 2 if i < 8 else (1 if i < 20 else 0)
        sx, sy = shake(i, amp, 10, 2)
        return crop(img, cx + sx, cy + sy, W, H)


def dilate_mask(m, r):
    out = m.copy()
    for _ in range(r):
        o = out.copy()
        o[1:] |= out[:-1]
        o[:-1] |= out[1:]
        o[:, 1:] |= out[:, :-1]
        o[:, :-1] |= out[:, 1:]
        out = o
    return out


FADES = {
    "S04_form": lambda i, n: ("#e8dcff", 1 - ease(i / 10)),  # out of the Rinnegan's light
    "S06_tower": lambda i, n: ("#f4fbff", 1 - ease(i / 7)),  # out of the burst's white
    "S09_blast": lambda i, n: ("#f4fbff", ease((i - (n - 7)) / 6)),  # into the white
    "S10_after": lambda i, n: ("#f4fbff", 1 - ease(i / 12)),
}

SHOTS = [("S01_face", 1, 36, S1), ("S02_dragon", 37, 84, S2), ("S03_eye", 85, 120, S3), ("S04_form", 121, 192, S4),
         ("S05_burst", 193, 222, S5), ("S06_tower", 223, 276, S6), ("S07_draw", 277, 318, S7),
         ("S08_cut", 319, 366, S8), ("S09_blast", 367, 396, S9), ("S10_after", 397, 480, S10)]


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
                img = sh.frame(f - f0, f1 - f0 + 1)
                img = snap(np.clip(img, 0, 255), sh.pal)
                fd = FADES.get(name)
                if fd:
                    col, k = fd(f - f0, f1 - f0 + 1)
                    if k > 0:
                        img = np.round(img * (1 - k) + hexc(col) * k).astype(np.int32)
                save_frame(os.path.join(OUT, "%04d.png" % f), img)
    print("frames %d-%d done in %.1fs" % (lo, hi, time.time() - t0))


if __name__ == "__main__":
    main()
