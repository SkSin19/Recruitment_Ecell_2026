import Link from "next/link";
import type { Domain } from "@/lib/domains";

/** Placeholder for domains whose character experience hasn't been built yet. */
export default function ComingSoon({ domain }: { domain: Domain }) {
  return (
    <section className="relative grid min-h-svh place-items-center overflow-hidden px-6 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_30%,var(--d-deep)_0%,var(--d-bg)_75%)]" />
      <div className="relative">
        <p className="text-[11px] font-semibold tracking-[0.4em] text-accent2 uppercase">
          {domain.name} · {domain.character}
        </p>
        <h1 className="mt-4 font-display text-[16vw] leading-[0.85] text-fg uppercase md:text-[10vw]">{domain.headline}</h1>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-fg/75 md:text-base">{domain.caption}</p>
        <p className="mt-10 inline-block border border-accent px-4 py-2 text-[11px] tracking-[0.3em] text-fg uppercase">
          {domain.identity} — reveal incoming
        </p>
        <div className="mt-8">
          <Link href="/recruitment/rnd" className="text-xs tracking-[0.25em] text-fg/60 uppercase underline-offset-4 hover:text-fg hover:underline">
            Meanwhile, meet R&amp;D →
          </Link>
        </div>
      </div>
    </section>
  );
}
