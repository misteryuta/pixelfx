"""Layered pixel camera for the Madara cutscene.

Each shot is made of layers (a plate behind, moving parts in front) at a base resolution. Every layer keeps
mip levels (cleaned and palette-snapped separately), and the camera samples the level that is at least as fine as
the screen, nearest-neighbour, so a zoom never shows doubled pixels: every output pixel stays one pixel. Layers can
move, turn, scale and sway (row offsets) per frame. Effects are drawn in screen space afterwards."""
import math
import numpy as np
from pxlib import *

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


def lerp(a, b, u):
    return a + (b - a) * u


EASE = {"s": ease, "o": ease_out, "i": ease_in, "l": lambda u: min(1.0, max(0.0, u))}


def track(i, keys):
    """keys: [(frame, (values...), easing-into-this-key), ...] -> tuple of floats."""
    if i <= keys[0][0]:
        return keys[0][1]
    for (a, va, _), (b, vb, e) in zip(keys[:-1], keys[1:]):
        if i <= b:
            u = EASE[e]((i - a) / max(1e-6, b - a))
            return tuple(lerp(x, y, u) for x, y in zip(va, vb))
    return keys[-1][1]


def mask_resample(m, w, h):
    Hh, Ww = m.shape
    fx, fy = Ww / w, Hh / h
    kx, ky = max(1, int(round(fx))), max(1, int(round(fy)))
    xs = np.minimum((np.arange(w) * fx).astype(int), Ww - kx)
    ys = np.minimum((np.arange(h) * fy).astype(int), Hh - ky)
    acc = np.zeros((h, w))
    for dy in range(ky):
        for dx in range(kx):
            acc += m[ys[:, None] + dy, xs[None, :] + dx]
    return acc / (kx * ky) >= 0.5


def resample_r(src, w, h):
    """Like resample_fast but with rounded footprints (so 1.5-2x reductions really look at their pixels)."""
    src = src[..., :3].astype(np.int32)
    Hh, Ww = src.shape[:2]
    fx, fy = Ww / w, Hh / h
    kx, ky = max(1, int(round(fx))), max(1, int(round(fy)))
    xs = np.minimum((np.arange(w) * fx).astype(int), Ww - kx)
    ys = np.minimum((np.arange(h) * fy).astype(int), Hh - ky)
    cand = np.stack([src[ys[:, None] + dy, xs[None, :] + dx] for dy in range(ky) for dx in range(kx)], 2)
    m = cand.mean(2, keepdims=True)
    k = np.argmin(((cand - m) ** 2).sum(3), 2)
    return np.take_along_axis(cand, k[..., None, None], 2)[:, :, 0]


