"""Figure/background masks for the Sasuke panels: the background is the region connected to given seed edges whose
colours stay close to the background's own palette; the figure is everything else, holes filled, cleaned.
Writes cache/<panel>_fg.npy and preview/seg_<panel>.png."""
import sys, os, numpy as np
from collections import deque
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "madara_px"))
from pxlib import *
import shots as old
from shots2 import dil, close


def ero(m, r):
    return ~dil(~m, r)


def flood(ok, seeds):
    h, w = ok.shape
    seen = np.zeros_like(ok)
    q = deque()
    for y, x in seeds:
        if ok[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < h and 0 <= xx < w and ok[yy, xx] and not seen[yy, xx]:
                seen[yy, xx] = True
                q.append((yy, xx))
    return seen


def seg(n, bgtest, edges=("t", "l", "r", "b"), keep_min=4000, smooth=2):
    a = np.load(os.path.join(HERE, "cache", "%s_b840.npy" % n)).astype(int)
    h, w = a.shape[:2]
    ok = bgtest(a)
    seeds = []
    if "t" in edges: seeds += [(0, x) for x in range(w)]
    if "b" in edges: seeds += [(h - 1, x) for x in range(w)]
    if "l" in edges: seeds += [(y, 0) for y in range(h)]
    if "r" in edges: seeds += [(y, w - 1) for y in range(h)]
    bg = flood(ok, seeds)
    fg = ~bg
    fg = close(fg, smooth) if smooth else fg
    keep = np.zeros_like(fg)
    for ys, xs in old.components(fg):
        if len(ys) >= keep_min:
            keep[ys, xs] = True
    # fill holes
    inv = flood(~keep, [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)])
    fg = ~inv
    np.save(os.path.join(HERE, "cache", "%s_fg.npy" % n), fg)
    vis = a.copy()
    vis[~fg] = (vis[~fg] * 0.25).astype(int)
    save_frame(os.path.join(HERE, "preview", "seg_%s.png" % n), vis)
    print(n, fg.mean())
    return fg


L = lambda a: lum(a)
S = lambda a: old.sat(a)
if __name__ == "__main__":
    # p02 seal: red/orange/black flames and rock behind him
    seg("p02", lambda a: ((a[..., 0] > a[..., 2] + 25) & (S(a) > 0.35)) | (L(a) < 28), ("t", "l", "r"), smooth=1)
    # p04 from above: brown ground
    seg("p04", lambda a: (a[..., 0] > a[..., 2] + 20) & (S(a) > 0.3) & (L(a) < 200), ("t", "l", "r", "b"), smooth=1)
    # p06 wide: reddish sky round the winged Susanoo (the sphere joins the background via the right edge)
    seg("p06", lambda a: ~((a[..., 2] > a[..., 1] + 40) & (L(a) > 115) & (a[..., 2] > 150)) , ("t", "l", "r", "b"), keep_min=1500, smooth=1)
    # p08 face: the pink sky
    seg("p08", lambda a: (a[..., 0] > 170) & (a[..., 2] > 150) & (a[..., 1] < 120), ("t", "r"), smooth=1)
    # p09 hit: the dark sky band and the wall
    seg("p09", lambda a: (L(a) < 80) | ((a[..., 0] > 150) & (a[..., 1] < 70)), ("t", "r", "b"), keep_min=8000, smooth=2)
