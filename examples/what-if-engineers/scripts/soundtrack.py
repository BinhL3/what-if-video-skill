"""Synthesizes the full 60 s soundtrack (all original sounds) to public/soundtrack.wav.

Times are in seconds and follow the frame cues in src/ (frame / 30).
"""
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 2206 / 30
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))


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
SEGMENTS = [
    (0, 150, 0, 150), (150, 210, 150, 270), (210, 265, 270, 320), (265, 320, 320, 370),
    (320, 485, 370, 520), (485, 660, 520, 675), (660, 810, 675, 810), (810, 930, 810, 915),
    (930, 1020, 915, 995), (1020, 1110, 995, 1075), (1110, 1275, 1075, 1225), (1275, 1395, 1225, 1330),
    (1395, 1590, 1435, 1590), (1590, 1650, 1590, 1640), (1650, 1800, 1640, 1800),
]


def M(t):
    f = t * 30
    for a, b, c, d in SEGMENTS:
        if a <= f <= b:
            return (c + (f - a) * (d - c) / (b - a)) / 30
    return t


# the final cut adds a 106-frame countdown before everything and a 150-frame fire beat at v4 frame 810.
def S(t, end=False):
    """v4 clock -> final clock: countdown, fire beat (at v4 810) and rent beat (at v4 1075)."""
    f4 = t * 30
    after_fire = f4 > 810 if end else f4 >= 810
    after_rent = f4 > 1075 if end else f4 >= 1075
    return t + (106 + (150 if after_fire else 0) + (150 if after_rent else 0)) / 30


def add(x, at, gain=1.0, pan=0.0, raw=False, final=False):
    if not final:
        at = S(at if raw else M(at))
    i = int(at * SR)
    if i >= N:
        return
    x = x[: N - i]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    mix[i : i + len(x), 0] += x * gain * l * 1.414
    mix[i : i + len(x), 1] += x * gain * r * 1.414


def norm(x):
    m = np.max(np.abs(x))
    return x / m if m > 0 else x


def bed(start, end, make, gain, fin=0.3, fout=0.3, pan=0.0, raw=False, final=False):
    if not final:
        if not raw:
            start, end = M(start), M(end)
        start, end = S(start), S(end, end=True)
    d = end - start
    x = norm(make(d)) * fade(int(d * SR), fin, fout)
    add(x, start, gain, pan, final=True)


# ---------- sound recipes ----------
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


# ---------- 0–5 s: bridge ----------
bed(0.0, 5.0, wind, 0.10, fin=0.05, fout=0.05)
bed(0.0, 5.0, road, 0.16, fin=0.05, fout=0.05)
bed(0.0, 5.0, ev_hum, 0.05, fin=0.05, fout=0.05)
add(whoosh(0.5)[::-1] * 0.5, 0.2, 0.25)  # vanish shimmer
add(squeal(1.2), 1.1, 0.16, pan=0.2)
add(impact(), 2.2, 0.55, pan=0.15)
add(squeal(0.9), 2.35, 0.1, pan=-0.3)
for at, f1, f2, d, g, pan in [
    (2.6, 415, 523, 1.1, 0.10, 0.3),
    (2.9, 349, 440, 0.6, 0.08, -0.4),
    (3.4, 392, 494, 1.4, 0.09, 0.5),
    (4.3, 415, 523, 0.5, 0.06, 0.3),
]:
    add(horn(f1, f2, d), at, g, pan)

# ---------- 5–9 s (final clock): interviewer vanishes mid-question ----------
bed(5.0, 9.0, room, 0.06, fin=0.02, fout=0.02, raw=True)
add(announcement(1.25) * 1.0, 5.05, 0.05, raw=True)  # interviewer mid-question
add(key_clicks(0.6, 8), 5.2, 0.06, raw=True)
add(whoosh(0.5)[::-1] * 0.5, 5.85, 0.22, raw=True)
add(creak(), 6.9, 0.1, raw=True)
add(beep(300, 0.25) * 0.4, 7.4, 0.03, raw=True)
add(creak() * 0.7, 8.2, 0.07, raw=True)

# ---------- 7–10.67 s: robotaxi keeps going, empty office ----------
bed(7.0, 8.85, lambda d: road(d) + 0.5 * wind(d), 0.13, fin=0.02, fout=0.25)
bed(7.0, 8.85, ev_hum, 0.07, fin=0.02, fout=0.25)
add(horn(392, 494, 0.6), 7.3, 0.03, 0.4)
add(horn(349, 440, 0.5), 7.9, 0.02, -0.3)
bed(8.8, 16.3, room, 0.07, fin=0.1, fout=0.2)

# ---------- 10.67–16.17 s: the on-call page nobody answers ----------
tt, gap = 10.67, 0.36
while tt < 13.17:
    add(ping(1320 + rng.integers(-2, 3) * 60), tt, 0.12, pan=rng.uniform(-0.3, 0.3))
    tt += gap
    gap = max(0.07, gap * 0.85)
