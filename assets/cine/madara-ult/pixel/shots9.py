"""Madara ultimate, Perfect Susanoo, version 10 (on top of shots8):
the wood dragon gets a body that is redrawn every frame: a 3D tube of wooden segments (ring bands, light from the
upper left, a dark rim, spines along the back) that follows its head along a flight path in space, seen in
perspective. So its silhouette really changes: it bursts straight up out of the ground behind Madara, arcs over,
turns toward the lens and comes at it, foreshortened, the body trailing in a curve; its head is the panel's head
(with the jaw opening), turned to its heading and scaled with depth.
Run: python shots9.py [--frames a-b] [--every n]"""
import sys, os, math, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pxlib import *
from engine import *
import shots as old
import shots2 as v3
import shots4 as v5
import shots5 as v6
import shots6 as v7
import shots8 as v9
from shots4 import dil, disc_screen, WHITE, CYAN, CYAN2

# the head's flight: (frame, x, y, z) in panel-2 space (base 840); z = 1 is the depth of the backdrop, smaller is
# nearer the lens. The body is where the head was a moment before (follow the leader).
HEAD_PATH = [(-12, 470, 760, 1.0), (0, 470, 520, 1.0), (8, 462, 250, 1.0), (14, 440, 150, 0.95), (20, 380, 150, 0.8),
             (26, 370, 215, 0.6), (32, 392, 250, 0.38), (38, 400, 252, 0.18), (43, 400, 246, 0.08), (48, 400, 242, 0.03)]
GROUND = 438.0
NSEG, LAG = 30, 0.62  # body segments, frames of path between neighbours


def catmull(path, t):
    ts = [p[0] for p in path]
    t = min(max(t, ts[0]), ts[-1])
    k = max(0, min(len(path) - 2, np.searchsorted(ts, t) - 1))
    p0, p1, p2, p3 = path[max(0, k - 1)], path[k], path[k + 1], path[min(len(path) - 1, k + 2)]
    u = (t - p1[0]) / max(1e-6, p2[0] - p1[0])
    out = []
    for d in (1, 2, 3):
        a, b, c, e = p0[d], p1[d], p2[d], p3[d]
        out.append(0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - e) * u * u + (-a + 3 * b - 3 * c + e) * u ** 3))
    return out


