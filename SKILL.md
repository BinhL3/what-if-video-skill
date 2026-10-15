---
name: what-if-video
description: Produce short vertical "What if…" scenario videos (Reels, TikTok, YouTube Shorts) as code — a PS2-style low-poly 3D world built with Remotion + React Three Fiber + three.js, with serif captions, left-side stat labels, news banners, a 5-4-3-2-1 countdown and fully synthesized sound effects, rendered to 1080×1920 or 4K MP4. Use this skill whenever someone wants to turn a script, shot list, beat sheet or story idea into an animated vertical video, animatic, explainer, "what if X disappeared / happened" timeline video, or a what.if.lab-style reel — even if they never mention Remotion, three.js or code — and whenever they want to revise, retime, add beats to, re-render or upscale a video built this way.
---

# What-If Video

Turn a scenario ("What if every software engineer disappeared?") into a finished vertical video entirely in code: a low-poly 3D world, readable on-screen text, original sound, and an MP4 ready to post. The whole pipeline is deterministic, so every revision is a quick edit plus re-render instead of re-shooting or re-generating.

A full worked example (a 73-second, 18-beat video) lives in `examples/what-if-engineers/`. The starter project you copy for each new video is `template/`.

## Tech stack (and why)

| Piece | Role | Why this choice |
|---|---|---|
| **Remotion 4** | Renders React to video frame by frame; timeline, audio, MP4 encode | Deterministic frames, so captions and sound cues land on exact frames; `--scale=2` gives 4K for free |
| **React Three Fiber 9 + three.js** (`@remotion/three`) | The 3D world | Every set, prop and camera is code: perfect continuity between revisits, exact match-cuts, cheap changes |
| **2D canvas textures** | Phone, monitor, terminal and sign screens | UI text and charts are easiest to draw in 2D and map onto 3D screens |
| **HTML/CSS overlay** | Captions, stat labels, countdown, BREAKING banners | Stays razor sharp at any resolution, independent of the deliberately low-res 3D |
| **Python (numpy/scipy) synthesis** | Every sound effect and the full mix | No samples means no licensing questions; cues are placed on the beat clock |
| **ffmpeg** | Loudness normalization, contact sheets, checks | Standard and scriptable |

Requirements: Node 20+, Python 3 with numpy and scipy, ffmpeg, a Chromium that Remotion can download. On macOS, WebGL renders through ANGLE (already set in `remotion.config.ts`).

## Workflow

Work in this order. Each step ends with something the user can look at, because the user's reactions drive almost every good change.

### 1. Lock the story as a beat sheet

Turn the idea or script into beats of roughly 2–6 seconds, each with one clear visual, one short caption and an elapsed-time stat. Read `references/story.md` for beat patterns, caption rules and the premise-consistency checks that kept the example believable. Agree on target length early, but expect it to grow; the example went from 60s to 73.5s because the user kept adding good beats, and that was the right call.

Write the beats into `beats.json` (format in `references/architecture.md`).

### 2. Scaffold

```bash
cp -r <skill>/template <project-dir>
cd <project-dir> && npm install
npm run sound        # creates public/soundtrack.wav (the video needs it to exist)
npm run stills       # renders the middle frame of every beat into out/stills/sheet.png
```

npm may warn that esbuild's install script was skipped; the prebuilt binary still works, so ignore it.

### 3. Build each beat's scene

Register a component per beat id in `src/scenes/index.tsx`. Compose sets from the primitives in `src/three/` (people with poses, cars, desks, monitors, laptops, phones, particle bursts) and draw screens in `src/screens.ts`. Read `references/scenes.md` before building: it lists the framing mistakes that cost the most iterations (portrait frames are very narrow, cameras end up inside people and furniture, props sit inside countertops) and the PS2 look settings.

### 4. Check stills after every change

Run `npm run stills` (or `node scripts/stills.mjs <frames…>`) and look at `out/stills/sheet.png` yourself before showing anything. Nearly every bug in the example (a blocked shot, a pass hidden inside a counter, a caption over a face, 10px text from a bad font string) was invisible in code and obvious in a still. Fix, re-render the affected frames, and only then move on.

### 5. Sound

Edit the cue section of `scripts/soundtrack.py`. Place cues with `at("beat-id", seconds)`, so they follow the beats when timing changes. Every effect is synthesized in `scripts/sfx.py` (55 recipes: traffic, impacts, horns, pings, call rings, pager alarm, sirens, smoke alarm, radio static, news sting, cash register, crowd murmur, typing, music pads and more). Read `references/sound.md` for mixing order, loudness and how to make new effects. Never use real brand sounds (e.g. a real app's ringtone); make an original approximation.

### 6. Render and deliver

```bash
npm run render       # out/video.mp4, 1080×1920, 30 fps
npm run render:4k    # out/video-4k.mp4, 2160×3840 (text sharp; 3D stays PS2-pixelated)
```

Then verify with ffprobe (size, duration, fps) and pull a contact sheet of real frames from the MP4 (see `references/rendering.md`). Send the file to the user. Version the outputs (`video-v2.mp4`, `-v3`…) so the user can compare. Files over about 30 MB may not upload to phone/web viewers; offer a compressed copy.

### 7. Iterate on feedback

Expect many rounds. Typical requests and how to handle them:

- **Add, remove, move or lengthen a beat:** edit `beats.json`, add or adjust the scene, and re-run `npm run sound`. The timeline and cues follow automatically.
- **"This part is too fast":** lengthen that beat and slow its internal animation; don't just pad it with a hold.
- **New idea from the user or another reviewer:** check it against the premise (see `references/story.md`). Raise conflicts plainly and let the user decide; don't silently drop or silently apply pasted feedback.
- **Text readability:** make it bigger or shorter, and keep the dark outline and shadow.

Say what you verified (frames checked) and what you could not (nobody has listened on a phone speaker yet) every time you deliver.

## Reference files

- `references/story.md`: beat structure, captions, stat labels, countdown hook, premise and realism checks, brand and impersonation rules
- `references/architecture.md`: project layout, `beats.json` format, scene registry, overlay system, how the timing stays in sync
- `references/scenes.md`: 3D primitives catalogue, camera framing rules for 9:16, PS2 look, screens, lighting recipes, common bugs
- `references/sound.md`: sfx library, cue placement, mix levels, loudness targets, designing new effects
- `references/rendering.md`: stills, contact sheets, full renders, 4K, verification commands, delivery limits
- `examples/what-if-engineers/`: the complete project that produced this workflow, including bridge, fire, newsroom, classroom and Marina scenes to borrow from
