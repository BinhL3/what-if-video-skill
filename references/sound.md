# Sound design

Everything is synthesized in Python, so there are no samples to license and every cue lands on an exact time.

## Files

- `scripts/sfx.py`: the library. Each recipe returns a mono numpy array at 48 kHz. Filters and helpers: `t_arr`, `bp`/`lp`/`hp` (Butterworth band/low/high pass), `env`, `fade`, `norm`.
- `scripts/soundtrack.py`: the mix. It defines `at(beat, sec)`, `add(sound, t, gain, pan)`, `bed(t0, t1, make, gain, fin, fout)`, then the cue list, then mastering.

## Recipe catalogue (sfx.py)

| Group | Recipes |
|---|---|
| Ambience | `wind`, `road`, `ev_hum`, `room`, `murmur`, `crackle` (fire), `birds`, `drone` (tension bed), `pad` (chords), `video_music` |
| Vehicles | `squeal`, `impact`, `horn(f1, f2, d)`, `siren` |
| UI | `ping`, `click`, `beep(f, d)`, `decline`, `error_tone`, `loading_pulse`, `success_chime`, `connect_tone`, `send_swoosh`, `bloop`, `whoosh` |
| Phones and alarms | `ring_cycle` (original call ring), `pager` (on-call alarm: vibration rattle + two-tone beeps), `alarm`, `smoke_alarm` (temporal-3 pattern), `phone_ring`, `radio` (static + voice-like burst) |
| People and objects | `rustle` (paper), `step`, `key_clicks`, `creak`, `knock`, `shutter`, `cha_ching`, `coins`, `chime_dingdong`, `announcement` (muffled voice), `ecg_beep` |
| Drama | `news_sting`, `falling` (descending tone) |

## Placing cues

```python
add(impact(), at("bridge", 2.2), 0.55, pan=0.15)        # one-shot at a moment in a beat
bed(at("store"), at("phone"), murmur, 0.05)              # ambience across a beat
for k in range(5):                                       # one tick per countdown number
    add(beep(1760, 0.05), at("countdown", k * 0.8), 0.06)
```

Line sounds up with what's on screen: the decline tone on the frame the error appears, a knock as each sign pops, a ping when the unread count changes, and the pager buzz pulsing at the same rhythm the phone visibly vibrates.

## Mix levels that worked (gain values passed to add/bed)

- Story-critical one-shots (impact, decline, alarm): 0.15–0.55
- UI ticks and pings: 0.05–0.16
- Ambience beds: 0.04–0.10
- Music pads and drones: 0.025–0.08 (always under effects)

Priority: story effects, then ambience, then music. Hard-cut ambience on scene cuts rather than crossfading; the cut sells the edit. Leave silence right after a vanish; it lands harder than another effect.

## Mastering

`soundtrack.py` fades the last `fadeOutFrames` with the picture, soft-limits (`tanh`), then runs ffmpeg `loudnorm=I=-15 … , volume=4dB, alimiter` for about -14 LUFS integrated, the loudness short-video platforms normalize to. Check it with:

```bash
ffmpeg -hide_banner -i out/video.mp4 -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
```

Always tell the user nobody has listened on a phone speaker yet; ask them to check, especially loud alarms and quiet ambience.

## Designing a new effect

Build it from a tone (`np.sin`, `signal.square`, `signal.sawtooth` with a frequency curve via `np.cumsum(f)/SR`) or filtered noise (`bp(rng.standard_normal(n), lo, hi)`), shaped by an envelope (`np.exp(-t*k)` for hits, a gate for rhythmic patterns). Put new recipes in `sfx.py` so later videos can reuse them. Keep `rng` seeded so renders are repeatable.

Don't recreate a specific real product's signature sound (an app's ringtone, a company's pager tone); make something in the same spirit but clearly original.