pg = pager(5.5)
pg[: int(1.83 * SR)] *= 0.55
pg[int(3.17 * SR) :] *= 0.6
add(pg, 10.67, 0.2, pan=-0.15)
add(np.tile(ring_cycle(), 3)[: int((16.15 - 13.83) * SR)], 13.83, 0.14, pan=0.15)

# ---------- 16.17–22 s: payment fails ----------
bed(16.17, 22.0, murmur, 0.05)
add(beep(1200, 0.07), 16.27, 0.12)
add(click(), 17.0, 0.4)
add(beep(1200, 0.07), 17.03, 0.08)
add(click(), 17.57, 0.4)
add(decline(), 18.23, 0.22)
add(whoosh(0.45), 19.3, 0.12)
bed(18.27, 27.0, drone, 0.065, fin=1.0, fout=0.2)

# ---------- 22–27 s: nothing loads (cloud outage) ----------
bed(22.0, 27.0, murmur, 0.035)
for tap, err in [(22.4, 22.73), (23.83, 24.17), (25.27, 25.6)]:
    add(click(), tap, 0.5)
    add(loading_pulse(err - tap), tap + 0.02, 0.05)
    add(error_tone(), err, 0.16)
add(whoosh(0.6), 26.1, 0.1)

# ---------- 27–31 s: tech stocks crash ----------
add(news_sting(), 27.0, 0.3)
bed(27.1, 31.0, lambda d: murmur(d) * 0.6 + 0.4 * room(d), 0.04)
add(falling(2.4), 27.3, 0.06)
for i in range(8):
    add(beep(660 - i * 40, 0.06), 27.5 + i * 0.27, 0.05, pan=0.3)

# ---------- 31–37 s: handwritten passes, cash only ----------
bed(31.0, 34.0, lambda d: murmur(d) + 0.3 * room(d), 0.06)
add(beep(1100, 0.15), 31.1, 0.08)
add(chime_dingdong(), 31.35, 0.06, pan=-0.4)
add(announcement(1.4), 32.6, 0.02, pan=-0.4)
for at in [31.7, 32.4, 32.9, 33.4]:
    add(rustle(0.3), at, 0.12)
tt = 31.0
while tt < 33.9:
    add(step(), tt, 0.07, pan=0.4)
    tt += 0.52
bed(34.0, 37.0, murmur, 0.05)
add(rustle(0.4), 34.3, 0.12)
add(cha_ching(), 34.67, 0.16)
add(coins(), 35.4, 0.1)

# ---------- 37–42.5 s: AI fix makes it worse ----------
bed(37.0, 42.5, room, 0.05)
add(key_clicks(1.0, 11), 37.0, 0.12)
add(bloop(), 37.93, 0.12)
add(key_clicks(0.5, 11), 38.55, 0.1)
add(whoosh(0.4), 39.05, 0.1)
add(alarm(2.8), 39.73, 0.06)
add(alarm(2.2), 40.33, 0.07, pan=0.3)
add(pager(5.5) * 0.5, 37.0, 0.12, pan=-0.2)
tt = 40.7
while tt < 42.4:
    add(ping(1320 + rng.integers(-2, 3) * 60), tt, 0.1, pan=rng.uniform(-0.5, 0.5))
    tt += rng.uniform(0.06, 0.16)
bed(37.0, 42.5, drone, 0.08, fin=0.5, fout=0.05)

# ---------- 42.5–46.5 s: governments call on student coders ----------
bed(42.5, 46.5, lambda d: murmur(d) + 0.5 * room(d), 0.06, fin=0.05)
add(step() * 0.8, 42.6, 0.1)  # mic thump
for at in [42.7, 43.13, 43.4, 43.97, 44.43, 44.87, 45.27, 45.73, 46.1]:
    add(shutter(), at, 0.14, pan=rng.uniform(-0.6, 0.6))
add(pad([196, 247, 294], 3.0, a=1.5, r=0.6), 43.6, 0.025)

# ---------- 44.33–47.83 s (final clock): retired engineers teach ----------
bed(44.33, 47.83, room, 0.05, fin=0.05, fout=0.1, raw=True)
add(lp(announcement(2.6), 900), 44.5, 0.045, raw=True)  # lecturer
add(key_clicks(3.2, 14), 44.5, 0.07, pan=0.2, raw=True)
for at in [44.9, 45.5, 46.1, 46.7]:
    add(beep(880, 0.05) * 0.5, at, 0.03, raw=True)  # slide advance
add(pad([196, 247, 294, 392], 3.6, a=1.0, r=0.8), 44.33, 0.03, raw=True)

