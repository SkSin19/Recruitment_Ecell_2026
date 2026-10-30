import type { CSSProperties } from "react";
import Link from "next/link";
import { DOMAINS } from "@/lib/domains";

/** Temporary index until the DOOMSDAY homepage is designed. */
export default function Home() {
  return (
    <main className="min-h-svh bg-obsidian px-6 py-20 text-offwhite md:px-16">
      <p className="text-[11px] font-semibold tracking-[0.4em] text-crimson uppercase">KIIT E-Cell · Recruitment 2026</p>
      <h1 className="mt-4 font-display text-[18vw] leading-[0.85] uppercase md:text-[11vw]">The world needs a new team.</h1>
      <p className="mt-6 max-w-lg text-coolgrey">Eight domains. Eight distinct strengths. One mission.</p>
      <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DOMAINS.map((d) => (
          <li key={d.slug}>
            <Link
              href={`/recruitment/${d.slug}`}
              className="group block border border-white/10 p-5 transition-colors hover:border-(--accent)"
              style={{ "--accent": d.palette.accent } as CSSProperties}
            >
              <span className="text-[10px] tracking-[0.3em] text-coolgrey uppercase">{d.character}</span>
              <span className="mt-1 block font-display text-4xl uppercase transition-colors group-hover:text-(--accent)">{d.name}</span>
              <span className="mt-2 block text-xs text-coolgrey">{d.identity}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
