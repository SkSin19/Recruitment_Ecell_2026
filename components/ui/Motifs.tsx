import { useId, type SVGProps } from "react";
import type { DomainSlug, Motif } from "@/lib/domains";
import { SpiderMark, WebPattern } from "./WebPattern";

/** Angular panther-head emblem in the style of the Wakandan crest. */
export function PantherMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M14 10 L24 16 H40 L50 10 L52 30 L44 46 L32 54 L20 46 L12 30 Z" />
        <path d="M18 27 L28 31 M46 27 L36 31" />
        <path d="M26 40 L32 44 L38 40" />
        <path d="M32 18 V34" />
      </g>
    </svg>
  );
}

/** Neutral DOOMSDAY diamond for domains without a character mark yet. */
function DiamondMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path d="M32 6 L58 32 L32 58 L6 32 Z" stroke="currentColor" strokeWidth="3" />
      <path d="M32 20 L44 32 L32 44 L20 32 Z" fill="currentColor" />
    </svg>
  );
}

export function DomainMark({ slug, ...props }: { slug: DomainSlug } & SVGProps<SVGSVGElement>) {
  if (slug === "rnd") return <SpiderMark {...props} />;
  if (slug === "tech") return <PantherMark {...props} />;
  return <DiamondMark {...props} />;
}

/** Fine circuit traces with node pads (Tech signature motif). */
export function CircuitPattern(props: SVGProps<SVGSVGElement>) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox="0 0 1000 1000" fill="none" aria-hidden="true" {...props}>
      <defs>
        <pattern id={`${uid}-c`} width="160" height="160" patternUnits="userSpaceOnUse">
          <g stroke="currentColor" strokeWidth="1.2">
            <path d="M0 40 H50 L70 60 H120 L140 40 H160" />
            <path d="M40 0 V30 L60 50 V110 L40 130 V160" />
            <path d="M100 160 V120 L120 100 H160" />
            <path d="M0 120 H30 L50 100" />
          </g>
          <g fill="currentColor">
            <circle cx="70" cy="60" r="3" />
            <circle cx="60" cy="110" r="3" />
            <circle cx="120" cy="100" r="3" />
            <circle cx="50" cy="100" r="2.5" />
          </g>
        </pattern>
        <radialGradient id={`${uid}-f`}>
          <stop offset="0.25" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${uid}-m`}>
          <rect width="1000" height="1000" fill={`url(#${uid}-f)`} />
        </mask>
      </defs>
      <rect width="1000" height="1000" fill={`url(#${uid}-c)`} mask={`url(#${uid}-m)`} />
    </svg>
  );
}

/** The domain's signature background motif. */
export function MotifPattern({ motif, ...props }: { motif: Motif } & SVGProps<SVGSVGElement>) {
  if (motif === "web-grid") return <WebPattern {...props} />;
  if (motif === "circuit") return <CircuitPattern {...props} />;
  return null;
}
