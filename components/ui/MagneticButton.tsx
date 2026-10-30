"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { DomainSlug, Motif } from "@/lib/domains";
import { DomainMark, MotifPattern } from "./Motifs";

const RAYS = Array.from({ length: 12 }, (_, i) => (i / 12) * 360);

interface Props {
  href: string;
  label: string;
  /** Small line under the label. */
  tagline: string;
  slug: DomainSlug;
  motif: Motif;
}

/** Magnetic call-to-action dial in the domain's accent that fires rays on hover. */
export default function MagneticButton({ href, label, tagline, slug, motif }: Props) {
  const wrap = useRef<HTMLAnchorElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = wrap.current;
      const core = inner.current;
      if (!el || !core || window.matchMedia("(hover: none)").matches) return;

      const xTo = gsap.quickTo(core, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(core, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });

      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      };
      const leave = () => {
        xTo(0);
        yTo(0);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: wrap },
  );

  return (
    <a ref={wrap} href={href} className="group relative inline-grid size-64 place-items-center outline-none md:size-72">
      {/* Web rays */}
      <svg viewBox="-100 -100 200 200" className="pointer-events-none absolute inset-0 size-full text-fg" aria-hidden="true">
        {RAYS.map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="-46"
            x2="0"
            y2="-98"
            pathLength={1}
            transform={`rotate(${deg})`}
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="1"
            className="[stroke-dashoffset:1] transition-[stroke-dashoffset] duration-500 ease-out group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
            style={{ transitionDelay: `${(deg / 360) * 120}ms` }}
          />
        ))}
        <circle r="70" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="2 5" className="origin-center animate-[spin_30s_linear_infinite]" />
      </svg>

      <span ref={inner} className="relative grid size-40 place-items-center md:size-44">
        <span className="absolute inset-0 rounded-full bg-accent shadow-[0_0_0_6px_rgba(0,0,0,0.35),0_20px_60px_-10px_var(--d-accent)] transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute inset-0 translate-y-full rounded-full bg-accent2 transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:translate-y-0" />
          <MotifPattern motif={motif} className="absolute inset-0 size-full text-black/35 transition-transform duration-700 group-hover:rotate-45" />
        </span>
        <span className="absolute -inset-3 rounded-full border border-fg/30 transition-all duration-500 group-hover:-inset-5 group-hover:border-fg/60 group-focus-visible:border-fg" />

        <span className="relative flex flex-col items-center gap-1 text-fg">
          <DomainMark slug={slug} className="size-8 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110" />
          <span className="font-display text-2xl tracking-wider uppercase md:text-3xl">{label}</span>
          <span className="text-[9px] font-semibold tracking-[0.35em] uppercase opacity-80">{tagline}</span>
        </span>
      </span>
    </a>
  );
}
