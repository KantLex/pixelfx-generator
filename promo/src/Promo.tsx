import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadDela } from '@remotion/google-fonts/DelaGothicOne';
import { loadFont as loadDot } from '@remotion/google-fonts/DotGothic16';
import { loadFont as loadPress } from '@remotion/google-fonts/PressStart2P';
import { CLEAR, Entry, Fx, LOOKS, WALL, around, byShape } from './Fx';

const DELA = loadDela('normal', { weights: ['400'], ignoreTooManyRequestsWarning: true }).fontFamily;
const DOT = loadDot('normal', { weights: ['400'], ignoreTooManyRequestsWarning: true }).fontFamily;
const PRESS = loadPress('normal', { weights: ['400'] }).fontFamily;

const C = { bg: '#0b0912', pink: '#ff4fa3', cyan: '#3de8ff', yellow: '#ffd23f', violet: '#9b7bff', green: '#5dff9b' };
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const hash = (n: number) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
// the music runs at 120 BPM: one beat is 15 frames, and every scene starts on one
const S1 = 0, S2 = 105, S3 = 180, S4 = 330, S5 = 465, S6 = 540;

// a deterministic camera shake that decays over dur frames
const shake = (f: number, at: number, dur: number, amp: number) => {
  const k = f - at;
  if (k < 0 || k >= dur) return 'translate(0px, 0px)';
  const a = amp * (1 - k / dur);
  return `translate(${Math.sin(k * 2.7) * a}px, ${Math.cos(k * 3.9) * a * 0.6}px)`;
};
// a one-shot's own frame, lined up so its contact lands on frame `at` of the video
const shotT = (e: Entry, f: number, at: number) => f - at + e.contact;

