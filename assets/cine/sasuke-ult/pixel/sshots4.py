"""Sasuke ultimate, version 4 (on top of sshots3):
  - S5: the Susanoo's own red eyes (found in the full-size panel and put back on the 840 grid) light up in place
  - S3: Amaterasu pierces the target. The shot is layered: background plate, the TARGET (any character sprite, a
    transparent PNG), black flame spikes behind it and in front of it. The spikes burst out through the target's chest
    in all directions, hold and writhe, black flames eat into the target, it sinks, smoke fills the frame.
    Kaguya (cut from the panel) is only the placeholder target:
        python sshots4.py --target path/to/character.png     (feet at the bottom of the image, transparent background)
    --layers also writes the shot's layers (back, target, front) to frames_layers/ for compositing at runtime.
Run: python sshots4.py [--frames a-b] [--every n] [--target png] [--layers]"""
import sys, os, math, time
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "madara_px"))
sys.path.insert(0, HERE)
from pxlib import *
from engine import *
import shots as old
from shots2 import tones, sample, disc_screen, dil, close
from shots4 import starburst, XX, YY
from shots import glint
import sshots3 as v3
from sshots3 import Shot, cam_of, FL, SMOKE, WHITE, RED

TARGET = None
if "--target" in sys.argv:
    TARGET = sys.argv[sys.argv.index("--target") + 1]
LAYERS = "--layers" in sys.argv


