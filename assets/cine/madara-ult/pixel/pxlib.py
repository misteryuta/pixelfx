"""Pixel-exact 2D toolkit for the Madara ultimate cutscene (numpy only).

Every frame is built on one 1-pixel grid: art is resampled once to the shot's canvas, effects are rasterised
straight onto that grid (no rotation or scaling of textures), the camera only moves by whole pixels, and each
finished frame is snapped to the shot's palette. That keeps every pixel the same size in every frame."""
import numpy as np, zlib, struct, os

# ---------------------------------------------------------------- PNG io
def read_png(path):
    data = open(path, "rb").read()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", path
    pos, idat, w = 8, [], None
    plte = None
    while pos < len(data):
        n, typ = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + n]
        if typ == b"IHDR":
            w, h, depth, ctype, _, _, inter = struct.unpack(">IIBBBBB", body)
            assert depth == 8 and inter == 0, (path, depth, inter)
        elif typ == b"PLTE":
            plte = np.frombuffer(body, np.uint8).reshape(-1, 3)
        elif typ == b"IDAT":
            idat.append(body)
        pos += 12 + n
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = np.frombuffer(zlib.decompress(b"".join(idat)), np.uint8)
    stride = w * ch
    raw = raw.reshape(h, stride + 1)
    out = np.zeros((h, stride), np.int32)
    prev = np.zeros(stride, np.int32)
    for y in range(h):
        f, line = raw[y, 0], raw[y, 1:].astype(np.int32)
        if f == 0:
            cur = line
        elif f == 1:
            cur = line.copy()
            for x in range(ch, stride, ch):  # sub: do it in blocks of ch with cumulative sum per channel
                pass
            cur = np.zeros(stride, np.int32)
            for c in range(ch):
                cur[c::ch] = np.cumsum(line[c::ch]) & 255
        elif f == 2:
            cur = (line + prev) & 255
        elif f == 3:
            cur = np.zeros(stride, np.int32)
            for x in range(stride):
                a = cur[x - ch] if x >= ch else 0
                cur[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        else:
            cur = np.zeros(stride, np.int32)
            for x in range(stride):
                a = cur[x - ch] if x >= ch else 0
                b = prev[x]
                c = prev[x - ch] if x >= ch else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                cur[x] = (line[x] + pr) & 255
        out[y] = cur
        prev = cur
    img = out.reshape(h, w, ch).astype(np.uint8)
    if ctype == 3:
        img = plte[img[..., 0]]
    elif ctype == 0:
        img = np.repeat(img, 3, 2)
    elif ctype == 4:
        img = np.concatenate([np.repeat(img[..., :1], 3, 2), img[..., 1:]], 2)
    if img.shape[2] == 3:
        img = np.concatenate([img, np.full(img.shape[:2] + (1,), 255, np.uint8)], 2)
    return img  # h, w, 4 uint8


def write_png(path, img):
    img = np.ascontiguousarray(img.astype(np.uint8))
    h, w, ch = img.shape
    ctype = {3: 2, 4: 6}[ch]
    raw = np.concatenate([np.zeros((h, 1), np.uint8), img.reshape(h, w * ch)], 1).tobytes()

    def chunk(t, b):
        return struct.pack(">I", len(b)) + t + b + struct.pack(">I", zlib.crc32(t + b) & 0xffffffff)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, ctype, 0, 0, 0))
                + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))


def hexc(s):
    s = s.lstrip("#")
    return np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], np.int32)

# ---------------------------------------------------------------- resample + palette
def resample(src, w, h, box=None):
    """Downsample src (H,W,C) to (h,w): each output pixel takes the real source pixel of its footprint that is
    closest to the footprint's mean colour, so no blended in-between colours appear."""
    src = src[..., :3].astype(np.int32)
    if box is not None:
        x0, y0, x1, y1 = box
        src = src[y0:y1, x0:x1]
    H, W = src.shape[:2]
    xs = np.linspace(0, W, w + 1).astype(int)
    ys = np.linspace(0, H, h + 1).astype(int)
    out = np.zeros((h, w, 3), np.int32)
    for j in range(h):
        band = src[ys[j]:max(ys[j + 1], ys[j] + 1)]
        for i in range(w):
            blk = band[:, xs[i]:max(xs[i + 1], xs[i] + 1)].reshape(-1, 3)
            m = blk.mean(0)
            out[j, i] = blk[np.argmin(((blk - m) ** 2).sum(1))]
    return out


def resample_fast(src, w, h, box=None):
    """Vectorised version of resample() for footprints of equal size (uses the centre-weighted pick)."""
    src = src[..., :3].astype(np.int32)
    if box is not None:
        x0, y0, x1, y1 = box
        src = src[y0:y1, x0:x1]
    H, W = src.shape[:2]
    fx, fy = W / w, H / h
    kx, ky = max(1, int(fx)), max(1, int(fy))
    xs = (np.arange(w) * fx).astype(int)
    ys = (np.arange(h) * fy).astype(int)
    xs = np.minimum(xs, W - kx)
    ys = np.minimum(ys, H - ky)
    # gather kx*ky candidates per pixel
    cand = np.stack([src[ys[:, None] + dy, xs[None, :] + dx] for dy in range(ky) for dx in range(kx)], 2)
    m = cand.mean(2, keepdims=True)
    k = np.argmin(((cand - m) ** 2).sum(3), 2)
    return np.take_along_axis(cand, k[..., None, None], 2)[:, :, 0]


