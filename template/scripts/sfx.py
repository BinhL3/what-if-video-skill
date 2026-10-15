"""Library of original, synthesized sound effects (no samples, no licensing).

Every function returns a mono numpy array at SR. Combine them in soundtrack.py.
Names describe the sound; durations are in seconds.
"""
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(7)


def t_arr(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return signal.lfilter(b, a, x)


def lp(x, hi, order=2):
    b, a = signal.butter(order, hi / (SR / 2), btype="low")
    return signal.lfilter(b, a, x)


def hp(x, lo, order=2):
    b, a = signal.butter(order, lo / (SR / 2), btype="high")
    return signal.lfilter(b, a, x)


def env(d, a=0.005, r=0.1, curve=4.0):
    n = int(d * SR)
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    nr = min(n - na, int(r * SR))
    if nr > 0:
        e[n - nr :] *= np.linspace(1, 0, nr) ** (curve / 4)
    return e


def fade(n, fin, fout):
    e = np.ones(n)
    a, b = int(fin * SR), int(fout * SR)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if b:
        e[n - b :] *= np.linspace(1, 0, b)
    return e


# [v3 start, v3 end, v4 start, v4 end] in frames (30 fps); mirrors SEGMENTS in src/Video.tsx


def norm(x):
    m = np.max(np.abs(x))
    return x / m if m > 0 else x


def wind(d):
    x = bp(rng.standard_normal(int(d * SR)), 150, 900)
    t = t_arr(d)
    return x * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t) * np.sin(2 * np.pi * 0.07 * t + 1))


def road(d):
    return lp(np.cumsum(rng.standard_normal(int(d * SR))) * 0.02, 260) + 0.3 * bp(rng.standard_normal(int(d * SR)), 400, 1400)


def ev_hum(d):
    t = t_arr(d)
    return 0.6 * np.sin(2 * np.pi * 95 * t) + 0.25 * np.sin(2 * np.pi * 760 * t + 0.3 * np.sin(2 * np.pi * 3 * t)) + 0.3 * bp(rng.standard_normal(len(t)), 200, 600)


def room(d):
    t = t_arr(d)
    return lp(rng.standard_normal(len(t)), 500) + 0.15 * np.sin(2 * np.pi * 120 * t)


def murmur(d):
    x = bp(rng.standard_normal(int(d * SR)), 250, 1200)
    t = t_arr(d)
    return x * (0.7 + 0.3 * np.abs(np.sin(2 * np.pi * 1.7 * t) * np.sin(2 * np.pi * 0.6 * t)))


def squeal(d=1.0):
    t = t_arr(d)
    f = 1900 + 220 * np.sin(2 * np.pi * 7 * t) + 90 * rng.standard_normal(len(t)).cumsum() / SR * 40
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.5 * bp(rng.standard_normal(len(t)), 1500, 4000)
    return x * env(d, 0.05, 0.4)


def impact():
    d = 1.2
    t = t_arr(d)
    thump = np.sin(2 * np.pi * (60 + 40 * np.exp(-t * 20)) * t) * np.exp(-t * 9)
    crunch = bp(rng.standard_normal(len(t)), 300, 5000) * np.exp(-t * 14)
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(523, 5), (811, 6), (1290, 8), (1977, 9)])
    glass = hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 6) * (rng.random(len(t)) > 0.97)
    return 1.2 * thump + crunch + 0.15 * ring + 0.6 * glass


def horn(f1, f2, d):
    t = t_arr(d)
    x = signal.square(2 * np.pi * f1 * t) + signal.square(2 * np.pi * f2 * t)
    return lp(x, 2200) * env(d, 0.02, 0.08)


def ping(base=1320):
    d = 0.22
    t = t_arr(d)
    a = np.sin(2 * np.pi * base * t) * np.exp(-t * 22)
    b = np.sin(2 * np.pi * base * 1.5 * t) * np.exp(-(t - 0.06).clip(0) * 22) * (t > 0.06)
    return a + b


def ring_cycle():
    # original two-tone ring motif: rising triad then pause
    out = []
    for f in [659, 784, 988, 784]:
        t = t_arr(0.14)
        out.append((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env(0.14, 0.008, 0.08))
    out.append(np.zeros(int(0.65 * SR)))
    return np.concatenate(out)


def click():
    t = t_arr(0.03)
    return hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 300)


def beep(f=1000, d=0.12):
    t = t_arr(d)
    return np.sin(2 * np.pi * f * t) * env(d, 0.004, 0.03)


