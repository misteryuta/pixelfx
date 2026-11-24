"""Madara ultimate, Perfect Susanoo, version 5 (on top of shots3):
  - the wood dragon, risen, rears back and lunges at the enemy and snaps him up (a small pixel action scene)
  - the orb is the user's own orb image, animated: the streaks fall, the orb breathes and shrinks, its rim flickers
  - the Susanoo blade has a katana point, six tone bands, and white chakra wisps curling up off it
  - in the valley the cut mountain tops spring up off their bases with bursts of white smoke and flying grit,
    then a close blast of rock and smoke whites the screen out
Frames at 24 fps: S1 1-36 | S2 37-108 | S3 109-132 | orb 133-154 | S4 155-204 | S5 205-230 | S6 231-276
                  S7 277-316 | S8 317-362 | S9 363-386 | S10 387-442 | S11 443-480
Run: python shots4.py [--frames a-b] [--every n]"""
import sys, os, math, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pxlib import *
from engine import *
import shots as old
import shots2 as v3
import shots3 as v4
from shots2 import base, dil, close, tones, sample, disc_screen, ring_screen, WHITE, CYAN, CYAN2, BLUE
from shots import glint

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "frames")
XX, YY = np.mgrid[0:H, 0:W][1], np.mgrid[0:H, 0:W][0]


def starburst(img, cx, cy, R, cols, seed, spikes=24, squash=1.0):
    """A spiky pixel burst: one jagged star per tone, each smaller and lighter."""
    r = np.random.default_rng(seed)
    for col, kR in zip(cols, (1.0, 0.8, 0.58, 0.36)[:len(cols)]):
        pts = []
        for k in range(spikes):
            a = k * 2 * math.pi / spikes + r.uniform(-0.05, 0.05)
            rad = R * kR * (1.0 if k % 2 else r.uniform(0.45, 0.7))
            pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad * squash))
        img[poly_mask(W, H, pts)] = col


def lumpy(img, cx, cy, rx, ry, col, nz, k=0.9, cut=1.0):
    if rx < 1:
        return
    d = np.hypot((XX - cx) / rx, (YY - cy) / max(ry, 1))
    img[d + (nz - 0.5) * k < cut] = col


def sprite_at(img, L, bw, bh, px, py, sc, rot=0.0, col=None):
    """Draw a sprite layer centred on screen point (px, py) at scale sc."""
    cam2 = Cam(bw / 2 - (px - W / 2) / sc, bh / 2 - (py - H / 2) / sc, W / sc)
    tmp = np.zeros((H, W, 3), np.int32)
    ok = draw(tmp, cam2, L, rot=rot, pivot=(bw / 2, bh / 2))
    img[ok] = tmp[ok] if col is None else col
    return ok


S1 = v4.S1


