"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import type { SwingConfig } from "@/lib/domains";
import { clamp01, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { CINEMATIC_GRADE } from "@/lib/grade";

/** Share of the pinned scroll spent on the swing itself; the rest reveals the copy. */
const SWING_END = 0.62;

/** Half-width of the soft band where the two city colours blend, in px. */
const SPLIT_FEATHER = 90;

const range = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));

/**
 * Mask that keeps everything left of the line from (top, 0) to (bottom, h),
 * feathered across SPLIT_FEATHER px on either side of it.
 */
function splitMask(top: number, bottom: number, w: number, h: number) {
  // Normal to the line, pointing at the side that stays hidden.
  const len = Math.hypot(h, bottom - top);
  const nx = h / len;
  const ny = (top - bottom) / len;
  const angle = (Math.atan2(nx, -ny) * 180) / Math.PI;
  // Where the line's midpoint falls along a CSS gradient line of this angle.
  const span = Math.abs(w * nx) + Math.abs(h * ny);
  const at = ((top + bottom) / 2 - w / 2) * nx + span / 2;
  return `linear-gradient(${angle}deg, #000 ${at - SPLIT_FEATHER}px, transparent ${at + SPLIT_FEATHER}px)`;
}

/**
 * Pinned night-city scene: the character swings in from the left on a web,
 * repainting the city behind him, and settles centre-screen between two
 * colour fields that each carry their own copy.
 */
