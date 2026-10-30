"use client";

import Image from "next/image";
import { useRef } from "react";
import type { DomainSlug, JoinConfig, Motif } from "@/lib/domains";
import { gsap, useGSAP } from "@/lib/gsap";
import { CINEMATIC_GRADE } from "@/lib/grade";
import MagneticButton from "@/components/ui/MagneticButton";
import { WebPattern } from "@/components/ui/WebPattern";

/**
 * Final call to action. The character rests in a web hammock that spans the
 * full width and sits above the footer, whose top fades in behind the web (see SiteFooter `merge`).
 */
export default function WebBedJoin({ id, join, slug, motif }: { id: string; join: JoinConfig; slug: DomainSlug; motif: Motif }) {
  const root = useRef<HTMLElement>(null);
  const bed = useRef<HTMLDivElement>(null);
  const hammock = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const bedEl = bed.current;
      const hammockEl = hammock.current;
      if (!el || !bedEl || !hammockEl) return;

      gsap.set(hammockEl, { yPercent: -45, opacity: 0, transformOrigin: "50% 0%" });

      // Drops into place, the web stretches and springs back, then sways gently.
      gsap
        .timeline({ scrollTrigger: { trigger: bedEl, start: "top 90%", once: true } })
        .to(hammockEl, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power2.in" })
        .to(hammockEl, { scaleY: 1.08, duration: 0.16, ease: "power2.out" })
        .to(hammockEl, { scaleY: 1, duration: 1.4, ease: "elastic.out(1, 0.3)" })
        .to(hammockEl, { y: 6, rotate: 0.4, duration: 2.8, ease: "sine.inOut", repeat: -1, yoyo: true });

      gsap.from("[data-join-intro]", {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.06,
        scrollTrigger: { trigger: el, start: "top 65%", once: true },
      });
    },
    { scope: root, dependencies: [join] },
  );

  return (
    <section ref={root} id={id} aria-labelledby={`${id}-title`} className="relative overflow-clip">
      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_40%,color-mix(in_oklab,var(--d-accent2)_30%,transparent)_0%,transparent_70%)]" />
      <WebPattern className="absolute -top-[30vmax] left-1/2 size-[110vmax] -translate-x-1/2 text-fg/[0.07]" />

      <div className="relative z-10 flex flex-col items-center px-6 pt-[18vh] text-center">
        <p className="overflow-hidden text-[11px] font-semibold tracking-[0.4em] text-fg/70 uppercase">
          <span data-join-intro className="inline-block">
            Recruitment 2026 · Final call
          </span>
        </p>
        <h2 id={`${id}-title`} className="mt-4 overflow-hidden font-display text-[26vw] leading-[0.8] text-fg uppercase md:text-[17vw]">
          <span data-join-intro className="inline-block">
            {join.heading}
          </span>
        </h2>
        <p className="mt-4 max-w-xl overflow-hidden text-sm leading-relaxed text-fg/75 md:text-base">
          <span data-join-intro className="inline-block">
            {join.subheading}
          </span>
        </p>
        <div className="mt-4">
          <MagneticButton href={join.button.href} label={join.button.label} tagline="Thwip to apply" slug={slug} motif={motif} />
        </div>
      </div>

      <div ref={bed} className="relative z-20 -mt-[5vw]">
        <div ref={hammock} className="will-change-transform [mask-image:linear-gradient(180deg,#000_90%,transparent)]">
          <Image
            src={join.figure.src}
            alt={join.figure.alt}
            width={join.figure.width}
            height={join.figure.height}
            sizes="100vw"
            className={`h-auto w-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.7)] ${CINEMATIC_GRADE}`}
          />
        </div>
      </div>
    </section>
  );
}
