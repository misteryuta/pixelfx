"""Our own sound track for the Madara cutscene, synthesised from scratch (no samples from anywhere):
a wind bed under the whole 20 s and one designed hit per cue in cues.txt (frame at 24 fps + kind).
Writes sfx.wav (48 kHz stereo)."""
import numpy as np, wave, os, sys

SR = 48000
DUR = 20.0
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)


def t_(sec):
    return np.arange(int(SR * sec)) / SR


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be a scalar or an array (sweeps)."""
    a = np.exp(-2 * np.pi * np.broadcast_to(cutoff, x.shape) / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def lp_fast(x, cutoff, passes=2):
    """Cheap static low-pass: repeated moving average (for long noise beds)."""
    k = max(1, int(SR / cutoff / 2))
    ker = np.ones(k) / k
    for _ in range(passes):
        x = np.convolve(x, ker, mode="same")
    return x


def env(n, a, d, shape=3.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * shape / max(d, 1e-4))
    return e


def noise(sec):
    return rng.standard_normal(int(SR * sec))


def rumble(sec=1.6):
    x = lp_fast(noise(sec), 90, 3) * 6
    x += 0.5 * np.sin(2 * np.pi * 42 * t_(sec)) * (1 + 0.3 * np.sin(2 * np.pi * 3 * t_(sec)))
    return x * env(len(x), 0.12, sec * 0.7, 2.5)


def explosion(sec=2.2):
    n = noise(sec)
    cut = 6000 * np.exp(-t_(sec) * 3.0) + 120
    x = lowpass(n, cut) * 1.6
    x += 1.2 * np.sin(2 * np.pi * (60 - 25 * t_(sec)) * t_(sec)) * np.exp(-t_(sec) * 4)
    x += lp_fast(noise(sec), 70, 3) * 8 * np.exp(-t_(sec) * 1.2)
    return x * env(len(x), 0.005, sec * 0.6, 2.2)


def heavy(sec=0.7):
    t = t_(sec)
    x = np.sin(2 * np.pi * (85 * np.exp(-t * 6) + 38) * t) * np.exp(-t * 7) * 1.4
    x += lowpass(noise(sec), 1800) * np.exp(-t * 30) * 0.8
    return x


def whoosh(sec=0.6):
    t = t_(sec)
    cut = 400 + 3800 * np.sin(np.pi * t / sec) ** 2
    x = lowpass(noise(sec), cut) - lowpass(noise(sec), cut * 0.35)
    return x * np.sin(np.pi * t / sec) ** 1.5 * 2.2


def thunder(sec=2.4):
    t = t_(sec)
    crack = lowpass(noise(sec), 7000) * np.exp(-t * 18) * 1.4
    roll = lp_fast(noise(sec), 140, 3) * 7 * (0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * t) ** 2)
    return crack + roll * env(len(t), 0.05, sec * 0.8, 1.8)


def cast(sec=1.1):
    t = t_(sec)
    f = 260 + 620 * (t / sec) ** 1.4
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3.01 * ph)) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * t))
    x += lowpass(noise(sec), 5000) * 0.15
    return x * env(len(t), sec * 0.7, sec * 0.3, 4) * 0.7


def clash(sec=1.2):
    t = t_(sec)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in
            ((1180, 0.6, 3.5), (1873, 0.45, 4.5), (2641, 0.35, 6), (3420, 0.2, 8), (612, 0.3, 3)))
    x += lowpass(noise(sec), 9000) * np.exp(-t * 60) * 1.2
    return x


def parry(sec=0.9):
    return clash(sec) * 0.8


def land(sec=0.5):
    return heavy(sec) * 0.8 + lowpass(noise(sec), 600) * np.exp(-t_(sec) * 12) * 0.6


KINDS = dict(rumble=rumble, explosion=explosion, heavy=heavy, whoosh=whoosh, thunder=thunder, cast=cast, clash=clash,
             parry=parry, land=land)
GAIN = dict(rumble=0.55, explosion=0.8, heavy=0.6, whoosh=0.45, thunder=0.6, cast=0.4, clash=0.5, parry=0.45, land=0.5)


def main():
    n = int(SR * DUR)
    L = np.zeros(n)
    Rr = np.zeros(n)
    # a wind bed: slow-moving filtered noise, slightly different per side
    for ch, out in ((0, L), (1, Rr)):
        w = lp_fast(rng.standard_normal(n), 400, 2) * 3
        sway = 0.55 + 0.45 * np.sin(2 * np.pi * (0.13 + 0.02 * ch) * np.arange(n) / SR + ch)
        out += w * sway * 0.08
    cues = [l.split() for l in open(os.path.join(HERE, "cues.txt")) if l.strip()]
    for f, kind in cues:
        start = int((int(f) - 1) / 24 * SR)
        x = KINDS[kind]() * GAIN[kind]
        x = x[: max(0, n - start)]
        pan = rng.uniform(-0.25, 0.25)
        L[start:start + len(x)] += x * (1 - pan)
        Rr[start:start + len(x)] += x * (1 + pan)
    st = np.stack([L, Rr], 1)
    st = np.tanh(st * 1.2)
    st /= max(1e-6, np.abs(st).max()) / 0.89
    pcm = (st * 32767).astype(np.int16)
    with wave.open(os.path.join(HERE, "sfx.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("sfx.wav", len(cues), "cues")


if __name__ == "__main__":
    main()