class S2(v9.S2):
    def __init__(s):
        super().__init__()
        a = s.art
        wood = s.drag & (lum(a) > 70)
        t4 = v3.tones(a, wood, 4, 2201)
        s.wood = t4  # dark -> light
        s.rim = hexc("#2a1a10")
        s.pal = np.concatenate([s.pal, t4, [s.rim]])

    def proj(s, x, y, z, vcx, vcy):
        """Perspective about the view centre: a point at depth z lands at (vcx + (x-vcx)/z, ...)."""
        return vcx + (x - vcx) / z, vcy + (y - vcy) / z

    def body(s, img, cam, i, n, vcx, vcy):
        segs = []
        for j in range(NSEG):
            t = i - j * LAG
            x, y, z = catmull(HEAD_PATH, t)
            if t < HEAD_PATH[0][0]:
                continue
            r = 44 - 20 * (j / NSEG)  # thick at the neck, thinner to the tail
            segs.append((j, x, y, max(0.02, z), r))
        # far to near, so nearer segments cover farther ones (the scallops read as wooden rings)
        order = sorted(segs, key=lambda q: -q[3])
        heads = None
        for j, x, y, z, r in order:
            if z < 0.06 or y > GROUND + r * 0.6:
                continue
            bx, by = s.proj(x, y, z, vcx, vcy)
            px, py = cam.P(bx, by)
            R = r / z * cam.r
            if R < 1 or px < -R or px > W + R or py < -R or py > H + R:
                continue
            ground_y = cam.P(0, s.proj(0, GROUND, z, vcx, vcy)[1])[1]
            clip = (np.arange(H)[:, None] < ground_y) & np.ones((1, W), bool)
            disc = lambda cx_, cy_, rr: disc_mask(W, H, cx_, cy_, rr) & clip
            img[disc(px, py, R + 1.5)] = s.rim
            img[disc(px, py, R)] = s.wood[1]
            band = s.wood[2] if j % 2 else s.wood[1]
            img[disc(px - R * 0.12, py - R * 0.16, R * 0.84)] = band
            img[disc(px - R * 0.3, py - R * 0.36, R * 0.42)] = s.wood[3]
            if j % 3 == 1 and j > 2:  # a spine along the back (screen-up side)
                sp = [(px - R * 0.35, py - R * 0.8), (px + R * 0.25, py - R * 1.75), (px + R * 0.35, py - R * 0.75)]
                m = poly_mask(W, H, sp) & clip
                img[dil(m, 1) & ~m & clip] = s.rim
                img[m] = s.wood[2]
        return segs

    def head(s, img, px, py, ang, R, jaw, i):
        """The dragon's head in screen space: (px,py) at the neck, pointing along ang, R = neck radius on screen."""
        flip = -1.0 if math.cos(ang) < 0 else 1.0  # keep the top of the head up
        c, si = math.cos(ang), math.sin(ang)

        def T(pts, piv=None, rot=0.0):
            out = []
            for u, v in pts:
                if piv is not None:
                    du, dv = u - piv[0], v - piv[1]
                    cr, sr = math.cos(rot), math.sin(rot)
                    u, v = piv[0] + du * cr - dv * sr, piv[1] + du * sr + dv * cr
                v *= flip
                out.append((px + (u * c - v * si) * R, py + (u * si + v * c) * R))
            return out

        def fill(pts, col, rim=True):
            m = poly_mask(W, H, pts)
            if rim:
                img[dil(m, 1) & ~m] = s.rim
            img[m] = col
            return m
        hinge = (0.55, 0.28)
        lower = T([(0.5, 0.18), (2.35, 0.32), (2.4, 0.5), (2.2, 0.72), (0.65, 0.8)], hinge, jaw)
        mouth = T([(0.6, 0.1), (2.5, 0.12), (2.3, 0.55), (0.7, 0.62)], hinge, jaw * 0.6)
        fill(mouth, hexc("#1e0c06"), False)
        fill(lower, s.wood[1])
        fill(T([(0.7, 0.62), (2.2, 0.62), (2.15, 0.72), (0.75, 0.76)], hinge, jaw), s.wood[0], False)
        for k in range(6):  # lower fangs
            u0 = 0.8 + k * 0.26
            fill(T([(u0, 0.24), (u0 + 0.08, 0.02), (u0 + 0.16, 0.24)], hinge, jaw), hexc("#e8d6b4"))
        for k, (u0, w_, h_) in enumerate(((-0.35, 0.5, 1.2), (0.05, 0.45, 1.35), (0.45, 0.35, 1.05))):  # horns
            fill(T([(u0, -0.55), (u0 - 0.45, -0.55 - h_), (u0 + w_, -0.6)]), s.wood[2])
        skull = [(-0.15 + 0.8 * math.cos(a), -0.1 + 0.72 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 18)]
        fill(T(skull), s.wood[1])
        snout = [(0.4, -0.75), (1.6, -0.62), (2.55, -0.38), (2.75, -0.02), (2.6, 0.18), (0.6, 0.22)]
        fill(T(snout), s.wood[2])
        fill(T([(0.6, -0.6), (1.6, -0.5), (2.45, -0.3), (2.5, -0.18), (0.6, -0.3)]), s.wood[3], False)
        for k in range(7):  # upper fangs
            u0 = 0.75 + k * 0.27
            fill(T([(u0, 0.16), (u0 + 0.09, 0.42), (u0 + 0.18, 0.16)]), hexc("#e8d6b4"))
        fill(T([(0.95, -0.52), (1.35, -0.62), (1.3, -0.42), (0.98, -0.4)]), hexc("#140804"))  # the eye
        fill(T([(1.12, -0.56), (1.22, -0.58), (1.2, -0.5)]), hexc("#ffd890"), False)

    def head_front(s, img, px, py, R, jaw, i):
        """The head coming straight at us: the jaws gaping, fangs all round, eyes above, horns."""
        def fill(pts, col, rim=True):
            m = poly_mask(W, H, pts)
            if rim:
                img[dil(m, 1) & ~m] = s.rim
            img[m] = col
            return m

        def ell(cx_, cy_, rx, ry, k=24):
            return [(cx_ + rx * math.cos(a), cy_ + ry * math.sin(a)) for a in np.linspace(0, 2 * math.pi, k, endpoint=False)]
        for sgn in (-1, 1):  # horns sweeping up and out
            fill([(px + sgn * 0.6 * R, py - 0.8 * R), (px + sgn * 1.9 * R, py - 2.0 * R), (px + sgn * 1.05 * R, py - 0.55 * R)], s.wood[2])
            fill([(px + sgn * 1.0 * R, py - 0.3 * R), (px + sgn * 2.1 * R, py - 0.9 * R), (px + sgn * 1.3 * R, py + 0.05 * R)], s.wood[1])
        P = lambda pts: [(px + u * R, py + v * R) for u, v in pts]
        fill(P([(-1.3, -0.95), (-0.55, -1.4), (0.55, -1.4), (1.3, -0.95), (1.5, 0.15), (1.05, 1.3), (-1.05, 1.3), (-1.5, 0.15)]),
             s.wood[1])
        fill(P([(-1.1, -0.9), (-0.5, -1.25), (0.5, -1.25), (1.1, -0.9), (1.2, -0.2), (-1.2, -0.2)]), s.wood[2], False)
        fill(P([(-0.6, -1.15), (0.1, -1.2), (-0.2, -0.85), (-0.75, -0.8)]), s.wood[3], False)
        for k in range(3):  # wood grain across the brow
            yk = -0.55 - 0.18 * k
            for (u0, v0), (u1, v1) in zip(P([(-0.9 + 0.1 * k, yk), (0, yk - 0.12), (0.9 - 0.1 * k, yk)])[:-1],
                                          P([(-0.9 + 0.1 * k, yk), (0, yk - 0.12), (0.9 - 0.1 * k, yk)])[1:]):
                draw_line(img, u0, v0, u1, v1, s.wood[0], 1 if R < 60 else 2)
        my = py + 0.3 * R
        mr = (0.25 + 0.75 * jaw) * R
        fill([(px - 1.15 * R, my), (px - 0.75 * R, my - mr), (px + 0.75 * R, my - mr), (px + 1.15 * R, my),
              (px + 0.75 * R, my + mr), (px - 0.75 * R, my + mr)], hexc("#1e0c06"))
        fill(ell(px, my + mr * 0.3, 0.6 * R, mr * 0.45), hexc("#3a140a"), False)  # the throat
        nf = 9
        for k in range(nf):  # fangs: down from the upper jaw, up from the lower
            a = math.pi + (k + 0.5) * math.pi / nf
            fx, fy = px + 1.05 * R * math.cos(a), my + mr * math.sin(a) * 0.95
            L = (0.32 + 0.12 * (k % 2)) * R
            fill([(fx - 0.09 * R, fy), (fx, fy + L), (fx + 0.09 * R, fy)], hexc("#e8d6b4"))
            a2 = (k + 0.5) * math.pi / nf
            gx_, gy_ = px + 1.0 * R * math.cos(a2), my + mr * math.sin(a2) * 0.95
            fill([(gx_ - 0.08 * R, gy_), (gx_, gy_ - L * 0.85), (gx_ + 0.08 * R, gy_)], hexc("#e8d6b4"))
        for sgn in (-1, 1):  # eyes
            fill([(px + sgn * 0.45 * R, py - 0.78 * R), (px + sgn * 0.95 * R, py - 0.98 * R), (px + sgn * 0.9 * R, py - 0.72 * R)],
                 hexc("#140804"))
            fill([(px + sgn * 0.7 * R, py - 0.86 * R), (px + sgn * 0.82 * R, py - 0.9 * R), (px + sgn * 0.8 * R, py - 0.8 * R)],
                 hexc("#ffd890"), False)

    def frame(s, i, n):
        h = s.art.shape[0]
        cx, cy, vis = track(i, [(0, (440, 340, 700), "s"), (12, (400, 270, 760), "o"), (n - 1, (400, 270, 760), "s")])
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        vcx, vcy = cam.cx, cam.cy  # the lens looks at the middle of the frame
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        segs = s.body(img, cam, i, n, vcx, vcy)
        # the head, built like the body: skull, snout, a jaw that drops open, fangs, eye, horns
        x, y, z = catmull(HEAD_PATH, i)
        x2, y2, z2 = catmull(HEAD_PATH, i - 2.5)
        if z > 0.045 and y < GROUND + 20:
            hx, hy = s.proj(x, y, z, vcx, vcy)
            bx2, by2 = s.proj(x2, y2, max(z2, 0.045), vcx, vcy)
            px, py = cam.P(hx, hy)
            qx, qy = cam.P(bx2, by2)
            ang = math.atan2(py - qy, px - qx) if math.hypot(px - qx, py - qy) > 1 else -math.pi / 2
            R = 44 / z * cam.r
            jaw = 0.08 + 0.42 * ease((i - 16) / 18)
            dz = (z2 - z) * 600  # how fast it comes at us, against how fast it crosses the screen
            front = i >= 33  # from here it comes straight at us
            if front:
                s.head_front(img, px, py, R * 0.9, min(1.0, jaw * 1.8), i)
            else:
                s.head(img, px, py, ang, R, jaw, i)
        X, Y = cam.grid()
        top = h * 0.92 - 40 - 300 * ease_out(i / 12)
        life = 1 - ease((i - 6) / 16)
        if life > 0:  # the ground bursts where it comes up
            nz = noise_at(X, Y + i * 4.0, 90, 56, 29, 2)
            env = np.clip((Y - top) / 120, 0, 1) * life
            d = nz * (0.3 + 0.8 * env)
            img[d > 0.52] = s.dcols[0]
            img[d > 0.64] = s.dcols[1]
        for k, (x0, y0, vx, vy, sw, sh, c) in enumerate(s.chips):
            t = i - (k % 4)
            if t < 0 or t > 30:
                continue
            px, py = cam.P(x0 + vx * t, y0 + vy * t + 0.55 * t * t)
            px, py = int(px), int(py)
            if 0 <= px < W - 6 and 0 <= py < H - 6:
                img[py:py + sh, px:px + sw] = s.wcols[c]
        r = np.random.default_rng(1500 + i)
        if i > 28:
            u = (i - 28) / (n - 29)
            radial_lines(img, r, int(6 + 26 * u), W / 2, H / 2, 160 - 90 * u, 300, hexc("#efe2c8"))
        amp = 6 * (1 - i / 14) if i < 14 else (1 if i > n - 12 else 0)
        return shift(img, *old.shake(i, amp, 2))


SHOTS = list(v9.SHOTS)
SHOTS[1] = ("S02_dragon", 37, 84, S2)


def main():
    v5.SHOTS[:] = SHOTS
    v5.FADES.clear()
    v5.FADES.update(v6.FADES)
    v5.main()


if __name__ == "__main__":
    main()
