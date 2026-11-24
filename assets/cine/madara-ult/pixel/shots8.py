"""Madara ultimate, Perfect Susanoo, version 9 (on top of shots7):
  - the dragon is quick: it bursts up out of the dust and in one smooth arc flies straight into the lens, its body
    wiping past (no rear-back, no bite)
  - the blade swing is carried by the whole arm (it turns from the elbow, the wrist adds a little), the blade is
    sampled from the matching mip so its edges stay clean while it turns
  - the blade's impact: the point grinds with dark grit and small flames, then tall flickering flame spikes in three
    tones burst up along the ground with a soft cyan glow, dark rock flying, the blade's end lit; the glow swells
    into the white of the next shot
Frames at 24 fps: S1 1-36 | S2 37-84 | S3 85-108 | orb 109-130 | S4 131-176 | S5 177-202 | S6 203-242
                  S7 243-290 | S8 291-364 | S9 365-388 | S10 389-442 | S11 443-480
Run: python shots8.py [--frames a-b] [--every n]"""
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
import shots7 as v8
from shots4 import dil, sample, disc_screen, WHITE, CYAN, CYAN2, BLUE

DUST = [hexc("#1a2036"), hexc("#2e3448"), hexc("#4a5068")]
GLOW = np.array([150, 236, 255])


# ------------------------------------------------------------------ S2: up out of the dust, straight into the lens
class S2(v7.S2):
    RISE, FLY = 12, 14

    def pose(s, i, n):
        R, F = s.RISE, s.FLY
        if i <= R:
            u = ease_out(i / R)
            p = v7.lerp_pose(v7.P_(gy=200, groot=0.06, ang=[0, 0.03, 0.05, 0.08, 0.1, 0.16], jaw=0.2),
                             v7.P_(gy=-10, groot=0.0, ang=[0, 0.01, 0.02, 0.03, 0.05, 0.08], jaw=0.1), u)
        else:
            u = ease((i - F) / (n - 8 - F)) if i > F else 0.0
            p = v7.lerp_pose(v7.P_(gy=-10, groot=0.0, ang=[0, 0.01, 0.02, 0.03, 0.05, 0.08], jaw=0.1),
                             v7.P_(gy=0, groot=-0.05, ang=[0, 0.03, 0.05, 0.07, 0.1, 0.18], jaw=0.45), u)
            p["sc"] = [1 + (x - 1) * ease_in(min(1.0, u * 1.05)) for x in [1.05, 1.15, 1.3, 1.5, 1.8, 2.15]]
        for k in range(1, 6):  # the body never stops undulating
            p["ang"][k] += 0.035 * math.sin(i * 0.38 - k * 0.9)
        return p

    def post_pose(s, p, i, n):
        W0 = n - 7
        if i >= W0:
            t = i - W0
            p["gx"] -= 46 * t + 4 * t * t
            p["gy"] += 6 * t
        return p

    def frame(s, i, n):
        h = s.art.shape[0]
        R, F = s.RISE, s.FLY
        cx, cy, vis = track(i, [(0, (430, 400, 560), "s"), (R, (420, 280, 760), "o"), (n - 1, (300, 300, 640), "s")])
        p = s.pose(i, n)
        cy = max(cy, p["gy"] + vis * H / W / 2 + 1) if i < R else cy
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1])
        if i > F:  # the head comes at the middle of the frame
            sol = s.rig.solve(p)
            hx, hy = s.rig.world(sol, 5, s.rig.head_c)
            u = ease((i - F) / (n - 8 - F) * 1.3)
            p["gx"] += (cam.cx - hx) * u
            p["gy"] += (cam.cy + 20 - hy) * u
        p = s.post_pose(p, i, n)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        s.rig.draw(img, cam, p)
        X, Y = cam.grid()
        top = h * 0.92 - 40 - 280 * ease_out(i / 14)
        life = 1 - ease((i - 10) / 14)
        if life > 0:
            nz = noise_at(X, Y + i * 4.0, 90, 56, 29, 2)
            env = np.clip((Y - top) / 120, 0, 1) * life
            d = nz * (0.3 + 0.8 * env)
            img[d > 0.52] = s.dcols[0]
            img[d > 0.64] = s.dcols[1]
        for k, (x, y, vx, vy, sw, sh, c) in enumerate(s.chips):
            t = i - (k % 4)
            if t < 0 or t > 30:
                continue
            px, py = cam.P(x + vx * t, y + vy * t + 0.55 * t * t)
            px, py = int(px), int(py)
            if 0 <= px < W - 6 and 0 <= py < H - 6:
                img[py:py + sh, px:px + sw] = s.wcols[c]
        r = np.random.default_rng(1500 + i)
        if i > F + 4:
            u = (i - F) / (n - 1 - F)
            radial_lines(img, r, int(8 + 26 * u), W / 2, H / 2, 150 - 90 * u, 300, hexc("#efe2c8"))
        if i >= n - 7:
            speed_lines(img, r, 24, -1.0, 0.08, hexc("#efe2c8"), (80, 260), WHITE)
        amp = 6 * (1 - i / 16) if i < 16 else (1 if i > n - 12 else 0)
        return shift(img, *old.shake(i, amp, 2))


