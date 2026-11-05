import { Img, staticFile } from 'remotion';
import manifest from '../public/fx/manifest.json';

// one effect baked from the generator: a sprite sheet of 160 x 96 frames at 30 fps, and where in the frame it plays
export type Entry = { id: string; seed: number; shape: string; mat: string; name: string; frames: number; cols: number; loop: boolean; contact: number; x: number; alt: number };
export const WALL = manifest.wall as Entry[];
export const CLEAR = manifest.clear as Record<string, Entry>;
export const LOOKS = manifest.looks as Record<string, Entry>;
export const byShape = (shape: string) => WALL.find((e) => e.shape === shape)!;
// a window of width w (and the frame's 5:3 shape) round where the effect happens
export const around = (e: Entry, w: number) => ({ cx: e.x, cy: 80 - 26 - Math.min(e.alt, 30) * 0.6, w });

// t is the effect's own frame; 'loop' wraps, 'once' holds the first and last frames. crop shows only a window of the frame.
export const Fx: React.FC<{ e: Entry; t: number; scale: number; mode?: 'loop' | 'once'; crop?: { cx: number; cy: number; w: number }; style?: React.CSSProperties }> = ({ e, t, scale, mode = 'loop', crop, style }) => {
  const n = e.frames, f = Math.floor(t);
  const i = mode === 'loop' ? ((f % n) + n) % n : Math.max(0, Math.min(n - 1, f));
  const col = i % e.cols, row = Math.floor(i / e.cols), rows = Math.ceil(n / e.cols);
  const w = crop ? crop.w : 160, h = w * 0.6;
  const x0 = crop ? Math.max(0, Math.min(160 - w, crop.cx - w / 2)) : 0, y0 = crop ? Math.max(0, Math.min(96 - h, crop.cy - h / 2)) : 0;
  return (
    <div style={{ width: w * scale, height: h * scale, overflow: 'hidden', position: 'relative', ...style }}>
      <Img
        src={staticFile(`fx/${e.id}.png`)}
        style={{ position: 'absolute', left: -(col * 160 + x0) * scale, top: -(row * 96 + y0) * scale, width: e.cols * 160 * scale, height: rows * 96 * scale, maxWidth: 'none', imageRendering: 'pixelated' }}
      />
    </div>
  );
};
