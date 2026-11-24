"""Sasuke ultimate sound track: the Madara synth kit plus a Chidori crackle (gated bursts of bright noise and a
high chirp, like a thousand birds); no samples from anywhere."""
import sys, os, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "madara_px"))
import sfx as S


def chidori(sec=1.4):
    t = S.t_(sec)
    n = S.noise(sec)
    hi = n - S.lp_fast(n, 1800, 2)
    gate = (np.random.default_rng(int(sec * 1000)).random(len(t) // 240 + 1) > 0.45).repeat(240)[:len(t)]
    chirp = np.sin(2 * np.pi * (2400 + 900 * np.sin(2 * np.pi * 23 * t)) * t) * 0.35
    x = (hi * 1.6 * gate + chirp * (0.6 + 0.4 * gate)) * S.env(len(t), 0.03, sec * 0.8, 2.0)
    return x


S.KINDS["chidori"] = chidori
S.GAIN["chidori"] = 0.42
S.HERE = HERE
S.main()
