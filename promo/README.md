# Promo video

A 20-second Japanese promo for the generator, made with [Remotion](https://www.remotion.dev): 1920 × 1080, 30 fps.

- `public/fx/` holds sprite sheets baked from the generator itself (all 70 shapes, transparent hero shots, and one
  effect in the four looks), with `manifest.json` listing each one's seed, Japanese name, frame count and position.
- `public/music.wav` is a 120 BPM chiptune made by `scripts/music.mjs`; every scene cut lands on a beat.
- `src/Promo.tsx` has the six scenes: the hook and title, the seed roll, the five families, the effect wall, the
  four looks and the end card. The generator's own clock, iris and diamonds transitions carry the cuts.

```bash
npm install
npm run studio      # preview and scrub
npm run render      # writes out/promo-ja.mp4
node scripts/music.mjs   # rebuild the soundtrack
```
