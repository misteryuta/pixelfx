"""Sasuke ultimate, version 8 (on top of sshots7), rendered at native size: PX_RES=800x450 (set below), one panel
pixel = one screen pixel, the camera only pans in whole pixels, nothing is resampled during the shots.
  - Amaterasu: purple spikes burst out of the ground and impale the opponent (in at the front, out of the back);
    the opponent has a hit reaction: jolted up off his feet, the upper body thrown back (rows shifted in whole
    pixels), a white flash on the hit, twitching while impaled, then he slumps forward; only purple flames.
Run: python sshots8.py [--frames a-b] [--every n] [--target png]"""
import os, sys, math
os.environ.setdefault("PX_RES", "800x450")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "madara_px"))
sys.path.insert(0, HERE)
import numpy as np
import sshots7 as v7
import sshots4 as v4
import sshots3 as v3
from pxlib import *
from engine import *
from shots2 import dil
from shots4 import XX, YY
from sshots3 import cam_of, WHITE, SMOKE
from sshots4 import spike_poly

PUR = [hexc("#7a2ab8"), hexc("#3f1162"), hexc("#170e2f"), hexc("#0f091b")]  # light rim, purple, navy, deep


def draw_spear(img, m):
    sh = np.zeros_like(m)
    sh[2:, 2:] = m[:-2, :-2]
    core = np.zeros_like(m)
    core[4:, 4:] = m[:-4, :-4]
    img[m] = PUR[0]
    img[m & sh] = PUR[1]
    img[m & core & sh] = PUR[2]


def purple_tongues(img, x, y, size, t, seed, n=5):
    r = np.random.default_rng(seed)
    rf = np.random.default_rng(seed * 31 + int(t))
    for k in range(n):
        bx = x + r.uniform(-1, 1) * size * 0.6
        hh = size * r.uniform(0.6, 1.4) * (1 + 0.25 * math.sin(t * 1.1 + k * 2.3))
        ww = size * r.uniform(0.45, 0.7)
        lean = r.uniform(-0.25, 0.25)
        for col, kh, kw in ((PUR[0], 1.0, 1.0), (PUR[1], 0.85, 0.75), (PUR[3], 0.6, 0.45)):
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


