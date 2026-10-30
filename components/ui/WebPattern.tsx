import { useId, type SVGProps } from "react";

const r = (n: number) => Math.round(n * 100) / 100;

/** Radial spider web blended into a fine technical grid (R&D signature motif). */
export function WebPattern({
  rings = 9,
  spokes = 16,
  ...props
}: { rings?: number; spokes?: number } & SVGProps<SVGSVGElement>) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const c = 500;
  const angles = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2);

  const ringPaths = Array.from({ length: rings }, (_, k) => {
    const radius = ((k + 1) / rings) * 480;
    return (
      angles
        .map((a, i) => {
          const next = angles[(i + 1) % spokes];
          const mid = (a + next) / 2;
          const sag = radius * 0.86;
          const p0 = `${r(c + Math.cos(a) * radius)} ${r(c + Math.sin(a) * radius)}`;
          const q = `${r(c + Math.cos(mid) * sag)} ${r(c + Math.sin(mid) * sag)}`;
          const p1 = `${r(c + Math.cos(next) * radius)} ${r(c + Math.sin(next) * radius)}`;
          return `${i === 0 ? `M${p0}` : ""} Q${q} ${p1}`;
        })
        .join(" ") + " Z"
    );
  });

  return (
    <svg viewBox="0 0 1000 1000" fill="none" aria-hidden="true" {...props}>
      <defs>
        <pattern id={`${uid}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.6" />
        </pattern>
        <radialGradient id={`${uid}-fade`}>
          <stop offset="0.35" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${uid}-mask`}>
          <rect width="1000" height="1000" fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>
      <rect width="1000" height="1000" fill={`url(#${uid}-grid)`} opacity="0.5" />
      <g stroke="currentColor" strokeWidth="1.1" mask={`url(#${uid}-mask)`}>
        {angles.map((a) => (
          <line key={a} x1={c} y1={c} x2={r(c + Math.cos(a) * 520)} y2={r(c + Math.sin(a) * 520)} />
        ))}
        {ringPaths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** Minimal spider glyph used for the nav mark, buttons and placeholders. */
export function SpiderMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" {...props}>
      <ellipse cx="32" cy="22" rx="5" ry="6" />
      <ellipse cx="32" cy="38" rx="7" ry="11" />
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M27 30 L14 22 L8 8" />
        <path d="M37 30 L50 22 L56 8" />
        <path d="M26 35 L12 34 L4 26" />
        <path d="M38 35 L52 34 L60 26" />
        <path d="M26 40 L13 46 L7 58" />
        <path d="M38 40 L51 46 L57 58" />
        <path d="M27 45 L18 56 L16 62" />
        <path d="M37 45 L46 56 L48 62" />
      </g>
    </svg>
  );
}
