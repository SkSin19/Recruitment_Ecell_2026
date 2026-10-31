"use client";

import { useRef } from "react";
import type { CtaConfig, DomainSlug, Motif } from "@/lib/domains";
import { gsap, useGSAP } from "@/lib/gsap";
import MagneticButton from "@/components/ui/MagneticButton";
import ClawButton from "@/components/ui/ClawButton";
import MercButton from "@/components/ui/MercButton";
import { DomainMark, MotifPattern } from "@/components/ui/Motifs";

/** Final call to action for domains without a bespoke closing scene. Fades into the footer below. */
export default function JoinCta({ id, cta, slug, motif }: { id: string; cta: CtaConfig; slug: DomainSlug; motif: Motif }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-cta-intro]", {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.06,
        scrollTrigger: { trigger: root.current, start: "top 65%", once: true },
      });
      gsap.fromTo(
        "[data-cta-emblem]",
        { scale: 0.85, opacity: 0, rotate: -8 },
        { scale: 1, opacity: 1, rotate: 0, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 70%", once: true } },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} aria-labelledby={`${id}-title`} className="relative overflow-clip pb-[18vw] md:pb-[14vw]">
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_45%,color-mix(in_oklab,var(--d-accent)_32%,transparent)_0%,transparent_70%)]" />
      <MotifPattern motif={motif} className="absolute top-1/2 left-1/2 size-[110vmax] -translate-x-1/2 -translate-y-1/2 text-accent2/[0.08]" />
      <div data-cta-emblem className="pointer-events-none absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DomainMark slug={slug} className="size-[70vmin] text-accent opacity-[0.12] drop-shadow-[0_0_60px_var(--d-accent)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 pt-[18vh] text-center">
        <p className="overflow-hidden text-[11px] font-semibold tracking-[0.4em] text-fg/70 uppercase">
          <span data-cta-intro className="inline-block">
            Recruitment 2026 · Final call
          </span>
        </p>
        <h2 id={`${id}-title`} className="mt-4 overflow-hidden font-display text-[26vw] leading-[0.8] text-fg uppercase md:text-[17vw]">
          <span data-cta-intro className="inline-block">
            {cta.heading}
          </span>
        </h2>
        <p className="mt-4 max-w-xl overflow-hidden text-sm leading-relaxed text-fg/75 md:text-base">
          <span data-cta-intro className="inline-block">
            {cta.subheading}
          </span>
        </p>
        <div className="mt-4">
          {cta.button.style === "claw" ? (
            <ClawButton href={cta.button.href} label={cta.button.label} tagline={cta.buttonTagline} />
          ) : cta.button.style === "merc" ? (
            <MercButton href={cta.button.href} label={cta.button.label} tagline={cta.buttonTagline} />
          ) : (
            <MagneticButton href={cta.button.href} label={cta.button.label} tagline={cta.buttonTagline} slug={slug} motif={motif} />
          )}
        </div>
      </div>
    </section>
  );
}