// text with cyan and pink copies split apart behind a white face
const Chroma: React.FC<{ text: string; font: string; size: number; split?: number; color?: string; glow?: string; style?: React.CSSProperties }> = ({ text, font, size, split = 4, color = '#fff', glow = C.pink, style }) => {
  const base: React.CSSProperties = { fontFamily: font, fontSize: size, lineHeight: 1.15, whiteSpace: 'pre', textAlign: 'center' };
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ ...base, position: 'absolute', inset: 0, color: C.cyan, transform: `translate(${-split}px, ${split * 0.35}px)`, mixBlendMode: 'screen' }}>{text}</div>
      <div style={{ ...base, position: 'absolute', inset: 0, color: C.pink, transform: `translate(${split}px, ${-split * 0.35}px)`, mixBlendMode: 'screen' }}>{text}</div>
      <div style={{ ...base, position: 'relative', color, textShadow: `0 0 28px ${glow}, 0 8px 0 rgba(0,0,0,0.55)` }}>{text}</div>
    </div>
  );
};
const Flash: React.FC<{ f: number; at: number; dur?: number; max?: number; color?: string }> = ({ f, at, dur = 6, max = 1, color = '#fff' }) => {
  const o = interpolate(f, [at, at + dur], [max, 0], clamp);
  return f >= at && o > 0 ? <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: 'screen' }} /> : null;
};
// a pop-in scale: overshoots, then settles
const usePop = (f: number, at: number, fps: number, damping = 11) => spring({ frame: f - at, fps, config: { damping, stiffness: 180, mass: 0.6 } });
const Grid: React.FC<{ f: number; color?: string }> = ({ f, color = 'rgba(255,79,163,0.10)' }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px)`,
      backgroundSize: '64px 64px', backgroundPosition: `0px ${(f * 2) % 64}px`,
      maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
    }}
  />
);

// ---------------------------------------------------------------- 1: the hook and the title
const Hook: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const slam = CLEAR.slam, fw = CLEAR.firework, contact = 15;
  const seedChars = 'SEED #20482'.slice(0, Math.floor(f / 1.2));
  const a = usePop(f, contact, fps, 9), b = usePop(f, 44, fps, 9);
  const title = f >= 66;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 70%, #2a1238 0%, ${C.bg} 70%)` }}>
      <Grid f={f} />
      <AbsoluteFill style={{ transform: shake(f, contact, 16, 46) }}>
      {f < 70 && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', opacity: interpolate(f, [56, 70], [1, 0], clamp) }}>
          <Fx e={slam} t={shotT(slam, f, contact)} scale={16} mode="once" crop={{ ...around(slam, 120), cy: 50 }} />
        </AbsoluteFill>
      )}
      {f < contact && <div style={{ position: 'absolute', left: 90, top: 80, fontFamily: PRESS, fontSize: 34, color: C.cyan, textShadow: `0 0 16px ${C.cyan}` }}>{seedChars}<span style={{ opacity: f % 8 < 4 ? 1 : 0 }}>_</span></div>}
      {f >= contact && f < 44 && (
        <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
          <Chroma text="数字ひとつで、" font={DELA} size={150} split={interpolate(f, [contact, contact + 10], [26, 4], clamp)} style={{ transform: `scale(${interpolate(a, [0, 1], [2.2, 1])})` }} />
        </AbsoluteFill>
      )}
      {f >= 44 && f < 66 && (
        <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
          <Chroma text={'エフェクトが\n生まれる。'} font={DELA} size={136} glow={C.cyan} split={interpolate(f, [44, 52], [30, 4], clamp)} style={{ transform: `scale(${interpolate(b, [0, 1], [0.4, 1])}) rotate(${interpolate(b, [0, 1], [-6, 0])}deg)` }} />
        </AbsoluteFill>
      )}
      {title && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Fx e={fw} t={shotT(fw, f, 75)} scale={9} mode="once" />
          </AbsoluteFill>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, marginTop: -40 }}>
            {['PIXEL VFX', 'ANATOMY'].map((line, li) => (
              <div key={line} style={{ display: 'flex' }}>
                {[...line].map((ch, k) => {
                  const at = 66 + li * 6 + k * 1.2, s = usePop(f, at, fps, 10);
                  return (
                    <span key={k} style={{ fontFamily: PRESS, fontSize: 118, color: li ? C.pink : '#fff', width: ch === ' ' ? 60 : undefined, display: 'inline-block', transform: `translateY(${interpolate(s, [0, 1], [-120, 0])}px) scale(${s})`, textShadow: `0 0 30px ${li ? C.pink : C.cyan}, 6px 6px 0 #000` }}>
                      {ch === ' ' ? ' ' : ch}
                    </span>
                  );
                })}
              </div>
            ))}
            <div style={{ fontFamily: DOT, fontSize: 50, color: '#fff', opacity: interpolate(f, [80, 88], [0, 1], clamp), transform: `translateY(${interpolate(f, [80, 88], [20, 0], clamp)}px)`, letterSpacing: '0.08em', background: 'rgba(11,9,18,0.7)', padding: '8px 28px', border: `3px solid ${C.cyan}` }}>
              コードで描く、ピクセルエフェクト生成ツール
            </div>
          </div>
        </AbsoluteFill>
      )}
      </AbsoluteFill>
      <Flash f={f} at={contact} dur={8} />
      <Flash f={f} at={75} dur={6} max={0.6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2: a new seed every half beat
const ROLL = ['meteor', 'firework', 'portal', 'levelup', 'spikes', 'frog', 'combo', 'vortex', 'chest', 'jellyfish'];
const SeedRoll: React.FC<{ f: number }> = ({ f }) => {
  const lf = f - S2, k = Math.min(ROLL.length - 1, Math.floor(lf / 7.5)), cut = S2 + Math.round(k * 7.5), e = byShape(ROLL[k]), cf = f - cut;
  const t = e.loop ? cf + 8 : e.contact - 3 + cf;
  const digits = String(e.seed).split('').map((d, i) => (cf < 4 && i > 1 ? String(Math.floor(hash(f * 31 + i) * 10)) : d)).join('');
  const punch = interpolate(cf, [0, 5], [1.06, 1], clamp);
  const head = interpolate(lf, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, #1b1530 0%, ${C.bg} 75%)` }}>
      <Grid f={f} color="rgba(61,232,255,0.08)" />
      <div style={{ position: 'absolute', top: 54, width: '100%', textAlign: 'center', opacity: head, transform: `translateY(${(1 - head) * -40}px)` }}>
        <Chroma text="シードを変えるたび、新しいエフェクト。" font={DELA} size={66} split={3} glow={C.cyan} />
      </div>
      <div style={{ position: 'absolute', top: 160, width: '100%', textAlign: 'center', fontFamily: PRESS, fontSize: 58, color: C.yellow, textShadow: `0 0 22px ${C.yellow}, 5px 5px 0 #000` }}>#{digits}</div>
      <AbsoluteFill style={{ alignItems: 'center', top: 262 }}>
        <div style={{ transform: `scale(${punch})`, border: `6px solid ${C.pink}`, boxShadow: `0 0 40px ${C.pink}, inset 0 0 30px rgba(255,79,163,0.4)`, position: 'relative' }}>
          <Fx e={e} t={t} scale={10} crop={around(e, 100)} style={{ filter: 'brightness(1.15) saturate(1.2)' }} />
          <div style={{ position: 'absolute', top: 14, left: 16, fontFamily: PRESS, fontSize: 20, color: '#fff', background: C.pink, padding: '6px 10px' }}>● LIVE</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: 902, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontFamily: DOT, fontSize: 52, color: '#fff', background: 'rgba(11,9,18,0.85)', border: `3px solid ${C.cyan}`, padding: '6px 30px' }}>{e.name}</div>
      </div>
      <Flash f={f} at={cut} dur={3} max={0.16} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3: the five families, two beats each
const CATS = [
  { ja: '単発', en: 'ONE-SHOTS', n: '19', color: C.pink, fx: ['slash', 'meteor', 'chain'] },
  { ja: 'ループ', en: 'SEAMLESS LOOPS', n: '18', color: C.cyan, fx: ['portal', 'torch', 'vortex'] },
  { ja: 'UI', en: 'UI POPS', n: '11', color: C.yellow, fx: ['levelup', 'combo', 'chest'] },
  { ja: 'トランジション', en: 'TRANSITIONS', n: '10', color: C.violet, fx: ['diamonds', 'clock', 'curtain'] },
  { ja: 'クリーチャー', en: 'CRITTERS', n: '12', color: C.green, fx: ['frog', 'jellyfish', 'bats'] },
];
const Families: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const k = Math.min(4, Math.floor((f - S3) / 30)), cat = CATS[k], at = S3 + k * 30, lf = f - at;
  const slide = usePop(f, at, fps, 13);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 30% 30%, ${cat.color}33 0%, ${C.bg} 65%)` }}>
      <Grid f={f} color={`${cat.color}18`} />
      <AbsoluteFill style={{ transform: shake(f, at, 8, 14) }}>
      <div style={{ position: 'absolute', left: 110, top: 70, transform: `translateX(${interpolate(slide, [0, 1], [-700, 0])}px) skewX(${interpolate(slide, [0, 1], [-18, 0])}deg)` }}>
        <Chroma text={cat.ja} font={DELA} size={190} glow={cat.color} split={interpolate(lf, [0, 8], [24, 4], clamp)} style={{ textAlign: 'left' }} />
        <div style={{ fontFamily: PRESS, fontSize: 34, color: cat.color, marginTop: 6, textShadow: `0 0 14px ${cat.color}` }}>{cat.en}</div>
      </div>
      <div style={{ position: 'absolute', right: 110, top: 96, textAlign: 'right', transform: `scale(${usePop(f, at + 4, fps, 9)})`, transformOrigin: 'right center' }}>
        <div style={{ fontFamily: PRESS, fontSize: 120, color: cat.color, textShadow: `0 0 30px ${cat.color}, 6px 6px 0 #000` }}>{cat.n}</div>
        <div style={{ fontFamily: DOT, fontSize: 44, color: '#fff' }}>シェイプ</div>
      </div>
      <div style={{ position: 'absolute', left: 104, top: 520, display: 'flex', gap: 40 }}>
        {cat.fx.map((shape, i) => {
          const e = byShape(shape), p = usePop(f, at + 3 + i * 3, fps, 10);
          const t = e.loop ? lf + i * 9 : cat.ja === 'トランジション' ? lf * 1.4 + 4 : e.contact - 6 + lf;
          return (
            <div key={shape} style={{ transform: `scale(${p}) rotate(${interpolate(p, [0, 1], [i % 2 ? 8 : -8, 0])}deg)`, border: `5px solid ${cat.color}`, boxShadow: `0 0 34px ${cat.color}99` }}>
              <Fx e={e} t={t} scale={cat.ja === 'トランジション' ? 3.4 : 5.44} mode={e.loop ? 'loop' : 'once'} crop={cat.ja === 'トランジション' ? undefined : around(e, 100)} style={{ filter: 'brightness(1.15) saturate(1.2)' }} />
            </div>
          );
        })}
      </div>
      </AbsoluteFill>
      <Flash f={f} at={at} dur={5} max={0.28} color={cat.color} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4: the effect wall, all 70 shapes at once
