import type { HeroSplashConfig } from "@/lib/domains";

/** Width of the diagonal on the wipe edge, in % of the screen. */
const SKEW = 18;
/** Share of the video (0–1) each wipe takes to cross the screen. */
const DEFAULT_RAMP = 0.05;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const polygon = (l: number, r: number) =>
  `polygon(${l}% 0, ${r}% 0, ${r - SKEW}% 100%, ${l - SKEW}% 100%)`;

/**
 * Full-screen wipe that covers a hard change in a scroll-scrubbed video.
 * Rendered once; `updateHeroSplash` moves it from the camera loop.
 */
export default function HeroSplash({ splash }: { splash: HeroSplashConfig }) {
  const row = `${splash.text} · `.repeat(6);
  return (
    <div data-splash className="pointer-events-none absolute inset-0 z-[5] invisible" aria-hidden="true">
      <div data-splash-panel className="absolute inset-0 overflow-hidden bg-bg">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,color-mix(in_oklab,var(--d-accent)_22%,transparent)_0%,transparent_70%)]" />
        <div className="absolute inset-0 flex -rotate-6 flex-col justify-center gap-[2vh] font-display text-[13vw] leading-[0.95] whitespace-nowrap uppercase md:text-[9vw]">
          {[0, 1, 2, 3].map((i) => (
            <p
              key={i}
              data-splash-row
              className={
                i % 2
                  ? "text-[color-mix(in_oklab,var(--d-accent)_16%,transparent)]"
                  : "text-transparent [-webkit-text-stroke:1px_color-mix(in_oklab,var(--d-accent)_45%,transparent)]"
              }
            >
              {row}
            </p>
          ))}
        </div>
        {/* light streak through the middle */}
        <div
          data-splash-streak
          className="absolute top-1/2 left-0 h-px w-full origin-center -translate-y-1/2 bg-[linear-gradient(90deg,transparent,var(--d-accent)_30%,var(--d-fg)_50%,var(--d-accent)_70%,transparent)] shadow-[0_0_24px_var(--d-accent)]"
        />
      </div>
      {/* bright accent bar riding the wipe edge */}
      <div data-splash-edge className="absolute inset-0 bg-accent shadow-[0_0_40px_var(--d-accent)]" />
    </div>
  );
}

/** Position the splash for the current video focus (0–1). */
export function updateHeroSplash(root: HTMLElement, splash: HeroSplashConfig, focus: number) {
  const el = root.querySelector<HTMLElement>("[data-splash]");
  if (!el) return;
  const ramp = splash.ramp ?? DEFAULT_RAMP;
  const start = splash.at - splash.hold / 2 - ramp;
  const end = splash.at + splash.hold / 2;
  const pin = clamp01((focus - start) / ramp);
  const pout = clamp01((focus - end) / ramp);
  const visible = pin > 0 && pout < 1;
  el.style.visibility = visible ? "visible" : "hidden";
  if (!visible) return;

  // ease so the wipe snaps across instead of crawling
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const r = ease(pin) * (100 + SKEW);
  const l = ease(pout) * (100 + SKEW);
  const panel = el.querySelector<HTMLElement>("[data-splash-panel]");
  const edge = el.querySelector<HTMLElement>("[data-splash-edge]");
  if (panel) panel.style.clipPath = polygon(l, r);
  if (edge) {
    // the bar leads the way in, then trails the way out
    const x = pout > 0 ? l : r;
    const w = 0.6 + Math.sin(Math.PI * (pout > 0 ? pout : pin)) * 1.4;
    edge.style.clipPath = polygon(x - w, x);
    edge.style.opacity = pin >= 1 && pout <= 0 ? "0" : "1";
  }

  // text rows drift in opposite directions while the splash is up
  const drift = (focus - splash.at) / (splash.hold / 2 + ramp);
  el.querySelectorAll<HTMLElement>("[data-splash-row]").forEach((row, i) => {
    const dir = i % 2 ? 1 : -1;
    row.style.transform = `translate3d(${-25 + dir * drift * 12}%, 0, 0)`;
  });
  const streak = el.querySelector<HTMLElement>("[data-splash-streak]");
  if (streak) streak.style.transform = `translateY(-50%) scaleX(${0.15 + 0.85 * Math.min(pin, 1 - pout)})`;
}
