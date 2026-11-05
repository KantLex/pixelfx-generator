// A 20-second chiptune for the promo, synthesised from scratch: 120 BPM in A minor, so one beat is 15 video frames
// at 30 fps. Scene cuts in the video land on these beats. Writes public/music.wav (44.1 kHz, 16-bit stereo).
import { writeFileSync } from 'node:fs';

const SR = 44100, LEN = 20, N = SR * LEN, BEAT = 0.5;
const L = new Float32Array(N), R = new Float32Array(N);
// a fixed-seed noise source, so every render is the same
let seed = 1234567;
const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const add = (t0, dur, fn, gain = 1, pan = 0) => {
  const a = Math.max(0, Math.floor(t0 * SR)), b = Math.min(N, Math.floor((t0 + dur) * SR));
  for (let i = a; i < b; i++) {
    const t = (i - a) / SR, v = fn(t, dur) * gain;
    L[i] += v * (1 - Math.max(0, pan)); R[i] += v * (1 + Math.min(0, pan));
  }
};
const env = (t, d, atk = 0.005, rel = 0.05) => Math.min(1, t / atk) * Math.min(1, Math.max(0, (d - t) / rel));

// a triangle wave: the soft, rounded cousin of the square, so the track sits under the visuals instead of over them
const tri = (f) => (t) => 4 * Math.abs(((t * f) % 1) - 0.5) - 1;
const kick = (t0, g = 1) => add(t0, 0.24, (t) => Math.sin(2 * Math.PI * (40 * t + (80 / 18) * (1 - Math.exp(-18 * t)))) * Math.exp(-11 * t), 0.5 * g);
const snare = (t0, g = 1) => add(t0, 0.12, (t) => (noise() * 0.5 + Math.sin(2 * Math.PI * 190 * t) * 0.3) * Math.exp(-28 * t), 0.12 * g);
const hat = (t0, g = 1, pan = 0) => add(t0, 0.03, (t) => noise() * Math.exp(-110 * t), 0.035 * g, pan);
const note = (t0, d, midi, g, pan = 0) => add(t0, d, (t, dd) => tri(hz(midi))(t) * env(t, dd, 0.01, 0.06), g, pan);
const riser = (t0, d, g = 1) => add(t0, d, (t, dd) => noise() * Math.pow(t / dd, 3) * 0.5, 0.06 * g);
const boom = (t0, g = 1) => { kick(t0, 1.1 * g); add(t0, 1.4, (t) => Math.sin(2 * Math.PI * 45 * t) * Math.exp(-3.5 * t), 0.22 * g); };
const blip = (t0, midi) => note(t0, 0.08, midi, 0.035, 0.3);

// Am  F  C  G, two beats each
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const beats = LEN / BEAT;
for (let b = 1; b < beats; b++) {
  const t = b * BEAT, bar = Math.floor(b / 2) % 4, ch = CHORDS[bar], end = t >= 18;
  if (end) continue;
  // a light pulse: soft kick on every beat, a rim on the backbeat, a quiet off-beat tick
  kick(t);
  if (b % 2 === 0) snare(t + BEAT * 0.5);
  hat(t + BEAT * 0.5, 1, 0.3);
  // bass: one held root per beat
  note(t, BEAT * 0.9, ch[0] - 12, 0.13);
  // lead: a slow eighth-note arpeggio in the middle register, low in the mix
  if (b >= 2) for (let k = 0; k < 2; k++) note(t + (k * BEAT) / 2, BEAT / 2 * 0.9, ch[(b * 2 + k) % 3] + 12, 0.03, k ? 0.25 : -0.25);
  // a held pad of the chord
  if (b % 2 === 1) for (const m of ch) add(t, BEAT * 2, (tt, d) => tri(hz(m))(tt) * env(tt, d, 0.15, 0.4), 0.025);
}
// the intro: a riser into the drop on beat one (frame 15), where the slam lands
riser(0, 0.5, 1.2); boom(0.5);
// risers into the three generator transitions, and a hit where each covers the screen
for (const cover of [3.5, 11, 18]) { riser(cover - 0.6, 0.6); boom(cover, 0.8); }
// blips for the seed roll (frames 105 to 180, a cut every 7.5 frames)
for (let k = 0; k < 10; k++) blip(3.5 + k * 0.25, 76 + [0, 3, 7, 10, 12, 10, 7, 3, 0, 7][k]);
// the end: a final chord rings out
for (const m of [57, 64, 69, 72]) add(18, 2, (t) => tri(hz(m))(t) * Math.exp(-1.4 * t) * Math.min(1, t / 0.03), 0.045);
add(18, 2, (t) => Math.sin(2 * Math.PI * hz(45) * t) * Math.exp(-1.5 * t), 0.18);

// a one-pole low-pass around 3.5 kHz takes the edge off the top
{ const a = Math.exp((-2 * Math.PI * 3500) / SR); let l = 0, r = 0; for (let i = 0; i < N; i++) { l = l * a + L[i] * (1 - a); r = r * a + R[i] * (1 - a); L[i] = l; R[i] = r; } }
// soft clip, master fade at the very end, and write
let peak = 0, pre = 0, over = 0;
for (let i = 0; i < N; i++) { const m = Math.max(Math.abs(L[i]), Math.abs(R[i])); pre = Math.max(pre, m); if (m > 0.8) over++; }
console.log("pre-clip peak", pre.toFixed(2), "samples over 0.8:", (over / N * 100).toFixed(2) + "%");
for (let i = 0; i < N; i++) { const f = Math.min(1, (N - i) / (SR * 0.3)); L[i] = Math.tanh(L[i] * 0.6) * f; R[i] = Math.tanh(R[i] * 0.6) * f; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
// normalised to a modest peak, so the track sits well under a voice-over or the viewer's own audio
const g = 0.55 / Math.max(peak, 1e-6);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
writeFileSync(new URL('../public/music.wav', import.meta.url), buf);
console.log('wrote public/music.wav, peak', peak.toFixed(2));