const COLS = 10, ROWS = 7, TS = 1.15, GAP = 8;
// a fixed shuffle so the families mix across the wall
const ORDER = WALL.map((e, i) => ({ e, r: hash(i * 7 + 3) })).sort((a, b) => a.r - b.r).map((x) => x.e);
const Wall: React.FC<{ f: number; reveal: number; dim?: number }> = ({ f, reveal, dim = 1 }) => {
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${160 * TS}px)`, gap: GAP, opacity: dim }}>
      {ORDER.slice(0, COLS * ROWS).map((e, i) => {
        const c = i % COLS, r = Math.floor(i / COLS), d = Math.max(Math.abs(c - (COLS - 1) / 2), Math.abs(r - (ROWS - 1) / 2));
        const p = usePop(f, reveal + d * 2.2, fps, 12);
        return (
          <div key={e.id} style={{ transform: `scale(${p})`, outline: '2px solid rgba(255,255,255,0.10)' }}>
            <Fx e={e} t={f + i * 11} scale={TS * 1.6} crop={around(e, 100)} style={{ filter: 'brightness(1.3) saturate(1.35)' }} />
          </div>
        );
      })}
    </div>
  );
};
const Count: React.FC<{ f: number; from: number; to: number; dur: number; value: number }> = ({ f, from, dur, to, value }) => (
  <>{Math.round(interpolate(f, [from, from + dur], [0, value], { ...clamp, easing: Easing.out(Easing.cubic) })).toLocaleString('ja-JP')}</>
);
const STAT_FONT: React.CSSProperties = { fontFamily: DELA, color: '#fff', textAlign: 'center', whiteSpace: 'pre' };
const EffectWall: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const lf = f - S4;
  const zoom = interpolate(lf, [0, 48], [5.2, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) * interpolate(lf, [48, 135], [1, 1.14], clamp);
  const tilt = interpolate(lf, [26, 90], [0, 24], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const roll = interpolate(lf, [26, 135], [0, -7], clamp), pan = interpolate(lf, [26, 135], [0, -60], clamp);
  const glare = interpolate(lf, [40, 100], [-60, 160], clamp);
  const stat = lf < 80 ? 0 : lf < 108 ? 1 : 2, sAt = [46, 80, 108][stat], sp = usePop(f, S4 + sAt, fps, 9);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1a1430 0%, #050409 80%)` }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1800 }}>
        <div style={{ transform: `translateY(${pan}px) scale(${zoom}) rotateX(${tilt}deg) rotateZ(${roll}deg)`, transformStyle: 'preserve-3d', position: 'relative' }}>
          <Wall f={f} reveal={S4} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${glare - 12}%, rgba(255,255,255,0.22) ${glare}%, transparent ${glare + 12}%)`, mixBlendMode: 'screen', pointerEvents: 'none' }} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)' }} />
      <div style={{ position: 'absolute', left: 70, top: 56, opacity: interpolate(lf, [10, 20], [0, 1], clamp) }}>
        <div style={{ fontFamily: PRESS, fontSize: 30, color: C.yellow, textShadow: `0 0 14px ${C.yellow}` }}>EFFECT WALL</div>
        <div style={{ fontFamily: DOT, fontSize: 44, color: '#fff', marginTop: 8 }}>エフェクトウォール</div>
      </div>
      {lf >= 46 && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'linear-gradient(90deg, transparent, rgba(8,6,14,0.82) 20%, rgba(8,6,14,0.82) 80%, transparent)', padding: '30px 220px', transform: `scale(${interpolate(sp, [0, 1], [1.8, 1])})`, opacity: Math.min(1, sp * 1.5) }}>
            {stat === 0 && <div style={{ ...STAT_FONT, fontSize: 150 }}>全<span style={{ color: C.pink, fontFamily: PRESS, fontSize: 150 }}><Count f={f} from={S4 + 46} dur={14} to={70} value={70} /></span>シェイプ</div>}
            {stat === 1 && <div style={{ ...STAT_FONT, fontSize: 112 }}>×8素材 = <span style={{ color: C.cyan, fontFamily: PRESS, fontSize: 130 }}><Count f={f} from={S4 + 80} dur={14} to={560} value={560} /></span>タイプ</div>}
            {stat === 2 && <div style={{ ...STAT_FONT, fontSize: 150 }}><span style={{ color: C.yellow, fontFamily: PRESS, fontSize: 150 }}><Count f={f} from={S4 + 108} dur={14} to={215} value={215} /></span>億シード</div>}
          </div>
        </AbsoluteFill>
      )}
      <Flash f={f} at={S4 + 46} dur={5} max={0.4} />
      <Flash f={f} at={S4 + 80} dur={5} max={0.4} color={C.cyan} />
      <Flash f={f} at={S4 + 108} dur={5} max={0.4} color={C.yellow} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5: one effect in the four looks
const LOOK_LABELS: [keyof typeof LOOKS, string, string][] = [['pixel', 'ピクセル', C.pink], ['cel', 'セル輪郭', C.cyan], ['handheld', '携帯機', C.green], ['ink', 'インクスケッチ', C.yellow]];
const Looks: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const lf = f - S5, head = usePop(f, S5, fps, 12);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #241a36 0%, ${C.bg} 70%)` }}>
      <Grid f={f} color="rgba(255,210,63,0.07)" />
      <div style={{ position: 'absolute', top: 40, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${head})` }}>
        <Chroma text="4つのルック" font={DELA} size={104} glow={C.yellow} split={interpolate(lf, [0, 8], [20, 3], clamp)} />
        <div style={{ fontFamily: DOT, fontSize: 40, color: '#ddd', marginTop: 4 }}>同じエフェクトを、4つの画風で。</div>
      </div>
      <div style={{ position: 'absolute', left: 300, top: 250, display: 'grid', gridTemplateColumns: 'repeat(2, 640px)', gap: 40 }}>
        {LOOK_LABELS.map(([k, label, color], i) => {
          const p = usePop(f, S5 + 4 + i * 4, fps, 12);
          return (
            <div key={k} style={{ position: 'relative', border: `5px solid ${color}`, boxShadow: `0 0 30px ${color}88`, transform: `translateX(${interpolate(p, [0, 1], [i % 2 ? 900 : -900, 0])}px)` }}>
              <Fx e={LOOKS[k]} t={lf + 12} scale={4} />
              <div style={{ position: 'absolute', left: 0, bottom: 0, fontFamily: DOT, fontSize: 40, color: '#0b0912', background: color, padding: '4px 20px' }}>{label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6: the end card
const CHIPS: [string, string][] = [['インストール不要', C.pink], ['PNG・GIF書き出し', C.cyan], ['リンクで共有', C.yellow], ['4言語対応', C.green]];
const EndCard: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const lf = f - S6, nova = CLEAR.nova, tag = usePop(f, S6 + 10, fps, 10);
  return (
    <AbsoluteFill style={{ background: '#050409' }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${interpolate(lf, [0, 60], [1.12, 1.24])}) rotate(-4deg)`, filter: 'blur(3px)' }}>
        <Wall f={f} reveal={-100} dim={0.32} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(5,4,9,0.55) 0%, rgba(5,4,9,0.92) 70%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Fx e={nova} t={shotT(nova, f, S6 + 6)} scale={9} mode="once" style={{ marginTop: -160, opacity: 0.9 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 34 }}>
        <div style={{ fontFamily: PRESS, fontSize: 92, color: '#fff', textShadow: `0 0 30px ${C.pink}, 0 0 60px ${C.pink}, 6px 6px 0 #000`, transform: `scale(${usePop(f, S6 + 2, fps, 10)})` }}>
          PIXEL VFX <span style={{ color: C.pink }}>ANATOMY</span>
        </div>
        <div style={{ transform: `scale(${interpolate(tag, [0, 1], [1.6, 1])})`, opacity: Math.min(1, tag * 2) }}>
          <Chroma text="ブラウザで、いますぐ。" font={DELA} size={112} glow={C.cyan} split={interpolate(lf, [10, 18], [22, 3], clamp)} />
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 10 }}>
          {CHIPS.map(([text, color], i) => {
            const p = usePop(f, S6 + 18 + i * 3, fps, 12);
            return <div key={text} style={{ fontFamily: DOT, fontSize: 40, color: '#fff', border: `3px solid ${color}`, boxShadow: `0 0 18px ${color}88`, padding: '8px 24px', background: 'rgba(11,9,18,0.85)', transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px)`, opacity: p }}>{text}</div>;
          })}
        </div>
        <div style={{ fontFamily: PRESS, fontSize: 22, color: '#aaa', marginTop: 18, opacity: interpolate(lf, [30, 38], [0, 1], clamp) }}>github.com/KantLex/pixelfx-generator</div>
      </AbsoluteFill>
      <Flash f={f} at={S6 + 6} dur={6} max={0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the generator's own transitions carry the cuts
const CUTS: [string, number][] = [['clock', S2], ['iris', S4], ['diamonds', S6]];
const Transitions: React.FC<{ f: number }> = ({ f }) => (
  <>
    {CUTS.map(([shape, cover]) => {
      const e = CLEAR[shape], t = shotT(e, f, cover);
      if (t < 0 || t >= e.frames) return null;
      return (
        <AbsoluteFill key={shape} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Fx e={e} t={t} scale={12} mode="once" />
        </AbsoluteFill>
      );
    })}
  </>
);

export const Promo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <Audio src={staticFile('music.wav')} />
      {f < S2 && <Hook f={f} />}
      {f >= S2 && f < S3 && <SeedRoll f={f} />}
      {f >= S3 && f < S4 && <Families f={f} />}
      {f >= S4 && f < S5 && <EffectWall f={f} />}
      {f >= S5 && f < S6 && <Looks f={f} />}
      {f >= S6 && <EndCard f={f} />}
      <Transitions f={f} />
      {/* scanlines and a vignette over everything */}
      <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, transparent 2px, transparent 5px)', pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
