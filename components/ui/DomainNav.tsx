"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { DOMAINS, type DomainSlug } from "@/lib/domains";
import { gsap, useGSAP } from "@/lib/gsap";
import { DomainMark } from "./Motifs";

export default function DomainNav({ current, applyHref }: { current: DomainSlug; applyHref: string }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useGSAP(
    () => {
      if (!panel.current) return;
      if (open) {
        gsap.set(panel.current, { display: "flex" });
        gsap.fromTo(panel.current, { clipPath: "circle(0% at 3rem 2.5rem)" }, { clipPath: "circle(150% at 3rem 2.5rem)", duration: 0.8, ease: "power3.inOut" });
        gsap.fromTo("[data-menu-item]", { yPercent: 110 }, { yPercent: 0, stagger: 0.04, duration: 0.7, ease: "power3.out", delay: 0.2 });
      } else {
        gsap.to(panel.current, {
          clipPath: "circle(0% at 3rem 2.5rem)",
          duration: 0.5,
          ease: "power3.in",
          onComplete: () => gsap.set(panel.current, { display: "none" }),
        });
      }
    },
    { dependencies: [open], scope: panel },
  );

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-70 flex items-center justify-between px-5 py-5 md:px-10">
        <div className="pointer-events-auto flex items-center gap-4">
          <Link href="/" aria-label="KIIT E-Cell home" className="text-fg transition-colors hover:text-accent">
            <DomainMark slug={current} className="size-7" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="domain-menu"
            aria-label={open ? "Close domains menu" : "Open domains menu"}
            className="group relative flex h-9 w-9 flex-col items-center justify-center gap-1.5"
          >
            <span className={`h-px w-5 bg-fg transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-5 bg-fg transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>

        <p className="hidden font-display text-base tracking-[0.35em] text-fg/90 md:block">
          KIIT E-CELL <span className="text-accent">·</span> DOOMSDAY
        </p>

        <a
          href={applyHref}
          className="pointer-events-auto rounded-full bg-fg px-4 py-2 whitespace-nowrap text-[11px] font-semibold tracking-[0.18em] text-bg uppercase transition-colors hover:bg-accent hover:text-fg"
        >
          Apply now
        </a>
      </header>

      <div
        ref={panel}
        id="domain-menu"
        style={{ display: "none" }}
        className="fixed inset-0 z-60 flex-col justify-center bg-obsidian/95 px-6 backdrop-blur-md md:px-16"
        data-lenis-prevent
      >
        <p className="mb-6 text-xs tracking-[0.4em] text-coolgrey uppercase">Eight domains · One mission</p>
        <nav className="grid gap-x-12 md:grid-cols-2">
          {DOMAINS.map((d) => (
            <div key={d.slug} className="overflow-hidden border-b border-white/10">
              <Link
                data-menu-item
                href={`/recruitment/${d.slug}`}
                onClick={() => setOpen(false)}
                aria-current={d.slug === current ? "page" : undefined}
                className="group flex items-baseline justify-between gap-4 py-3"
                style={{ color: d.slug === current ? d.palette.accent : undefined }}
              >
                <span className="font-display text-4xl uppercase transition-transform duration-300 group-hover:translate-x-2 md:text-6xl">
                  {d.name}
                </span>
                <span className="text-xs tracking-[0.25em] text-coolgrey uppercase" style={{ color: d.palette.accent2 }}>
                  {d.character}
                </span>
              </Link>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
