"""Madara ultimate, Perfect Susanoo, version 3: the ten storyboard panels as animated shots.

The panels are split into layers and the parts move: Madara's eye opens and his hair sways, the wood dragon tears
up out of the ground, the Rinnegan's light swells, the Susanoo forms and rises, the arm draws the blade, the blade
sweeps down, rocks fly, the cut mountain top slides away. The camera pushes, pulls and whips through each shot and
carries its motion over the cut into the next one, so the twenty seconds read as one movement.

Order (the storyboard, top-left to bottom-right) and frames at 24 fps:
  S1 face 1-40 | S2 dragon 41-92 | S3 eye 93-128 | S4 Susanoo forms 129-200 | S5 burst 201-228
  S6 towering 229-284 | S7 draw 285-326 | S8 cut 327-374 | S9 blast 375-404 | S10 aftermath 405-480
Run: python shots2.py [--frames a-b] [--every n]"""
import sys, os, math, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pxlib import *
from engine import *
import shots as old  # the blade-cut shot (S8) is kept from version 2
from shots import glint

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "frames")
WHITE, CYAN, CYAN2, BLUE = hexc("#f4fbff"), hexc("#5ce6ff"), hexc("#b8f4ff"), hexc("#2a6cff")


def base(n, w, k=48, seed=1):
    h = round(w * 941 / 1672)
    key = os.path.join(HERE, "cache", "%s_b%d" % (n, w))
    if os.path.exists(key + ".npy"):
        return np.load(key + ".npy").astype(np.int32), np.load(key + ".pal.npy")
    src = np.load(os.path.join(HERE, "cache", n + ".npy"))
    a, pal = clean(src, w, h, k=k, seed=seed)
    np.save(key + ".npy", a)
    np.save(key + ".pal.npy", pal)
    return a, pal


def dil(m, r):
    out = m.copy()
    for _ in range(r):
        o = out.copy()
        o[1:] |= out[:-1]
        o[:-1] |= out[1:]
        o[:, 1:] |= out[:, :-1]
        o[:, :-1] |= out[:, 1:]
        out = o
    return out


def ero(m, r):
    return ~dil(~m, r)


def close(m, r):
    return ero(dil(m, r), r)


def tones(img, region, n, seed=3):
    px = img[region]
    if len(px) > 20000:
        px = px[np.random.default_rng(seed).choice(len(px), 20000, replace=False)]
    u = np.unique(px.reshape(-1, 3), axis=0)
    if len(u) <= n:
        pal = u
    else:
        pal = kmeans_palette(px.reshape(-1, 1, 3), n, seed=seed)
    return sorted([p for p in pal], key=lambda c: c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11)


def sample(cam, arr):
    """Look up a base-resolution array (mask or values) at every screen pixel."""
    X, Y = cam.grid()
    h, w = arr.shape[:2]
    sx = np.clip(np.floor(X).astype(int), 0, w - 1)
    sy = np.clip(np.floor(Y).astype(int), 0, h - 1)
    ok = (X >= 0) & (X < w) & (Y >= 0) & (Y < h)
    v = arr[sy, sx]
    if v.dtype == bool:
        v = v & ok
    return v


def mode_colour(img, box):
    x0, y0, x1, y1 = box
    px = img[y0:y1, x0:x1].reshape(-1, 3)
    key = (px[:, 0] << 16) | (px[:, 1] << 8) | px[:, 2]
    v, c = np.unique(key, return_counts=True)
    k = v[np.argmax(c)]
    return np.array([(k >> 16) & 255, (k >> 8) & 255, k & 255])


class ScreenFog:
    """Horizontal fog wisps in screen space; scroll with the camera for parallax."""

    def __init__(self, seed, y0, y1, cols, cx=90, cy=9, thr=(0.6, 0.7)):
        self.n = value_noise2(W * 4, H, cx, cy, seed, 2)
        yy = np.arange(H)[:, None].astype(float)
        self.wt = np.clip((yy - y0) / max(1, y1 - y0), 0, 1)
        self.cols, self.thr = [hexc(c) for c in cols], thr

    def apply(self, img, ox):
        x0 = int(ox) % (self.n.shape[1] - W)
        v = self.n[:, x0:x0 + W] * (0.55 + 0.45 * self.wt) * (self.wt > 0)
        img[v > self.thr[0]] = self.cols[0]
        img[v > self.thr[1]] = self.cols[1]


def disc_screen(img, cx, cy, r, col, ry=None):
    if r <= 0:
        return
    img[disc_mask(W, H, cx, cy, r, ry)] = col


