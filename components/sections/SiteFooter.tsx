import Link from "next/link";
import { DOMAINS, type DomainSlug } from "@/lib/domains";

/** Footer that sits directly under the web bed (shares its obsidian fill). */
export default function SiteFooter({
  current,
  credits,
  merge = false,
}: {
  current: DomainSlug;
  credits?: string;
  /** Pull the footer up behind the section above so its top fades in under that artwork. */
  merge?: boolean;
}) {
  return (
    <footer
      id="footer"
      className={`relative px-6 pb-10 text-offwhite md:px-12 ${
        merge
          ? "-mt-[11vw] bg-[linear-gradient(180deg,transparent_0,color-mix(in_oklab,var(--d-bg)_75%,transparent)_6vw,color-mix(in_oklab,var(--d-bg)_90%,transparent)_12vw)] pt-[12vw]"
          : "bg-obsidian pt-6"
      }`}
    >
      <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-4xl tracking-wide uppercase">
            KIIT E-Cell <span className="text-crimson">/</span> Doomsday
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-coolgrey">
            Eight characters. Eight domains. One mission. Find where you belong in the KIIT E-Cell recruitment drive 2026.
          </p>
        </div>

        <nav aria-label="Domains">
          <p className="mb-4 text-[11px] font-semibold tracking-[0.3em] text-coolgrey uppercase">Domains</p>
          <ul className="grid grid-cols-2 gap-y-2 text-sm">
            {DOMAINS.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/recruitment/${d.slug}`}
                  aria-current={d.slug === current ? "page" : undefined}
                  className="group inline-flex items-center gap-2 text-offwhite/80 transition-colors hover:text-offwhite"
                >
                  <span className="size-1.5 rounded-full transition-transform group-hover:scale-150" style={{ background: d.palette.accent }} />
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-4 text-[11px] font-semibold tracking-[0.3em] text-coolgrey uppercase">Connect</p>
          <ul className="space-y-2 text-sm text-offwhite/80">
            <li>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="hover:text-offwhite">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="hover:text-offwhite">
                LinkedIn
              </a>
            </li>
            <li>
              <a href="mailto:ecell@kiit.ac.in" className="hover:text-offwhite">
                ecell@kiit.ac.in
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-2 pt-6 text-[11px] tracking-[0.2em] text-coolgrey uppercase md:flex-row">
        <p>© 2026 KIIT E-Cell</p>
        <p>Doomsday recruitment campaign</p>
      </div>
      {credits && <p className="mt-4 text-[10px] leading-relaxed text-coolgrey/70">{credits}</p>}
    </footer>
  );
}
