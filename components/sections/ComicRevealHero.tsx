"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import type { ComicBeat, ComicRevealConfig, StagePose } from "@/lib/domains";
import { buildBullet, BULLET_ETCH_SPAN, BULLET_LENGTH } from "@/lib/bullet";
import { makeSplat, splatDropsPath, splatPath } from "@/lib/splat";
import { makeShatter } from "@/lib/shatter";
import { clamp01, createSpring, gsap, ScrollTrigger } from "@/lib/gsap";

const range = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const n3 = (v: number) => v.toFixed(3);

/* Scroll choreography, as fractions of the pinned section. */
const FALL = [0.04, 0.15] as const;
const IMPACT = 0.15;
const STAND = 0.26;
const PUSH = [0.28, 0.4] as const; // camera pushes in while he drifts right
const AIM = 0.4; // comic cut to the aiming pose
const SHOT = 0.47;
const SPLAT = [0.47, 0.49] as const; // the paint bursts across the glass almost at once
const SHOT_2 = 0.5; // fires the moment he is real
const BULLET_IN = [0.5, 0.64] as const; // bullet time: camera chases the bullet onto the engraving
const TURN = [0.76, 0.84] as const; // the bullet swings round to face the camera
const RUSH = [0.84, 0.9] as const; // ...and comes straight at it
const CRACK = [0.9, 0.925] as const;
const SHATTER = [0.93, 1] as const; // the glass falls away onto the next section

/** When each comic caption is on screen, and where it sits so it never covers the character. */
const CAPTION_BEATS: Record<ComicBeat, { from: number; to: number; place: string }> = {
  intro: { from: -1, to: 0.035, place: "bottom-[14svh] left-1/2 -translate-x-1/2 -rotate-1" },
  fall: { from: 0.05, to: 0.145, place: "top-[16svh] left-[6vw] -rotate-2" },
  land: { from: 0.16, to: 0.25, place: "top-[16svh] left-[6vw] rotate-1" },
  stand: { from: 0.275, to: 0.39, place: "bottom-[12svh] left-[6vw] -rotate-1" },
  aim: { from: 0.405, to: 0.468, place: "top-1/2 left-[6vw] -translate-y-1/2 rotate-1" },
};

/** Comic poses move in steps, like animation drawn "on twos". */
const COMIC_STEPS = 140;
const FOV = 30;
/** How much of the screen width the engraving fills in the close-up. */
const ETCH_SCREEN_SHARE = 0.25;
/** How far in front of the lens the bullet's tip stops at the end of its rush (world units). */
const RUSH_STOP = 0.55;
/** Roll that turns the engraving towards the camera. */
const ETCH_FACING = 1.32;

/** Same softbox studio as the kunai, with a red bounce card. */
function studioScene(accent: string) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  const panels: [number, number, THREE.ColorRepresentation, number, [number, number, number], [number, number, number]][] = [
    [12, 0.5, 0xffffff, 7, [0, 5, 1], [Math.PI / 2, 0, 0]],
    [0.6, 7, 0xffffff, 3.5, [-6, 0.5, 2], [0, Math.PI / 2, 0]],
    [0.5, 6, 0xffe2b8, 2.5, [6, 0, 3], [0, -Math.PI / 2, 0]],
    [9, 2.5, accent, 3, [0, -4, -3], [-Math.PI / 4, 0, 0]],
  ];
  for (const [w, h, color, intensity, pos, rot] of panels) {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    scene.add(mesh);
  }
  return scene;
}

/** Height-driven sizing; the horizontal offset is capped on narrow screens so the figure stays in view. */
const poseStyle = (p: StagePose): CSSProperties => {
  const x = p.x ?? 0;
  const cap = `${Math.abs(x) * 62}vw`;
  const offset = x === 0 ? "0px" : x > 0 ? `min(${x * 100}svh, ${cap})` : `max(${x * 100}svh, -${cap})`;
  return {
    height: `${p.h * 100}svh`,
    width: "auto",
    top: `${(p.bottom - p.h) * 100}svh`,
    left: `calc(50% + ${offset})`,
    aspectRatio: `${p.width} / ${p.height}`,
  };
};

