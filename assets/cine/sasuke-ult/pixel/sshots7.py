"""Sasuke ultimate, version 7 (on top of sshots6):
  - no unfilled spots: the figure masks have their holes closed, and the panels' own Chidori glow is taken out of
    the backgrounds so it never stays behind when the figure moves
  - Amaterasu: black flame spears fly in from outside and pierce the opponent: in through the front, out of the back
    (the part before the body's centre is drawn over the target, the rest behind it), one after another, then they
    hold and black flames spread from the wounds; the opponent is Madara (any transparent PNG via --target)
Run: python sshots7.py [--frames a-b] [--every n] [--target png]"""
import sys, os, math, time
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "madara_px"))
sys.path.insert(0, HERE)
import sshots4 as v4
if v4.TARGET is None:
    v4.TARGET = os.path.join(HERE, "ref", "targets", "madara.png")
from pxlib import *
from engine import *
import shots as old
from shots2 import tones, sample, disc_screen, dil, close
from shots4 import XX, YY
import sshots3 as v3
import sshots5 as v5
import sshots6 as v6
from sshots3 import cam_of, WHITE, CYAN, CYAN2, SMOKE, tongues
from sshots4 import SP, spike_poly
from segment import flood


def fill_holes(m, r=4):
    m = close(m, r)
    h, w = m.shape
    edge = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    return ~flood(~m, edge)


# ------------------------------------------------------------------ S3: spears fly in and pierce the opponent
class S3(v4.S3):
    SPEARS = [  # travel angle (radians, screen), delay in frames, length and width (x target size)
        (-0.35, 2, 0.9, 0.035), (math.pi + 0.3, 4, 0.85, 0.035), (-1.2, 6, 1.0, 0.04), (math.pi + 1.05, 7, 0.9, 0.035),
        (0.15, 9, 0.8, 0.03), (math.pi - 0.1, 10, 0.8, 0.03), (-1.75, 12, 1.1, 0.045)]

    def frame(s, i, n, layers=None):
        cam = cam_of([(0, (460, 250, 820), "s"), (n - 1, (460, 236, 680), "s")], i)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.Lp)
        cx, cy = cam.P(*s.chest)
        X, Y = cam.grid()
        Xs, Ys = XX + 0.5, YY + 0.5
        spears = []
        for k, (a, d0, Lk, wk) in enumerate(s.SPEARS):
            if i < d0:
                continue
            u = ease_out((i - d0) / 5)
            ca, sa = math.cos(a), math.sin(a)
            Ls = s.size * Lk * cam.r
            reach = s.size * 0.45 * cam.r  # how far the tip comes out of the back
            start = -(Ls + s.size * 0.6 * cam.r)  # tip far out on the near side
            tipd = start + (reach - start) * u
            tx, ty = cx + ca * tipd, cy + sa * tipd
            tail = (tx - ca * Ls, ty - sa * Ls)
            pts = spike_poly(tail[0], tail[1], a + 0.015 * math.sin(i * 0.5 + k), Ls, s.size * wk * cam.r, 0.6,
                             4000 + k)
            m = poly_mask(W, H, pts)
            along = (Xs - cx) * ca + (Ys - cy) * sa  # < 0: the near side of the body's centre
            spears.append((m, along < 0))
        for m, near in spears:  # the whole spear behind the target ...
            v4.draw_spike_mask(img, m)
        T, ox, oy = s.T, 0, 0
        if i >= 30:
            oy = round(50 * ease_in((i - 30) / 22))
        tl = Layer(T, s.Tm, None, levels=(1.0, 0.75, 0.5))
        tlay = np.zeros((H, W, 3), np.int32)
        tok = draw(tlay, cam, tl, ox=s.tx + ox, oy=s.ty + oy)
        img[tok] = tlay[tok]
        for m, near in spears:  # ... and its near half over it, so it goes in the front and out the back
            v4.draw_spike_mask(img, m & near)
        # black flames spread from where they went in
        if i >= 14:
            for k, (a, d0, Lk, wk) in enumerate(s.SPEARS):
                g = ease_out((i - 14 - k) / 10)
                if g <= 0:
                    continue
                d = s.size * 0.12 * cam.r
                px, py = cx - math.cos(a) * d, cy - math.sin(a) * d + oy * cam.r
                tongues(img, px, py, (6 + 22 * g) * cam.r, i, 4100 + k, 4)
        if i >= n - 16:
            u = ease_in((i - (n - 16)) / 15)
            nz = noise_at(X, Y + i * 5.0, 60, 40, 307, 3)
            img[nz + u * 0.95 > 0.98] = SMOKE[1]
            img[nz + u * 0.95 > 1.06] = SMOKE[0]
        return img

    def post(s, i, n):
        return [(SMOKE[0], ease_in((i - (n - 4)) / 3))]