# ---------- 46.5–53 s: students rebuild ----------
bed(46.5, 53.0, lambda d: lp(rng.standard_normal(int(d * SR)), 300), 0.04, fin=0.05)
add(click() * 0.6, 46.67, 0.3)  # laptop lid
add(key_clicks(5.4, 8), 47.5, 0.12, pan=-0.1)
tt = 47.83
while tt < 49.2:
    add(step(), tt, 0.06, pan=0.5)
    tt += 0.45
add(pad([220, 277, 330], 6.5, a=2.0, r=0.6), 46.5, 0.035)
add(beep(1046, 0.1), 50.7, 0.06)

# ---------- 53–60 s: five years later ----------
bed(53.0, 55.05, lambda d: road(d) * 0.8 + 0.4 * wind(d), 0.12, fin=0.02, fout=0.1)
bed(55.0, 60.0, lambda d: room(d) + 0.4 * murmur(d), 0.06, fin=0.05, fout=0.8)
add(key_clicks(4.8, 12), 55.1, 0.08, pan=0.2)
add(send_swoosh(), 58.3, 0.18)
add(success_chime(), 58.77, 0.11)
add(connect_tone(), 59.23, 0.12)
add(pad([262, 330, 392, 523], 7.0, a=2.5, r=1.8), 53.0, 0.04)
add(pad([196, 262, 330, 392], 2.4, a=0.6, r=1.6), 57.6, 0.035)

# ---------- final clock: countdown 0–4 s ----------
bed(0.0, 3.6, wind, 0.10, fin=0.1, fout=0.0, final=True)
bed(0.0, 3.6, road, 0.16, fin=0.1, fout=0.0, final=True)
bed(0.0, 3.6, ev_hum, 0.05, fin=0.1, fout=0.0, final=True)
for k in range(5):
    t = t_arr(0.5)
    boom = np.sin(2 * np.pi * (55 + 30 * np.exp(-t * 18)) * t) * np.exp(-t * 7)
    add(boom, k * 0.8, 0.3 + k * 0.04, final=True)
    add(click(), k * 0.8, 0.2, final=True)
    add(beep(1760, 0.05), k * 0.8, 0.06, final=True)
t = t_arr(2.0)
riser = bp(rng.standard_normal(len(t)), 400, 3000) * (t / 2.0) ** 2 + 0.4 * np.sin(2 * np.pi * (200 + 300 * t / 2.0) * t) * (t / 2.0) ** 2
add(riser, 2.0, 0.12, final=True)

# ---------- final clock: apartment fire 30.53–35.53 s ----------
F0 = 916 / 30


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


bed(F0, F0 + 1.27, crackle, 0.10, fin=0.02, fout=0.05, final=True)
add(smoke_alarm(1.27), F0, 0.07, final=True)
bed(F0 + 1.27, F0 + 3.73, lambda d: lp(rng.standard_normal(int(d * SR)), 300), 0.04, fin=0.02, fout=0.02, final=True)
add(phone_ring(1.2), F0 + 1.27, 0.09, final=True)
add(beep(1400, 0.04), F0 + 2.5, 0.08, final=True)  # radio squelch
add(radio(1.15), F0 + 2.55, 0.11, final=True)
add(beep(1100, 0.04), F0 + 3.68, 0.07, final=True)
bed(F0 + 3.73, F0 + 5.0, crackle, 0.08, fin=0.02, fout=0.02, final=True)
add(siren(1.27), F0 + 3.73, 0.16, final=True)

# ---------- final clock: Marina rent drops 44.37–49.37 s ----------
R0 = 1331 / 30


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


bed(R0, R0 + 5.0, lambda d: murmur(d) * 0.4 + 0.3 * road(d) + 0.4 * birds(d), 0.06, fin=0.05, fout=0.05, final=True)
for k in [6, 13, 20, 27, 34, 41]:
    add(knock(), R0 + k / 30, 0.16, pan=rng.uniform(-0.5, 0.5), final=True)
    add(knock(), R0 + k / 30 + 0.09, 0.1, final=True)
add(ping(1320), R0 + 1.85, 0.1, final=True)
add(falling(1.7) * 0.8, R0 + 2.17, 0.07, final=True)
for i in range(10):
    add(click() * 0.5, R0 + 2.17 + i * 0.16, 0.12, final=True)  # price ticking down
add(np.concatenate([beep(1046, 0.08), beep(784, 0.08), beep(523, 0.16)]), R0 + 3.83, 0.08, final=True)

# ---------- master ----------
mix *= np.concatenate([np.ones(N - int(0.8 * SR)), np.linspace(1, 0, int(0.8 * SR))])[:, None]  # fade out with the picture
out = mix
peak = np.max(np.abs(out))
out = np.tanh(out / peak * 1.4) / np.tanh(1.4) * 0.89
wavfile.write("public/soundtrack.wav", SR, (out * 32767).astype(np.int16))
print("peak before limiting", round(float(peak), 3))