def despeckle_fast(img, passes=2):
    """Pixels that match none of their 8 neighbours take the neighbour colour closest to their own."""
    img = img.copy()
    h, w = img.shape[:2]
    offs = [(dy, dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]
    for _ in range(passes):
        pad = np.pad(img, ((1, 1), (1, 1), (0, 0)), mode="edge")
        nb = np.stack([pad[1 + dy:h + 1 + dy, 1 + dx:w + 1 + dx] for dy, dx in offs], 2)  # h,w,8,3
        same = np.all(nb == img[:, :, None], 3)
        lonely = ~np.any(same, 2)
        d = ((nb - img[:, :, None]) ** 2).sum(3)
        k = np.argmin(d, 2)
        rep = np.take_along_axis(nb, k[..., None, None], 2)[:, :, 0]
        img[lonely] = rep[lonely]
    return img


def clean(src, w, h, k=48, seed=1):
    a = resample_r(src, w, h)
    pal = kmeans_palette(a, k, seed=seed)
    a = snap(a, pal)
    return despeckle_fast(a, 2), pal


class Layer:
    """An image (base resolution) with an optional mask, kept at several mip levels."""

    def __init__(self, img, mask=None, pal=None, levels=(1.0, 0.75, 0.5)):
        H0, W0 = img.shape[:2]
        self.w, self.h = W0, H0
        self.lv = []
        for s in sorted(levels):
            if s == 1.0:
                im, m = img, mask
            else:
                w, h = max(1, round(W0 * s)), max(1, round(H0 * s))
                im = resample_r(img, w, h)
                if pal is not None:
                    im = snap(im, pal)
                m = None if mask is None else mask_resample(mask, w, h)
            self.lv.append((s, im, m))

    def pick(self, ratio):
        for s, im, m in self.lv:
            if s >= ratio - 1e-6:
                return s, im, m
        return self.lv[-1]


class Cam:
    def __init__(self, cx, cy, vis, roll=0.0):
        self.cx, self.cy, self.vis, self.roll = cx, cy, vis, roll
        self.r = W / vis

    def P(self, x, y):
        """Base -> screen."""
        dx, dy = (x - self.cx) * self.r, (y - self.cy) * self.r
        if self.roll:
            c, s = math.cos(-self.roll), math.sin(-self.roll)
            dx, dy = dx * c - dy * s, dx * s + dy * c
        return dx + W / 2, dy + H / 2

    def grid(self):
        u = (np.arange(W) - W / 2 + 0.5)[None, :] / self.r
        v = (np.arange(H) - H / 2 + 0.5)[:, None] / self.r
        u, v = np.broadcast_to(u, (H, W)), np.broadcast_to(v, (H, W))
        if self.roll:
            c, s = math.cos(self.roll), math.sin(self.roll)
            u, v = u * c - v * s, u * s + v * c
        return self.cx + u, self.cy + v


def draw(out, cam, layer, ox=0.0, oy=0.0, rot=0.0, sc=1.0, pivot=(0.0, 0.0), sway=None, grid=None):
    """Draw a layer through the camera. The layer is moved by (ox, oy), turned by rot and scaled by sc about pivot
    (base coordinates); sway(y) -> x offset per base row for hair/cloth. Returns the drawn mask."""
    X, Y = cam.grid() if grid is None else grid
    X = X - ox
    Y = Y - oy
    if rot or sc != 1.0:
        px, py = pivot
        c, s = math.cos(-rot), math.sin(-rot)
        dx, dy = X - px, Y - py
        X = px + (dx * c - dy * s) / sc
        Y = py + (dx * s + dy * c) / sc
    if sway is not None:
        X = X - sway(Y)
    eff = cam.r * sc
    s, im, m = layer.pick(eff)
    sx = np.floor(X * s).astype(int)
    sy = np.floor(Y * s).astype(int)
    hh, ww = im.shape[:2]
    ok = (sx >= 0) & (sx < ww) & (sy >= 0) & (sy < hh)
    sx, sy = np.clip(sx, 0, ww - 1), np.clip(sy, 0, hh - 1)
    if m is not None:
        ok &= m[sy, sx]
    out[ok] = im[sy, sx][ok]
    return ok


def speed_lines(img, rng, n, dx, dy, col, length=(40, 140), cols2=None):
    """Straight streaks along (dx, dy) across the screen."""
    L = math.hypot(dx, dy) or 1.0
    ux, uy = dx / L, dy / L
    for k in range(n):
        x0, y0 = rng.uniform(-60, W + 60), rng.uniform(-60, H + 60)
        ln = rng.uniform(*length)
        draw_line(img, x0, y0, x0 + ux * ln, y0 + uy * ln, col if (cols2 is None or k % 2) else cols2)


def radial_lines(img, rng, n, cx, cy, r0, r1, col):
    for _ in range(n):
        a = rng.uniform(0, 2 * math.pi)
        a0, a1 = rng.uniform(r0, r1), rng.uniform(r0, r1) + rng.uniform(40, 160)
        draw_line(img, cx + math.cos(a) * a0, cy + math.sin(a) * a0, cx + math.cos(a) * a1, cy + math.sin(a) * a1, col)


def noise_at(X, Y, cx, cy, seed, octaves=2, angle=0.0):
    """Value noise sampled at arbitrary coordinates, cells cx by cy, the cell grid turned by angle."""
    c, s = math.cos(angle), math.sin(angle)
    U, V = X * c + Y * s, -X * s + Y * c
    rng = np.random.default_rng(seed)
    out = np.zeros(X.shape)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        ax, ay = cx / 2 ** o, cy / 2 ** o
        G = rng.random((257, 257))
        fx, fy = U / ax, V / ay
        ix, iy = np.floor(fx).astype(int), np.floor(fy).astype(int)
        tx, ty = fx - ix, fy - iy
        tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
        ix0, iy0 = ix % 256, iy % 256
        a = G[iy0, ix0] * (1 - tx) + G[iy0, ix0 + 1] * tx
        b = G[iy0 + 1, ix0] * (1 - tx) + G[iy0 + 1, ix0 + 1] * tx
        out += amp * (a * (1 - ty) + b * ty)
        tot += amp
        amp *= 0.5
    return out / tot


def fill_by_tones(img, mask, X, Y, tones, cx, cy, seed, angle=0.0):
    """Paint mask with banded noise in the given tones (dark->light), like the panel's own flat-shaded clouds."""
    n = noise_at(X, Y, cx, cy, seed, 3, angle)
    q = np.clip((n - 0.25) / 0.5, 0, 0.999)
    idx = (q * len(tones)).astype(int)
    for k, t in enumerate(tones):
        img[mask & (idx == k)] = t


def clampcam(cx, cy, vis, w, h, roll=0.0, margin=0.0):
    """A camera that never looks past the edges of a w x h base image (no empty borders)."""
    vis = min(vis, w * (1 - margin), h * (1 - margin) * W / H)
    vh = vis * H / W
    pad = 1 + margin
    cx = min(max(cx, vis * pad / 2), w - vis * pad / 2)
    cy = min(max(cy, vh * pad / 2), h - vh * pad / 2)
    return Cam(cx, cy, vis, roll)


def mirror_up(img, hole):
    """Fill holes by mirroring the pixels above each hole's top edge (column by column)."""
    h, w = hole.shape
    rows = np.repeat(np.arange(h)[:, None], w, 1)
    cols = np.repeat(np.arange(w)[None, :], h, 0)
    last = np.where(~hole, rows, -1)
    last = np.maximum.accumulate(last, axis=0)
    src = 2 * last - rows
    out = img.copy()
    ok = hole & (last >= 0) & (src >= 0)
    srcc = np.clip(src, 0, h - 1)
    ok &= ~hole[srcc, cols]
    out[ok] = img[srcc[ok], cols[ok]]
    rest = hole & ~ok & (last >= 0)
    out[rest] = img[last[rest], cols[rest]]
    return out
