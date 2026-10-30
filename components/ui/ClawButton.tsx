"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { CircuitPattern, PantherMark } from "./Motifs";

/** Angular plate outline shared by the energy border and the plate itself. */
const PLATE = "polygon(7% 0, 93% 0, 100% 50%, 93% 100%, 7% 100%, 0 50%)";

const CLAWS = [
  "M -10 118 L 150 -18",
  "M 40 128 L 200 -8",
  "M 90 138 L 250 2",
];

/**
 * Black Panther call to action: a vibranium plate with kinetic energy racing
 * round its edge. On hover three claw strikes tear across it and the energy
 * flares; it also leans towards the pointer.
 */
export default function ClawButton({ href, label, tagline }: { href: string; label: string; tagline: string }) {
  const wrap = useRef<HTMLAnchorElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = wrap.current;
      const core = inner.current;
      if (!el || !core || window.matchMedia("(hover: none)").matches) return;

      const xTo = gsap.quickTo(core, "x", { duration: 0.7, ease: "elastic.out(1, 0.45)" });
      const yTo = gsap.quickTo(core, "y", { duration: 0.7, ease: "elastic.out(1, 0.45)" });
      const rTo = gsap.quickTo(core, "rotationY", { duration: 0.7, ease: "power3.out" });

      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        xTo(dx * 0.18);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
        rTo((dx / r.width) * 18);
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
    <a ref={wrap} href={href} className="group relative inline-block px-10 py-12 outline-none [perspective:800px]">
      <span ref={inner} className="relative block h-28 w-[min(86vw,24rem)] [transform-style:preserve-3d]">
        {/* Kinetic energy border */}
        <span
          className="absolute -inset-[3px] animate-[claw-spin_4s_linear_infinite] bg-[conic-gradient(from_var(--claw-angle),transparent_0deg,var(--d-accent)_70deg,var(--d-accent2)_110deg,transparent_160deg,transparent_200deg,var(--d-accent)_270deg,transparent_320deg)] opacity-80 transition-opacity duration-500 group-hover:opacity-100 group-hover:[animation-duration:1.4s]"
          style={{ clipPath: PLATE }}
        />
        {/* Glow that flares on hover */}
        <span
          className="absolute -inset-6 bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_oklab,var(--d-accent)_55%,transparent),transparent_70%)] opacity-40 blur-xl transition-opacity duration-500 group-hover:opacity-90 group-focus-visible:opacity-90"
          aria-hidden="true"
        />
        {/* The plate */}
        <span
          className="absolute inset-0 overflow-hidden bg-[linear-gradient(160deg,#17102a_0%,#0a0612_55%,#120a20_100%)]"
          style={{ clipPath: PLATE }}
        >
          <CircuitPattern className="absolute inset-0 size-full text-accent2/15" />
          <span className="absolute inset-x-[7%] top-0 h-px bg-[linear-gradient(90deg,transparent,var(--d-accent2),transparent)] opacity-60" />
          <svg viewBox="0 0 240 120" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
            {CLAWS.map((d, i) => (
              <path
                key={d}
                d={d}
                pathLength={1}
                strokeDasharray="1"
                className="fill-none stroke-accent2 [stroke-dashoffset:1] [stroke-width:2.2] transition-[stroke-dashoffset] duration-300 ease-out group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
                style={{ transitionDelay: `${i * 70}ms`, filter: "drop-shadow(0 0 4px var(--d-accent))" }}
              />
            ))}
          </svg>
        </span>

        <span className="relative flex h-full items-center justify-center gap-4 text-fg">
          <PantherMark className="size-9 text-accent2 transition-transform duration-500 group-hover:scale-110 group-hover:text-fg" />
          <span className="flex flex-col items-start">
            <span className="font-display text-3xl tracking-[0.12em] uppercase md:text-4xl">{label}</span>
            <span className="text-[9px] font-semibold tracking-[0.45em] text-accent2 uppercase">{tagline}</span>
          </span>
        </span>
      </span>
    </a>
  );
}