export default function SwingSplit({ id, swing }: { id: string; swing: SwingConfig }) {
  const root = useRef<HTMLElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLDivElement>(null);
  const web = useRef<SVGPathElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || !figure.current || !trail.current || !web.current || !left.current || !right.current) return;
      const fig = figure.current;
      const trailEl = trail.current;
      const webEl = web.current;
      const leftEl = left.current;
      const rightEl = right.current;

      let vw = window.innerWidth;
      let vh = window.innerHeight;
      let figW = fig.offsetWidth;
      let figH = fig.offsetHeight;
      const measure = () => {
        vw = window.innerWidth;
        vh = window.innerHeight;
        figW = fig.offsetWidth;
        figH = fig.offsetHeight;
      };

      // Where the web leaves the cut-out, and the angle it leaves at (from vertical, towards the right).
      const attach = swing.figure.webAttach ?? { x: 0.5, y: 0 };
      const webAngle = ((swing.figure.webAngle ?? 0) * Math.PI) / 180;
      fig.style.transformOrigin = `${attach.x * 100}% ${attach.y * 100}%`;
      const splitFoot = swing.figure.splitFoot ?? 0.15;

      const theta0 = -1.35; // radians, start of the swing (off-screen left)
      const swingIn = gsap.parseEase("sine.in");

      const render = (p: number) => {
        const t = range(p, 0, SWING_END);
        // Gravity pulls the swing down to centre, then a short damped overshoot.
        let theta: number;
        if (t < 0.7) theta = theta0 * (1 - swingIn(t / 0.7));
        else {
          const u = (t - 0.7) / 0.3;
          theta = 0.22 * Math.sin(u * Math.PI * 2) * Math.exp(-3.2 * u);
        }

        // The pendulum swings the web attach point; the figure hangs off it.
        const restAX = vw / 2 + (attach.x - 0.5) * figW;
        // Far enough left that even the starting tilt can't poke any corner of the cut-out on screen.
        const r0 = (theta0 * 22 * Math.PI) / 180;
        const corners = [
          [-attach.x * figW, -attach.y * figH],
          [(1 - attach.x) * figW, -attach.y * figH],
          [-attach.x * figW, (1 - attach.y) * figH],
          [(1 - attach.x) * figW, (1 - attach.y) * figH],
        ];
        const startRight = Math.max(...corners.map(([cx, cy]) => cx * Math.cos(r0) - cy * Math.sin(r0)));
        const reach = restAX + startRight + 40;
        const ax = restAX + (reach / Math.sin(-theta0)) * Math.sin(theta);
        const restY = vh * (vw < 768 ? 0.3 : 0.1);
        const ay = restY - (vh * 0.28 * (1 - Math.cos(theta))) / (1 - Math.cos(theta0));
        const rot = theta * 22;

        fig.style.transform = `translate3d(${ax - attach.x * figW}px, ${ay - attach.y * figH}px, 0) rotate(${rot}deg)`;

        const a = webAngle + (rot * Math.PI) / 180;

        // The colour split hugs the character: it runs from just right of where the web
        // meets the top of the screen down to just left of his trailing leg.
        const splitTop = ax + Math.tan(a) * ay + SPLIT_FEATHER * 0.6;
        const splitBottom = ax - attach.x * figW + splitFoot * figW - SPLIT_FEATHER * 0.6;
        trailEl.style.setProperty("--split", splitMask(splitTop, splitBottom, vw, vh));

        // Continue the cut-out's own web line up and off the top of the screen.
        const topY = -vh * 0.15;
        const len = (ay - topY) / Math.max(0.2, Math.cos(a));
        webEl.setAttribute("d", `M${ax} ${ay} L${ax + Math.sin(a) * len} ${topY}`);

        const reveal = range(p, SWING_END - 0.04, SWING_END + 0.22);
        const e = gsap.parseEase("power3.out")(reveal);
        leftEl.style.opacity = String(e);
        leftEl.style.transform = `translate3d(${(1 - e) * -80}px, 0, 0)`;
        rightEl.style.opacity = String(e);
        rightEl.style.transform = `translate3d(${(1 - e) * 80}px, 0, 0)`;
      };

      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => render(self.progress),
        onRefresh: (self) => {
          measure();
          render(self.progress);
        },
      });
      measure();
      render(0);
    },
    { scope: root, dependencies: [swing] },
  );

  return (
    <section ref={root} id={id} aria-label={`${swing.left.title} ${swing.right.title}`} className="relative z-20 h-[340vh]">
      <div className="sticky top-0 h-svh overflow-x-clip">
        <TintedCity city={swing.city} tint={swing.restColor} />

        <div
          ref={trail}
          className="absolute inset-0 [mask-image:var(--split)] [-webkit-mask-image:var(--split)]"
          style={{ "--split": "linear-gradient(90deg, transparent, transparent)" } as CSSProperties}
        >
          <TintedCity city={swing.city} tint={swing.trailColor} />
        </div>

        <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
          <path ref={web} stroke="white" strokeOpacity="0.9" strokeWidth="1.6" fill="none" />
        </svg>

        <div ref={figure} className="absolute top-0 left-0 z-10 w-[min(70vw,460px)] will-change-transform md:w-[min(42vw,820px)]">
          <Image
            src={swing.figure.src}
            alt={swing.figure.alt}
            width={swing.figure.width}
            height={swing.figure.height}
            sizes="(min-width: 768px) 42vw, 70vw"
            loading="eager"
            className={`h-auto w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)] ${CINEMATIC_GRADE}`}
          />
        </div>

        <div
          ref={left}
          className="absolute top-20 left-0 z-20 w-full px-6 opacity-0 will-change-transform md:top-1/2 md:left-[4vw] md:w-[26vw] md:-translate-y-1/2 md:px-0"
        >
          <SideCopy side={swing.left} />
        </div>
        <div
          ref={right}
          className="absolute bottom-8 left-0 z-20 w-full px-6 text-right opacity-0 will-change-transform md:top-1/2 md:right-[4vw] md:bottom-auto md:left-auto md:w-[26vw] md:-translate-y-1/2 md:px-0"
        >
          <SideCopy side={swing.right} />
        </div>
      </div>
    </section>
  );
}

/** The night photo recoloured to a single hue while keeping its lights and contrast. */
function TintedCity({ city, tint }: { city: SwingConfig["city"]; tint: string }) {
  return (
    <div className="absolute inset-0 [mask-image:linear-gradient(180deg,transparent_0%,#000_38%,#000_72%,transparent_100%)]">
      <Image src={city.src} alt="" width={city.width} height={city.height} sizes="100vw" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 mix-blend-color" style={{ background: tint }} />
      <div className="absolute inset-0 opacity-40 mix-blend-soft-light" style={{ background: tint }} />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}

function SideCopy({ side }: { side: SwingConfig["left"] }) {
  return (
    <>
      <p className="mb-3 text-[11px] font-semibold tracking-[0.3em] text-fg/80 uppercase">{side.eyebrow}</p>
      <h2 className="font-display text-4xl leading-[0.92] text-fg uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)] md:text-[5.2vw]">
        {side.title}
      </h2>
      <p className="mt-3 text-[13px] leading-relaxed text-fg/85 md:mt-4 md:text-base">{side.body}</p>
    </>
  );
}
