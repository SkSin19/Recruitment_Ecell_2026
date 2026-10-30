import * as THREE from "three";

/* Kunai proportions in world units; the long axis is +X with the tip pointing right. */
const BLADE_START = 0.55;
const BLADE_END = 2.85;
const BLADE_LEN = BLADE_END - BLADE_START;
const MAX_HALF_WIDTH = 0.42;
const HANDLE_START = -1.2;
const RING_RADIUS = 0.3;
const SAMPLES = 64;

/** Where the etched word is centred along the blade (0 = base, 1 = tip). */
const ETCH_AT = 0.4;

/** Leaf-shaped blade: narrow neck, widest a third of the way up, tapering to the tip. */
function halfWidth(t: number) {
  if (t < 0.32) return 0.13 + 0.29 * Math.sin((t / 0.32) * (Math.PI / 2));
  return MAX_HALF_WIDTH * Math.pow(1 - (t - 0.32) / 0.68, 1.1);
}

/** Thickness at the central ridge. */
function ridge(t: number) {
  return 0.075 * Math.pow(1 - t, 0.7) + 0.006;
}

/**
 * Diamond cross-section blade built from four bevel strips. Each strip is
 * smooth along its length but sharp against its neighbours, like a ground edge.
 * Group 0 = the two front bevels (carry the etch), group 1 = the back.
 */
function bladeGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const point = (corner: number, t: number): [number, number, number] => {
    const x = BLADE_START + t * BLADE_LEN;
    const w = halfWidth(t);
    const r = ridge(t);
    return [
      [x, w, 0],
      [x, 0, r],
      [x, -w, 0],
      [x, 0, -r],
    ][corner] as [number, number, number];
  };

  // Strips listed so that P → Q runs the same way round the blade, giving outward normals.
  const strips: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];

  const geometry = new THREE.BufferGeometry();
  strips.forEach(([pc, qc], s) => {
    const base = positions.length / 3;
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      for (const c of [pc, qc]) {
        const p = point(c, t);
        positions.push(...p);
        uvs.push(t, p[1] / (2 * MAX_HALF_WIDTH) + 0.5);
      }
    }
    const start = indices.length;
    for (let i = 0; i < SAMPLES; i++) {
      const p0 = base + i * 2;
      const q0 = p0 + 1;
      const p1 = p0 + 2;
      const q1 = p0 + 3;
      indices.push(p0, q0, p1, q0, q1, p1);
    }
    geometry.addGroup(start, indices.length - start, s < 2 ? 0 : 1);
  });

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(
    private from: number,
    private to: number,
    private radius: number,
    private turns: number,
    private phase: number,
  ) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const a = this.phase + t * this.turns * Math.PI * 2;
    return target.set(this.from + (this.to - this.from) * t, Math.cos(a) * this.radius, Math.sin(a) * this.radius);
  }
}