# ===================================================================== S2: the dragon rises and snaps up the enemy
class S2(v4.S2):
    EN = (70.0, 372.0)  # the enemy's top-left in panel 2 (base 840), in front of the dragon's jaws

    def __init__(s):
        super().__init__()
        e, _ = base("p06", 840, seed=6)
        sub = e[306:392, 650:712]
        m = lum(sub) < 70
        keep = np.zeros_like(m)
        for ys, xs in old.components(m):
            if len(ys) > 400:
                keep[ys, xs] = True
        s.en_w, s.en_h = sub.shape[1], sub.shape[0]
        s.L_en = Layer(sub, keep, s.pal)
        s.splint = [hexc("#efe2c8"), hexc("#c9a878"), hexc("#7a5c3c")]
        s.pal = np.concatenate([s.pal, s.splint, [CYAN2, hexc("#3a3020")]])

    def frame(s, i, n):
        h = s.art.shape[0]
        A, Lg, HIT = 30, 40, 47  # rear back, lunge, bite
        cx, cy, vis = track(i, [(0, (430, 400, 520), "s"), (18, (440, 250, 780), "o"), (A, (420, 280, 760), "s"),
                                (Lg, (300, 320, 640), "s"), (HIT, (190, 360, 560), "i"), (n - 1, (170, 350, 520), "s")])
        rise = track(i, [(0, (175.0, 0.06), "s"), (18, (-14.0, -0.012), "o"), (28, (0.0, 0.0), "s")])
        cy = max(cy, rise[0] + vis * H / W / 2 + 1)
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        # the enemy on the rocks, until the jaws close on him
        ex, ey = s.EN
        # rear back (up and away), then the lunge down at him, then it holds him there
        mv = track(i, [(0, (0.0, 0.0, 0.0, 1.0), "s"), (A, (0.0, 0.0, 0.0, 1.0), "s"), (Lg, (0.0, -30.0, -0.03, 1.0), "o"),
                       (HIT, (-118.0, 112.0, 0.05, 1.12), "i"), (HIT + 6, (-104.0, 100.0, 0.04, 1.1), "o"),
                       (n - 1, (-100.0, 96.0, 0.04, 1.1), "s")])
        bob = 3 * math.sin((i - 28) * 0.3) if 28 < i < A else 0
        draw(img, cam, s.L_drag, ox=mv[0], oy=rise[0] + bob + mv[1], rot=rise[1] + mv[2], sc=mv[3], pivot=(196, 262))
        if i < HIT:  # he stands in the foreground, braced, until the jaws close on him
            draw(img, cam, s.L_en, ox=ex + (1 if Lg <= i and i % 2 else 0), oy=ey)
        X, Y = cam.grid()
        gy = h * 0.92
        top = gy - 40 - 260 * ease_out(i / 26)
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
        if Lg <= i < HIT:  # speed lines along the lunge
            r = np.random.default_rng(1500 + i)
            speed_lines(img, r, 16, -1.0, 0.95, hexc("#efe2c8"), (50, 160), WHITE)
        if i >= HIT:  # the bite: a burst of light and splinters where he stood
            t = i - HIT
            bx, by = cam.P(ex + s.en_w / 2, ey + s.en_h / 2)
            if t < 9:
                R = (20 + 70 * ease_out(t / 4)) * (1 - ease_in((t - 4) / 5) if t > 4 else 1)
                starburst(img, bx, by, R, [hexc("#c9a878"), hexc("#efe2c8"), WHITE], 1600 + t // 2, 22, 0.8)
            r = np.random.default_rng(1650)
            for k in range(34):
                a = r.uniform(-math.pi, 0.4)
                sp = r.uniform(4, 13)
                px, py = bx + math.cos(a) * sp * t, by + math.sin(a) * sp * t + 0.5 * t * t
                if 0 <= px < W - 4 and 0 <= py < H - 4 and t < 22:
                    sz = 1 + k % 3
                    img[int(py):int(py) + sz, int(px):int(px) + sz + 1] = s.splint[k % 3]
        amp = 6 * (1 - i / 24) if i < 24 else (0 if i < Lg else (2 if i < HIT else max(0, 6 - (i - HIT) * 0.4)))
        return shift(img, *old.shake(i, amp, 2))


S3 = v4.S3


# ===================================================================== the orb: the user's own image, animated
class SOrb:
    def __init__(s):
        src = np.load(os.path.join(HERE, "cache", "orb.npy"))
        hh, ww = src.shape[:2]
        # crop to 16:9 round the orb and clean it at screen size and at 2x
        cw = min(ww, int(hh * 16 / 9))
        x0 = int(min(max(843 - cw / 2, 0), ww - cw))
        src = src[:, x0:x0 + cw]
        a1, s.pal = clean(src, W, H, k=24, seed=140)
        a2 = snap(resample_r(src, W * 2, H * 2), s.pal)
        s.cx, s.cy = (843 - x0) * W / cw, 436 * H / hh
        orb1, orb2 = a1[..., 0] > 140, a2[..., 0] > 140
        s.L_orb = Layer(a1, orb1, s.pal, levels=(1.0,))
        add2 = (2.0, a2, orb2)
        s.L_orb.lv.append(add2)
        s.R = 0.5 * (orb1.any(0).sum() + orb1.any(1).sum()) / 2
        halo = disc_mask(W, H, s.cx, s.cy, s.R + 7)
        navy = a1[np.clip(int(s.cy), 0, H - 1), np.clip(int(s.cx + s.R + 3), 0, W - 1)]
        st = a1.copy()
        st[orb1] = navy
        s.L_orb = Layer(a1, disc_mask(W, H, s.cx, s.cy, s.R + 8), s.pal, levels=(1.0,))
        s.L_orb.lv.append((2.0, a2, disc_mask(W * 2, H * 2, s.cx * 2, s.cy * 2, (s.R + 8) * 2)))
        bgcol = a1[2, 2]
        blues = tones(a1, (a1[..., 2] > 120) & (a1[..., 0] < 90) & ~disc_mask(W, H, s.cx, s.cy, s.R + 12), 4, 143)
        r = np.random.default_rng(144)
        T = np.zeros((2 * H, W, 3), np.int32)
        T[:] = bgcol
        x = 0
        s.cols = []
        while x < W:
            bw = int(r.integers(2, 7))
            col = np.zeros((2 * H, 3), np.int32)
            col[:] = bgcol
            y = int(r.integers(0, 2 * H))
            for _ in range(int(r.integers(2, 5))):
                L = int(r.integers(30, 160))
                c = blues[int(r.integers(1, len(blues)))]
                ys = (np.arange(y, y + L)) % (2 * H)
                col[ys] = c
                y += L + int(r.integers(6, 50))
            T[:, x:x + bw] = col[:, None]
            s.cols.append((x, bw, int(r.integers(5, 13))))
            x += bw
        s.T = T
        s.halo = halo
        s.mag = (a1[..., 0] > 140) & (a1[..., 1] < 120)
        s.pal = np.concatenate([s.pal, [WHITE, hexc("#ff7cff")]])
        r = np.random.default_rng(141)
        blues = tones(a1, (a1[..., 2] > 150) & (a1[..., 0] < 80), 3, 142)
        s.st = [(int(r.integers(0, W)), int(r.integers(-H, H)), int(r.integers(20, 70)), int(r.integers(9, 18)),
                 blues[int(r.integers(0, len(blues)))]) for _ in range(90)]

    def frame(s, i, n):
        # the streaks fall: the background scrolls down; the halo round the orb stays put
        img = np.zeros((H, W, 3), np.int32)
        for x, bw, v in s.cols:  # every bar column falls at its own speed, seamlessly
            ys = (np.arange(H) - i * v) % (2 * H)
            img[:, x:x + bw] = s.T[ys, x:x + bw]
        # the orb breathes and shrinks a little before the Susanoo forms round it
        sc = (1.0 - 0.16 * ease(i / n)) * (1 + 0.025 * math.sin(i * 0.9))
        cam = Cam(W / 2, H / 2, W)
        ok = draw(img, cam, s.L_orb, sc=sc, pivot=(s.cx, s.cy))
        if (i // 2) % 2:
            mag = ok & (img[..., 0] > 140) & (img[..., 1] < 120)
            img[mag] = hexc("#ff7cff")
        return shift(img, *old.shake(i, 1 if i < 6 else 0, 140))


S4, S5, S6, S7 = v4.S4, v4.S5, v4.S6, v4.S7


# ===================================================================== S8: the pointed blade with chakra wisps
class S8(v4.S8):
    BANDS = ["#a8f8ff", "#5ee8fb", "#33a6f4", "#1f72f0", "#1446f0", "#0a26c4"]

    def __init__(s):
        super().__init__()
        s.bands = [hexc(c) for c in s.BANDS]
        s.pal = np.concatenate([s.pal, s.bands, [hexc("#06128a"), hexc("#dff8ff")]])
        s.o.blade = s.blade  # the old shot's frame code calls o.blade

    def blade(s, img, ang):
        o = s.o
        px, py = -520.0, 20.0
        top0 = np.array([[8.0, 115.0], [430.0, 205.0]])
        c, si = math.cos(ang), math.sin(ang)
        rot = lambda p: (px + (p[0] - px) * c - (p[1] - py) * si, py + (p[0] - px) * si + (p[1] - py) * c)
        a, b = rot(top0[0]), rot(top0[1])
        ex, ey = b[0] - a[0], b[1] - a[1]
        L = math.hypot(ex, ey)
        ux, uy = ex / L, ey / L
        nx, ny = -uy, ux
        T, TL = 64, 86
        a0 = (a[0] - ux * 300, a[1] - uy * 300)
        poly = [a0, b]
        for k in range(1, 9):  # the point: the lower edge sweeps up to the tip in a curve
            t = k / 9
            poly.append((b[0] - ux * TL * t + nx * T * t ** 0.55, b[1] - uy * TL * t + ny * T * t ** 0.55))
        poly += [(b[0] - ux * TL + nx * T, b[1] - uy * TL + ny * T), (a0[0] + nx * T, a0[1] + ny * T)]
        m = poly_mask(560, 315, poly)
        dist = ((o.xx + 0.5 - a[0]) * nx + (o.yy + 0.5 - a[1]) * ny) / T
        band = np.clip((dist * 6).astype(int), 0, 5)
        for k in range(6):
            img[m & (band == k)] = s.bands[k]
        img[m & (dist < 0.035)] = hexc("#dff8ff")
        edge = m & ~old.dilate_mask(~m, 1) if False else None
        inner = m.copy()
        inner[1:] &= m[:-1]
        img[m & ~inner & (dist > 0.5)] = hexc("#06128a")  # the dark lower rim
        return a, b, (nx, ny), m

    def frame(s, i, n):
        o, HIT = s.o, s.HIT
        img = o.plate.copy()
        ang = -0.2 * (1 - ease_in(i / HIT)) if i < HIT else 0.0
        a, b, (nx, ny), m = s.blade(img, ang)
        # white chakra wisps curling up off the blade, flowing and flickering
        ex, ey = b[0] - a[0], b[1] - a[1]
        for k in range(7):
            t = 0.08 + k * 0.13
            bx, by = a[0] + ex * t, a[1] + ey * t + 3
            ph = i * 0.55 + k * 1.7
            Lw = 44 + 12 * math.sin(i * 0.3 + k)
            pts = []
            for j in range(16):
                q = j / 15
                yy = -Lw * q
                xx = 9 * math.sin(q * 5.0 + ph) * q + 14 * q * q
                pts.append((bx + xx, by + yy))
            for j in range(15):
                th = 3 if j < 4 else (2 if j < 9 else 1)
                col = WHITE if j < 10 else CYAN2
                draw_line(img, *pts[j], *pts[j + 1], col, th)
        if i >= HIT:
            u = ease_out((i - HIT) / 12)
            vis = o.bt < u * 1.25
            img[vis & o.burst] = o.art[vis & o.burst]
            front = (o.bt >= u * 1.25) & (o.bt < u * 1.25 + 0.03) & o.burst
            img[front] = WHITE
            for k, (x, y, vx, vy, sz, c) in enumerate(o.debris):
                t = i - HIT - (k % 4)
                if t < 0:
                    continue
                qx, qy = int(x + vx * t), int(y + vy * t + 0.35 * t * t)
                if 0 <= qx < 556 and 0 <= qy < 311:
                    img[qy:qy + sz, qx:qx + sz] = (CYAN, BLUE, WHITE)[c]
        F = n - 10
        if i >= F:
            u = ease_in((i - F) / 9)
            d = np.hypot(o.xx - o.IMP[0], o.yy - o.IMP[1])
            img[d < u * 600] = WHITE
            img[(d < u * 600 + 18) & (d >= u * 600)] = CYAN2
        cx, cy = old.path(i, [(0, 20, 0), (HIT, 40, 26), (n, 70, 40)])
        amp = 0 if i < HIT else max(1, 6 - (i - HIT) * 0.25)
        sx, sy = old.shake(i, amp, 8)
        out = crop(img, cx + sx, cy + sy, W, H)
        if i >= F:
            rr = np.random.default_rng(890 + i)
            radial_lines(out, rr, 26, o.IMP[0] - cx, o.IMP[1] - cy, 40 + 200 * (1 - ease_in((i - F) / 9)), 520, CYAN2)
        return out


S9 = v4.S9


# ===================================================================== S10: the valley; the mountain tops spring up
class S10(v3.S10):
    POP = (26, 30, 34)

    def __init__(s):
        super().__init__()
        a = s.art
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        L = lum(a)

        def top(poly, thr=150):
            pm = poly_mask(w, h, poly)
            mm = close(pm & (L < thr), 2) & pm
            k = np.zeros_like(mm)
            for ys, xs in old.components(mm):
                if len(ys) > 300:
                    k[ys, xs] = True
            return k
        s.m2 = top([(560, 214), (612, 168), (652, 146), (700, 166), (748, 206), (700, 218), (640, 222)])
        s.m3 = top([(468, 172), (518, 137), (582, 158), (566, 176), (510, 178)])
        haze = tones(a, (yy > 100) & (yy < 200) & (L > 120) & (L < 215), 3, 103)
        plate = s.L_plate.lv[-1][1].copy()
        fill_by_tones(plate, s.m2 | s.m3, xx.astype(float), yy.astype(float), haze, 120, 10, 104)
        s.L_plate = Layer(snap(plate, s.pal), None, s.pal)
        s.L_m2, s.L_m3 = Layer(a, s.m2, s.pal), Layer(a, s.m3, s.pal)
        s.su = dil((a[..., 2] > a[..., 0] + 60) & (a[..., 2] > 140), 2)
        s.nz = noise_at(XX.astype(float), YY.astype(float), 14, 14, 1401, 2)
        # where each top is cut off (its lowest row) and its centre, for the smoke and grit
        s.cuts = []
        for mm in (s.slab, s.m2, s.m3):
            ys, xs = np.nonzero(mm)
            s.cuts.append((xs.mean(), ys.max(), (xs.max() - xs.min()) / 2))
        s.pal = np.concatenate([s.pal, [hexc("#7ff2ff"), hexc("#1a2036"), hexc("#8a90aa"), hexc("#eef0f8"),
                                        hexc("#c8cbdc"), hexc("#3a4058")]])

    def frame(s, i, n):
        keys = s.cam_keys(n) if hasattr(s, "cam_keys") else [(0, (420, 290, 800), "s"), (n - 1, (420, 260, 700), "s")]
        cx, cy, vis = track(i, keys)
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        # the cut tops spring up off their bases and drift on, tipping
        for k, (L, mm, piv) in enumerate(((s.L_slab, s.slab, (300, 130)), (s.L_m2, s.m2, (650, 190)),
                                         (s.L_m3, s.m3, (520, 160)))):
            t0 = s.POP[k]
            up = 0.0 if i < t0 else 30 * ease_out((i - t0) / 9) + 0.6 * max(0, i - t0 - 9)
            rot = 0.0 if i < t0 else (0.05 if k % 2 else -0.04) * ease_out((i - t0) / 14)
            shake_k = 0
            if t0 - 5 <= i < t0:
                shake_k = (1 if i % 2 else -1)
            draw(img, cam, L, ox=shake_k, oy=-up, rot=rot, pivot=piv)
        sx, sy = cam.P(*s.SC)
        floor = np.zeros((H, W), bool)
        _, fy = cam.P(0, 252)
        floor[max(0, int(fy)):] = True
        if i < 10:  # the slash
            u = ease_out(i / 8)
            x0 = -40 + (W + 80) * u
            draw_line(img, x0 - 260, sy - 2, x0, sy - 2, CYAN2, 3)
            draw_line(img, x0 - 120, sy - 2, x0, sy - 2, WHITE, 3)
        if 4 <= i < 26:  # the glowing ring
            t = (i - 4) / 22
            rr = 20 + 520 * ease_out(t)
            th = max(2, int(14 * (1 - t)))
            ring_screen(img, sx, sy, rr * cam.r, th, hexc("#7ff2ff"), rr * cam.r * 0.3, floor)
            ring_screen(img, sx, sy, rr * cam.r - th, 2, WHITE, (rr * cam.r - th) * 0.3, floor)
        if i >= 12:  # the crater
            c = ease_out((i - 12) / 30)
            rx = 70 * c * cam.r
            m = disc_mask(W, H, sx, sy + 6 * cam.r, rx, rx * 0.3)
            img[m & ~sample(cam, s.su)] = hexc("#1a2036")
        for k, st in enumerate((14, 22, 32)):
            t = i - st
            if t < 0:
                continue
            rr = (12 + t * (10 - k * 1.5)) * cam.r
            if rr > 520:
                continue
            th = 4 if rr < 160 else (3 if rr < 300 else 2)
            ring_screen(img, sx, sy, rr, th, WHITE if rr < 260 else hexc("#c8cbdc"), rr * 0.26, floor)
        # white smoke bursts out along each cut as its top springs up, grit flies
        for k, (mx, my, half) in enumerate(s.cuts):
            t = i - s.POP[k]
            if t < 0:
                continue
            g = ease_out(t / 12)
            px, py = cam.P(mx, my)
            rx = (half * 1.05 * g + 6) * cam.r
            lumpy(img, px, py, rx, rx * 0.18, hexc("#c8cbdc"), s.nz, 0.8)
            lumpy(img, px - rx * 0.1, py - rx * 0.03, rx * 0.8, rx * 0.11, hexc("#eef0f8"), s.nz, 0.8)
            r = np.random.default_rng(1700 + k)
            for j in range(26):
                a = r.uniform(-math.pi * 0.95, -math.pi * 0.05)
                sp = r.uniform(2, 7)
                qx = px + (math.cos(a) * sp * t + r.uniform(-half, half) * cam.r * 0.8)
                qy = py + math.sin(a) * sp * t + 0.12 * t * t
                if 0 <= qx < W - 2 and 0 <= qy < H - 2:
                    img[int(qy):int(qy) + 1 + j % 2, int(qx):int(qx) + 1 + j % 2] = hexc("#3a4058")
        s.fog.apply(img, cx * cam.r * 1.3 + i // 2)
        if hasattr(s, "extra"):
            s.extra(img, cam, i, n)
        amp = 1 if i < 20 else (2 if any(0 <= i - p < 6 for p in s.POP) else 0)
        return shift(img, *old.shake(i, amp, 10, 2))


# ===================================================================== S11: the close blast of rock, smoke, white
class S11:
    def __init__(s):
        s.rk = v4.S9()  # its rock sprites
        s.nz = noise_at(XX.astype(float), YY.astype(float), 40, 30, 1801, 3)
        s.cols = dict(bg=hexc("#8a90aa"), g1=hexc("#c8cbdc"), g2=hexc("#eef0f8"), rock=hexc("#1a2036"),
                      rim=hexc("#4a5270"), smoke=hexc("#2a3048"), smoke2=hexc("#454c66"))
        s.pal = np.array(list(s.cols.values()) + [WHITE])

    def frame(s, i, n):
        C = s.cols
        img = blank(W, H, C["bg"])
        u = ease_out(i / 12)
        bx, by = W * 0.42, H * 0.55
        starburst(img, bx, by, 60 + 420 * u, [C["g1"], C["g2"], WHITE], 1800 + i // 2, 26, 0.7)
        r = np.random.default_rng(1810 + i)
        radial_lines(img, r, 18, bx, by, 40 + 80 * u, 340, WHITE)
        rr = np.random.default_rng(1850)
        rocks = s.rk.rocks * 2
        for k, (L, x0, y0, bw, bh) in enumerate(rocks):
            a = k * 2 * math.pi / len(rocks) + rr.uniform(-0.25, 0.25)
            sp = rr.uniform(14, 30)
            t = i + rr.uniform(0, 4)
            sc = min(1.0, (0.2 + 0.035 * t) * rr.uniform(0.7, 1.1))
            px, py = bx + math.cos(a) * sp * t, by + math.sin(a) * sp * t * 0.75
            ok = sprite_at(img, L, bw, bh, px + 2, py + 2, sc, rr.uniform(-1, 1) * 0.06 * t, C["rim"])
            sprite_at(img, L, bw, bh, px, py, sc, rr.uniform(-1, 1) * 0.06 * t, C["rock"])
        # dark smoke rolls in over everything, then thins to fog (the white fade finishes it)
        if i >= 14:
            g = ease_in((i - 14) / 10)
            d = s.nz + (XX / W) * 0.6 - 0.3
            img[d > 1.0 - g * 1.1] = C["smoke2"]
            img[d > 1.12 - g * 1.1] = C["smoke"]
        return shift(img, *old.shake(i, max(0, 5 - i * 0.25), 11))


FADES = {
    "S01_face": lambda i, n: ("#f4fbff", 1 - ease(i / 8)),
    "S09_blast": lambda i, n: ("#7ff2ff", ease((i - (n - 9)) / 8)),
    "S11_end": lambda i, n: ("#f4fbff", ease((i - 22) / 12)),
}
DISSOLVE = {"S02_dragon": 8, "S00_orb": 8, "S04_form": 10}

SHOTS = [("S01_face", 1, 36, S1), ("S02_dragon", 37, 108, S2), ("S03_eye", 109, 132, S3), ("S00_orb", 133, 154, SOrb),
         ("S04_form", 155, 204, S4), ("S05_burst", 205, 230, S5), ("S06_tower", 231, 276, S6),
         ("S07_draw", 277, 316, S7), ("S08_cut", 317, 362, S8), ("S09_blast", 363, 386, S9),
         ("S10_after", 387, 442, S10), ("S11_end", 443, 480, S11)]


def shot_img(cache, k, i):
    name, f0, f1, cls = SHOTS[k]
    if name not in cache:
        t1 = time.time()
        cache[name] = cls()
        print(name, "ready in %.1fs" % (time.time() - t1), flush=True)
    sh = cache[name]
    n = f1 - f0 + 1
    img = snap(np.clip(sh.frame(i, n), 0, 255), sh.pal)
    fd = FADES.get(name)
    if fd:
        col, kk = fd(i, n)
        if kk > 0:
            img = np.round(img * (1 - kk) + hexc(col) * kk).astype(np.int32)
    return img


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
        for k, (name, f0, f1, cls) in enumerate(SHOTS):
            if f0 <= f <= f1:
                img = shot_img(cache, k, f - f0)
                dk = DISSOLVE.get(name, 0)
                if dk and f - f0 < dk and k > 0:
                    pf0, pf1 = SHOTS[k - 1][1], SHOTS[k - 1][2]
                    pimg = shot_img(cache, k - 1, pf1 - pf0 + 1 + (f - f0))
                    u = ease((f - f0 + 1) / (dk + 1))
                    img = np.round(pimg * (1 - u) + img * u).astype(np.int32)
                save_frame(os.path.join(OUT, "%04d.png" % f), img)
    print("frames %d-%d done in %.1fs" % (lo, hi, time.time() - t0))


if __name__ == "__main__":
    main()