# ------------------------------------------------------------------ S7: the arm carries the swing
class S7(v8.S7):
    SW0, SW1 = 20, 34

    def __init__(s):
        super().__init__()
        s.piv = (40.0, 330.0)  # the elbow side, at the left edge
        a = s.art
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        hole = dil(s.arm, 2)
        cl = v3.tones(a, ~dil(s.arm | s.blade, 6) & (lum(a) < 150), 4, 71)
        plate = s.L_plate.lv[-1][1].copy()
        fill_by_tones(plate, hole, xx.astype(float), yy.astype(float), cl, 170, 18, 72, angle=-0.42)
        s.L_plate = Layer(snap(plate, s.pal), None, s.pal)

    def arm_rot(s, i):
        base = track(i, [(0, (0.03,), "s"), (16, (-0.015,), "o"), (20, (-0.01,), "s")])[0]
        return base - 0.26 * ease((i - s.SW0) / (s.SW1 - s.SW0))

    def swing(s, i):  # the wrist adds a little on top of the arm
        return -0.32 * ease((i - s.SW0 - 2) / (s.SW1 - s.SW0))

    def frame(s, i, n):
        cx, cy, vis = track(i, [(0, (560, 250, 500), "s"), (18, (500, 250, 760), "o"), (s.SW0, (500, 245, 780), "s"),
                                (s.SW1, (470, 170, 800), "s"), (n - 6, (460, 160, 800), "s"), (n - 1, (300, 40, 800), "i")])
        roll = 0.05 * ease(i / n) - 0.02
        cam = clampcam(cx, cy, vis, *s.art.shape[1::-1], roll=roll, margin=0.1)
        img = np.zeros((H, W, 3), np.int32)
        draw(img, cam, s.L_plate)
        rot = s.arm_rot(i)
        sw = s.swing(i)
        k = 225 * (1 - ease_out((i - 4) / 12)) if i >= 4 else 225
        X, Y = cam.grid()
        px, py = s.piv
        c, sn = math.cos(-rot), math.sin(-rot)
        Xa = px + (X - px) * c - (Y - py) * sn
        Ya = py + (X - px) * sn + (Y - py) * c
        gx, gy = s.G
        c2, s2 = math.cos(-sw), math.sin(-sw)
        Xb = gx + (Xa - gx) * c2 - (Ya - gy) * s2
        Yb = gy + (Xa - gx) * s2 + (Ya - gy) * c2
        # sample the blade from the mip level that matches the screen, so its turning edges stay clean
        lvl, im, mk = s.L_blade.pick(cam.r)
        h, w = mk.shape
        bx, by = (Xb - s.AX[0] * k) * lvl, (Yb - s.AX[1] * k) * lvl
        ix, iy = np.floor(bx).astype(int), np.floor(by).astype(int)
        ax, ay = np.floor(Xb).astype(int), np.floor(Yb).astype(int)
        H0, W0 = s.strip.shape
        ok = (ix >= 0) & (ix < w) & (iy >= 0) & (iy < h) & (ax >= 0) & (ax < W0) & (ay >= 0) & (ay < H0)
        ix, iy = np.clip(ix, 0, w - 1), np.clip(iy, 0, h - 1)
        ax, ay = np.clip(ax, 0, W0 - 1), np.clip(ay, 0, H0 - 1)
        ok &= mk[iy, ix] & s.strip[ay, ax]
        img[ok] = im[iy, ix][ok]
        draw(img, cam, s.L_arm, rot=rot, pivot=s.piv)
        r = np.random.default_rng(700 + i)
        if 4 <= i < 16:
            for _ in range(8):
                o = r.uniform(-60, 60)
                x0, y0 = cam.P(440 + s.AX[1] * o, 150 - s.AX[0] * o)
                L = r.uniform(50, 140)
                draw_line(img, x0, y0, x0 - s.AX[0] * L, y0 - s.AX[1] * L, CYAN2 if r.random() < 0.5 else WHITE)
        if s.SW0 <= i < s.SW1 + 6:  # wind arcs behind the point
            tip = (376.0, 44.0)

            def tip_at(j):
                a_r, a_w = s.arm_rot(j), s.swing(j)
                cw, sw_ = math.cos(a_w), math.sin(a_w)
                d = (tip[0] - gx, tip[1] - gy)
                q = (gx + d[0] * cw - d[1] * sw_, gy + d[0] * sw_ + d[1] * cw)
                ca, sa = math.cos(a_r), math.sin(a_r)
                d = (q[0] - px, q[1] - py)
                q = (px + d[0] * ca - d[1] * sa, py + d[0] * sa + d[1] * ca)
                return cam.P(*q)
            for j in range(4):
                pts = [tip_at(i - 4 + q * 0.5) for q in range(9)]
                off = j * 5
                for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
                    draw_line(img, x0, y0 + off, x1, y1 + off, WHITE if j == 0 else CYAN2, 2 if j == 0 else 1)
        if i >= 15 and (i // 2) % 3 != 2:
            for _ in range(2):
                x0, y0 = cam.P(r.uniform(450, 630), r.uniform(180, 290))
                draw_pts(img, bolt(r, x0, y0, x0 + r.uniform(-60, 60), y0 - r.uniform(30, 80), 6, 5), WHITE)
        if i >= n - 6:
            speed_lines(img, r, 18, -s.AX[0], -s.AX[1], CYAN2, (60, 200), WHITE)
        amp = 3 if 15 <= i < 19 else (2 if s.SW0 + 8 <= i < s.SW1 + 2 else 0)
        return shift(img, *old.shake(i, amp, 7))


# ------------------------------------------------------------------ S8: grind, then the flame burst
def flame_spikes(img, x0, x1, base_y, height, t, seed, lean=0.35, n=24):
    """A burst of light along the ground: a lumpy white-hot core and jagged flame tongues licking up and away,
    three tones (cyan rim, pale cyan, white), flickering."""
    if height < 2:
        return
    h, w = img.shape[:2]
    r = np.random.default_rng(seed)
    rf = np.random.default_rng(seed * 7 + int(t))
    cx = x0 + (x1 - x0) * 0.4
    tongues = []
    for k in range(n):
        x = x0 + (x1 - x0) * (k + r.uniform(-0.45, 0.45)) / n
        mid = max(0.0, 1 - abs(x - cx) / ((x1 - x0) * 0.62))
        hh = height * (0.25 + 0.75 * mid) * r.uniform(0.45, 1.0) * (1 + 0.22 * math.sin(t * 1.3 + k * 2.1))
        tongues.append((x, hh, r.uniform(22, 42) * (0.6 + 0.4 * mid), lean * r.uniform(0.4, 1.4)))
    for col, kh, kw in ((CYAN, 1.0, 1.0), (CYAN2, 0.7, 0.72), (WHITE, 0.42, 0.5)):
        for x, hh, ww, ln in tongues:
            H_, W_ = hh * kh, ww * kw
            pts = [(x - W_ / 2, base_y + 3)]
            for q in range(1, 5):  # a jagged left flank
                f = q / 5
                pts.append((x - W_ / 2 * (1 - f) + ln * H_ * f + rf.uniform(-3, 3), base_y - H_ * f))
            pts.append((x + ln * H_, base_y - H_))
            for q in range(4, 0, -1):  # and the right flank, flaring out
                f = q / 5
                pts.append((x + W_ / 2 * (1 - f) + ln * H_ * f + 4 * (1 - f) + rf.uniform(-3, 3), base_y - H_ * f))
            pts.append((x + W_ / 2, base_y + 3))
            img[poly_mask(w, h, pts)] = col
    # the white-hot core heaped along the ground
    yy, xx = np.mgrid[0:h, 0:w]
    rx, ry = (x1 - x0) * 0.42 * min(1.0, height / 120), height * 0.32
    if rx > 2:
        d = np.hypot((xx - cx) / rx, (yy - base_y) / max(ry, 1))
        nz = np.sin(xx * 0.35 + t) * 0.06 + np.sin(xx * 0.13 - t * 0.7) * 0.08
        img[(d + nz < 1.0) & (yy <= base_y + 4)] = CYAN2
        img[(d + nz < 0.78) & (yy <= base_y + 4)] = WHITE


def glow(img, xx, yy, cx, cy, R, strength, squash=1.3):
    d = np.hypot(xx - cx, (yy - cy) * squash)
    a = (np.clip(1 - d / R, 0, 1) ** 2 * strength)[..., None]
    img[:] = (img * (1 - a) + GLOW * a).astype(np.int32)


class S8(v8.S8):
    HIT = 18
    GRIND = 26

    def __init__(s):
        super().__init__()
        s.pal = np.concatenate([s.pal, DUST, [GLOW, np.array([100, 200, 250]), np.array([60, 150, 230]),
                                              np.array([180, 230, 245]), np.array([120, 160, 200])]])

    def frame(s, i, n):
        o, HIT, G = s.o, s.HIT, s.GRIND
        X0 = HIT + G
        F = n - 10
        img = o.plate.copy()
        ang = -0.2 * (1 - ease_in(i / HIT)) if i < HIT else 0.0
        slide = 0.0 if i < HIT else 46 * ease(min(1.0, (i - HIT) / G))
        tmp = np.zeros_like(img)
        a, b, (nx, ny), m = s.blade(tmp, ang)
        ex, ey = b[0] - a[0], b[1] - a[1]
        L = math.hypot(ex, ey)
        ux, uy = ex / L, ey / L
        ox, oy = int(round(ux * slide)), int(round(uy * slide))
        ys, xs = np.nonzero(m)
        ty, tx = ys + oy, xs + ox
        ok = (ty >= 0) & (ty < 315) & (tx >= 0) & (tx < 560)
        img[ty[ok], tx[ok]] = tmp[ys[ok], xs[ok]]
        a, b = (a[0] + ox, a[1] + oy), (b[0] + ox, b[1] + oy)
        for k in range(7):  # chakra wisps
            t = 0.08 + k * 0.13
            bx, by = a[0] + ex * t, a[1] + ey * t + 3
            ph = i * 0.55 + k * 1.7
            Lw = 44 + 12 * math.sin(i * 0.3 + k)
            pts = [(bx + 9 * math.sin(q / 15 * 5.0 + ph) * q / 15 + 14 * (q / 15) ** 2, by - Lw * q / 15) for q in range(16)]
            for j in range(15):
                draw_line(img, *pts[j], *pts[j + 1], WHITE if j < 10 else CYAN2, 3 if j < 4 else (2 if j < 9 else 1))
        cpx, cpy = o.IMP[0] - 30 + ox, o.IMP[1] + oy
        gx0 = o.IMP[0] - 30
        # grinding: a lit furrow, small flames licking at the point, dark grit and sparks thrown back
        if HIT <= i < X0 + 3:
            t = i - HIT
            draw_line(img, gx0, o.IMP[1] + 2, cpx, cpy + 2, CYAN, 4)
            draw_line(img, gx0 + 6, o.IMP[1] + 1, cpx, cpy + 1, WHITE, 2)
            flame_spikes(img, cpx - 30, cpx + 20, cpy + 4, 22 + 10 * ease_out(t / 6), i, 3300 + i // 3, 0.5, 6)
            for te in range(max(HIT, i - 16), i + 1):
                r = np.random.default_rng(2500 + te)
                c0x = gx0 + ux * (46 * ease(min(1.0, (te - HIT) / G)))
                for kk in range(6):
                    vx, vy = r.uniform(-6, 2), r.uniform(-10, -3)
                    dt = i - te
                    qx, qy = c0x + vx * dt, o.IMP[1] + vy * dt + 0.6 * dt * dt
                    if 0 <= qx < 555 and 0 <= qy < 310:
                        sz = 2 + kk % 3
                        img[int(qy):int(qy) + sz, int(qx):int(qx) + sz] = DUST[kk % 3]
            r = np.random.default_rng(2000 + i)
            for kk in range(20):
                a2 = r.uniform(-math.pi * 0.98, -math.pi * 0.55)
                L1, L2 = r.uniform(4, 12), r.uniform(16, 48)
                draw_line(img, cpx + math.cos(a2) * L1, cpy + math.sin(a2) * L1, cpx + math.cos(a2) * L2,
                          cpy + math.sin(a2) * L2 * 0.7, (WHITE, CYAN2, CYAN)[kk % 3])
        # the burst: tall flames along the ground, the glow, rock flying, the blade's end lit
        if i >= X0:
            t = i - X0
            hgt = 150 * ease_out(t / 6) * (1 + 0.06 * math.sin(t * 1.3))
            grow = ease_in((i - F) / 9) if i >= F else 0.0  # at the end the burst swallows the frame
            flame_spikes(img, o.IMP[0] - 70 - 200 * grow, o.IMP[0] + 240 + 200 * grow, o.IMP[1] + 8,
                         hgt + 420 * grow, i, 3400 + t // 3, 0.42, 30)
            r = np.random.default_rng(3500)
            for kk in range(60):
                a2 = r.uniform(-math.pi * 0.95, -math.pi * 0.1)
                sp = r.uniform(4, 14)
                qx = o.IMP[0] + r.uniform(-60, 160) + math.cos(a2) * sp * t
                qy = o.IMP[1] + math.sin(a2) * sp * t + 0.45 * t * t
                if 0 <= qx < 554 and 0 <= qy < 309:
                    sz = 2 + kk % 4
                    img[int(qy):int(qy) + sz, int(qx):int(qx) + sz] = DUST[kk % 3] if kk % 5 else CYAN2
        cx, cy = old.path(i, [(0, 20, 0), (HIT, 40, 26), (X0, 52, 32), (n, 70, 40)])
        amp = 0 if i < HIT else (2 if i < X0 else max(1, 7 - (i - X0) * 0.3))
        sx, sy = old.shake(i, amp, 8)
        out = crop(img, cx + sx, cy + sy, W, H)
        if i >= F:
            rr = np.random.default_rng(890 + i)
            radial_lines(out, rr, 22, o.IMP[0] - cx, o.IMP[1] - cy, 40 + 200 * (1 - ease_in((i - F) / 9)), 520, WHITE)
        return out


S1, S3, SOrb, S4, S5, S6, S9, S10, S11 = v8.S1, v8.S3, v8.SOrb, v8.S4, v8.S5, v8.S6, v8.S9, v8.S10, v8.S11
SHOTS = [("S01_face", 1, 36, S1), ("S02_dragon", 37, 84, S2), ("S03_eye", 85, 108, S3), ("S00_orb", 109, 130, SOrb),
         ("S04_form", 131, 176, S4), ("S05_burst", 177, 202, S5), ("S06_tower", 203, 242, S6),
         ("S07_draw", 243, 290, S7), ("S08_cut", 291, 364, S8), ("S09_blast", 365, 388, S9),
         ("S10_after", 389, 442, S10), ("S11_end", 443, 480, S11)]


def main():
    v5.SHOTS[:] = SHOTS
    v5.FADES.clear()
    v5.FADES.update(v6.FADES)
    v5.main()


if __name__ == "__main__":
    main()