/** Brushed steel, the etched word, and matching bump / roughness / glow masks, all drawn on canvases. */
function etchTextures(word: string, fontFamily: string) {
  const W = 2048;
  const H = Math.round((W * 2 * MAX_HALF_WIDTH) / BLADE_LEN);

  const make = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return [c, c.getContext("2d") as CanvasRenderingContext2D] as const;
  };

  const brush = (ctx: CanvasRenderingContext2D, base: string, light: string, dark: string) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? light : dark;
      ctx.globalAlpha = 0.04 + Math.random() * 0.08;
      ctx.fillRect(Math.random() * W - 200, Math.random() * H, 200 + Math.random() * 900, 1 + Math.random() * 1.5);
    }
    ctx.globalAlpha = 1;
  };

  const text = (ctx: CanvasRenderingContext2D, fill: string) => {
    ctx.save();
    ctx.font = `${Math.round(H * 0.42)}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = `${Math.round(H * 0.05)}px`;
    ctx.fillStyle = fill;
    ctx.fillText(word, W * ETCH_AT, H * 0.5);
    ctx.restore();
  };

  // Colour: steel with the etch darkened and a thin bright lip catching light below each letter.
  const [colorCanvas, color] = make();
  brush(color, "#8d939c", "#d6dae0", "#4b5058");
  color.save();
  color.translate(0, 3);
  text(color, "rgba(255,255,255,0.55)");
  color.restore();
  text(color, "#16171b");

  const [backCanvas, back] = make();
  brush(back, "#8d939c", "#d6dae0", "#4b5058");

  // Bump: mid grey surface, the etch cut in.
  const [bumpCanvas, bump] = make();
  bump.fillStyle = "#9a9a9a";
  bump.fillRect(0, 0, W, H);
  bump.filter = "blur(2px)";
  text(bump, "#000");

  // Roughness (green channel): polished face, matte etch.
  const [roughCanvas, rough] = make();
  brush(rough, "#4d4d4d", "#5c5c5c", "#3a3a3a");
  text(rough, "#c8c8c8");

  // Glow mask for the vibranium light that fills the etch on close-up.
  const [glowCanvas, glow] = make();
  glow.fillStyle = "#000";
  glow.fillRect(0, 0, W, H);
  text(glow, "#fff");

  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };

  return {
    color: tex(colorCanvas, true),
    back: tex(backCanvas, true),
    bump: tex(bumpCanvas, false),
    rough: tex(roughCanvas, false),
    glow: tex(glowCanvas, false),
  };
}

export interface Kunai {
  group: THREE.Group;
  /** Offset (from the group origin) of the blade tip. */
  tipOffset: THREE.Vector3;
  /** World-space offset (from the group origin) of the etched word. */
  etchOffset: THREE.Vector3;
  /** 0 → 1 glow of the etch. */
  setGlow: (v: number) => void;
  dispose: () => void;
}

export function buildKunai(word: string, accent: string, fontFamily: string): Kunai {
  const textures = etchTextures(word, fontFamily);
  const accentColor = new THREE.Color(accent);

  // Brushed steel: anisotropic highlights stretch along the blade like real grinding marks.
  const bladeFront = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: textures.color,
    metalness: 1,
    roughness: 1,
    roughnessMap: textures.rough,
    bumpMap: textures.bump,
    bumpScale: 2.2,
    anisotropy: 0.7,
    emissive: accentColor,
    emissiveMap: textures.glow,
    emissiveIntensity: 0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
  });
  const bladeBack = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: textures.back,
    metalness: 1,
    roughness: 0.38,
    anisotropy: 0.7,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
  });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.34, anisotropy: 0.5 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x141518, metalness: 0.7, roughness: 0.55 });
  const cord = new THREE.MeshStandardMaterial({ color: 0x170a26, roughness: 0.92, metalness: 0 });

  const inner = new THREE.Group();

  const blade = new THREE.Mesh(bladeGeometry(), [bladeFront, bladeBack]);
  inner.add(blade);

  const handleLen = BLADE_START - 0.05 - HANDLE_START;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.108, handleLen, 32), darkSteel);
  handle.rotation.z = Math.PI / 2;
  handle.position.x = HANDLE_START + handleLen / 2;
  inner.add(handle);

  // Two counter-wound cords give the crossed wrap seen on real kunai grips.
  const wrapFrom = HANDLE_START + 0.06;
  const wrapTo = BLADE_START - 0.12;
  for (const [turns, phase] of [
    [13, 0],
    [-13, Math.PI],
  ] as const) {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new Helix(wrapFrom, wrapTo, 0.118, turns, phase), 900, 0.022, 8), cord);
    inner.add(tube);
  }

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.1, 32), steel);
  collar.rotation.z = Math.PI / 2;
  collar.position.x = BLADE_START - 0.05;
  inner.add(collar);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 24), steel);
  neck.rotation.z = Math.PI / 2;
  neck.position.x = HANDLE_START - 0.05;
  inner.add(neck);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, 0.06, 32, 96), steel);
  ring.position.x = HANDLE_START - 0.1 - RING_RADIUS;
  inner.add(ring);

  // Centre the whole knife on its middle so it rolls about its own long axis.
  const minX = HANDLE_START - 0.1 - RING_RADIUS * 2 - 0.06;
  const centre = (minX + BLADE_END) / 2;
  inner.position.x = -centre;

  const group = new THREE.Group();
  group.add(inner);

  return {
    group,
    tipOffset: new THREE.Vector3(BLADE_END - centre, 0, 0),
    etchOffset: new THREE.Vector3(BLADE_START + ETCH_AT * BLADE_LEN - centre, 0, 0),
    setGlow: (v) => {
      bladeFront.emissiveIntensity = v;
    },
    dispose: () => {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      [bladeFront, bladeBack, steel, darkSteel, cord].forEach((m) => m.dispose());
      Object.values(textures).forEach((t) => t.dispose());
    },
  };
}

/** Total length of the knife, used to frame it. */
export const KUNAI_LENGTH = BLADE_END - (HANDLE_START - 0.1 - RING_RADIUS * 2 - 0.06);