def kmeans_palette(img, k, iters=12, seed=1, extra=()):
    px = img.reshape(-1, 3).astype(np.float32)
    rng = np.random.default_rng(seed)
    sample = px[rng.choice(len(px), min(len(px), 40000), replace=False)]
    # k-means++ seeding
    c = [sample[rng.integers(len(sample))]]
    for _ in range(1, k):
        d = np.min(((sample[:, None] - np.array(c)[None]) ** 2).sum(2), 1)
        c.append(sample[rng.choice(len(sample), p=d / d.sum())])
    c = np.array(c)
    for _ in range(iters):
        lab = np.argmin(((sample[:, None] - c[None]) ** 2).sum(2), 1)
        for i in range(k):
            sel = sample[lab == i]
            if len(sel):
                c[i] = sel.mean(0)
    pal = np.round(c).astype(np.int32)
    if len(extra):
        pal = np.concatenate([pal, np.array(extra, np.int32).reshape(-1, 3)])
    return np.unique(pal, axis=0)


def snap(img, pal):
    """Map every pixel to its nearest palette colour (in chunks to save memory)."""
    flat = img.reshape(-1, 3).astype(np.int32)
    out = np.empty_like(flat)
    P = pal.astype(np.int32)
    for s in range(0, len(flat), 65536):
        blk = flat[s:s + 65536]
        d = ((blk[:, None] - P[None]) ** 2).sum(2)
        out[s:s + 65536] = P[np.argmin(d, 1)]
    return out.reshape(img.shape)


def despeckle(img, passes=1):
    """Replace pixels that match none of their 8 neighbours with the most common neighbour colour."""
    img = img.copy()
    h, w = img.shape[:2]
    for _ in range(passes):
        key = (img[..., 0] << 16) | (img[..., 1] << 8) | img[..., 2]
        pad = np.pad(key, 1, mode="edge")
        nb = np.stack([pad[1 + dy:h + 1 + dy, 1 + dx:w + 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                       if dy or dx], 2)
        lonely = ~np.any(nb == key[..., None], 2)
        ys, xs = np.nonzero(lonely)
        for y, x in zip(ys, xs):
            v, cnt = np.unique(nb[y, x], return_counts=True)
            kk = v[np.argmax(cnt)]
            img[y, x] = [(kk >> 16) & 255, (kk >> 8) & 255, kk & 255]
    return img


def clean_art(src, w, h, k=40, box=None, seed=1, extra=()):
    a = resample_fast(src, w, h, box)
    pal = kmeans_palette(a, k, seed=seed, extra=extra)
    a = snap(a, pal)
    a = despeckle(a, 2)
    return a, pal

# ---------------------------------------------------------------- raster primitives (all integer)
def blank(w, h, col=(0, 0, 0)):
    a = np.zeros((h, w, 3), np.int32)
    a[:] = col
    return a


def put(dst, src, x, y, mask=None):
    """Paste src at integer (x,y) into dst, optional boolean mask the size of src."""
    x, y = int(round(x)), int(round(y))
    H, W = dst.shape[:2]
    h, w = src.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x0 >= x1 or y0 >= y1:
        return
    s = src[y0 - y:y1 - y, x0 - x:x1 - x]
    if mask is None:
        dst[y0:y1, x0:x1] = s[..., :3]
    else:
        m = mask[y0 - y:y1 - y, x0 - x:x1 - x]
        dst[y0:y1, x0:x1][m] = s[..., :3][m]


def crop(src, x, y, w, h):
    """Crop with whole-pixel camera position; out-of-range edges are clamped (edge pixels repeat)."""
    x, y = int(round(x)), int(round(y))
    H, W = src.shape[:2]
    ys = np.clip(np.arange(y, y + h), 0, H - 1)
    xs = np.clip(np.arange(x, x + w), 0, W - 1)
    return src[ys][:, xs].copy()


def poly_mask(w, h, pts):
    """Even-odd scanline fill, sampled at pixel centres."""
    m = np.zeros((h, w), bool)
    pts = np.asarray(pts, float)
    n = len(pts)
    yy = np.arange(h) + 0.5
    for j in range(h):
        y = yy[j]
        xs = []
        for i in range(n):
            (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % n]
            if (y0 <= y < y1) or (y1 <= y < y0):
                xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
        xs.sort()
        for a, b in zip(xs[0::2], xs[1::2]):
            i0, i1 = int(np.ceil(a - 0.5)), int(np.floor(b - 0.5))
            i0, i1 = max(0, i0), min(w - 1, i1)
            if i1 >= i0:
                m[j, i0:i1 + 1] = True
    return m


def disc_mask(w, h, cx, cy, r, ry=None):
    ry = r if ry is None else ry
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx + 0.5 - cx) / max(r, 1e-6)) ** 2 + ((yy + 0.5 - cy) / max(ry, 1e-6)) ** 2 <= 1.0