def _draw_spike_mask(img, m):
    sh = np.zeros_like(m)
    sh[2:, 2:] = m[:-2, :-2]
    core = np.zeros_like(m)
    core[4:, 4:] = m[:-4, :-4]
    img[m] = SP[0]
    img[m & sh] = SP[1]
    img[m & core & sh] = SP[2]


v4.draw_spike_mask = _draw_spike_mask


# ------------------------------------------------------------------ S4: no leftover glow, lines behind him
class S4(v6.S4):
    def __init__(s):
        super().__init__()
        a = s.art
        halo = ((a[..., 2] > a[..., 0] + 10) & (lum(a) > 90)) | (lum(a) > 200)
        notbrown = ~((a[..., 0] > a[..., 2] + 20) & (old.sat(a) > 0.28))
        xx0 = np.mgrid[0:473, 0:840][1]
        skin = (a[..., 0] > 190) & (a[..., 1] > 140) & (a[..., 0] > a[..., 2] + 20)
        dark = lum(a) < 70
        halo = (dil(halo, 6) | dil(notbrown & ~s.fg, 2) | (notbrown & (s.d < 150) & (xx0 > 575))) & (s.d < 190) & ~skin & ~dark
        s.fg = fill_holes(s.fg & ~halo, 3) & ~halo
        art = s.plate2.copy()
        yy, xx = np.mgrid[0:473, 0:840]
        brown = v6.tones(a, ~dil(s.fg | halo, 6) & (old.sat(a) > 0.3) & (a[..., 0] > a[..., 2] + 20), 5, 411)
        fill_by_tones(art, halo & ~s.fg, xx.astype(float), yy.astype(float), brown, 40, 22, 412, angle=0.6)
        s.plate2 = snap(art, s.pal)
        g = s.gt[:473, :840].copy()
        fill_by_tones(g, halo, xx.astype(float), yy.astype(float), brown, 40, 22, 412, angle=0.6)
        s.gt = v6.tiled(v6.tiled(snap(g, s.pal), 1), 0)
        s.Lg = Layer(s.gt, None, s.pal, levels=(1.0,))


# ------------------------------------------------------------------ S6: the Susanoo whole, no glow left behind
class S6(v6.S6):
    def __init__(s):
        super().__init__()
        a = s.art
        yy, xx = np.mgrid[0:473, 0:840]
        sph = np.hypot(xx - 580, yy - 180) < 300
        c = (yy + 0.25 * xx).astype(int)
        nb = c.max() + 1

        def profile(known):
            acc = np.zeros((nb, 3)); cnt = np.zeros(nb)
            np.add.at(acc, c[known], a[known]); np.add.at(cnt, c[known], 1)
            idx = np.nonzero(cnt)[0]
            return np.stack([np.interp(np.arange(nb), idx, acc[idx, k] / cnt[idx]) for k in range(3)], 1)
        prof = profile(~sph & (xx < 460) & ~s.fgm)
        diff = np.abs(a - prof[c]).sum(2)
        fig = (diff > 60) & ~sph & (xx < 360)
        keep = np.zeros_like(fig)
        for ys, xs in old.components(close(fig, 3)):
            if len(ys) > 300:
                keep[ys, xs] = True
        s.fgm = fill_holes(keep, 4) & (xx < 360)
        hole = dil(s.fgm, 2) & ~sph
        prof = profile(~hole & ~sph & (xx < 460))
        plate = a.copy()
        plate[hole] = prof[c[hole]].astype(np.int32)
        skyp = kmeans_palette(a[~hole & ~sph & (xx < 460)].reshape(-1, 1, 3), 6, seed=603)
        plate[hole] = snap(plate[hole].reshape(-1, 1, 3), skyp).reshape(-1, 3)
        s.plate = snap(plate, s.pal)
        s.Lb = Layer(v6.tiled(s.plate, 1), None, s.pal, levels=(1.0, 0.75, 0.5))
        s.Lf = Layer(a, s.fgm, s.pal, levels=(1.0, 0.75, 0.5))


def _no_smear(*a, **k):
    return None


SHOTS = [(nm, a, b, {"S03": S3, "S04": S4, "S06": S6}.get(nm, c)) for nm, a, b, c in v6.SHOTS]


def main():
    v4.SHOTS[:] = SHOTS
    v4.main()


if __name__ == "__main__":
    main()
