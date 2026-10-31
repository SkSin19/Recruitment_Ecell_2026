/**
 * Broken-glass geometry for a full-screen shatter: jagged cracks radiating from an
 * impact point, a ring of cross-cracks, and the shards those cracks cut the
 * screen into. Everything is in pixels for a given screen size.
 */

export interface Shard {
  /** CSS polygon() points. */
  polygon: string;
  /** Shard centre, used to fling it away from the impact. */
  cx: number;
  cy: number;
  /** Per-shard randomness for spin and fall speed. */
  spin: [number, number, number];
  weight: number;
}

export interface Shatter {
  shards: Shard[];
  /** SVG path of every crack line, for the moment before the glass falls. */
  cracks: string;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPOKES = 13;
const RINGS = [0.13, 0.36]; // fractions of the screen diagonal

export function makeShatter(w: number, h: number, ix: number, iy: number, seed = 5): Shatter {
  const r = rng(seed);
  const diag = Math.hypot(w, h);
  const far = diag * 1.2;
  // spoke angles with jitter
  const angles = Array.from({ length: SPOKES }, (_, i) => ((i + 0.5 + (r() - 0.5) * 0.7) / SPOKES) * Math.PI * 2);
  // each spoke: points at the rings plus the far end, wobbling sideways so the crack looks jagged
  const radii = [...RINGS.map((f) => f * diag), far];
  const spoke = angles.map((a) =>
    radii.map((rad, k) => {
      const wob = (r() - 0.5) * (k === radii.length - 1 ? 0.05 : 0.18);
      const rr = rad * (k === radii.length - 1 ? 1 : 0.85 + r() * 0.3);
      return [ix + Math.cos(a + wob) * rr, iy + Math.sin(a + wob) * rr] as [number, number];
    }),
  );
  const centre: [number, number] = [ix, iy];

  const shards: Shard[] = [];
  const pt = ([x, y]: [number, number]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  for (let i = 0; i < SPOKES; i++) {
    const a = spoke[i];
    const b = spoke[(i + 1) % SPOKES];
    // inner wedge, middle band and outer band of this sector
    const rings: [number, number][][] = [
      [centre, a[0], b[0]],
      [a[0], a[1], b[1], b[0]],
      [a[1], a[2], b[2], b[1]],
    ];
    for (const poly of rings) {
      const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
      const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      shards.push({
        polygon: `polygon(${poly.map(pt).join(",")})`,
        cx,
        cy,
        spin: [(r() - 0.5) * 120, (r() - 0.5) * 120, (r() - 0.5) * 70],
        weight: 0.7 + r() * 0.6,
      });
    }
  }

  // cracks: every straight edge broken into short, wandering steps, plus a few hair-line branches
  const jag = (from: [number, number], to: [number, number]) => {
    const steps = Math.max(3, Math.round(Math.hypot(to[0] - from[0], to[1] - from[1]) / 26));
    const nx = -(to[1] - from[1]);
    const ny = to[0] - from[0];
    const len = Math.hypot(nx, ny) || 1;
    let d = "";
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      const off = k === steps ? 0 : (r() - 0.5) * 12;
      d += `L${(from[0] + (to[0] - from[0]) * t + (nx / len) * off).toFixed(1)} ${(from[1] + (to[1] - from[1]) * t + (ny / len) * off).toFixed(1)}`;
    }
    return d;
  };
  let cracks = "";
  for (const sp of spoke) {
    let prev = centre;
    cracks += `M${ix.toFixed(1)} ${iy.toFixed(1)}`;
    for (const q of sp) {
      cracks += jag(prev, q);
      prev = q;
    }
    // branches splitting off the spoke
    for (let k = 0; k < 2; k++) {
      const [bx, by] = sp[k];
      const a = Math.atan2(by - iy, bx - ix) + (r() > 0.5 ? 1 : -1) * (0.4 + r() * 0.5);
      const bl = diag * (0.04 + r() * 0.08);
      cracks += `M${bx.toFixed(1)} ${by.toFixed(1)}` + jag([bx, by], [bx + Math.cos(a) * bl, by + Math.sin(a) * bl]);
    }
  }
  for (let k = 0; k < RINGS.length; k++) {
    cracks += `M${spoke[0][k][0].toFixed(1)} ${spoke[0][k][1].toFixed(1)}`;
    for (let i = 1; i <= SPOKES; i++) cracks += jag(spoke[i - 1][k], spoke[i % SPOKES][k]);
  }
  return { shards, cracks };
}