def ring_mask(w, h, cx, cy, r, thick, ry=None):
    k = (ry / r) if ry else 1.0
    return disc_mask(w, h, cx, cy, r, r * k) & ~disc_mask(w, h, cx, cy, max(0, r - thick), max(0, r - thick) * k)


def line_pts(x0, y0, x1, y1):
    """Bresenham line points."""
    x0, y0, x1, y1 = map(lambda v: int(round(v)), (x0, y0, x1, y1))
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err, out = dx + dy, []
    while True:
        out.append((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
    return out


def draw_pts(dst, pts, col, thick=1):
    H, W = dst.shape[:2]
    r = thick // 2
    for x, y in pts:
        for oy in range(-r, thick - r):
            for ox in range(-r, thick - r):
                if 0 <= x + ox < W and 0 <= y + oy < H:
                    dst[y + oy, x + ox] = col


def draw_line(dst, x0, y0, x1, y1, col, thick=1):
    draw_pts(dst, line_pts(x0, y0, x1, y1), col, thick)


def bolt(rng, x0, y0, x1, y1, jag=6, seg=7):
    """A jagged lightning polyline from (x0,y0) to (x1,y1)."""
    pts = [(x0, y0)]
    for i in range(1, seg):
        t = i / seg
        nx, ny = -(y1 - y0), (x1 - x0)
        L = max(1e-6, (nx * nx + ny * ny) ** 0.5)
        o = rng.uniform(-jag, jag)
        pts.append((x0 + (x1 - x0) * t + nx / L * o, y0 + (y1 - y0) * t + ny / L * o))
    pts.append((x1, y1))
    out = []
    for a, b in zip(pts[:-1], pts[1:]):
        out += line_pts(*a, *b)
    return out


BAYER4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 + 1 / 32


def dither(w, h, amount, ox=0, oy=0):
    """Boolean mask covering `amount` (0..1, scalar or HxW array) of pixels in a 4x4 Bayer pattern."""
    yy, xx = np.mgrid[0:h, 0:w]
    return BAYER4[(yy + oy) % 4, (xx + ox) % 4] < amount


def value_noise(w, h, cell, seed, octaves=1):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        c = max(1, cell / (2 ** o))
        gw, gh = int(w / c) + 3, int(h / c) + 3
        g = rng.random((gh, gw))
        yy, xx = np.mgrid[0:h, 0:w]
        fx, fy = xx / c, yy / c
        ix, iy = fx.astype(int), fy.astype(int)
        tx, ty = fx - ix, fy - iy
        tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
        a = g[iy, ix] * (1 - tx) + g[iy, ix + 1] * tx
        b = g[iy + 1, ix] * (1 - tx) + g[iy + 1, ix + 1] * tx
        out += amp * (a * (1 - ty) + b * ty)
        tot += amp
        amp *= 0.5
    return out / tot


def blend(dst, col, mask, amount):
    """Mix a colour into dst where mask is set; result is snapped later by the shot palette."""
    c = np.asarray(col, np.int32)
    dst[mask] = (dst[mask] * (1 - amount) + c * amount).astype(np.int32)


def lum(img):
    return img[..., 0] * 0.299 + img[..., 1] * 0.587 + img[..., 2] * 0.114


def shift(img, dx, dy, fill=None):
    """Whole-pixel shift (camera shake) with edge repeat."""
    h, w = img.shape[:2]
    return crop(img, -dx, -dy, w, h)


def save_frame(path, img, scale=1):
    a = np.clip(img, 0, 255).astype(np.uint8)
    if scale > 1:
        a = np.repeat(np.repeat(a, scale, 0), scale, 1)
    write_png(path, a)


def value_noise2(w, h, cx, cy, seed, octaves=2):
    """Anisotropic value noise (cells cx wide, cy tall): long horizontal wisps for fog and dust."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w))
    amp, tot = 1.0, 0.0
    yy, xx = np.mgrid[0:h, 0:w]
    for o in range(octaves):
        ax, ay = max(1, cx / 2 ** o), max(1, cy / 2 ** o)
        g = rng.random((int(h / ay) + 3, int(w / ax) + 3))
        fx, fy = xx / ax, yy / ay
        ix, iy = fx.astype(int), fy.astype(int)
        tx, ty = fx - ix, fy - iy
        tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
        a = g[iy, ix] * (1 - tx) + g[iy, ix + 1] * tx
        b = g[iy + 1, ix] * (1 - tx) + g[iy + 1, ix + 1] * tx
        out += amp * (a * (1 - ty) + b * ty)
        tot += amp
        amp *= 0.5
    return out / tot
