/**
 * A paint splat as unit-radius geometry: a lumpy blob with a few long tendrils,
 * drips running down, and loose droplets around it. `splatPath` scales it into
 * an SVG / CSS `path()` string in pixels.
 */

interface Splat {
  outline: [number, number][];
  drops: [number, number, number][];
}

/** Small deterministic PRNG so the splat looks the same on every render. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeSplat(seed = 7): Splat {
  const r = rng(seed);
  const N = 72;
  const radii: number[] = [];
  for (let i = 0; i < N; i++) radii.push(0.8 + r() * 0.22);
  // smooth the lumps
  const smooth = radii.map((_, i) => (radii[(i + N - 1) % N] + radii[i] * 2 + radii[(i + 1) % N]) / 4);
  // tendrils: narrow spikes flung outwards
  for (let k = 0; k < 9; k++) {
    const at = Math.floor(r() * N);
    const len = 0.25 + r() * 0.45;
    for (let j = -2; j <= 2; j++) smooth[(at + j + N) % N] += len * Math.max(0, 1 - Math.abs(j) / 2.5) ** 2;
  }
  // drips: long thin runs on the lower half
  for (let k = 0; k < 5; k++) {
    const at = Math.round(N * (0.12 + r() * 0.26)); // angles pointing down (screen y grows down)
    const len = 0.4 + r() * 0.7;
    smooth[at] += len;
    smooth[(at + 1) % N] += len * 0.85;
  }
  const outline = smooth.map((rad, i) => {
    const a = (i / N) * Math.PI * 2;
    return [Math.cos(a) * rad, Math.sin(a) * rad] as [number, number];
  });
  const drops: [number, number, number][] = [];
  for (let k = 0; k < 22; k++) {
    const a = r() * Math.PI * 2;
    const d = 1.08 + r() * 0.65;
    drops.push([Math.cos(a) * d, Math.sin(a) * d, 0.012 + r() * r() * 0.07]);
  }
  return { outline, drops };
}

const f = (n: number) => n.toFixed(1);

/** The splat's body centred on (cx, cy) with radius `R`, in pixels. */
export function splatPath(s: Splat, cx: number, cy: number, R: number) {
  const pts = s.outline.map(([x, y]) => [cx + x * R, cy + y * R]);
  const n = pts.length;
  // quadratic curves through the midpoints give a soft, liquid edge
  const mid = (i: number) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  let d = `M${f(mid(n - 1)[0])} ${f(mid(n - 1)[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  d += "Z";
  return d;
}

/** The loose droplets flung around the splat, as their own path so they never punch holes in the body. */
export function splatDropsPath(s: Splat, cx: number, cy: number, R: number) {
  let d = "";
  for (const [x, y, rr] of s.drops) {
    const px = cx + x * R;
    const py = cy + y * R;
    const pr = rr * R;
    d += `M${f(px - pr)} ${f(py)}a${f(pr)} ${f(pr)} 0 1 0 ${f(pr * 2)} 0a${f(pr)} ${f(pr)} 0 1 0 ${f(-pr * 2)} 0Z`;
  }
  return d;
}