def decline():
    a = beep(620, 0.16)
    b = beep(440, 0.32)
    t = t_arr(0.32)
    b = b + 0.4 * signal.square(2 * np.pi * 220 * t) * env(0.32, 0.004, 0.1)
    return np.concatenate([a, np.zeros(int(0.03 * SR)), b])


def error_tone():
    return np.concatenate([beep(392, 0.1), beep(311, 0.18)])


def loading_pulse(d):
    t = t_arr(d)
    return np.sin(2 * np.pi * 180 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * t)) ** 4


def whoosh(d=0.5):
    t = t_arr(d)
    x = rng.standard_normal(len(t))
    out = np.zeros_like(x)
    for i, (lo, hi) in enumerate([(300, 900), (700, 2000), (1500, 4000)]):
        out += bp(x, lo, hi) * np.sin(np.pi * np.clip(t / d * 1.0 - i * 0.1, 0, 1)) ** 2
    return out


def rustle(d=0.35):
    t = t_arr(d)
    x = bp(rng.standard_normal(len(t)), 1500, 7000)
    return x * (rng.random(len(t)) ** 3 * 0.5 + 0.5) * np.sin(np.pi * t / d)


def step():
    t = t_arr(0.12)
    return lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 40) + 0.5 * np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30)


def chime_dingdong():
    out = []
    for f in [784, 622]:
        t = t_arr(0.8)
        out.append(sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t * (3 + m)) / m for m in [1, 2, 3]))
    return np.concatenate(out)


def announcement(d):
    t = t_arr(d)
    syll = (np.sin(2 * np.pi * 4.5 * t) > 0.1).astype(float)
    voice = bp(signal.sawtooth(2 * np.pi * (170 + 25 * np.sin(2 * np.pi * 0.8 * t)) * t), 300, 1400)
    return lp(voice * syll, 1200)


def ecg_beep():
    return beep(960, 0.09)


def key_clicks(d, rate=9.0):
    out = np.zeros(int(d * SR))
    tt = 0.0
    while tt < d - 0.05:
        k = click() * (0.5 + rng.random() * 0.5)
        i = int(tt * SR)
        out[i : i + len(k)] += k[: len(out) - i]
        tt += rng.exponential(1 / rate) + 0.03
    return out


def pad(freqs, d, a=1.5, r=1.5):
    t = t_arr(d)
    x = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.3 * t) * 0.5) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t) for f in freqs)
    return lp(x, 2500) * fade(len(t), a, r)


def drone(d):
    t = t_arr(d)
    x = np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t) + 0.3 * np.sin(2 * np.pi * 110.5 * t)
    pulse = 0.6 + 0.4 * np.sin(2 * np.pi * 1.1 * t) ** 2
    return lp(x * pulse, 500) * np.linspace(0.5, 1.0, len(t))


def video_music(d):
    notes = [523, 659, 784, 659, 587, 698, 880, 698]
    out = []
    for i in range(int(d / 0.16) + 1):
        out.append(beep(notes[i % len(notes)], 0.16) * 0.7)
    return lp(np.concatenate(out)[: int(d * SR)], 1800)


def success_chime():
    return np.concatenate([beep(f, 0.11) for f in [784, 988, 1319]]) * 0.9


def connect_tone():
    return np.concatenate([beep(523, 0.09), beep(784, 0.18)])


def send_swoosh():
    return whoosh(0.3) * 0.6 + np.concatenate([np.zeros(int(0.22 * SR)), beep(1568, 0.08)])[: int(0.3 * SR)] * 0.4


def pager(d):
    """Original on-call pager alarm: phone vibration rattle with urgent two-tone beeps,
    pulsing 0.27 s on / 0.27 s off (matches the on-screen buzz)."""
    t = t_arr(d)
    gate = ((t % 0.533) < 0.267).astype(float)
    gate = lp(gate, 60)
    rattle = signal.square(2 * np.pi * 155 * t) * (0.6 + 0.4 * signal.square(2 * np.pi * 31 * t))
    rattle = lp(rattle, 900)
    hi = np.where((t % 0.133) < 0.066, np.sin(2 * np.pi * 1870 * t), np.sin(2 * np.pi * 1480 * t))
    return gate * (0.8 * rattle + 0.35 * hi)


def alarm(d):
    t = t_arr(d)
    f = 700 + 300 * (t * 2.5 % 1)
    return signal.square(2 * np.pi * np.cumsum(f) / SR) * 0.5 * ((t * 2.5 % 1) < 0.8)