# ------------------------------------------------------------------ S5 with the panel's own eyes
class S5(v3.S5):
    EYES = [(379.0, 140.0), (330.0, 154.0)]

    def __init__(s):
        super().__init__()
        src = np.load(os.path.join(HERE, "cache", "p05.npy"))[..., :3].astype(int)
        hh, ww = src.shape[:2]
        yy, xx = np.mgrid[0:hh, 0:ww]
        red = (src[..., 0] > 170) & (src[..., 1] < 110) & (src[..., 0] > src[..., 2] + 30) & (xx > 600) & (xx < 960) & (yy < 420)
        # footprint fraction on the 840 grid
        fy, fx = hh / 473, ww / 840
        acc = np.zeros((473, 840))
        ys, xs = np.nonzero(red)
        np.add.at(acc, ((ys / fy).astype(int), (xs / fx).astype(int)), 1.0)
        s.eye = acc / (fy * fx) > 0.2
        s.art = s.art.copy()
        s.art[s.eye] = hexc("#b0183c")  # the eyes back in the art, on its own grid
        s.L = Layer(s.art, None, s.pal)
        s.pal = np.concatenate([s.pal, [hexc("#b0183c"), hexc("#ff3a5a"), hexc("#ffb0c0")]])

    def frame(s, i, n):
        W0 = n - 6
        cam = cam_of([(0, (640, 290, 520), "s"), (W0, (420, 160, 560), "s"), (n - 1, (760, 170, 560), "i")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L)
        v3.shimmer(img, sample(cam, s.glow), i, 51)
        px, py = cam.P(*s.C)
        v3.bolts_at(img, px, py, 70 * cam.r, i, 5, 5)
        if i > n * 0.4:  # the eyes flare: the eye pixels themselves brighten and pulse
            e = sample(cam, s.eye)
            img[e] = hexc("#ff3a5a")
            if (i // 2) % 2:
                core = sample(cam, s.eye & ~dil(~s.eye, 1))
                img[core] = hexc("#ffb0c0")
        r = np.random.default_rng(500 + i)
        if i >= W0:
            speed_lines(img, r, 40, 1.0, 0.0, v3.PINK2, (120, 360), WHITE)
        return img


# ------------------------------------------------------------------ the target
def load_target():
    """RGBA target on the 840 grid, feet at its bottom edge. Placeholder: Kaguya cut from panel 3."""
    if TARGET:
        src = read_png(TARGET)
        alpha = src[..., 3] > 128
        ys, xs = np.nonzero(alpha)
        src, alpha = src[ys.min():ys.max() + 1, xs.min():xs.max() + 1], alpha[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        h0, w0 = alpha.shape
        th = 400
        tw = max(1, round(w0 * th / h0))
        img = resample_r(src[..., :3], tw, th)
        m = mask_resample(alpha, tw, th)
        pal = kmeans_palette(img[m].reshape(-1, 1, 3), 32, seed=5)
        img = snap(img, pal)
        return img, m, pal, (470 - tw // 2, 450 - th)
    k, pal = v3.base("p03")
    m = np.load(os.path.join(HERE, "cache", "kaguya_mask.npy"))
    yy, xx = np.mgrid[0:473, 0:840]
    L = lum(k)
    tend = m & (L < 70) & (((xx > 550) & (yy > 285)) | ((xx < 330) & (yy > 350)))  # the spike tongues on her robe
    tend = dil(tend, 1) & m
    robe = tones(k, m & (L > 150) & (yy > 250) & (old.sat(k) < 0.25), 3, 309)
    k = k.copy()
    fill_by_tones(k, tend, xx.astype(float), yy.astype(float), robe, 60, 30, 310, angle=0.9)
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return k[y0:y1, x0:x1], m[y0:y1, x0:x1], pal, (x0, y0)


def spike_poly(x, y, a, L, w, jag, seed):
    """A black flame spike from (x,y) along angle a: tapered, with a couple of barbs, jagged edges."""
    r = np.random.default_rng(seed)
    ca, sa = math.cos(a), math.sin(a)
    nx, ny = -sa, ca
    left, right = [], []
    for k in range(9):
        f = k / 8
        half = w * (1 - f) ** 0.8 * (1 + jag * r.uniform(-0.35, 0.35))
        bx, by = x + ca * L * f, y + sa * L * f
        left.append((bx + nx * half, by + ny * half))
        right.append((bx - nx * half, by - ny * half))
        if k in (3, 5) and r.random() < 0.7:  # a barb flicking back off one side
            side = 1 if r.random() < 0.5 else -1
            bl = L * r.uniform(0.12, 0.22)
            tip = (bx + side * nx * (half + bl * 0.6) - ca * bl * 0.4, by + side * ny * (half + bl * 0.6) - sa * bl * 0.4)
            (left if side == 1 else right).append(tip)
            (left if side == 1 else right).append((x + ca * L * (f + 0.06) + side * nx * half * 0.8,
                                                   y + sa * L * (f + 0.06) + side * ny * half * 0.8))
    return left + [(x + ca * L, y + sa * L)] + right[::-1]


SP = [hexc("#3f1162"), hexc("#170e2f"), hexc("#0f091b")]  # the panel's own spike colours: purple rim, navy, deep


def draw_spike(img, pts):
    m = poly_mask(W, H, pts)
    sh = np.zeros_like(m)
    sh[2:, 2:] = m[:-2, :-2]
    img[m] = SP[0]           # a purple rim on the upper-left (lit) side
    img[m & sh] = SP[1]      # navy body
    core = np.zeros_like(m)
    core[4:, 4:] = m[:-4, :-4]
    img[m & core & sh] = SP[2]


def spear(x, y_tip, y_base, half):
    """The great spike: a tall wedge from below the frame up to its tip (slightly jagged flanks)."""
    pts = [(x - half, y_base)]
    for k in range(1, 6):
        f = k / 6
        pts.append((x - half * (1 - f) + (3 if k % 2 else -2), y_base + (y_tip - y_base) * f))
    pts.append((x, y_tip))
    for k in range(5, 0, -1):
        f = k / 6
        pts.append((x + half * (1 - f) + (-2 if k % 2 else 3), y_base + (y_tip - y_base) * f))
    pts.append((x + half, y_base))
    return pts


class S3(Shot):
    pal_extra = FL + SMOKE + [hexc("#140810"), hexc("#3f1162"), hexc("#170e2f"), hexc("#0f091b")]
    IGN, BURST = 6, 9

    def __init__(s):
        super().__init__("p03")
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        km = np.load(os.path.join(HERE, "cache", "kaguya_mask.npy"))
        tri = poly_mask(840, 473, [(432, 168), (612, 410), (600, 473), (290, 473), (318, 390)]) & (lum(a) < 75) & ~km
        sky = tones(a, ~dil(km, 8) & (yy < 300) & (xx > 300), 4, 301)
        low = tones(a, ~dil(km | tri, 8) & (yy > 330), 3, 302)
        plate = a.copy()
        hole = dil(km, 3) | dil(tri, 2)
        fill_by_tones(plate, hole & (yy < 330), xx.astype(float), yy.astype(float), sky, 150, 26, 303, angle=-0.25)
        fill_by_tones(plate, hole & (yy >= 330), xx.astype(float), yy.astype(float), low, 70, 22, 304)
        s.Lp = Layer(snap(plate, s.pal), None, s.pal)
        timg, tm, tpal, (tx, ty) = load_target()
        s.T, s.Tm, s.tx, s.ty = timg, tm, tx, ty
        s.LT = Layer(timg, tm, tpal, levels=(1.0, 0.75, 0.5))
        th, tw = tm.shape
        ys, xs = np.nonzero(tm)
        s.chest = (tx + float(xs.mean()), ty + float(ys.min() + (ys.max() - ys.min()) * 0.32))
        if TARGET is None:
            s.chest = (432.0, 172.0)  # the great spike's tip in the panel
        s.half = (xs.max() - xs.min()) * 0.3 if TARGET else 150.0
        s.foot = ty + float(ys.max())
        s.size = float(ys.max() - ys.min())
        s.burnN = noise_at(np.mgrid[0:th, 0:tw][1].astype(float), np.mgrid[0:th, 0:tw][0].astype(float), 12, 12, 305, 2)
        s.dchest = np.hypot(np.mgrid[0:th, 0:tw][1] + tx - s.chest[0], np.mgrid[0:th, 0:tw][0] + ty - s.chest[1])
        r = np.random.default_rng(306)
        s.spikes = []
        for k in range(16):
            a = k / 16 * 2 * math.pi + r.uniform(-0.15, 0.15)
            s.spikes.append(dict(a=a, L=s.size * r.uniform(0.45, 0.9), w=s.size * r.uniform(0.025, 0.045),
                                 front=(k % 2 == 0), seed=3060 + k, delay=r.uniform(0, 2.5)))
        s.pal = np.concatenate([s.pal, tpal])

    def target_frame(s, i):
        """The target with the burn eaten into it, and its offset (it shudders, then sinks)."""
        t = s.T.copy()
        if False:
            g = ease((i - s.BURST) / 40)
            reach = 20 + s.size * 0.7 * g
            burn = (s.dchest < reach) & (s.burnN > 0.74 - 0.18 * g)
            edge = burn & ~dil(~burn, 1)
            t[burn] = FL[2]
            t[burn & ~edge] = hexc("#140810")
            t[dil(burn, 1) & ~burn] = FL[0]
        oy = 0
        ox = 0
        if s.BURST <= i < s.BURST + 6:
            ox = (1 if i % 2 else -1) * 2
        if i >= 30:
            oy = round(60 * ease_in((i - 30) / 24))
        return t, ox, oy

    def frame(s, i, n, layers=None):
        cam = cam_of([(0, (430, 250, 840), "s"), (s.BURST, (450, 236, 700), "o"), (n - 1, (460, 240, 660), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.Lp)
        back = img.copy()
        cx, cy = cam.P(*s.chest)
        behind, hem = [], []
        for k, (dx, ang, L, w) in enumerate(((-0.55, -1.9, 1.0, 0.05), (0.6, -1.25, 1.05, 0.05), (-0.2, -1.62, 1.25, 0.04),
                                             (0.95, -1.05, 0.7, 0.04), (-0.95, -2.2, 0.7, 0.04))):
            t0 = s.BURST + 1 + k * 0.7
            if i < t0:
                continue
            u = ease_out((i - t0) / 4)
            bx, by = cam.P(s.chest[0] + dx * s.half, s.foot)
            behind.append(spike_poly(bx, by, ang + 0.02 * math.sin(i * 0.4 + k), s.size * L * u * cam.r,
                                     s.size * w * cam.r, 0.8, 3200 + k))
        great = None
        if i >= s.BURST - 3:  # the great spike thrusts up from below the frame through the target
            u = ease_out((i - (s.BURST - 3)) / 4)
            tip_y = s.foot + 140 - (s.foot + 140 - s.chest[1]) * u * (1 + 0.04 * math.sin((i - s.BURST) * 0.9))
            gx, gy = cam.P(s.chest[0], tip_y)
            _, by = cam.P(0, 520)
            great = spear(gx, gy, by, s.half * cam.r)
        if i >= s.BURST + 2:  # tongues of the same flame lick up the hem
            g = ease_out((i - s.BURST - 2) / 14)
            r = np.random.default_rng(3300)
            for k in range(9):
                fx = s.chest[0] + r.uniform(-1.6, 1.6) * s.half
                bx, by = cam.P(fx, s.foot - r.uniform(0, 40))
                a = -math.pi / 2 + r.uniform(-0.5, 0.5) + 0.08 * math.sin(i * 0.6 + k)
                hem.append(spike_poly(bx, by, a, s.size * r.uniform(0.12, 0.25) * g * cam.r, s.size * 0.03 * cam.r,
                                      1.4, 3400 + k + i // 3))
        for pts in behind:
            draw_spike(img, pts)
        grown = [(True, q) for q in behind + ([great] if great else []) + hem]
        T, ox, oy = s.target_frame(i)
        tl = Layer(T, s.Tm, None, levels=(1.0,))
        tlay = np.zeros((H, W, 3), np.int32)
        tok = draw(tlay, cam, tl, ox=s.tx + ox, oy=s.ty + oy)
        img[tok] = tlay[tok]
        before_front = img.copy()
        if great:
            draw_spike(img, great)
        for pts in hem:
            draw_spike(img, pts)
        if s.IGN <= i < s.BURST + 2:  # it ignites in the chest
            g = (i - s.IGN + 1) / (s.BURST + 2 - s.IGN)
            fx, fy = cam.P(s.chest[0], s.foot)
            starburst(img, fx, fy, (16 + 60 * g) * cam.r, [SP[0], SP[2]], 3100 + i, 14, 0.5)
        if i >= n - 16:  # smoke rises and fills the frame
            X, Y = cam.grid()
            u = ease_in((i - (n - 16)) / 15)
            nz = noise_at(X, Y + i * 5.0, 60, 40, 307, 3)
            img[nz + u * 0.95 > 0.98] = SMOKE[1]
            img[nz + u * 0.95 > 1.06] = SMOKE[0]
        if layers is not None:
            layers["back"] = back
            layers["target"] = (tlay, tok)
            layers["front"] = (img, img != before_front)
        if i == s.BURST:  # one impact frame: the target and the spikes black on red-white
            out = np.full((H, W, 3), WHITE)
            out[tok] = FL[2]
            for _, pts in grown:
                out[poly_mask(W, H, pts)] = FL[2]
            return out
        return shift(img, *old.shake(i, 4 if s.BURST < i < s.BURST + 6 else (1 if i > s.BURST else 0), 33))

    def post(s, i, n):
        return [(SMOKE[0], ease_in((i - (n - 4)) / 3)), (hexc("#ff4a5a"), 0.35 if i == s.BURST + 1 else 0.0)]


SHOTS = [(nm, a, b, {"S03": S3, "S05": S5}.get(nm, c)) for nm, a, b, c in v3.SHOTS]


def main():
    a = sys.argv
    lo, hi, every = 1, 480, 1
    if "--frames" in a:
        lo, hi = map(int, a[a.index("--frames") + 1].split("-"))
    if "--every" in a:
        every = int(a[a.index("--every") + 1])
    os.makedirs(v3.OUT, exist_ok=True)
    if LAYERS:
        os.makedirs(os.path.join(HERE, "frames_layers"), exist_ok=True)
    cache = {}
    t0 = time.time()
    for f in range(lo, hi + 1, every):
        for name, f0, f1, cls in SHOTS:
            if f0 <= f <= f1:
                if name not in cache:
                    cache[name] = cls()
                sh = cache[name]
                i, n = f - f0, f1 - f0 + 1
                lay = {} if (LAYERS and name == "S03") else None
                raw = sh.frame(i, n, lay) if lay is not None else sh.frame(i, n)
                img = snap(np.clip(raw, 0, 255), sh.pal)
                for col, k in sh.post(i, n):
                    k = min(1.0, max(0.0, k))
                    if k > 0:
                        img = np.round(img * (1 - k) + np.asarray(col) * k).astype(np.int32)
                save_frame(os.path.join(v3.OUT, "%04d.png" % f), img)
                if lay:
                    d = os.path.join(HERE, "frames_layers")
                    save_frame(os.path.join(d, "back_%02d.png" % i), snap(lay["back"], sh.pal))
                    for key in ("target", "front"):
                        im, m = lay[key]
                        m = m if m.ndim == 2 else np.any(m, 2)
                        rgba = np.concatenate([np.clip(im, 0, 255), (m * 255)[..., None]], 2)
                        write_png(os.path.join(d, "%s_%02d.png" % (key, i)), rgba.astype(np.uint8))
    print("frames %d-%d done in %.1fs" % (lo, hi, time.time() - t0))


if __name__ == "__main__":
    main()
