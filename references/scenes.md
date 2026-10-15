# Building scenes

## Contents
1. The PS2 look
2. Primitives
3. Camera framing in 9:16 (read this)
4. Screens on 3D objects
5. Lighting and environment recipes
6. Common bugs and their fixes
7. Scenes to borrow from the example

## 1. The PS2 look

- `ThreeCanvas dpr={0.5}` renders the 3D at half resolution (540×960 for 1080p), and `style={{imageRendering: 'pixelated'}}` upscales it with hard pixels. With `--scale=2` (4K) the 3D stays at the same low resolution while the HTML text renders at full 4K, which is intended.
- `flat` (no tone mapping) plus `meshLambertMaterial flatShading` gives faceted, predictable colors.
- Low segment counts: spheres `[r, 7, 6]`, cylinders 6–10 sides, cones with 4–6 sides.
- Linear fog matched to the background color for atmospheric distance. Long views: fog far 1000–2000. Rooms: 8–40.
- Blob shadows (dark transparent circles) instead of real shadow maps.
- People are simple boxes with a faceted head, hair cap and two-pixel eyes; that reads at phone size.

## 2. Primitives (src/three)

- `B` box `{p, s, c, r?, e?, ei?, o?, basic?}`. `basic` = unlit (signs, glowing windows, light panels). `e`/`ei` = emissive color and intensity (headlights, alarms, fire glow).
- `Cyl`, `Blob`, `Sky` (vertical gradient sphere), `Env` (background + fog), `Lights` (hemisphere + ambient + sun).
- `Cam {p, t, fov}`: set every frame. Move it with `lerp3(a, b, ramp(f, start, end))`.
- `Screen {w, h, res, draw}`: a plane whose canvas is redrawn every frame (see section 4).
- `Burst`: little cubes flying out and fading. White = someone vanishing, orange = impact sparks.
- `Person {shirt, pants, skin, hair, hairStyle: short|long|bun|cap, pose: stand|sit, arms: down|type|hold|phone|card|write|shrug|wheel|wave, armBlend, headYaw, headPitch, walk (phase), hold (prop node), noHead}`. Origin is between the feet; faces +Z. Seated hips sit at chair height 0.48.
- `Car {x, z, yaw, pitch, color, brake, driver, driverVisible, waymo (sensor dome), passengers}`: faces +Z, transparent glass so drivers show.
- `Chair`, `Desk` (keyboard and mug at x+0.55), `Monitor` (screen faces +Z), `Laptop {open 0..1, draw}` (stickers on the lid's outside, screen inside), `PhoneRig` (hand + phone + tapping thumb; screen faces +Z, so rotate it to face the camera).

Coordinates are meters, Y up. A desk at the origin puts its top at y 0.755; the monitor center is around y 1.1, and a chair at z +0.62 with yaw π faces the desk.

## 3. Camera framing in 9:16 (read this)

A portrait frame is narrow: with a vertical fov of 50°, the **horizontal** half-angle is only about 15°. Most framing bugs in the example came from forgetting this.

- To fit an object of width `w` at distance `d`, you need `w ≤ 2·d·tan(fov/2)·9/16`. A 0.62 m monitor needs about 1.5 m of distance at fov 38.
- Tall subjects (bridge towers, buildings) fit easily; wide groups do not. Stack them in depth instead.
- Over-the-shoulder shots: put the camera beside and slightly above the head, not behind it. Long hair and chair backs fill the frame otherwise.
- Check for things between camera and subject: queue members, press photographers, mentors and tower legs all blocked shots in the example. Move the blocker or the camera, or don't render the blocker in that shot (people the viewer can't see don't need to exist).
- Text on in-world screens must be large in frame to be readable; frame screens to fill 50–70% of the frame width for key information (PAYMENT FAILED, 99+, a price).
- Keep top-left (stats) and the caption band clear of the key detail, or move the detail.
- Match-cuts: reuse the exact same camera function (e.g. follow the car with the same offset) for the "+5 years later" shot.

## 4. Screens on 3D objects

`Screen` draws with a 2D canvas each render, so screens animate: counters climbing, spinners, call overlays, prices ticking down. Tips:

- Pick `res` (canvas width) by how big the screen is in frame: 256 for background monitors, 640 for a hero monitor, 300 for phones, 800–900 for large boards.
- Font shorthand order is `style weight size family` ("italic 600 30px …"). A malformed string is silently ignored and text falls back to 10px.
- Use big type for the one thing that matters on each screen; small text is just texture.
- Frozen states read well: a spinner that does *not* rotate plus "Not Responding".
- A flat object on a counter must sit **above** the counter's top surface (counter top y + half thickness + a few mm) or it disappears inside it.

## 5. Lighting and environment recipes

- Hazy blue morning (bridge): sky stops `#3f84d4 → #7fb2e2 → #bcd4ea → #b9c9d6`, fog `#b4cce4` 25–1900, warm sun.
- Office day: bg/fog `#d8dde0`, hemi 1.5, light panels as `basic` boxes. Dusk variant: purple/orange window texture, hemi 0.9, orange sun from the window, red error screens on every monitor.
- Night street with fire: bg `#141a2e`, a flickering orange `pointLight` at the window (intensity × `0.75 + 0.25·sin…`), smoke = translucent icosahedrons rising, growing and fading on a looping age.
- Interior at night (study room): dark walls, a warm `pointLight` desk lamp.
- Newsroom: dark blue, a big screen behind the anchor with an animated chart, red accent strip.

## 6. Common bugs and their fixes

| Symptom | Cause | Fix |
|---|---|---|
| Large white or flat color fills the frame | Camera inside a box, or looking at the top face of a car body/counter | Move the camera or raise the subject |
| Prop invisible | Inside another mesh (pass inside counter, phone below car body) | Raise it above the surface |
| Screen shows nothing readable | Camera behind it (screens face +Z) or too far | Rotate the object or reframe |
| Text tiny on a canvas | Font string in the wrong order | `italic 700 30px Family` |
| Person floats or sinks | Wrong pose origin | Seated people go at the chair position; Person handles hip height |
| Scene flickers between renders | Random numbers or time-based animation | Derive everything from `f` and `hash()` |
| Countdown/caption timing off after edits | Timing duplicated in several places | Keep it in beats.json and use `at()` in the soundtrack |

## 7. Scenes to borrow from the example

`examples/what-if-engineers/src/scenes/`:
- `bridge.tsx`: Golden Gate built procedurally (towers, parabolic cables, instanced suspenders), traffic choreography with braking curves, a crash with sparks, a robotaxi.
- `indoor.tsx`: office (day, dusk, restored), store with card terminal and queue, newsroom, airport, cash-only store, government briefing, study room, interview room, classroom with retirees and AI tutors.
- `fire.tsx`: night street, burning window with smoke, dispatch desk with frozen routing screen and paper map, fire engine with flashing lights.
- `rent.tsx`: Marina-style stucco houses, palms, the distant bridge, a rental listing whose price ticks down.