def news_sting():
    t = t_arr(1.6)
    chord = sum(signal.sawtooth(2 * np.pi * f * t) for f in [110, 165, 220, 277, 330])
    hit = np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 12)) * t) * np.exp(-t * 5)
    return lp(chord, 1800) * np.exp(-t * 2.2) * 0.5 + hit


def falling(d):
    t = t_arr(d)
    f = 880 * np.exp(-t * 0.9)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * (np.sin(2 * np.pi * 6 * t) > 0))


def shutter():
    a = click()
    t = t_arr(0.06)
    b = bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 80)
    return np.concatenate([a, np.zeros(int(0.04 * SR)), b])


def cha_ching():
    t = t_arr(0.9)
    bell = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (2637, 5), (3136, 6)])
    slide = bp(rng.standard_normal(int(0.25 * SR)), 300, 2000) * np.linspace(1, 0, int(0.25 * SR))
    out = np.zeros(int(1.2 * SR))
    out[: len(slide)] += slide
    out[int(0.25 * SR) : int(0.25 * SR) + len(bell)] += bell * 0.6
    return out


def coins():
    out = np.zeros(int(0.6 * SR))
    for _ in range(9):
        t = t_arr(0.12)
        f = rng.uniform(3000, 6000)
        c = np.sin(2 * np.pi * f * t) * np.exp(-t * 40)
        i = int(rng.uniform(0, 0.45) * SR)
        out[i : i + len(c)] += c
    return out


def bloop():
    t = t_arr(0.15)
    return np.sin(2 * np.pi * (500 + 900 * t / 0.15) * t) * env(0.15, 0.005, 0.08)


def creak():
    t = t_arr(0.35)
    f = 180 + 60 * np.sin(2 * np.pi * 9 * t)
    return bp(signal.sawtooth(2 * np.pi * np.cumsum(f) / SR), 200, 1500) * np.sin(np.pi * t / 0.35) ** 2


def crackle(d):
    t = t_arr(d)
    pops = (rng.random(len(t)) > 0.9985) * rng.standard_normal(len(t))
    return lp(rng.standard_normal(len(t)), 700) * 0.6 + hp(np.convolve(pops, np.exp(-np.arange(200) / 30), "same"), 800)


def smoke_alarm(d):
    # temporal-3 pattern: three 0.5 s beeps, then a pause
    t = t_arr(d)
    ph = t % 3.5
    gate = ((ph < 0.5) | ((ph > 1.0) & (ph < 1.5)) | ((ph > 2.0) & (ph < 2.5))).astype(float)
    return np.sin(2 * np.pi * 3150 * t) * lp(gate, 80)


def phone_ring(d):
    t = t_arr(d)
    ph = t % 2.0
    gate = (((ph < 0.4) | ((ph > 0.6) & (ph < 1.0)))).astype(float)
    tone = np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)
    return tone * (0.6 + 0.4 * np.sin(2 * np.pi * 20 * t)) * lp(gate, 60)


def radio(d):
    t = t_arr(d)
    st = bp(rng.standard_normal(len(t)), 1200, 4000) * 0.5
    voice = bp(signal.sawtooth(2 * np.pi * (140 + 30 * np.sin(2 * np.pi * 0.9 * t)) * t), 500, 2500) * ((np.sin(2 * np.pi * 5 * t) > -0.2) & (t > 0.15) & (t < d - 0.2))
    return st * (0.4 + 0.6 * (t < 0.15)) + voice


def siren(d):
    t = t_arr(d)
    f = 950 + 400 * np.sin(2 * np.pi * 0.9 * t)
    x = signal.square(2 * np.pi * np.cumsum(f) / SR) * 0.4 + np.sin(2 * np.pi * np.cumsum(f) / SR)
    return lp(x, 3000) * (0.15 + 0.85 * (t / d) ** 1.5)


def knock():
    t = t_arr(0.18)
    return lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 35) + 0.8 * np.sin(2 * np.pi * 140 * t) * np.exp(-t * 30)


def birds(d):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 3)):
        t = t_arr(0.12)
        f0 = rng.uniform(2600, 4200)
        chirp = np.sin(2 * np.pi * np.cumsum(f0 + 1500 * np.sin(np.pi * t / 0.12)) / SR) * np.sin(np.pi * t / 0.12)
        i = int(rng.uniform(0, d - 0.15) * SR)
        out[i : i + len(chirp)] += chirp
    return out
