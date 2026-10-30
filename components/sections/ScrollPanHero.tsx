"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useLenis } from "lenis/react";
import type { HeroConfig, Motif } from "@/lib/domains";
import { clamp01, createSpring, gsap, ScrollTrigger, stairProgress, useGSAP } from "@/lib/gsap";
import { MotifPattern } from "@/components/ui/Motifs";
import { CINEMATIC_GRADE } from "@/lib/grade";

/** Viewport-heights of scroll spent travelling between two camera stops. */
const SCROLL_PER_STOP = 110;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Cutout mode framing, in viewport heights. */
const CUTOUT_DEFAULT_HEIGHT = 2.5;
/** The figure never gets wider than this share of the screen. */
const CUTOUT_MAX_WIDTH = 0.8;
const CUTOUT_EYE_LINE = 0.42;
const CUTOUT_HEADROOM = 0.2;
const CUTOUT_FLOOR = 0.07;

interface Props {
  id: string;
  hero: HeroConfig;
  motif: Motif;
  /** Element id of the section that follows, used by the scroll button on the last stop. */
  nextId: string;
  cornerLeft: string;
  cornerRight: string;
  /** Fade the background in at the top too, for sections that follow another one. */
  fadeIn?: boolean;
  /** Start on the previous section's final screen, so the entrance plays the moment it finishes. */
  overlapPrev?: boolean;
}

/**
 * Pinned section where scrolling moves a camera over the character and springs
 * onto each configured stop (head → chest → legs). With `enter: "drop"` the
 * character first falls in from above the screen. Works with a scroll-scrubbed
 * video, a tall still image or a transparent cut-out.
 */
