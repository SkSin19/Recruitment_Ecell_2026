"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { KunaiConfig } from "@/lib/domains";
import { buildKunai, KUNAI_LENGTH } from "@/lib/kunai";
import { clamp01, createSpring, gsap, ScrollTrigger } from "@/lib/gsap";

const range = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t: number) => t * t * t;

/* Scroll choreography, as fractions of the pinned section. */
const FLY = [0.08, 0.26] as const; // slices through the title
const SLASH = [0.16, 0.27] as const; // the cut races ahead of the tip to the far edge
const SPLIT = [0.25, 0.42] as const; // the two halves fall apart
const SETTLE = [0.26, 0.4] as const; // camera eases in from the wide shot
const ZOOM_IN = [0.4, 0.58] as const;
const ZOOM_OUT = [0.66, 0.8] as const;
const EXIT = [0.88, 1] as const;

const FOV = 30;
const CLOSE_UP_DISTANCE = 1.9;
/** Width (world units) the close-up must keep in frame so the whole etched word shows. */
const ETCH_SPAN = 1.25;
/** How much further back the camera sits while the knife flies in, so it first appears small. */
const FLY_DISTANCE_FACTOR = 1.9;

/** Dark product-photography studio: black walls with a few softbox strips and a purple bounce card. */
function studioScene(accent: string) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040406);
  const panels: [number, number, THREE.ColorRepresentation, number, [number, number, number], [number, number, number]][] = [
    [12, 0.5, 0xffffff, 7, [0, 5, 1], [Math.PI / 2, 0, 0]],
    [0.6, 7, 0xffffff, 3.5, [-6, 0.5, 2], [0, Math.PI / 2, 0]],
    [0.5, 6, 0xffffff, 2, [6, 0, 3], [0, -Math.PI / 2, 0]],
    [9, 2.5, accent, 3, [0, -4, -3], [-Math.PI / 4, 0, 0]],
  ];
  for (const [w, h, color, intensity, pos, rot] of panels) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    scene.add(mesh);
  }
  return scene;
}

/**
 * Pinned 3D intro: a giant line of type sits alone on screen; a kunai flies in
 * from the left spinning about its long axis (tip always right) and slices it
 * through the middle; the halves fall away, the camera pushes in on the word
 * etched into the blade, pulls back, and the knife leaves.
 */