def ring_screen(img, cx, cy, r, th, col, ry=None, clip=None):
    if r <= 0:
        return
    m = ring_mask(W, H, cx, cy, r, th, ry)
    if clip is not None:
        m &= clip
    img[m] = col


# ===================================================================== S1: Madara's face, his eye opens
class S1:
    B = 840

    def __init__(s):
        s.art, s.pal = base("p01", s.B, seed=1)
        a = s.art
        L = lum(a)
        yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
        s.hair = (L < 70) & (a[..., 2] >= a[..., 0]) & (yy < a.shape[0] * 0.8)
        s.L_art = Layer(a, None, s.pal)
        s.L_hair = Layer(a, s.hair, s.pal)
        s.E = (518.0, 178.0, 50.0, 20.0)  # eye centre, radii
        s.skin = mode_colour(a, (440, 200, 470, 225))
        s.lash = np.array([24, 20, 40])
        s.iris = ((xx - 518) ** 2 / 48 ** 2 + (yy - 178) ** 2 / 19 ** 2 < 1) & (a[..., 2] > 150) & (a[..., 0] > 90)
        s.fogA = ScreenFog(11, 190, 270, ("#7c7e92", "#a4a6b8"))
        s.fogB = ScreenFog(12, 215, 270, ("#9497aa", "#c0c2d0"), cx=60, cy=6)
        s.pal = np.concatenate([s.pal, [s.skin, s.lash, hexc("#e8dcff"), hexc("#c9b2ff"), WHITE, hexc("#7c7e92"),
                                        hexc("#a4a6b8"), hexc("#9497aa"), hexc("#c0c2d0")]])

    def frame(s, i, n):
        cx, cy, vis = track(i, [(0, (420, 260, 800), "s"), (24, (488, 200, 620), "s"), (n - 1, (518, 180, 480), "i")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_art)
        # the hair sways in the wind, more toward the ends
        sway = lambda Y: np.round(2.6 * np.sin(Y * 0.035 + i * 0.32) * np.clip(Y / 300.0, 0, 1.4))
        draw(img, cam, s.L_hair, sway=sway)
        # the Rinnegan opens: the upper lid lifts from closed to open between frames 8 and 18
        X, Y = cam.grid()
        ex, ey, rx, ry = s.E
        inside = ((X - ex) / rx) ** 2 + ((Y - ey) / ry) ** 2 < 1
        o = ease_out((i - 8) / 10)
        lid = ey + ry - o * 2.15 * ry + 5 * (1 - ((X - ex) / rx) ** 2)  # lid edge, slightly curved
        cover = inside & (Y < lid)
        img[cover] = s.skin
        edge = inside & (Y >= lid - 1.6) & (Y < lid + 0.4)
        img[edge] = s.lash
        if i >= 16:
            p = ease((i - 16) / 10) * (0.5 + 0.2 * math.sin(i * 0.5))
            irs = sample(cam, s.iris) & ~cover
            blend(img, (232, 220, 255), irs, p)
        if i >= 22 and i % 6 < 4:
            gx, gy = cam.P(512, 173)
            glint(img, int(gx), int(gy), 2 + (i % 6 == 1), "#ffffff")
        s.fogA.apply(img, cx * cam.r * 1.2 + i * 1)
        s.fogB.apply(img, cx * cam.r * 1.5 + i * 2.5)
        amp = 0 if i < 26 else 1 + (i - 26) * 0.3
        return shift(img, *old.shake(i, amp, 1))


# ===================================================================== S2: the wood dragon tears up
class S2:
    B = 840

    def __init__(s):
        s.art, s.pal = base("p02", s.B, seed=2)
        a = s.art
        h, w = a.shape[:2]
        L = lum(a)
        yy, xx = np.mgrid[0:h, 0:w]
        wood = (a[..., 0] > 130) & (a[..., 1] > 95) & (a[..., 0] > a[..., 2] + 35) & (L > 105)
        wood = close(wood, 3)
        outline = dil(wood, 3) & (L < 70) & ~((a[..., 0] > a[..., 2] + 50) & (a[..., 1] < 80))
        drag = close(wood | outline, 2)
        # keep the components that are big (the dragon), drop stray rock highlights
        keep = np.zeros_like(drag)
        for ys, xs in old.components(drag):
            if len(ys) > 3000:
                keep[ys, xs] = True
        s.drag = keep
        # the plate: what the dragon hid, painted in the panel's own tones
        far = ~dil(keep, 6)
        sky = tones(a, (yy < h * 0.35) & far & (a[..., 2] >= a[..., 0]), 4, 21)
        mtn = tones(a, (yy > h * 0.4) & (yy < h * 0.75) & far & (a[..., 2] >= a[..., 0] - 10), 3, 22)
        rock = tones(a, (yy > h * 0.78) & far & ((a[..., 0] - a[..., 2]) > 8) & (lum(a) < 120), 4, 23)
        plate = a.copy()
        X, Y = xx.astype(float), yy.astype(float)
        ridge = h * 0.56 + 26 * noise_at(X, Y * 0, 90, 90, 24, 2) - 13
        rline = h * 0.8 + 18 * noise_at(X, Y * 0, 60, 60, 25, 2)
        hole = keep
        fill_by_tones(plate, Y < ridge, X, Y, sky, 140, 16, 26)
        fill_by_tones(plate, (Y >= ridge) & (Y < rline), X, Y, mtn, 70, 22, 27)
        fill_by_tones(plate, hole & (Y >= rline), X, Y, rock, 40, 20, 28)
        s.plate = snap(plate, s.pal)
        s.L_plate = Layer(s.plate, None, s.pal)
        s.L_drag = Layer(a, keep, s.pal)
        r = np.random.default_rng(22)
        s.dust = [(r.uniform(80, 800), r.uniform(h * 0.82, h * 0.98), r.uniform(-1.2, 1.2), r.uniform(-3.4, -1.0),
                   r.uniform(14, 34), int(r.integers(0, 2)), int(r.integers(0, 8))) for _ in range(70)]
        s.chips = [(r.uniform(100, 760), r.uniform(h * 0.75, h * 0.95), r.uniform(-4, 4), r.uniform(-16, -7),
                    int(r.integers(2, 6)), int(r.integers(2, 4)), int(r.integers(0, 2))) for _ in range(70)]
        s.dcols = [hexc("#8a7c70"), hexc("#ab9c8a"), hexc("#c9bba6")]
        s.wcols = [hexc("#c9a878"), hexc("#7a5c3c")]
        s.pal = np.concatenate([s.pal, s.dcols, s.wcols, [WHITE]])

    def frame(s, i, n):
        h = s.art.shape[0]
        # the camera rises with the dragon, then leans in toward its head (the eye-to-eye bridge into S3)
        cx, cy, vis = track(i, [(0, (430, 400, 520), "s"), (18, (440, 250, 780), "o"), (36, (430, 240, 760), "s"),
                                (n - 1, (230, 262, 500), "i")])
        rise = track(i, [(0, (175.0, 0.06), "s"), (18, (-14.0, -0.012), "o"), (28, (0.0, 0.0), "s")])
        # while it rises the camera rides up with it, so the top of the panel (where the tail leaves it) never shows
        cy = max(cy, rise[0] + vis * H / W / 2 + 1)
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        # the dragon: up out of the ground with a little overshoot, then it breathes
        bob = 3 * math.sin((i - 28) * 0.3) if i > 28 else 0
        draw(img, cam, s.L_drag, oy=rise[0] + bob, rot=rise[1], pivot=(420, 330))
        # dust boils up from the ground where it broke out: a noise cloud bank that rises and thins
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
            if t < 0:
                continue
            px, py = cam.P(x + vx * t, y + vy * t + 0.55 * t * t)
            px, py = int(px), int(py)
            if 0 <= px < W - 6 and 0 <= py < H - 6:
                img[py:py + sh, px:px + sw] = s.wcols[c]
        amp = 6 * (1 - i / 24) if i < 24 else (1 if i < 36 else 0)
        return shift(img, *old.shake(i, amp, 2))


# ===================================================================== S3: the Rinnegan, its light swells
class S3:
    B = 1120

    def __init__(s):
        s.art, s.pal = base("p03", s.B, seed=3)
        a = s.art
        yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
        s.iris = ((xx - 566) ** 2 / 124 ** 2 + (yy - 418) ** 2 / 52 ** 2 < 1) & (a[..., 2] > a[..., 0] + 20) & (a[..., 2] > 150)
        s.L_art = Layer(a, None, s.pal)
        s.dark = lum(a) < 28
        r = np.random.default_rng(33)
        s.rain = [(int(r.integers(0, W)), int(r.integers(-H, H)), int(r.integers(8, 26)), int(r.integers(10, 17)))
                  for _ in range(110)]
        s.rc = hexc("#3c4660")
        s.pal = np.concatenate([s.pal, [hexc("#e8dcff"), hexc("#c4a8ff"), hexc("#9f7cf0"), WHITE, s.rc]])

    def frame(s, i, n):
        cx, cy, vis = track(i, [(0, (520, 330, 760), "s"), (n - 1, (566, 418, 480), "i")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_art)
        dark = sample(cam, s.dark)
        for x, y0, L, v in s.rain:
            y = (y0 + i * v) % (2 * H) - H
            ys = np.arange(max(0, y), min(H, y + L))
            if len(ys):
                m = dark[ys, x]
                img[ys[m], x] = s.rc
        p = 0.3 + 0.25 * math.sin(i * 0.42)
        blend(img, (230, 214, 255), sample(cam, s.iris), p)
        # the pupil's light swells and swallows the frame
        if i >= 14:
            u = ease_in((i - 14) / (n - 15))
            px, py = cam.P(566, 418)
            r = 3 + u * 330
            disc_screen(img, px, py, r, hexc("#9f7cf0"), r * 0.87)
            disc_screen(img, px, py, r - 9, hexc("#c4a8ff"), (r - 9) * 0.87)
            disc_screen(img, px, py, (r - 9) * 0.72, hexc("#e8dcff"), (r - 9) * 0.63)
            disc_screen(img, px, py, (r - 9) * 0.34, WHITE, (r - 9) * 0.3)
        amp = 0 if i < 16 else 1 + (i - 16) * 0.12
        return shift(img, *old.shake(i, amp, 3))


# ===================================================================== S4: the Perfect Susanoo forms
class S4:
    B = 1120

    def __init__(s):
        s.art, s.pal = base("p04", s.B, seed=4)
        a = s.art
        L = lum(a)
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        d = np.hypot(xx - 570, (yy - 300) * 1.3) / 660
        nz = value_noise(w, h, 28, 44, octaves=2)
        s.rt = np.clip(d * 0.7 + nz * 0.3 + np.where(L > 150, 0.0, 0.12), 0, 1.2)
        s.lines = L > 120
        s.eyes = (a[..., 0] > 150) & (a[..., 1] < 110) & (a[..., 2] < 140)
        plate = np.zeros_like(a)
        plate[:] = np.array([5, 8, 30])
        for x, y, b in old.stars(w, h, 260, 45):
            plate[y, x] = hexc("#cfe0ff") if b else hexc("#6a86d0")
        s.plate = plate
        s.L_art = Layer(a, None, s.pal)
        s.L_plate = Layer(plate, None, None)
        r = np.random.default_rng(46)
        s.sparks = [(r.uniform(100, 1020), r.uniform(150, 640), r.uniform(-0.5, 0.5), r.uniform(-7, -2.5), int(r.integers(0, 3)))
                    for _ in range(110)]
        s.pal = np.concatenate([s.pal, [hexc("#e8dcff"), hexc("#c4a8ff"), WHITE, CYAN, CYAN2, np.array([5, 8, 30]),
                                        hexc("#cfe0ff"), hexc("#6a86d0"), np.array([40, 8, 30])]])

    def frame(s, i, n):
        # from the light, pull back to show the whole Susanoo; the eyes ignite; then push to the chest (into S5)
        cx, cy, vis = track(i, [(0, (570, 300, 500), "s"), (38, (560, 330, 1000), "o"), (54, (560, 320, 980), "s"),
                                (n - 1, (560, 560, 560), "i")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        u = (i - 2) / 30
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        art = img.copy()
        draw(art, cam, s.L_art)
        rt = sample(cam, s.rt)
        vis_m = rt < u
        img[vis_m] = art[vis_m]
        lines = sample(cam, s.lines)
        front = (rt >= u) & (rt < u + 0.035) & lines
        img[front] = CYAN2
        img[front & (rt < u + 0.012)] = WHITE
        if i < 50:
            img[sample(cam, s.eyes) & vis_m] = np.array([40, 8, 30])
        for k, (x, y, vx, vy, c) in enumerate(s.sparks):
            t = (i + k * 3) % 40
            if i < 62:
                px, py = cam.P(x + vx * t, y + vy * t)
                px, py = int(px), int(py)
                if 0 <= px < W - 1 and 0 <= py < H - 1:
                    img[py, px] = (WHITE, CYAN, CYAN2)[c]
                    if c == 0:
                        img[py + 1, px] = CYAN
        if 50 <= i < 57:
            for ex in (530, 616):
                gx, gy = cam.P(ex, 296)
                glint(img, int(gx), int(gy), max(1, int((7 - (i - 50)) * cam.r * 1.4)), "#ffffff")
        amp = 3 if 50 <= i < 54 else (1 if 54 <= i < 60 else (2 if i > n - 6 else 0))
        return shift(img, *old.shake(i, amp, 4))


# ===================================================================== S5: chakra bursts at the chest
class S5:
    B = 840

    def __init__(s):
        s.art, s.pal = base("p05", s.B, seed=5)
        s.L_art = Layer(s.art, None, s.pal)
        s.C = (315.0, 398.0)
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2]])

    def frame(s, i, n):
        if i == 0:
            return blank(W, H, WHITE)
        cx, cy, vis = track(i, [(1, (330, 380, 520), "s"), (16, (370, 320, 800), "o"), (n - 1, (380, 310, 840), "s")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1], roll=0.03 * (1 - ease_out(i / 16)), margin=0.12)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_art)
        bx, by = cam.P(*s.C)
        r = np.random.default_rng(55 + i // 2)
        for k in range(14):
            a = k * (2 * math.pi / 14) + i * 0.06 + r.uniform(-0.05, 0.05)
            L = r.uniform(140, 460)
            draw_line(img, bx, by, bx + math.cos(a) * L, by + math.sin(a) * L, WHITE if k % 2 else CYAN, 1 + (k % 3 == 0))
        rr = (24 + i * 22) * cam.r
        ring_screen(img, bx, by, rr, 4, WHITE)
        ring_screen(img, bx, by, rr - 4, 3, CYAN)
        for _ in range(40):
            img[int(r.integers(0, H)), int(r.integers(0, W))] = WHITE
        if i >= n - 7:
            wr = ease_in((i - (n - 7)) / 6) * 560
            disc_screen(img, bx, by, wr + 14, CYAN2)
            disc_screen(img, bx, by, wr, WHITE)
        return shift(img, *old.shake(i, max(0, 5 - i * 0.22), 5))


# ===================================================================== S6: from below, the Susanoo rises over the enemy
class S6:
    B = 840

    def __init__(s):
        s.art, s.pal = base("p06", s.B, seed=6)
        a = s.art
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        blue = (a[..., 2] > a[..., 0] + 40) & (a[..., 2] > 90) & (xx < w * 0.78)
        su = close(blue, 3)
        keep = np.zeros_like(su)
        for ys, xs in old.components(su):
            if len(ys) > 4000:
                keep[ys, xs] = True
        s.su = dil(keep, 1) & ((lum(a) < 60) | keep)  # with its dark outline
        sky = tones(a, (yy < h * 0.35) & (xx > w * 0.6), 2, 61)
        fog = tones(a, (yy > h * 0.7) & (xx > w * 0.55) & (lum(a) > 70), 4, 62)
        plate = a.copy()
        X, Y = xx.astype(float), yy.astype(float)
        fogline = h * 0.6 + 40 * noise_at(X, Y * 0, 120, 120, 63, 2) - 20
        plate[s.su & (Y < fogline)] = sky[0]
        for x, y, b in old.stars(w, h, 120, 64):
            if s.su[y, x] and y < fogline[y, x]:
                plate[y, x] = hexc("#cfe0ff")
        fill_by_tones(plate, s.su & (Y >= fogline), X, Y, fog, 150, 14, 65, angle=-0.35)
        s.L_plate = Layer(snap(plate, s.pal), None, s.pal)
        s.L_su = Layer(a, s.su, s.pal)
        s.outline = (lum(a) > 150) & (a[..., 2] > a[..., 0] + 40) & s.su
        s.fog = ScreenFog(61, 200, 270, ("#9a9cae", "#c8cad6"))
        r = np.random.default_rng(66)
        s.wind = [(r.uniform(0, W), r.uniform(130, 265), r.uniform(10, 40), r.uniform(8, 16)) for _ in range(26)]
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2, hexc("#9a9cae"), hexc("#c8cad6"), hexc("#d4d6e2"), hexc("#cfe0ff")]])

    def frame(s, i, n):
        cx, cy, vis = track(i, [(0, (660, 330, 600), "s"), (34, (430, 220, 820), "s"), (44, (430, 215, 820), "s"),
                                (n - 1, (500, 200, 500), "i")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        for x, y, L, v in s.wind:
            xx = int((x - i * v) % (W + 60)) - 30
            draw_line(img, xx, y, xx + L, y, hexc("#d4d6e2"))
        up = track(i, [(0, (80.0, 0.9, 0.05), "s"), (32, (0.0, 1.0, 0.0), "o")])
        breathe = 1.5 * math.sin(i * 0.25) if i > 32 else 0
        ok = draw(img, cam, s.L_su, oy=up[0] + breathe, sc=up[1], rot=up[2], pivot=(345, 470))
        p = 0.25 + 0.25 * math.sin(i * 0.5)
        # the outline glow rides on the moving Susanoo: sample it through the same transform
        X, Y = cam.grid()
        Yl = (Y - up[0] - breathe - 470) / up[1] + 470
        Xl = (X - 345) / up[1] + 345
        h, w = s.outline.shape
        sx, sy = np.clip(Xl.astype(int), 0, w - 1), np.clip(Yl.astype(int), 0, h - 1)
        blend(img, (210, 245, 255), s.outline[sy, sx] & ok, p)
        s.fog.apply(img, cx * cam.r * 1.4 - i * 3)
        if 20 <= i < 30 and i % 3 != 2:
            r = np.random.default_rng(600 + i)
            for _ in range(3):
                bx, by = cam.P(r.uniform(350, 500), r.uniform(90 + up[0], 225 + up[0]))
                draw_pts(img, bolt(r, bx, by, bx + r.uniform(-70, 70), by + r.uniform(-50, 50), 7, 6),
                         WHITE if r.random() < 0.6 else CYAN2)
        amp = 2 if 20 <= i < 26 else (1 if i > n - 5 else 0)
        return shift(img, *old.shake(i, amp, 6))


# ===================================================================== S7: the arm draws the blade
class S7:
    B = 840
    AX = np.array([118.0, 124.0]) / np.hypot(118, 124)

    def __init__(s):
        s.art, s.pal = base("p07", s.B, seed=7)
        a = s.art
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        f = s.B / 560
        strip = poly_mask(w, h, [(x * f, y * f) for x, y in
                                 [(226, 28), (276, 30), (402, 152), (390, 160), (356, 176), (346, 182)]])
        s.strip = strip
        S = old.sat(a)
        blade = strip & ((S > 0.5) | (lum(a) > 185))
        s.blade = strip & (dil(blade, 2) | (dil(blade, 4) & (lum(a) < 80)))
        armish = (a[..., 2] > a[..., 0] + 40) & (a[..., 2] > 80)
        arm = close(armish, 3) & ~s.blade
        keep = np.zeros_like(arm)
        for ys, xs in old.components(arm):
            if len(ys) > 3000:
                keep[ys, xs] = True
        s.arm = dil(keep, 1) & (keep | (lum(a) < 45))
        plate = mirror_up(a, dil(s.arm, 1) & ~s.blade)
        plate = old.mirror_fill(plate, s.blade, (-s.AX[1], s.AX[0]), unknown=dil(s.arm, 1))
        s.L_plate = Layer(snap(plate, s.pal), None, s.pal)
        s.L_arm = Layer(a, s.arm, s.pal)
        s.L_blade = Layer(a, s.blade, s.pal)
        s.piv = (-180.0, 520.0)
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2]])

    def frame(s, i, n):
        cx, cy, vis = track(i, [(0, (560, 250, 500), "s"), (18, (500, 250, 760), "o"), (n - 6, (480, 240, 780), "s"),
                                (n - 1, (300, 80, 780), "i")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        rot = track(i, [(0, (0.035,), "s"), (16, (-0.02,), "o"), (24, (-0.012,), "s")])[0]
        # the blade slides out of the fist along its own axis (arm space), and only shows outside the fist
        k = 225 * (1 - ease_out((i - 4) / 12)) if i >= 4 else 225
        X, Y = cam.grid()
        px, py = s.piv
        c, sn = math.cos(-rot), math.sin(-rot)
        Xa = px + (X - px) * c - (Y - py) * sn
        Ya = py + (X - px) * sn + (Y - py) * c
        h, w = s.blade.shape
        bx, by = Xa - s.AX[0] * k, Ya - s.AX[1] * k
        ix, iy = np.floor(bx).astype(int), np.floor(by).astype(int)
        ax, ay = np.floor(Xa).astype(int), np.floor(Ya).astype(int)
        ok = (ix >= 0) & (ix < w) & (iy >= 0) & (iy < h) & (ax >= 0) & (ax < w) & (ay >= 0) & (ay < h)
        ix, iy, ax, ay = np.clip(ix, 0, w - 1), np.clip(iy, 0, h - 1), np.clip(ax, 0, w - 1), np.clip(ay, 0, h - 1)
        ok &= s.blade[iy, ix] & s.strip[ay, ax]
        img[ok] = s.art[iy, ix][ok]
        draw(img, cam, s.L_arm, rot=rot, pivot=s.piv)
        r = np.random.default_rng(700 + i)
        if 4 <= i < 16:
            for _ in range(8):
                o = r.uniform(-60, 60)
                x0, y0 = cam.P(440 + s.AX[1] * o, 150 - s.AX[0] * o)
                L = r.uniform(50, 140)
                draw_line(img, x0, y0, x0 - s.AX[0] * L, y0 - s.AX[1] * L, CYAN2 if r.random() < 0.5 else WHITE)
        if i >= 15 and (i // 2) % 3 != 2:
            for _ in range(2):
                x0, y0 = cam.P(r.uniform(450, 630), r.uniform(180, 290))
                draw_pts(img, bolt(r, x0, y0, x0 + r.uniform(-60, 60), y0 - r.uniform(30, 80), 6, 5), WHITE)
        if i >= n - 6:  # whip up along the blade into the sweep
            speed_lines(img, r, 18, -s.AX[0], -s.AX[1], CYAN2, (60, 200), WHITE)
        amp = 3 if 15 <= i < 19 else (1 if 19 <= i < 25 else 0)
        return shift(img, *old.shake(i, amp, 7))


# ===================================================================== S8: the blade sweeps down (version 2 shot)
class S8:
    def __init__(s):
        s.o = old.S8()
        s.pal = s.o.pal

    def frame(s, i, n):
        img = s.o.frame(i, n)
        if i < 3:  # the whip from S7 runs out
            r = np.random.default_rng(880 + i)
            speed_lines(img, r, 14 - i * 4, 0.7, 0.72, CYAN2, (60, 180), WHITE)
        return img


# ===================================================================== S9: the land explodes, rocks fly
class S9:
    B = 840

    def __init__(s):
        s.art, s.pal = base("p09", s.B, seed=9)
        a = s.art
        h, w = a.shape[:2]
        L, S_ = lum(a), old.sat(a)
        yy, xx = np.mgrid[0:h, 0:w]
        rockish = ((L < 95) | ((L >= 95) & (L < 175) & (S_ < 0.5) & (a[..., 2] > a[..., 0]))) & (xx > 225) & (yy < 393)
        s.rocks = []
        allm = np.zeros((h, w), bool)
        for ys, xs in old.components(rockish):
            area = len(ys)
            if area < 160 or area > 20000:
                continue
            bw, bh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
            if area / (bw * bh) < 0.42 or ys.max() >= 450 or xs.min() <= 227:
                continue
            x0, y0 = xs.min(), ys.min()
            sub = np.zeros((bh, bw, 3), np.int32)
            msk = np.zeros((bh, bw), bool)
            sub[ys - y0, xs - x0] = a[ys, xs]
            msk[ys - y0, xs - x0] = True
            s.rocks.append((Layer(sub, msk, s.pal, levels=(1.0,)), x0, y0, bw, bh))
            allm[ys, xs] = True
        allm = dil(allm, 1)
        plate = a.copy()
        plate[allm] = WHITE
        r = np.random.default_rng(99)
        for _ in range(220):
            m = disc_mask(w, h, r.uniform(220, w), r.uniform(0, 450), r.uniform(3, 9)) & allm
            plate[m] = CYAN if r.random() < 0.7 else CYAN2
        s.L_plate = Layer(plate, None, s.pal)
        s.cyan = (a[..., 1] > 180) & (a[..., 0] < 120)
        s.C = (450.0, 255.0)
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2, np.array([16, 34, 84])]])

    def frame(s, i, n):
        if i == 0:
            return blank(W, H, WHITE)
        cx, cy, vis = track(i, [(1, (450, 255, 500), "s"), (n - 1, (430, 240, 820), "o")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        if (i // 2) % 2:
            img[sample(cam, s.cyan)] = CYAN2
        t = i - 1
        for k, (L, x0, y0, bw, bh) in enumerate(s.rocks):
            mx, my = x0 + bw / 2, y0 + bh / 2
            dx, dy = mx - s.C[0], my - s.C[1]
            dl = max(1.0, math.hypot(dx, dy))
            sp = 5 + (k % 3) * 2.2
            off = -40 + t * sp
            ox, oy = dx / dl * off, dy / dl * off + 0.06 * t * t
            rot = (k % 2 * 2 - 1) * 0.02 * t
            if i == 1:  # impact frame: the rocks as navy shapes on white
                continue
            draw(img, cam, L, ox=x0 + ox, oy=y0 + oy, rot=rot, pivot=(bw / 2, bh / 2))
        if i == 1:
            out = blank(W, H, WHITE)
            for k, (L, x0, y0, bw, bh) in enumerate(s.rocks):
                tmp = np.zeros((H, W, 3), np.int32)
                ok = draw(tmp, cam, L, ox=x0 - 40 * 0, oy=y0)
                out[ok] = np.array([16, 34, 84])
            return out
        r = np.random.default_rng(900 + i)
        bx, by = cam.P(*s.C)
        radial_lines(img, r, 12, bx, by, 40, 220, WHITE)
        return shift(img, *old.shake(i, max(1, 7 - i * 0.22), 9))


# ===================================================================== S10: the valley, the mountain top slides away
class S10:
    B = 840

    def __init__(s):
        s.art, s.pal = base("p10", s.B, seed=10)
        a = s.art
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        f = s.B / 560
        poly = poly_mask(w, h, [(x * f, y * f) for x, y in [(108, 130), (190, 46), (322, 96), (310, 124), (196, 132)]])
        slab = poly & (lum(a) < 165)
        slab = close(slab, 2) & poly
        keep = np.zeros_like(slab)
        for ys, xs in old.components(slab):
            if len(ys) > 2000:
                keep[ys, xs] = True
        s.slab = keep
        sk = tones(a, (yy < h * 0.2), 4, 101)
        plate = a.copy()
        fill_by_tones(plate, keep, xx.astype(float), yy.astype(float), sk, 160, 12, 102)
        s.L_plate = Layer(snap(plate, s.pal), None, s.pal)
        s.L_slab = Layer(a, keep, s.pal)
        s.rings = (lum(a) > 228) & (yy > 80 * f) & (yy < 160 * f) & (xx > 280 * f)
        s.SC = (318.0, 321.0)
        s.fog = ScreenFog(101, 205, 270, ("#b8bccd", "#eef0f8"), cx=110, cy=10)
        s.dcols = [hexc("#b8bccd"), hexc("#e2e4f0")]
        s.pal = np.concatenate([s.pal, [WHITE, CYAN, CYAN2, hexc("#b8bccd"), hexc("#eef0f8"), hexc("#e2e4f0"),
                                        hexc("#c8cbdc")]])

    def frame(s, i, n):
        cx, cy, vis = track(i, [(0, (318, 300, 500), "s"), (40, (420, 290, 780), "o"), (n - 1, (430, 280, 820), "s")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        sl = track(i, [(0, (0.0, 0.0, 0.0), "s"), (12, (0.0, 0.0, 0.0), "s"), (n - 1, (30.0, 13.0, 0.035), "o")])
        draw(img, cam, s.L_slab, ox=sl[0], oy=sl[1], rot=sl[2], pivot=(470, 160))
        if 12 <= i < 60:  # dust spills from the cut as it slides
            r = np.random.default_rng(1000 + i // 2)
            for _ in range(5):
                t = r.uniform(0, 1)
                x, y = 170 + 300 * t + sl[0], 190 - 40 * t + sl[1] + r.uniform(0, 10)
                px, py = cam.P(x, y)
                rr = r.uniform(3, 8) * cam.r * 1.5
                disc_screen(img, px, py, rr, s.dcols[int(r.integers(0, 2))], rr * 0.7)
        if (i // 4) % 2:
            img[sample(cam, s.rings)] = hexc("#e2e4f0")
        floor = np.zeros((H, W), bool)
        _, fy = cam.P(0, 252)
        floor[max(0, int(fy)):] = True
        sx, sy = cam.P(*s.SC)
        for k, st in enumerate((0, 10, 22)):
            t = i - st
            if t < 0:
                continue
            rr = (12 + t * (10 - k * 1.5)) * cam.r
            if rr > 520:
                continue
            th = 4 if rr < 160 else (3 if rr < 300 else 2)
            ring_screen(img, sx, sy, rr, th, WHITE if rr < 260 else hexc("#c8cbdc"), rr * 0.26, floor)
        s.fog.apply(img, cx * cam.r * 1.3 + i // 2)
        if 56 <= i < 62:
            gx, gy = cam.P(276, 312)
            glint(img, int(gx), int(gy), 4 - abs(i - 58), "#ffffff")
        amp = 2 if i < 8 else (1 if i < 20 else 0)
        return shift(img, *old.shake(i, amp, 10, 2))


FADES = {
    "S04_form": lambda i, n: ("#e8dcff", 1 - ease(i / 10)),
    "S06_tower": lambda i, n: ("#f4fbff", 1 - ease(i / 7)),
    "S09_blast": lambda i, n: ("#f4fbff", ease((i - (n - 7)) / 6)),
    "S10_after": lambda i, n: ("#f4fbff", 1 - ease(i / 12)),
}

SHOTS = [("S01_face", 1, 40, S1), ("S02_dragon", 41, 92, S2), ("S03_eye", 93, 128, S3), ("S04_form", 129, 200, S4),
         ("S05_burst", 201, 228, S5), ("S06_tower", 229, 284, S6), ("S07_draw", 285, 326, S7),
         ("S08_cut", 327, 374, S8), ("S09_blast", 375, 404, S9), ("S10_after", 405, 480, S10)]


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
                    t1 = time.time()
                    cache[name] = cls()
                    print(name, "ready in %.1fs" % (time.time() - t1), flush=True)
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
