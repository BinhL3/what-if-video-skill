"""Builds public/soundtrack.wav from synthesized effects (scripts/sfx.py).

Cues are placed on the beat clock: at("alerts", 1.2) means 1.2 s into the "alerts" beat.
Because timing comes from beats.json, resizing or reordering beats keeps sound in sync.

Run from the project root:  python3 scripts/soundtrack.py   (or: npm run sound)
Needs numpy, scipy and ffmpeg (for loudness normalization).
"""
import json
import os
import subprocess
import sys

import numpy as np
from scipy.io import wavfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfx import *  # noqa: E402,F401,F403  (SR, rng, filters and every sound recipe)

CFG = json.load(open("beats.json"))
FPS = CFG["fps"]
START = {}
_cursor = 0
for b in CFG["beats"]:
    START[b["id"]] = _cursor
    _cursor += b["frames"]
TOTAL = _cursor
DUR = TOTAL / FPS
N = int(SR * DUR)
mix = np.zeros((N, 2))


def at(beat_id, sec=0.0):
    """Absolute time in seconds for a moment inside a beat."""
    return START[beat_id] / FPS + sec


def beat_len(beat_id):
    return next(b["frames"] for b in CFG["beats"] if b["id"] == beat_id) / FPS


def add(x, t, gain=1.0, pan=0.0):
    """Mix a mono sound in at absolute time t (seconds). pan: -1 left … +1 right."""
    i = int(t * SR)
    if i >= N:
        return
    x = x[: N - i]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    mix[i : i + len(x), 0] += x * gain * l * 1.414
    mix[i : i + len(x), 1] += x * gain * r * 1.414


def bed(t0, t1, make, gain, fin=0.3, fout=0.3, pan=0.0):
    """A continuous ambience from t0 to t1, normalized then scaled by gain."""
    d = t1 - t0
    x = norm(make(d)) * fade(int(d * SR), fin, fout)
    add(x, t0, gain, pan)


# ---------------- cues (edit for your story) ----------------
# countdown: office ambience, typing, a tick + low boom on every number, a rising riser
cd = beat_len("countdown")
bed(0, at("vanish"), room, 0.06, fin=0.1, fout=0.0)
add(key_clicks(cd - 0.2, 9), 0.1, 0.1)
for k in range(5):
    t = t_arr(0.5)
    boom = np.sin(2 * np.pi * (55 + 30 * np.exp(-t * 18)) * t) * np.exp(-t * 7)
    add(boom, at("countdown", k * cd / 5), 0.3 + k * 0.04)
    add(beep(1760, 0.05), at("countdown", k * cd / 5), 0.06)
t = t_arr(cd / 2)
add(bp(rng.standard_normal(len(t)), 400, 3000) * (t / t[-1]) ** 2, at("countdown", cd / 2), 0.12)

# vanish: reversed whoosh shimmer, then an empty room
add(whoosh(0.5)[::-1] * 0.5, at("vanish") - 0.35, 0.25)
bed(at("vanish"), at("alerts"), room, 0.05, fin=0.02, fout=0.02)
add(creak(), at("vanish", 0.9), 0.08)

# alerts: notification pings speeding up, then a soft drone underneath
bed(at("alerts"), DUR, room, 0.06, fin=0.05, fout=0.8)
tt, gap = at("alerts", 0.1), 0.4
while tt < at("alerts", 2.4):
    add(ping(1320 + rng.integers(-2, 3) * 60), tt, 0.12, pan=rng.uniform(-0.3, 0.3))
    tt += gap
    gap = max(0.07, gap * 0.85)
bed(at("alerts", 1.5), DUR, drone, 0.05, fin=1.0, fout=0.8)

# ---------------- master ----------------
fade_n = int(CFG.get("fadeOutFrames", 24) / FPS * SR)
mix *= np.concatenate([np.ones(N - fade_n), np.linspace(1, 0, fade_n)])[:, None]
peak = np.max(np.abs(mix)) or 1.0
out = np.tanh(mix / peak * 1.4) / np.tanh(1.4) * 0.89
os.makedirs("public", exist_ok=True)
wavfile.write("public/soundtrack_raw.wav", SR, (out * 32767).astype(np.int16))
# about -14 LUFS (what Reels/TikTok/Shorts target) with a peak limiter
subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-y", "-i", "public/soundtrack_raw.wav",
     "-af", "loudnorm=I=-15:TP=-1.5:LRA=14,volume=4dB,alimiter=limit=0.84:level=false",
     "-ar", "48000", "public/soundtrack.wav"],
    check=True,
)
os.remove("public/soundtrack_raw.wav")
print(f"public/soundtrack.wav  {DUR:.2f}s")
