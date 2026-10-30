import { useId, useMemo, type CSSProperties } from "react";

/** Deterministic PRNG so server and client render the exact same skyline. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 1600;
const H = 900;
const r1 = (n: number) => Math.round(n * 10) / 10;

interface Building {
  x: number;
  w: number;
  h: number;
  spire?: "needle" | "stepped" | "crown";
  windows: { x: number; y: number; w: number; h: number; flicker: number }[];
}

function buildLayer(rand: () => number, opts: { count: number; minH: number; maxH: number; density: number; spires: boolean }) {
  const buildings: Building[] = [];
  let x = -20;
  while (x < W + 20) {
    const w = 50 + rand() * 90;
    const tall = rand() < 0.18;
    const h = opts.minH + rand() * (opts.maxH - opts.minH) * (tall ? 1.35 : 1);
    const b: Building = { x: r1(x), w: r1(w), h: r1(Math.min(h, H * 0.82)), windows: [] };
    if (opts.spires && tall) b.spire = (["needle", "stepped", "crown"] as const)[Math.floor(rand() * 3)];

    if (opts.density > 0) {
      const cols = Math.max(2, Math.floor(w / 13));
      const rows = Math.floor(b.h / 17);
      const cw = (w - 10) / cols;
      for (let row = 1; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (rand() > opts.density) continue;
          b.windows.push({
            x: r1(x + 5 + col * cw + cw * 0.18),
            y: r1(H - b.h + row * 17),
            w: r1(cw * 0.62),
            h: 8,
            flicker: rand() < 0.06 ? r1(rand() * 6) : -1,
          });
        }
      }
    }
    buildings.push(b);
    x += w + (rand() < 0.3 ? rand() * 12 : 2);
  }
  return buildings.slice(0, opts.count);
}

function Spire({ b, fill }: { b: Building; fill: string }) {
  const cx = b.x + b.w / 2;
  const top = H - b.h;
  if (b.spire === "needle")
    return <polygon fill={fill} points={`${r1(cx - 3)},${top} ${r1(cx)},${r1(top - 90)} ${r1(cx + 3)},${top}`} />;
  if (b.spire === "stepped")
    return (
      <path
        fill={fill}
        d={`M${r1(b.x + b.w * 0.15)} ${top}V${r1(top - 30)}H${r1(b.x + b.w * 0.3)}V${r1(top - 55)}H${r1(b.x + b.w * 0.42)}V${r1(top - 75)}H${r1(cx - 2)}V${r1(top - 130)}H${r1(cx + 2)}V${r1(top - 75)}H${r1(b.x + b.w * 0.58)}V${r1(top - 55)}H${r1(b.x + b.w * 0.7)}V${r1(top - 30)}H${r1(b.x + b.w * 0.85)}V${top}Z`}
      />
    );
  return (
    <path
      fill={fill}
      d={`M${r1(b.x + b.w * 0.2)} ${top}Q${r1(cx)} ${r1(top - 120)} ${r1(b.x + b.w * 0.8)} ${top}Z M${r1(cx - 1.5)} ${r1(top - 80)}L${r1(cx)} ${r1(top - 150)}L${r1(cx + 1.5)} ${r1(top - 80)}Z`}
    />
  );
}

export interface CitySkylineProps {
  /** Hue that floods the sky and the window light. */
  tint: string;
  seed?: number;
  className?: string;
  style?: CSSProperties;
}

/** Procedural New York style skyline at night with lit, occasionally flickering windows. */
export default function CitySkyline({ tint, seed = 7, className, style }: CitySkylineProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const layers = useMemo(() => {
    const rand = mulberry32(seed);
    return {
      far: buildLayer(rand, { count: 60, minH: 260, maxH: 520, density: 0, spires: true }),
      mid: buildLayer(rand, { count: 60, minH: 180, maxH: 430, density: 0.22, spires: true }),
      near: buildLayer(rand, { count: 60, minH: 90, maxH: 300, density: 0.38, spires: false }),
    };
  }, [seed]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05060a" />
          <stop offset="0.55" stopColor={tint} stopOpacity="0.55" />
          <stop offset="1" stopColor={tint} stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id={`${uid}-moon`}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.2" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint} stopOpacity="0" />
          <stop offset="1" stopColor={tint} stopOpacity="0.45" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#${uid}-sky)`} />
      <circle cx="1240" cy="170" r="150" fill={`url(#${uid}-moon)`} />
      <circle cx="1240" cy="170" r="34" fill="#f5f3ee" opacity="0.85" />

      <g fill="#0b0d14" opacity="0.55">
        {layers.far.map((b) => (
          <g key={`f${b.x}`}>
            <rect x={b.x} y={H - b.h} width={b.w} height={b.h} />
            {b.spire && <Spire b={b} fill="#0b0d14" />}
          </g>
        ))}
      </g>

      <rect y={H * 0.45} width={W} height={H * 0.55} fill={`url(#${uid}-haze)`} />

      <g>
        {layers.mid.map((b) => (
          <g key={`m${b.x}`}>
            <rect x={b.x} y={H - b.h} width={b.w} height={b.h} fill="#080a10" />
            {b.spire && <Spire b={b} fill="#080a10" />}
            {b.windows.map((w) => (
              <rect
                key={`${w.x}-${w.y}`}
                x={w.x}
                y={w.y}
                width={w.w}
                height={w.h}
                fill={tint}
                opacity="0.75"
                style={w.flicker >= 0 ? { animation: `window-flicker 5s ${w.flicker}s infinite` } : undefined}
              />
            ))}
          </g>
        ))}
      </g>

      <g>
        {layers.near.map((b) => (
          <g key={`n${b.x}`}>
            <rect x={b.x} y={H - b.h} width={b.w} height={b.h} fill="#040508" />
            {b.windows.map((w) => (
              <rect
                key={`${w.x}-${w.y}`}
                x={w.x}
                y={w.y}
                width={w.w}
                height={w.h}
                fill={w.flicker >= 0 ? "#fff3d6" : "#ffd98a"}
                opacity="0.8"
                style={w.flicker >= 0 ? { animation: `window-flicker 4s ${w.flicker}s infinite` } : undefined}
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
