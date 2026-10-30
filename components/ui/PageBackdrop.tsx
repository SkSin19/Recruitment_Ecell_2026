import Image from "next/image";
import type { Backdrop } from "@/lib/domains";

/**
 * One fixed backdrop behind every section. Sections fade their own artwork
 * into it, so the page reads as a single continuous scene.
 */
export default function PageBackdrop({ backdrop }: { backdrop: Backdrop }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#06080f]">
      {backdrop.kind === "photo" ? (
        <>
          <Image src={backdrop.src} alt="" fill sizes="100vw" className="scale-110 object-cover opacity-45 blur-[6px] brightness-[0.45] saturate-[0.7]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,15,0.55)_0%,rgba(10,16,32,0.35)_50%,rgba(6,8,15,0.8)_100%)]" />
        </>
      ) : (
        <SmokeLayers />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_50%,transparent_35%,rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}

/** Slow-drifting silver smoke over deep accent glows, rendered from SVG noise (no image needed). */
function SmokeLayers() {
  return (
    <>
      <div className="absolute inset-0 bg-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_25%_30%,color-mix(in_oklab,var(--d-accent)_26%,transparent),transparent_70%),radial-gradient(55%_40%_at_80%_75%,color-mix(in_oklab,var(--d-accent)_18%,transparent),transparent_70%),radial-gradient(70%_50%_at_50%_0%,color-mix(in_oklab,var(--d-deep)_90%,transparent),transparent_80%)]" />
      <svg className="absolute -inset-[10%] size-[120%] animate-[smoke-drift_60s_ease-in-out_infinite_alternate] opacity-25 mix-blend-screen" preserveAspectRatio="none">
        <filter id="page-smoke" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.007" numOctaves="5" seed="11" />
          <feColorMatrix values="0 0 0 0 0.78  0 0 0 0 0.79  0 0 0 0 0.86  0 0 0 1.6 -0.62" />
        </filter>
        <rect width="100%" height="100%" filter="url(#page-smoke)" />
      </svg>
    </>
  );
}
