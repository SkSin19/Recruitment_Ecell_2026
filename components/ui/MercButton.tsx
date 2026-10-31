"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DeadpoolMark } from "./Motifs";

/** Two katana cuts that cross the plate on hover. */
const SLASHES = ["M -8 -10 L 248 130", "M 248 -10 L -8 130"];

/**
 * Deadpool call to action: a skewed comic panel in his red with a heavy ink
 * outline and offset shadow. On hover the mask winks, two katana slashes cross
 * the panel, a speech bubble pops out and the panel punches towards the viewer;
 * it also leans towards the pointer.
 */
export default function MercButton({ href, label, tagline }: { href: string; label: string; tagline: string }) {
  const wrap = useRef<HTMLAnchorElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = wrap.current;
      const core = inner.current;
      if (!el || !core || window.matchMedia("(hover: none)").matches) return;

      const xTo = gsap.quickTo(core, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(core, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const rTo = gsap.quickTo(core, "rotation", { duration: 0.6, ease: "power3.out" });

      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        xTo(dx * 0.16);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
        rTo((dx / r.width) * 6);
      };
      const leave = () => {
        xTo(0);
        yTo(0);
        rTo(0);
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
    <a ref={wrap} href={href} className="group relative inline-block px-10 pt-20 pb-12 outline-none">
      <span ref={inner} className="relative block">
        {/* speech bubble that pops out on hover */}
        <span className="pointer-events-none absolute -top-16 right-2 origin-bottom-left scale-0 -rotate-6 border-[3px] border-[#111] bg-[#FFF3C4] px-3 py-1.5 font-display text-lg text-[#111] uppercase shadow-[4px_4px_0_#111] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-100 group-focus-visible:scale-100">
          {tagline}!
          <span className="absolute -bottom-[11px] left-5 size-4 rotate-45 border-r-[3px] border-b-[3px] border-[#111] bg-[#FFF3C4]" />
        </span>

        <span className="relative block h-24 w-[min(84vw,23rem)] -skew-x-6 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105 group-active:scale-95">
          {/* hard ink shadow that grows as the panel punches out */}
          <span className="absolute inset-0 translate-x-2 translate-y-2 bg-[#111] transition-transform duration-300 group-hover:translate-x-3.5 group-hover:translate-y-3.5" />
          <span className="absolute inset-0 overflow-hidden border-[3px] border-[#111] bg-accent">
            {/* halftone dots in the corner, like printed comic ink */}
            <span className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.28)_1.2px,transparent_1.6px)] [background-size:9px_9px] [mask-image:linear-gradient(115deg,transparent_45%,#000_100%)]" />
            <span className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent)]" />
            <svg viewBox="0 0 240 120" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
              {SLASHES.map((d, i) => (
                <path
                  key={d}
                  d={d}
                  pathLength={1}
                  strokeDasharray="1"
                  className="fill-none stroke-[#F2F0EC] [stroke-dashoffset:1] [stroke-width:3] transition-[stroke-dashoffset] duration-200 ease-out group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
                  style={{ transitionDelay: `${i * 110}ms`, filter: "drop-shadow(0 0 3px #fff)" }}
                />
              ))}
            </svg>
          </span>

          <span className="relative flex h-full skew-x-6 items-center justify-center gap-4 text-[#F2F0EC]">
            <DeadpoolMark className="size-12 drop-shadow-[2px_2px_0_#111] transition-transform duration-300 group-hover:-rotate-12" />
            <span className="flex flex-col items-start">
              <span className="font-display text-4xl leading-none tracking-[0.06em] uppercase [text-shadow:3px_3px_0_#111]">{label}</span>
              <span className="mt-1 text-[9px] font-semibold tracking-[0.45em] text-[#111] uppercase">{tagline}</span>
            </span>
          </span>
        </span>
      </span>
    </a>
  );
}