class S3(v7.S3):
    HIT = 8
    # spears out of the ground: foot offset (x target width), travel angle (up = -pi/2), delay, length, width
    SP = [(-0.15, -1.45, 6, 1.05, 0.06), (0.25, -1.85, 7, 1.0, 0.055), (-0.55, -1.15, 8, 0.85, 0.045),
          (0.6, -2.05, 9, 0.85, 0.045), (0.0, -1.62, 10, 1.2, 0.05), (-0.9, -0.95, 12, 0.7, 0.04), (0.95, -2.25, 12, 0.7, 0.04)]

    def __init__(s):
        super().__init__()
        th, tw = s.Tm.shape
        ys, xs = np.nonzero(s.Tm)
        s.waist = int(ys.min() + (ys.max() - ys.min()) * 0.52)
        s.pal = np.concatenate([s.pal, PUR])

    def pose(s, i):
        """(lift, lean): lift = pixels off the ground, lean = how far the top of the body is thrown back (pixels)."""
        if i < s.HIT:
            return 0, 0
        t = i - s.HIT
        lift = round(26 * ease_out(min(1.0, t / 3)) - 6 * ease((t - 18) / 14))
        lean = 18 * ease_out(min(1.0, t / 3)) * (1 - 0.5 * ease((t - 4) / 8))  # thrown back, then settles
        lean += 2.0 * math.sin(t * 1.7) * (1 - ease(t / 16))  # twitching
        if t > 22:
            lean -= 26 * ease((t - 22) / 14)  # he slumps forward
        return lift, round(lean)

    def bent(s, lean):
        """The target with rows above the waist shifted back by up to `lean` pixels (more toward the head)."""
        if lean == 0:
            return s.T, s.Tm
        th, tw = s.Tm.shape
        pad = abs(lean) + 2
        T = np.zeros((th, tw + 2 * pad, 3), np.int32)
        M = np.zeros((th, tw + 2 * pad), bool)
        for y in range(th):
            f = max(0.0, (s.waist - y) / max(1, s.waist)) ** 1.2
            dx = round(lean * f)
            T[y, pad + dx:pad + dx + tw] = s.T[y]
            M[y, pad + dx:pad + dx + tw] = s.Tm[y]
        return T, M, pad

    def frame(s, i, n, layers=None):
        cam = cam_of([(0, (460, 250, 800), "s"), (n - 1, (460, 236, 800), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.Lp)
        lift, lean = s.pose(i)
        sink = round(40 * ease_in((i - 36) / 14)) if i >= 36 else 0
        r = s.bent(lean)
        T, M = r[0], r[1]
        pad = r[2] if len(r) > 2 else 0
        ox, oy = s.tx - pad, s.ty - lift + sink
        cx, cy = cam.P(s.chest[0], s.chest[1] - lift + sink)
        fx, fy = cam.P(s.chest[0], s.foot)
        Xs, Ys = XX + 0.5, YY + 0.5
        spears = []
        for k, (dx, a, d0, Lk, wk) in enumerate(s.SP):
            if i < d0:
                continue
            u = ease_out((i - d0) / 3)
            ca, sa = math.cos(a), math.sin(a)
            Ls = s.size * Lk * cam.r
            bx = fx + dx * s.half * cam.r  # where it breaks out of the ground
            by = fy + 6
            L = Ls * u * (1 + 0.03 * math.sin(i * 0.6 + k))
            pts = spike_poly(bx, by, a + 0.01 * math.sin(i * 0.5 + k), L, s.size * wk * cam.r, 0.6, 5000 + k)
            m = poly_mask(W, H, pts) & (Ys < by + 2)
            along = (Xs - bx) * ca + (Ys - by) * sa  # distance from the ground along the spear
            cut = ((cx - bx) * ca + (cy - by) * sa)  # up to the body's centre it is in front of the body
            spears.append((m, along < cut, bx, by, u))
        for m, near, bx, by, u in spears:
            draw_spear(img, m)
        tl = Layer(T, M, None, levels=(1.0,))
        tlay = np.zeros((H, W, 3), np.int32)
        tok = draw(tlay, cam, tl, ox=ox, oy=oy)
        if i == s.HIT:  # the hit: the body flashes white
            tlay[tok] = WHITE
        img[tok] = tlay[tok]
        for m, near, bx, by, u in spears:
            draw_spear(img, m & near)
        for m, near, bx, by, u in spears:  # the ground cracks open where each one breaks out
            if u < 1:
                g = 1 - u
                img[poly_mask(W, H, [(bx - 22 * g - 6, by + 2), (bx, by - 10 * g - 3), (bx + 22 * g + 6, by + 2),
                                     (bx, by + 6)])] = PUR[0]
        if i >= s.HIT + 4:  # purple flames creep up the body from the wounds
            for k, (dx, a, d0, Lk, wk) in enumerate(s.SP):
                g = ease_out((i - s.HIT - 4 - k) / 10)
                if g <= 0:
                    continue
                px = cx + dx * s.half * 0.4 * cam.r
                py = cy + s.size * 0.18 * cam.r
                purple_tongues(img, px, py, (6 + 20 * g) * cam.r, i, 6100 + k, 4)
        if i >= n - 16:
            X, Y = cam.grid()
            u = ease_in((i - (n - 16)) / 15)
            nz = noise_at(X, Y + i * 5.0, 60, 40, 307, 3)
            img[nz + u * 0.95 > 0.98] = SMOKE[1]
            img[nz + u * 0.95 > 1.06] = SMOKE[0]
        return img


import sshots5 as v5
SHOTS = [(nm, a, b, {"S03": S3, "S02": v5.S2}.get(nm, c)) for nm, a, b, c in v7.SHOTS]


def main():
    v4.SHOTS[:] = SHOTS
    v4.main()


if __name__ == "__main__":
    main()
