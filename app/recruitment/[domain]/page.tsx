import { Suspense, type CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APPLY_HREF, DOMAINS, getDomain, type Domain, type Palette, type SectionConfig } from "@/lib/domains";
import DomainNav from "@/components/ui/DomainNav";
import ScrollPanHero from "@/components/sections/ScrollPanHero";
import SwingSplit from "@/components/sections/SwingSplit";
import WebBedJoin from "@/components/sections/WebBedJoin";
import KunaiHero from "@/components/sections/KunaiHero";
import JoinCta from "@/components/sections/JoinCta";
import SiteFooter from "@/components/sections/SiteFooter";
import ComingSoon from "@/components/sections/ComingSoon";
import PageBackdrop from "@/components/ui/PageBackdrop";

export function generateStaticParams() {
  return DOMAINS.map((d) => ({ domain: d.slug }));
}

export async function generateMetadata(props: PageProps<"/recruitment/[domain]">): Promise<Metadata> {
  const { domain: slug } = await props.params;
  const domain = getDomain(slug);
  if (!domain) return {};
  return {
    title: `${domain.name} · ${domain.character}`,
    description: `${domain.identity}. ${domain.caption}`,
  };
}

function paletteVars(p: Palette) {
  return {
    "--d-accent": p.accent,
    "--d-accent2": p.accent2,
    "--d-deep": p.deep,
    "--d-bg": p.bg,
    "--d-fg": p.fg,
  } as CSSProperties;
}

type Params = PageProps<"/recruitment/[domain]">["params"];

export default function DomainPage(props: PageProps<"/recruitment/[domain]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-obsidian" />}>
      <DomainExperience params={props.params} />
    </Suspense>
  );
}

function Section({
  section,
  nextId,
  prev,
  domain,
}: {
  section: SectionConfig;
  nextId: string;
  prev?: SectionConfig;
  domain: Domain;
}) {
  switch (section.type) {
    case "scroll-pan":
      return (
        <ScrollPanHero
          id={section.id}
          hero={section.hero}
          motif={domain.motif}
          nextId={nextId}
          cornerLeft={`KIIT E-Cell · ${domain.name}`}
          cornerRight="Recruitment 2026"
          fadeIn={Boolean(prev)}
          overlapPrev={prev?.type === "kunai"}
        />
      );
    case "swing":
      return <SwingSplit id={section.id} swing={section.swing} />;
    case "hammock":
      return <WebBedJoin id={section.id} join={section.join} slug={domain.slug} motif={domain.motif} />;
    case "kunai":
      return <KunaiHero id={section.id} kunai={section.kunai} accent={domain.palette.accent} />;
    case "cta":
      return <JoinCta id={section.id} cta={section.cta} slug={domain.slug} motif={domain.motif} />;
  }
}

async function DomainExperience({ params }: { params: Params }) {
  const { domain: slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const xp = domain.experience;

  return (
    <main className="grain isolate bg-bg text-fg" style={paletteVars(domain.palette)}>
      {xp && <PageBackdrop backdrop={xp.backdrop} />}
      <DomainNav current={domain.slug} applyHref={APPLY_HREF} />
      {xp ? (
        xp.sections.map((section, i) => (
          <Section key={section.id} section={section} domain={domain} prev={xp.sections[i - 1]} nextId={xp.sections[i + 1]?.id ?? "footer"} />
        ))
      ) : (
        <ComingSoon domain={domain} />
      )}
      <SiteFooter current={domain.slug} credits={domain.credits} merge={Boolean(xp)} />
    </main>
  );
}