export default function KunaiHero({ id, kunai, accent }: { id: string; kunai: KunaiConfig; accent: string }) {
  const root = useRef<HTMLElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const titleTop = useRef<HTMLDivElement>(null);
  const titleBottom = useRef<HTMLDivElement>(null);
  const slash = useRef<HTMLDivElement>(null);
  const tagline = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const wrap = canvasWrap.current;
    if (!el || !wrap) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      // No WebGL: the title simply stays on screen without the knife.
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "absolute inset-0 size-full";
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const studio = studioScene(accent);
    scene.environment = pmrem.fromScene(studio, 0.02).texture;
    scene.environmentIntensity = 1;

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 4, 6);
    const rim = new THREE.DirectionalLight(new THREE.Color(accent), 3);
    rim.position.set(-5, 2, -4);
    scene.add(key, rim);

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 100);
    const lookAt = new THREE.Vector3();
    const tip = new THREE.Vector3();

    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-anton").trim() || "Impact, sans-serif";
    let knife: ReturnType<typeof buildKunai> | null = null;
    let disposed = false;

    // Wait for the display font so the etch isn't drawn in a fallback face.
    document.fonts
      .load(`200px ${fontFamily}`)
      .catch(() => undefined)
      .then(() => {
        if (disposed) return;
        knife = buildKunai(kunai.etch, accent, fontFamily);
        knife.group.position.x = -100;
        scene.add(knife.group);
      });

    let width = 1;
    let baseDistance = 10;
    let closeDistance = CLOSE_UP_DISTANCE;
    let halfViewWidth = 4;
    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      width = w;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      // Fit the whole knife with margin, whatever the aspect ratio.
      baseDistance = Math.max(9, (KUNAI_LENGTH * 0.72) / (tanHalf * camera.aspect));
      closeDistance = Math.max(CLOSE_UP_DISTANCE, ETCH_SPAN / 2 / (tanHalf * camera.aspect));
      halfViewWidth = baseDistance * FLY_DISTANCE_FACTOR * tanHalf * camera.aspect;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let progress = 0;
    let inView = false;
    const spring = createSpring(0, 70, 15);
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress = self.progress;
      },
    });
    const visibility = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        inView = self.isActive;
      },
    });
    inView = visibility.isActive;

    const show = (node: HTMLElement | null, v: number, lift = 0) => {
      if (!node) return;
      node.style.opacity = String(v);
      node.style.transform = `translate3d(0, ${(1 - v) * lift}px, 0)`;
      node.style.visibility = v < 0.01 ? "hidden" : "visible";
    };

    const tick = (time: number, deltaMs: number) => {
      spring.target = progress;
      const p = spring.step(Math.min(deltaMs / 1000, 1 / 20));
      if (!inView) return;

      // --- the title halves ----------------------------------------------------------
      const split = easeOut(range(p, ...SPLIT));
      const fade = 1 - range(p, 0.32, 0.44);
      if (titleTop.current && titleBottom.current) {
        titleTop.current.style.transform = `translate3d(${-split * 3}vw, ${-split * 9}vh, 0) rotate(${-split * 2.5}deg)`;
        titleBottom.current.style.transform = `translate3d(${split * 3}vw, ${split * 9}vh, 0) rotate(${split * 2}deg)`;
        titleTop.current.style.opacity = titleBottom.current.style.opacity = String(fade);
      }

      if (!knife) return;

      // --- the knife ------------------------------------------------------------------
      const fly = easeOut(range(p, ...FLY));
      const settle = easeInOut(range(p, ...SETTLE));
      const zoom = easeInOut(range(p, ...ZOOM_IN)) * (1 - easeInOut(range(p, ...ZOOM_OUT)));
      const exit = easeIn(range(p, ...EXIT));

      const g = knife.group;
      const startX = -(halfViewWidth + KUNAI_LENGTH);
      const endX = halfViewWidth + KUNAI_LENGTH;
      g.position.set(lerp(startX, 0, fly) + exit * endX, 0, 0);
      // Pure roll about its own long axis: three turns in flight, settling etch-forward, spinning off at the end.
      g.rotation.set((1 - fly) * Math.PI * 6 + Math.sin(time * 0.6) * 0.1 * zoom + exit * Math.PI * 4, 0, 0);

      knife.setGlow(zoom * (0.9 + Math.sin(time * 2.2) * 0.15));

      const etchWorld = knife.etchOffset.clone().add(g.position);
      const distance = lerp(lerp(baseDistance * FLY_DISTANCE_FACTOR, baseDistance, settle), closeDistance, zoom);
      lookAt.set(lerp(0, etchWorld.x, zoom), 0, 0);
      camera.position.set(lookAt.x, zoom * 0.04, distance);
      camera.lookAt(lookAt);

      // Light sweeps across the blade during the close-up.
      key.position.set(3 - zoom * 6 + Math.sin(time * 0.4) * 1.2, 4, 6);

      // The cut follows the tip across the screen, then races on to the far edge.
      tip.copy(knife.tipOffset).add(g.position).project(camera);
      const tipX = ((tip.x + 1) / 2) * width;
      const started = p > FLY[0];
      const cut = clamp01(Math.max(started ? tipX : 0, range(p, ...SLASH) * width) / width);
      if (slash.current) {
        slash.current.style.transform = `scaleX(${cut})`;
        slash.current.style.opacity = String(started ? fade : 0);
      }

      show(tagline.current, range(p, 0.72, 0.8) * (1 - range(p, 0.88, 0.95)), 40);

      renderer.render(scene, camera);
    };
    gsap.ticker.add(tick);

    return () => {
      disposed = true;
      gsap.ticker.remove(tick);
      trigger.kill();
      visibility.kill();
      ro.disconnect();
      knife?.dispose();
      scene.environment?.dispose();
      studio.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [kunai.etch, accent]);

  const titleClass =
    "absolute inset-0 grid place-items-center px-4 text-center font-display text-[17vw] leading-none whitespace-nowrap text-fg uppercase will-change-transform md:text-[12.5vw]";

  return (
    <section ref={root} id={id} aria-label={`${kunai.eyebrow}: ${kunai.title}`} className="relative h-[460vh]">
      <h1 className="sr-only">{kunai.title}</h1>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_50%,color-mix(in_oklab,var(--d-accent)_18%,transparent)_0%,transparent_70%)]" />

        {/* The title, as two halves that start flush and fall apart once cut */}
        <div aria-hidden="true" className="absolute inset-0">
          <div ref={titleTop} className={`${titleClass} [clip-path:inset(0_0_50%_0)]`}>
            {kunai.title}
          </div>
          <div ref={titleBottom} className={`${titleClass} [clip-path:inset(50%_0_0_0)]`}>
            {kunai.title}
          </div>
          <div
            ref={slash}
            style={{ transform: "scaleX(0)", opacity: 0 }}
            className="absolute top-1/2 left-0 h-[2px] w-full origin-left -translate-y-1/2 bg-[linear-gradient(90deg,transparent,var(--d-accent2)_30%,#fff_70%,#fff)] shadow-[0_0_18px_4px_color-mix(in_oklab,var(--d-accent)_70%,transparent)]"
          />
        </div>

        <div ref={canvasWrap} className="absolute inset-0 [mask-image:linear-gradient(180deg,#000_70%,transparent_100%)]" />

        <div
          ref={tagline}
          style={{ opacity: 0, visibility: "hidden" }}
          className="absolute inset-x-0 bottom-[16vh] z-10 px-6 text-center will-change-transform"
        >
          <p className="mb-3 text-[11px] font-semibold tracking-[0.4em] text-accent2 uppercase">{kunai.eyebrow}</p>
          <p className="font-display text-5xl leading-[0.95] text-fg uppercase md:text-8xl">{kunai.tagline}</p>
        </div>
      </div>
    </section>
  );
}