/** Comic sound-effect burst. */
function Sfx({ word, className }: { word: string; className: string }) {
  return (
    <div data-sfx className={`pointer-events-none absolute z-20 ${className}`} style={{ opacity: 0, visibility: "hidden" }}>
      <svg viewBox="0 0 200 140" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <polygon
          points="100,0 118,38 160,8 146,50 200,46 158,74 196,110 140,96 132,140 104,104 70,138 66,98 10,120 40,80 0,56 50,48 30,8 78,36"
          className="fill-[#FFD400] stroke-[#111] [stroke-width:5]"
        />
      </svg>
      <span className="relative grid size-full place-items-center font-display text-[min(7vw,64px)] leading-none text-[#111] [-webkit-text-stroke:2px_var(--d-accent)]">
        {word}
      </span>
    </div>
  );
}

/** The real world's look while the bullet is in flight: blurred and dimmed behind it. */
const BULLET_TIME_FILTER = (focus: number) => `blur(${(focus * 10).toFixed(2)}px) brightness(${(1 - focus * 0.55).toFixed(3)})`;

export default function ComicRevealHero({ id, reveal, accent }: { id: string; reveal: ComicRevealConfig; accent: string }) {
  const root = useRef<HTMLElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const wrap = canvasWrap.current;
    if (!el || !wrap) return;
    const q = <T extends HTMLElement | SVGElement>(sel: string) => el.querySelector<T>(sel);
    const stage = q<HTMLElement>("[data-stage]");
    const comicWorld = q<HTMLElement>("[data-comic]");
    const realWorld = q<HTMLElement>("[data-real]");
    const realInner = q<HTMLElement>("[data-real-inner]");
    const cams = el.querySelectorAll<HTMLElement>("[data-cam]");
    const title = q<HTMLElement>("[data-title]");
    const crack = q<SVGElement>("[data-crack]");
    const fall = q<HTMLElement>("[data-pose=fall]");
    const land = q<HTMLElement>("[data-pose=land]");
    const stand = q<HTMLElement>("[data-pose=stand]");
    const aim = q<HTMLElement>("[data-pose=aim]");
    const aimReal = q<HTMLElement>("[data-pose=aim-real]");
    const speed = q<HTMLElement>("[data-speed]");
    const shock = q<HTMLElement>("[data-shock]");
    const flash = q<HTMLElement>("[data-flash]");
    const redFlash = q<HTMLElement>("[data-redflash]");
    const muzzle = q<HTMLElement>("[data-muzzle]");
    const splatSvg = q<SVGPathElement>("[data-splat]");
    const dropsSvg = q<SVGPathElement>("[data-drops]");
    const tagline = q<HTMLElement>("[data-tagline]");
    const glassCracks = q<SVGPathElement>("[data-glass-cracks]");
    const shardBox = q<HTMLElement>("[data-shards]");
    const [sfxLand, sfxShot] = Array.from(el.querySelectorAll<HTMLElement>("[data-sfx]"));
    const captions = Array.from(el.querySelectorAll<HTMLElement>("[data-caption]")).map((node) => ({
      node,
      beat: CAPTION_BEATS[node.dataset.caption as ComicBeat],
    }));
    const splat = makeSplat(11);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- 3D bullet ------------------------------------------------------------------------
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      renderer = null; // no WebGL: the second shot just flashes
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.02, 400);
    const studio = studioScene(accent);
    let pmrem: THREE.PMREMGenerator | null = null;
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = "absolute inset-0 size-full";
      wrap.appendChild(renderer.domElement);
      pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(studio, 0.02).texture;
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(3, 4, 6);
      const rim = new THREE.DirectionalLight(new THREE.Color(accent), 3.5);
      rim.position.set(-5, 2, -4);
      scene.add(key, rim);
    }
    const holder = new THREE.Group(); // turned so the tip points left, the way the gun fires
    holder.visible = false;
    scene.add(holder);
    let bullet: ReturnType<typeof buildBullet> | null = null;
    let disposed = false;
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-anton").trim() || "Impact, sans-serif";
    if (renderer) {
      document.fonts
        .load(`200px ${fontFamily}`)
        .catch(() => undefined)
        .then(() => {
          if (disposed) return;
          bullet = buildBullet(reveal.etch, accent, fontFamily);
          holder.add(bullet.group);
        });
    }

    // --- glass shards: copies of the bullet-time frame, cut along the cracks ------------------
    const glassFace = q<HTMLElement>("[data-glass-face]");
    let shardNodes: {
      node: HTMLElement;
      cx: number;
      cy: number;
      spin: [number, number, number];
      weight: number;
    }[] = [];
    const buildShards = () => {
      if (!shardBox || !glassFace) return;
      shardBox.replaceChildren();
      const s = makeShatter(vw, vh, vw * 0.5, vh * 0.48);
      glassCracks?.setAttribute("d", s.cracks);
      shardNodes = s.shards.map((sh) => {
        const node = document.createElement("div");
        node.className = "absolute inset-0 will-change-transform";
        node.style.clipPath = sh.polygon;
        node.style.transformOrigin = `${sh.cx}px ${sh.cy}px`;
        const face = glassFace.cloneNode(true) as HTMLElement;
        face.removeAttribute("data-glass-face");
        face.style.display = "block";
        node.appendChild(face);
        shardBox.appendChild(node);
        return { node, cx: sh.cx, cy: sh.cy, spin: sh.spin, weight: sh.weight };
      });
    };

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let wideDistance = 40;
    let closeDistance = 4;
    const resize = () => {
      vw = wrap.clientWidth || window.innerWidth;
      vh = wrap.clientHeight || window.innerHeight;
      camera.aspect = vw / vh;
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      // far enough that the fired bullet reads as a small object near the muzzle
      wideDistance = Math.max(30, (BULLET_LENGTH * 16) / (2 * tanHalf * camera.aspect));
      closeDistance = BULLET_ETCH_SPAN / (2 * tanHalf * camera.aspect * ETCH_SCREEN_SHARE);
      camera.updateProjectionMatrix();
      renderer?.setSize(vw, vh, false);
      buildShards();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // --- scroll -----------------------------------------------------------------------------
    let progress = 0;
    let inView = false;
    const spring = createSpring(0, reduce ? 600 : 70, reduce ? 50 : 15);
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

    const show = (node: HTMLElement | null | undefined, v: number) => {
      if (!node) return;
      node.style.opacity = String(v);
      node.style.visibility = v < 0.01 ? "hidden" : "visible";
    };
    const muzzleAt = { x: vw * 0.5, y: vh * 0.3 };
    const bulletStart = new THREE.Vector3();
    const look = new THREE.Vector3();

    const tick = (time: number, deltaMs: number) => {
      spring.target = progress;
      const p = spring.step(Math.min(deltaMs / 1000, 1 / 20));
      if (!inView) return;
      // comic beats snap to steps; the real world and the bullet stay smooth
      const pc = p < SPLAT[0] && !reduce ? Math.round(p * COMIC_STEPS) / COMIC_STEPS : p;

      // --- camera: landing shake, push in + drift right, the shot's kick ---------------------
      const sinceImpact = pc - IMPACT;
      const landShake = sinceImpact > 0 ? Math.exp(-sinceImpact * 90) * 1.4 : 0;
      const shotShake = p > SHOT ? Math.exp(-(p - SHOT) * 130) * 2.4 : 0;
      const shake = landShake + shotShake;
      const recoil = p > SHOT ? Math.exp(-(p - SHOT) * 160) : 0;
      const push = easeInOut(range(pc, ...PUSH));
      const aimed = pc >= AIM;
      const punch = aimed ? 1 + 0.12 * Math.exp(-(pc - AIM) * 60) : 1;
      const zoom = aimed ? punch : 1 + push * 0.4;
      const dx = aimed ? 0 : push * 12;
      const sx = Math.sin(time * 61) * shake * 1.2 + recoil * 0.8;
      const sy = Math.cos(time * 53) * shake * 1.6;
      const camTransform = `translate3d(calc(${n3(dx)}vw + ${n3(sx)}vh), ${n3(sy)}vh, 0) scale(${n3(zoom)}) rotate(${n3(recoil * 1.5)}deg)`;
      cams.forEach((c) => (c.style.transform = camTransform));

      // --- poses -------------------------------------------------------------------------------
      const fallT = range(pc, ...FALL);
      if (fall) {
        const t = easeIn(fallT);
        fall.style.transform = `translate3d(-50%, ${n3(lerp(-120, 0, t))}svh, 0) rotate(${n3(lerp(-40, -14, t))}deg) scaleY(${n3(1 + (1 - t) * 0.25)})`;
        fall.style.filter = `blur(${n3((1 - t) * 2 + (fallT > 0 ? 1.5 : 0))}px)`;
        show(fall, fallT > 0 && pc < IMPACT ? 1 : 0);
      }
      const squash = sinceImpact > 0 ? Math.exp(-sinceImpact * 70) : 0;
      if (land) {
        land.style.transform = `translate3d(-50%, 0, 0) scale(${n3(1 + squash * 0.08)}, ${n3(1 - squash * 0.1)})`;
        show(land, pc >= IMPACT && pc < STAND ? 1 : 0);
      }
      if (stand) {
        stand.style.transform = `translate3d(-50%, ${pc < STAND + 0.012 ? 4 : 0}svh, 0)`;
        show(stand, pc >= STAND && !aimed ? 1 : 0);
      }
      show(aim, aimed ? 1 : 0);
      show(speed, (fallT > 0 && pc < IMPACT ? 0.9 : 0) + (aimed && pc < AIM + 0.02 ? 0.8 : 0));

      // landing shockwave + sound effect + the title cracks
      const wave = range(pc, IMPACT, IMPACT + 0.05);
      if (shock) {
        shock.style.transform = `translate(-50%, -50%) scale(${n3(0.2 + wave * 2.6)})`;
        shock.style.opacity = String(wave > 0 && wave < 1 ? 1 - wave : 0);
      }
      show(sfxLand, pc >= IMPACT && pc < IMPACT + 0.07 ? 1 : 0);
      if (sfxLand) sfxLand.style.transform = `scale(${n3(0.6 + easeOut(range(pc, IMPACT, IMPACT + 0.02)) * 0.5)}) rotate(-8deg)`;
      if (crack) crack.style.strokeDashoffset = String(1 - easeOut(range(pc, IMPACT, IMPACT + 0.03)));
      if (title) title.style.transform = `translate3d(${n3(sx * 0.6)}vh, ${n3(sy * 0.6)}vh, 0)`;

      // narration boxes pop in on their beat
      for (const { node, beat } of captions) {
        const on = pc >= beat.from && pc < beat.to;
        node.style.opacity = on ? "1" : "0";
        node.style.visibility = on ? "visible" : "hidden";
        node.style.scale = on ? "1" : "0.85";
      }

      // --- muzzle position (screen px), from the framed aim image ------------------------------
      // measure whichever twin is on screen: the comic one is gone once the paint has covered it
      const framed = [aim, aimReal].map((n) => n?.getBoundingClientRect()).find((r) => r && r.width > 0);
      if (framed && aimed && stage) {
        const sr = stage.getBoundingClientRect();
        muzzleAt.x = framed.left + framed.width * reveal.muzzle.x - sr.left;
        muzzleAt.y = framed.top + framed.height * reveal.muzzle.y - sr.top;
      }

      // --- shot 1: flash, BANG, paint bursts over the glass ------------------------------------
      const flash1 = p > SHOT && p < SHOT + 0.006;
      const flash2 = p > SHOT_2 && p < SHOT_2 + 0.006;
      if (muzzle) {
        muzzle.style.left = `${muzzleAt.x}px`;
        muzzle.style.top = `${muzzleAt.y}px`;
        muzzle.style.transform = `translate(-50%, -50%) rotate(${(time * 400) % 360}deg) scale(${flash1 || flash2 ? 1 : 0})`;
      }
      show(redFlash, p > SHOT ? Math.exp(-(p - SHOT) * 70) * 0.55 * (p < SPLAT[1] + 0.03 ? 1 : 0) : 0);
      show(sfxShot, p >= SHOT && p < SHOT + 0.03 ? 1 : 0);
      if (sfxShot) sfxShot.style.transform = `scale(${n3(0.7 + easeOut(range(p, SHOT, SHOT + 0.008)) * 0.5)}) rotate(10deg)`;

      const sp = range(p, ...SPLAT);
      const diag = Math.hypot(vw, vh);
      const cx = lerp(muzzleAt.x, vw * 0.5, 0.5);
      const cy = lerp(muzzleAt.y, vh * 0.45, 0.5);
      // bursts in already big, then floods the screen
      const R = sp <= 0 ? 0 : lerp(diag * 0.42, diag * 1.35, easeOut(sp));
      const painting = sp > 0 && sp < 1;
      const inner = painting ? splatPath(splat, cx, cy, R * 0.8) : "";
      // the paint is a ring: its inside is a window onto the real world
      splatSvg?.setAttribute("d", painting ? splatPath(splat, cx, cy, R) + inner : "");
      dropsSvg?.setAttribute("d", painting ? splatDropsPath(splat, cx, cy, R) : "");
      if (realWorld) {
        if (sp <= 0) realWorld.style.clipPath = "path('M0 0Z')";
        else if (sp >= 1) realWorld.style.clipPath = "none";
        else realWorld.style.clipPath = `path('${inner}')`;
      }
      // display, not visibility: children that set their own visibility would still show through
      if (comicWorld) comicWorld.style.display = sp >= 1 ? "none" : "";

      // --- shot 2: bullet time ---------------------------------------------------------------------
      const bIn = easeInOut(range(p, ...BULLET_IN));
      const turn = easeInOut(range(p, ...TURN));
      const rush = easeIn(range(p, ...RUSH));
      const cracked = p >= CRACK[0];
      const shatter = range(p, ...SHATTER);
      const focus = range(p, SHOT_2, BULLET_IN[1]);
      if (realInner) realInner.style.filter = focus > 0 ? BULLET_TIME_FILTER(focus) : "none";
      // at the impact the glass (the shards) takes over from the real world
      if (realWorld) realWorld.style.display = cracked ? "none" : "";
      show(tagline, range(p, 0.6, 0.64) * (1 - range(p, TURN[0], TURN[0] + 0.03)));

      // --- the screen cracks, then falls away ------------------------------------------------------
      if (glassCracks) {
        glassCracks.style.strokeDashoffset = String(1 - easeOut(range(p, ...CRACK)));
        const layer = glassCracks.parentElement;
        if (layer) layer.style.opacity = String(cracked ? 1 - range(p, SHATTER[0], SHATTER[0] + 0.03) : 0);
      }
      if (shardBox) shardBox.style.display = cracked && shatter < 1 ? "" : "none";
      if (cracked) {
        const t = easeIn(shatter);
        for (const s of shardNodes) {
          const ox = (s.cx - vw * 0.5) / vw;
          const oy = (s.cy - vh * 0.48) / vh;
          // flung out from the impact, then gravity takes over
          const tx = ox * t * vw * 0.6;
          const ty = oy * t * vh * 0.4 + t * t * vh * 1.6 * s.weight;
          const tz = t * 500 * (1 - Math.hypot(ox, oy));
          s.node.style.transform = `translate3d(${n3(tx)}px, ${n3(ty)}px, ${n3(tz)}px) rotateX(${n3(s.spin[0] * t)}deg) rotateY(${n3(s.spin[1] * t)}deg) rotateZ(${n3(s.spin[2] * t)}deg)`;
          s.node.style.opacity = String(1 - range(shatter, 0.6, 1));
        }
      }
      show(flash, flash1 ? 0.9 : flash2 ? 0.3 : p >= CRACK[0] && p < CRACK[0] + 0.006 ? 1 : 0);

      if (!renderer) return;
      holder.visible = Boolean(bullet) && p > SHOT_2 && !cracked;
      if (!holder.visible || !bullet) {
        renderer.clear();
        return;
      }
      // where the muzzle sits on the z = 0 plane when the camera is wide
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      bulletStart.set(
        ((muzzleAt.x / vw) * 2 - 1) * wideDistance * tanHalf * camera.aspect,
        -((muzzleAt.y / vh) * 2 - 1) * wideDistance * tanHalf,
        0,
      );
      // leaves the muzzle fast, slows into bullet time
      const travel = easeOut(range(p, SHOT_2, SHOT_2 + 0.03)) * 3 + (p - SHOT_2) * 8;
      const camZ = lerp(wideDistance, closeDistance, bIn) + turn * closeDistance * 0.8;
      // the rush stops with the tip just short of the lens, so the camera never ends up inside the model
      const closest = camZ - BULLET_LENGTH / 2 - RUSH_STOP;
      holder.position.set(bulletStart.x - travel, bulletStart.y * (1 - bIn), rush * closest);
      // tip left, then swings round to point at the camera
      holder.rotation.y = Math.PI + turn * (Math.PI / 2);
      // rifling spin that winds down so the engraving faces the camera for the close-up, then spins up again
      const windDown = 1 - easeOut(range(p, SHOT_2, BULLET_IN[1]));
      bullet.group.rotation.x = ETCH_FACING + windDown * Math.PI * 8 + Math.sin(time * 0.8) * 0.06 * bIn + (turn + rush) * Math.PI * 4;
      bullet.setGlow(bIn * (1 - turn) * (0.9 + Math.sin(time * 2.4) * 0.15));

      // the close-up frames the whole cartridge (the engraving sits right of its middle, so centring on it pushed the bullet left)
      look.set(lerp(0, holder.position.x, bIn), lerp(0, holder.position.y, bIn), 0);
      camera.position.set(look.x, look.y + 0.05 * bIn, camZ);
      camera.lookAt(look);
      renderer.render(scene, camera);
    };
    gsap.ticker.add(tick);

    return () => {
      disposed = true;
      gsap.ticker.remove(tick);
      trigger.kill();
      visibility.kill();
      ro.disconnect();
      bullet?.dispose();
      scene.environment?.dispose();
      studio.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      pmrem?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      shardBox?.replaceChildren();
    };
  }, [reveal, accent]);

  const words = reveal.title.split(" ");
  const half = Math.ceil(words.length / 2);
  const lines = [words.slice(0, half).join(" "), words.slice(half).join(" ")];
  const { fall, land, stand, aim, aimReal } = reveal;
  const realPose = {
    ...aim,
    ...aimReal,
    h: aim.h,
    bottom: aim.bottom,
    x: aim.x,
  };
  const realBackdrop =
    "absolute inset-0 bg-[radial-gradient(60%_50%_at_45%_40%,color-mix(in_oklab,var(--d-accent)_24%,transparent),transparent_70%),radial-gradient(70%_60%_at_80%_90%,color-mix(in_oklab,var(--d-deep)_80%,transparent),transparent_75%)]";
  const realImageClass = "absolute max-w-none -translate-x-1/2 brightness-[0.85] contrast-[1.15] saturate-[0.9]";

  return (
    <section ref={root} id={id} aria-label={`${reveal.eyebrow}: ${reveal.title}`} className="relative z-20 h-[900vh]">
      <h1 className="sr-only">{reveal.title}</h1>
      <div data-stage className="sticky top-0 h-svh overflow-hidden">
        {/* ---------- comic world ---------- */}
        <div data-comic className="absolute inset-0 bg-bg">
          <div className="absolute inset-0 bg-[radial-gradient(color-mix(in_oklab,var(--d-accent)_35%,transparent)_1.2px,transparent_1.6px)] [background-size:14px_14px] opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_45%,transparent_30%,#000_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_45%,color-mix(in_oklab,var(--d-accent)_22%,transparent),transparent_70%)]" />

          <div data-title aria-hidden="true" className="absolute inset-0 grid place-items-center will-change-transform">
            <div className="relative px-4 text-center font-display text-[17vw] leading-[0.86] text-fg uppercase [text-shadow:0.05em_0.05em_0_var(--d-accent)] md:text-[12vw]">
              {lines.map((l) => (
                <span key={l} className="block whitespace-nowrap">
                  {l}
                </span>
              ))}
              {/* the landing cracks the wall */}
              <svg
                data-crack
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
                className="absolute inset-0 size-full overflow-visible [stroke-dasharray:1] [stroke-dashoffset:1]"
                aria-hidden="true"
              >
                {[
                  "M50 40 L47 31 L53 24 L46 16 L51 8 L48 0",
                  "M53 24 L64 21 L71 26 L83 22",
                  "M46 16 L35 18 L28 12 L16 15",
                  "M47 31 L38 34 L30 31",
                  "M51 8 L60 6 L66 1",
                ].map((d) => (
                  <path
                    key={d}
                    d={d}
                    pathLength={1}
                    fill="none"
                    className="stroke-bg"
                    strokeWidth={0.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* speed lines during the dive and the cut to the aim */}
          <div
            data-speed
            style={{ opacity: 0, visibility: "hidden" }}
            className="absolute inset-0 bg-[repeating-conic-gradient(from_0deg_at_50%_40%,transparent_0deg_2.2deg,color-mix(in_oklab,var(--d-fg)_55%,transparent)_2.4deg_2.6deg,transparent_2.8deg_7deg)] [mask-image:radial-gradient(circle_at_50%_40%,transparent_22%,#000_70%)]"
          />

          <div data-cam className="absolute inset-0 origin-[50%_32%] will-change-transform">
            <div
              data-shock
              className="absolute top-[87svh] left-1/2 h-[9svh] w-[60svh] rounded-[50%] border-[3px] border-fg/80 opacity-0"
            />
            <Image
              data-pose="fall"
              src={fall.src}
              width={fall.width}
              height={fall.height}
              unoptimized
              alt=""
              className="absolute max-w-none"
              style={{ ...poseStyle(fall), opacity: 0, visibility: "hidden" }}
            />
            <Image
              data-pose="land"
              src={land.src}
              width={land.width}
              height={land.height}
              unoptimized
              alt=""
              className="absolute max-w-none origin-bottom"
              style={{ ...poseStyle(land), opacity: 0, visibility: "hidden" }}
            />
            <Image
              data-pose="stand"
              src={stand.src}
              width={stand.width}
              height={stand.height}
              unoptimized
              alt=""
              className="absolute max-w-none"
              style={{ ...poseStyle(stand), opacity: 0, visibility: "hidden" }}
            />
            <Image
              data-pose="aim"
              src={aim.src}
              width={aim.width}
              height={aim.height}
              unoptimized
              alt={aim.alt}
              className="absolute max-w-none -translate-x-1/2"
              style={{ ...poseStyle(aim), opacity: 0, visibility: "hidden" }}
            />
          </div>
          {(Object.keys(CAPTION_BEATS) as ComicBeat[]).map((beat) =>
            reveal.captions[beat] ? (
              <p
                key={beat}
                data-caption={beat}
                style={{ opacity: 0, visibility: "hidden" }}
                className={`pointer-events-none absolute z-20 max-w-[min(80vw,420px)] border-[3px] border-[#111] bg-[#FFF3C4] px-4 py-2.5 font-display text-[clamp(16px,2.1vw,26px)] leading-tight text-[#111] uppercase shadow-[5px_5px_0_var(--d-accent)] transition-[scale] duration-150 ${CAPTION_BEATS[beat].place}`}
              >
                {reveal.captions[beat]}
              </p>
            ) : null,
          )}
          <Sfx word={reveal.sfx.land} className="top-[60svh] left-[calc(50%+14svh)] h-[22svh] w-[30svh] origin-center" />
          <Sfx word={reveal.sfx.shot} className="top-[12svh] left-[8vw] h-[24svh] w-[32svh] origin-center" />
        </div>

        {/* ---------- real world, revealed through the paint ---------- */}
        <div data-real className="absolute inset-0 bg-bg will-change-[clip-path]" style={{ clipPath: "path('M0 0Z')" }}>
          {/* blur goes on the content only, so the frame's edges never turn see-through */}
          <div data-real-inner className="absolute inset-0">
            <div className={realBackdrop} />
            <div data-cam className="absolute inset-0 origin-[50%_32%] will-change-transform">
              <Image
                data-pose="aim-real"
                src={aimReal.src}
                width={aimReal.width}
                height={aimReal.height}
                unoptimized
                alt={aimReal.alt}
                className={realImageClass}
                style={poseStyle(realPose)}
              />
            </div>
          </div>
        </div>

        {/* the paint itself, on the glass */}
        <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
          <path data-splat fillRule="evenodd" className="fill-accent" />
          <path data-drops className="fill-accent" />
        </svg>
        <div
          data-redflash
          className="pointer-events-none absolute inset-0 bg-accent mix-blend-multiply"
          style={{ opacity: 0, visibility: "hidden" }}
        />

        {/* the glass: one hidden template of the bullet-time frame, cloned into each shard */}
        <div data-glass-face className="absolute inset-0 bg-bg" style={{ display: "none" }} aria-hidden="true">
          <div className="absolute inset-0" style={{ filter: BULLET_TIME_FILTER(1) }}>
            <div className={realBackdrop} />
            <Image
              src={aimReal.src}
              width={aimReal.width}
              height={aimReal.height}
              unoptimized
              alt=""
              className={realImageClass}
              style={poseStyle(realPose)}
            />
          </div>
        </div>
        <div
          data-shards
          className="pointer-events-none absolute inset-0 [perspective:1400px]"
          style={{ display: "none" }}
          aria-hidden="true"
        />

        <div ref={canvasWrap} className="pointer-events-none absolute inset-0" />

        <svg className="pointer-events-none absolute inset-0 size-full" style={{ opacity: 0 }} aria-hidden="true">
          <path
            data-glass-cracks
            pathLength={1}
            fill="none"
            className="stroke-fg [stroke-dasharray:1] [stroke-dashoffset:1] [filter:drop-shadow(0_0_6px_rgba(255,255,255,0.8))]"
            strokeWidth={1.1}
            strokeLinejoin="round"
          />
        </svg>

        <div
          data-flash
          className="pointer-events-none absolute inset-0 bg-[#fff6e0] mix-blend-screen"
          style={{ opacity: 0, visibility: "hidden" }}
        />
        <div
          data-muzzle
          className="pointer-events-none absolute z-20 size-[26svh] bg-[conic-gradient(from_0deg,#fff_0deg_6deg,transparent_10deg_40deg,#ffd27a_44deg_48deg,transparent_52deg_88deg,#fff_92deg_97deg,transparent_101deg_134deg,#ffb347_138deg_142deg,transparent_146deg_180deg,#fff_184deg_189deg,transparent_193deg_226deg,#ffd27a_230deg_234deg,transparent_238deg_272deg,#fff_276deg_281deg,transparent_285deg_318deg,#ffb347_322deg_326deg,transparent_330deg)] [mask-image:radial-gradient(circle,#000_10%,transparent_65%)]"
          style={{ transform: "scale(0)" }}
        />

        <div data-tagline style={{ opacity: 0, visibility: "hidden" }} className="absolute inset-x-0 bottom-[7vh] z-10 px-6 text-center">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.4em] text-accent2 uppercase">{reveal.eyebrow}</p>
          <p className="font-display text-5xl leading-[0.95] text-fg uppercase md:text-8xl">{reveal.tagline}</p>
        </div>
      </div>
    </section>
  );
}