export default function ScrollPanHero({ id, hero, motif, nextId, cornerLeft, cornerRight, fadeIn = false, overlapPrev = false }: Props) {
  const root = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const railFill = useRef<HTMLSpanElement>(null);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [active, setActive] = useState(0);
  const lenis = useLenis();

  const stops = hero.stops;
  const last = stops.length - 1;
  // An entrance (drop or rise) adds one scroll segment before the first stop.
  const first = hero.enter ? -1 : 0;
  const segments = Math.max(1, last - first);

  useGSAP(
    () => {
      const el = root.current;
      const mediaEl = media.current;
      if (!el || !mediaEl) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const overlays = gsap.utils.toArray<HTMLElement>("[data-stop]", el);
      const dots = gsap.utils.toArray<HTMLElement>("[data-dot]", el);
      const indices = Array.from({ length: last - first + 1 }, (_, i) => first + i);
      const spring = createSpring(first, reduce ? 900 : 90, reduce ? 60 : 15);

      let progress = 0;
      let shown = 0;
      let vw = window.innerWidth;
      let vh = window.innerHeight;
      let stageH = stage.current?.offsetHeight ?? 0;
      const onResize = () => {
        vw = window.innerWidth;
        vh = window.innerHeight;
        stageH = stage.current?.offsetHeight ?? 0;
      };
      window.addEventListener("resize", onResize);

      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progress = self.progress;
        },
      });

      const render = (c: number) => {
        const cc = Math.min(last, Math.max(0, c));
        const i0 = Math.min(Math.max(0, last - 1), Math.floor(cc));
        const f = last === 0 ? 0 : cc - i0;
        const a = stops[i0];
        const b = stops[Math.min(last, i0 + 1)];
        const focus = clamp01(lerp(a.focus, b.focus, f) + (c - cc) * 0.04);
        const zoom = lerp(a.zoom ?? 1, b.zoom ?? 1, f);
        // 1 while the character is still off-screen, 0 once in place (springs past 0 for a soft settle).
        const entering = first < 0 ? Math.min(1, -c) : 0;

        if (hero.media.kind === "video") {
          const v = video.current;
          if (v && v.readyState >= 1 && v.duration) {
            const t = focus * (v.duration - 0.05);
            if (!v.seeking && Math.abs(v.currentTime - t) > 0.015) v.currentTime = t;
          }
          mediaEl.style.transform = `translate3d(0, ${(0.5 - focus) * 4}vh, 0) scale(${1.06 * zoom})`;
        } else if (hero.media.kind === "cutout") {
          const y = Math.min(
            vh * CUTOUT_HEADROOM,
            Math.max(vh - stageH - vh * CUTOUT_FLOOR, vh * CUTOUT_EYE_LINE - focus * stageH),
          );
          const scale = zoom * (1 + Math.max(0, entering) * 0.06);
          // Start entirely off-screen: above the section for a drop, below it for a rise.
          let offset = 0;
          if (entering > 0) {
            offset = hero.enter === "rise" ? entering * (vh - y + vh * 0.1) : -entering * (y + stageH * scale + vh * 0.2);
          }
          if (stage.current) stage.current.style.transform = `translate3d(0, ${y + offset}px, 0) scale(${scale})`;
          mediaEl.style.transform = `translate3d(0, ${-focus * 8}vh, 0) scale(1.15)`;
        } else {
          const imgH = (vw * hero.media.height) / hero.media.width;
          const y = Math.min(0, Math.max(vh - imgH * zoom, vh / 2 - focus * imgH * zoom));
          mediaEl.style.transform = `translate3d(0, ${y}px, 0) scale(${zoom})`;
        }

        if (title.current) {
          title.current.style.transform = `translate3d(0, ${-c * 0.6 * vh}px, 0)`;
          title.current.style.opacity = String(clamp01(1 - c * 1.15));
        }

        overlays.forEach((o, i) => {
          const d = c - i;
          const op = clamp01(1 - Math.abs(d) * 2.4);
          o.style.opacity = String(op);
          o.style.transform = `translate3d(0, ${-d * 90}px, 0)`;
          o.style.visibility = op < 0.02 ? "hidden" : "visible";
        });

        if (railFill.current) railFill.current.style.transform = `scaleY(${last ? clamp01(c / last) : 1})`;

        const nearest = Math.round(cc);
        if (nearest !== shown) {
          shown = nearest;
          dots.forEach((dot, i) => dot.toggleAttribute("data-on", i === nearest));
          setActive(nearest);
        }
      };

      const tick = (_time: number, deltaMs: number) => {
        spring.target = stairProgress(progress, indices, 0.4);
        render(spring.step(Math.min(deltaMs / 1000, 1 / 20)));
      };

      render(first);
      gsap.ticker.add(tick);

      if (el.querySelector("[data-intro]")) {
        gsap.from("[data-intro]", { yPercent: 115, duration: 1.3, ease: "expo.out", stagger: 0.08, delay: 0.15 });
      }
      // transform is owned by the camera loop, so the intro only touches filter/opacity
      gsap.from(mediaEl, { opacity: 0, filter: "blur(18px)", duration: 1.8, ease: "expo.out" });

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: root, dependencies: [hero] },
  );

  const goToStop = (i: number) => {
    const el = root.current;
    if (!el || !lenis) return;
    if (i > last) {
      lenis.scrollTo(`#${nextId}`, { duration: 1.6 });
      return;
    }
    const top = el.getBoundingClientRect().top + window.scrollY;
    lenis.scrollTo(top + ((i - first) / segments) * (el.offsetHeight - window.innerHeight), { duration: 1.6 });
  };

  const words = hero.title?.split(" ") ?? [];
  const cutout = hero.media.kind === "cutout" ? hero.media : null;

  return (
    <section
      ref={root}
      id={id}
      aria-label={hero.label}
      className={overlapPrev ? "relative -mt-[100svh]" : "relative"}
      style={{ height: `calc(${segments * SCROLL_PER_STOP}vh + 100svh)` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Camera layer, inside a static fade wrapper: the camera layer is scaled and moved, so the fade must live
            outside it to reach zero exactly at the section's bottom edge and melt into the page backdrop. */}
        <div
          className={`absolute inset-0 ${
            fadeIn
              ? "[mask-image:linear-gradient(180deg,transparent_0%,#000_30%,#000_55%,transparent_96%)]"
              : "[mask-image:linear-gradient(180deg,#000_50%,transparent_96%)]"
          }`}
        >
          <div ref={media} className="absolute inset-0 origin-center will-change-transform">
            {cutout && !cutout.backdrop ? (
              // No scene of its own: only a soft glow, so the shared page backdrop runs straight through.
              <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_45%,color-mix(in_oklab,var(--d-accent)_30%,transparent)_0%,transparent_70%)]" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_10%,var(--d-accent2)_0%,var(--d-deep)_45%,var(--d-bg)_100%)] opacity-90" />
            )}
            <MotifPattern
              motif={motif}
              className="absolute top-1/2 left-1/2 size-[140vmax] -translate-x-1/2 -translate-y-1/2 text-fg/10"
            />

            {hero.media.kind === "video" && !mediaFailed && (
              <video
                ref={video}
                className="absolute inset-0 size-full object-cover"
                src={hero.media.src}
                poster={hero.media.poster}
                muted
                playsInline
                preload="auto"
                onError={() => setMediaFailed(true)}
              />
            )}

            {cutout?.backdrop && (
              <>
                <Image
                  src={cutout.backdrop.src}
                  alt=""
                  fill
                  sizes="100vw"
                  preload
                  className="scale-110 object-cover blur-[10px] brightness-110 saturate-150"
                />
                <div className="absolute inset-0 opacity-70 mix-blend-color" style={{ background: cutout.backdrop.tint }} />
                <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_18%_30%,rgba(214,38,120,0.45),transparent_70%),radial-gradient(35%_30%_at_85%_55%,rgba(214,38,120,0.35),transparent_70%),radial-gradient(60%_50%_at_60%_20%,rgba(64,224,208,0.35),transparent_70%)]" />
              </>
            )}

            {hero.media.kind === "image" && !mediaFailed && (
              <Image
                src={hero.media.src}
                alt={hero.media.alt}
                width={hero.media.width}
                height={hero.media.height}
                sizes="100vw"
                preload
                className="absolute top-0 left-0 h-auto w-full"
                onError={() => setMediaFailed(true)}
              />
            )}
            {!(cutout && !cutout.backdrop) && (
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,transparent_30%)]" />
            )}
          </div>
        </div>

        {/* Optional giant title, scrolls away with the camera */}
        {words.length > 0 && (
          <h1
            ref={title}
            className="pointer-events-none absolute inset-x-0 top-[17vh] flex flex-wrap justify-center gap-x-[3vw] px-4 text-center font-display text-[19vw] leading-[0.9] text-fg uppercase will-change-transform md:top-[14vh] md:text-[12.5vw]"
          >
            {words.map((w) => (
              <span key={w} className="-mb-[0.06em] inline-block overflow-hidden pb-[0.06em]">
                <span data-intro className="inline-block">
                  {w}
                </span>
              </span>
            ))}
          </h1>
        )}

        {/* Cutout figure: sits in front of the title, moved by the camera */}
        {cutout && (
          <div
            ref={stage}
            className="absolute top-0 left-1/2 origin-top -translate-x-1/2 will-change-transform"
            style={{
              height: `min(${(cutout.height ?? CUTOUT_DEFAULT_HEIGHT) * 100}svh, ${((CUTOUT_MAX_WIDTH * cutout.figure.height) / cutout.figure.width) * 100}vw)`,
              aspectRatio: `${cutout.figure.width} / ${cutout.figure.height}`,
            }}
          >
            <div className="absolute top-[94%] left-1/2 h-[7%] w-[220%] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_45%,rgba(5,6,10,0.85)_0%,rgba(5,6,10,0.5)_45%,transparent_100%)]" />
            <div className="absolute top-[97%] left-1/2 h-[2.5%] w-[120%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl" />
            <div className="relative size-full" style={{ filter: `drop-shadow(0 0 40px ${cutout.rim})` }}>
              <Image
                src={cutout.figure.src}
                alt={cutout.figure.alt}
                width={cutout.figure.width}
                height={cutout.figure.height}
                sizes="(min-width: 768px) 60vw, 100vw"
                preload
                className={`size-full ${CINEMATIC_GRADE}`}
              />
            </div>
            {cutout.props?.map((pr) => (
              <Image
                key={pr.src}
                src={pr.src}
                alt={pr.alt}
                width={pr.width}
                height={pr.height}
                sizes="20vw"
                className={`absolute bottom-[-1.2%] h-auto -translate-x-1/2 drop-shadow-[0_6px_6px_rgba(0,0,0,0.7)] ${CINEMATIC_GRADE}`}
                style={{ left: `${pr.x * 100}%`, width: `${pr.scale * 100}%` }}
              />
            ))}
          </div>
        )}

        {/* Copy for each camera stop */}
        {stops.map((s, i) => (
          <div
            key={s.id}
            data-stop
            style={{ opacity: i === 0 && first === 0 ? 1 : 0 }}
            className={`absolute z-10 max-w-md px-6 will-change-transform md:px-12 ${
              s.placement === "bottom" ? "bottom-[16vh]" : "top-1/2 -translate-y-1/2"
            } ${s.align === "right" ? "right-0 text-right" : "left-0"}`}
          >
            {s.eyebrow && (
              <p className={`mb-3 flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] text-fg/80 uppercase ${s.align === "right" ? "justify-end" : ""}`}>
                <span className="h-px w-8 bg-accent" />
                {s.eyebrow}
              </p>
            )}
            {s.title && <h2 className="font-display text-5xl leading-[0.95] text-fg uppercase md:text-7xl">{s.title}</h2>}
            {s.body && (
              <p className={`mt-4 max-w-sm text-sm leading-relaxed text-fg/75 md:text-base ${s.align === "right" ? "ml-auto" : ""}`}>{s.body}</p>
            )}
            {s.cta && (
              <a
                href={s.cta.href}
                tabIndex={i === active ? 0 : -1}
                className="group mt-6 inline-flex items-center gap-3 rounded-full border border-fg/40 py-2 pr-5 pl-2 text-[11px] font-semibold tracking-[0.2em] text-fg uppercase transition-colors hover:border-accent hover:bg-accent"
              >
                <span className="grid size-7 place-items-center rounded-full bg-accent text-fg transition-colors group-hover:bg-fg group-hover:text-accent">
                  <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
                    <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </span>
                {s.cta.label}
              </a>
            )}
          </div>
        ))}

        {/* Progress rail */}
        <div className="absolute top-1/2 right-6 z-10 hidden h-[34vh] -translate-y-1/2 md:right-10 md:block">
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-fg/20" />
          <span ref={railFill} className="absolute inset-y-0 left-1/2 w-px origin-top -translate-x-1/2 bg-accent" />
          {stops.map((s, i) => (
            <button
              key={s.id}
              type="button"
              data-dot
              data-on={i === 0 ? "" : undefined}
              onClick={() => goToStop(i)}
              aria-label={`Go to ${s.id}`}
              className="absolute left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fg/60 bg-bg transition-all duration-300 data-on:scale-150 data-on:border-accent data-on:bg-accent"
              style={{ top: `${last ? (i / last) * 100 : 0}%` }}
            />
          ))}
        </div>

        {/* Scroll ring */}
        <button
          type="button"
          onClick={() => goToStop(active + 1)}
          aria-label={active >= last ? "Scroll to next section" : "Scroll to next view"}
          className="group absolute bottom-[5vh] left-1/2 z-10 grid size-20 -translate-x-1/2 place-items-center"
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 animate-[spin_14s_linear_infinite] text-fg/70" aria-hidden="true">
            <defs>
              <path id={`${id}-ring`} d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0" />
            </defs>
            <text className="fill-current text-[10px] tracking-[0.35em] uppercase">
              <textPath href={`#${id}-ring`}>Scroll · Explore · Scroll · Explore ·</textPath>
            </text>
          </svg>
          <span className="relative grid size-9 place-items-center overflow-hidden rounded-full border border-fg/50 transition-colors group-hover:border-accent group-hover:bg-accent">
            <span className="block h-3 w-px animate-[scroll-dot_1.6s_ease-in-out_infinite] bg-fg" />
          </span>
        </button>

        <p className="absolute bottom-6 left-6 z-10 text-[10px] tracking-[0.3em] text-fg/60 uppercase md:left-10">{cornerLeft}</p>
        <p className="absolute right-6 bottom-6 z-10 text-[10px] tracking-[0.3em] text-fg/60 uppercase md:right-10">{cornerRight}</p>
      </div>
    </section>
  );
}
