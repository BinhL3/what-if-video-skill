# Project architecture

```
template/
├── beats.json              ← timeline: beat ids, lengths, captions, stats, countdown, chyron
├── remotion.config.ts      ← jpeg frames, ANGLE OpenGL, concurrency 4
├── src/
│   ├── index.ts / Root.tsx ← composition "WhatIf"; duration = sum of beat frames
│   ├── timeline.ts         ← reads beats.json, computes start frames, beatAt(frame)
│   ├── Video.tsx           ← ThreeCanvas (3D) + HTML overlay + <Audio>
│   ├── scenes/index.tsx    ← registry: beat id → scene component
│   ├── scenes/*.tsx        ← one file per set (office, street, …)
│   ├── three/core.tsx      ← Cam, Env, Lights, Sky, B (box), Cyl, Blob shadow, Screen, Burst
│   ├── three/prims.tsx     ← Person, Car, Chair, Desk, Monitor, Laptop, PhoneRig
│   ├── screens.ts          ← 2D canvas drawings for in-world screens
│   └── lib.ts              ← clamp, ramp, smooth, lerp, lerp3, hash, shake
└── scripts/
    ├── soundtrack.py       ← cue list on the beat clock → public/soundtrack.wav
    ├── sfx.py              ← synthesized sound recipes
    └── stills.mjs          ← frame stills + contact sheet
```

## beats.json

```json
{
  "fps": 30, "width": 1080, "height": 1920, "fadeOutFrames": 24,
  "beats": [
    {
      "id": "payment",
      "frames": 175,
      "stats": [
        {"from": 0,  "items": [["Elapsed", "+6 HOURS"], ["Service", "RETRYING"]]},
        {"from": 62, "items": [["Elapsed", "+6 HOURS"], ["Service", "PAYMENT ERROR"]]}
      ],
      "captions": [[62, 82, "Payment failed."], [82, 172, "An expired certificate blocks payments."]],
      "chyron": [10, 120, "HEADLINE IN CAPS", "scrolling ticker text"],
      "countdown": "Every software engineer disappears in"
    }
  ]
}
```

- All frame numbers inside a beat are **beat-local** (0 = the beat's first frame).
- `stats`: the last entry whose `from` ≤ current frame is shown.
- `captions`: `[start, end, text]`. A caption starting at 0 doesn't fade in (use it to carry a caption across a beat boundary); one ending at or after the beat's length doesn't fade out.
- `countdown`: shows 5→1 evenly across the beat; the next beat starts on "zero". 120 frames = 0.8 s per number.
- `chyron`: `[start, end, headline, ticker]`.

## Scenes

Each scene is `React.FC<{f: number}>` where `f` is the beat-local frame. A scene renders its own environment (Env, Lights, set), actors and exactly one `<Cam>`. Cuts inside a beat are just `if (f < 40) return <ShotA/>; return <ShotB/>;`. Reuse a set component across beats with different props (lighting mode, who's sitting where, what each screen shows).

Animate from `f` only (positions as functions of time, `ramp`/`smooth` for easing). Never use random numbers or real time; use `hash(i)` for per-object variety, so every render is identical.

## Why one timeline file

The worked example grew beat by beat and had to bolt on frame-remapping layers each time a beat was inserted (see `examples/what-if-engineers/src/Video.tsx`: SEGMENTS, `toV3`, `toV4`, and the matching `M()` / `S()` in its soundtrack). It worked, but every insertion touched three places. With `beats.json` as the single source of truth, both the video (`src/timeline.ts`) and the soundtrack (`at("beat", seconds)`) recompute timing on their own, so adding, removing, reordering or lengthening a beat is one edit plus `npm run sound`.

## Overlay

`Video.tsx` draws, above the 3D: a vignette, a soft dark patch behind the stat labels, the stats, the countdown, the caption (y ≈ 1300 px of 1920, clear of the platform UI at the bottom), the chyron (y ≈ 1500), and the end fade to black. All text uses a serif face with a shadow and a thin dark outline (`WebkitTextStroke` + `paintOrder: stroke fill`) so it reads over bright skies.

Keep the bottom ~20% and right edge free of essential content; Reels/TikTok put their own UI there.
