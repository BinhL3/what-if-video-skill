# Rendering, checking and delivery

## Fast checks while building

```bash
npm run sound                          # public/soundtrack.wav must exist before any render
node scripts/stills.mjs --beats        # middle frame of every beat → out/stills/sheet.png
node scripts/stills.mjs 30 95 210      # specific frames (global frame numbers)
npm run studio                         # interactive Remotion Studio preview in a browser
```

`stills.mjs` bundles once and renders at half scale, so a dozen frames take about a minute. Pick frames at the moments that matter (just after a cut, when an error appears, the last frame of a camera move) rather than only beat midpoints.

## Full renders

```bash
npm run render       # 1080×1920, 30 fps, H.264 CRF 18, AAC 192k → out/video.mp4
npm run render:4k    # 2160×3840 via --scale=2, AAC 256k → out/video-4k.mp4
```

A 70-second video renders in roughly 3–5 minutes at 1080p and about 2–3× that in 4K on an 8-core Apple Silicon Mac. Run long renders in the background.

If WebGL fails in headless Chrome, check `remotion.config.ts` has `Config.setChromiumOpenGlRenderer('angle')` (macOS). On Linux servers try `'swangle'` or `'egl'`.

## Verify the actual file

```bash
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration,size -of compact out/video.mp4
ffmpeg -loglevel error -y -i out/video.mp4 \
  -vf "select='eq(n\,30)+eq(n\,400)+eq(n\,900)+eq(n\,1500)',scale=270:-1,tile=4x1" \
  -vsync 0 -frames:v 1 out/check.png
```

Look at `out/check.png`: these are real frames from the encoded video, so they catch timing errors that stills can't (a caption on the wrong beat, a fade starting early).

## Delivery

- Version every render (`video-v1.mp4`, `v2`, …) and keep old ones so the user can compare.
- Report length, resolution and what you checked. If a send fails because of size (about 30 MB for phone/web viewers), offer a compressed copy:
  `ffmpeg -i out/video-4k.mp4 -c:v libx264 -crf 26 -preset slow -c:a copy out/video-4k-small.mp4`
- 1080×1920 at 30 fps is the standard upload for Reels, TikTok and Shorts. 4K is useful for archiving and editing.
