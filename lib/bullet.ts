import * as THREE from "three";

/* Cartridge proportions in world units; the long axis is +X with the tip pointing right. */
const CASE_START = 0;
const CASE_END = 2.3;
const CASE_RADIUS = 0.34;
const RIM_RADIUS = 0.36;
const HEAD_END = 3.45;
const SEGMENTS = 96;

/** Where the engraved word is centred along the case (0 = base, 1 = mouth). */
const ETCH_AT = 0.56;
const ETCH_START = 0.32;
const ETCH_END = CASE_END - 0.08;

/** Copper head: short shank, then a tangent ogive to a slightly rounded point. */
function headProfile() {
  const pts: THREE.Vector2[] = [];
  const shank = 0.32;
  const r0 = CASE_RADIUS - 0.02;
  pts.push(new THREE.Vector2(0, CASE_END - 0.06));
  pts.push(new THREE.Vector2(r0, CASE_END - 0.06));
  pts.push(new THREE.Vector2(r0, CASE_END + shank));
  const len = HEAD_END - (CASE_END + shank);
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const r = r0 * Math.sqrt(Math.max(0, 1 - t * t)) * (1 - 0.06 * t);
    pts.push(new THREE.Vector2(Math.max(r, t === 1 ? 0 : 0.012), CASE_END + shank + len * Math.pow(t, 0.92)));
  }
  pts.push(new THREE.Vector2(0, HEAD_END));
  return pts;
}

/** Case base: rim, extractor groove, then the body begins. */
function baseProfile() {
  return [
    new THREE.Vector2(0, CASE_START),
    new THREE.Vector2(RIM_RADIUS - 0.02, CASE_START),
    new THREE.Vector2(RIM_RADIUS, CASE_START + 0.02),
    new THREE.Vector2(RIM_RADIUS, CASE_START + 0.09),
    new THREE.Vector2(RIM_RADIUS - 0.03, CASE_START + 0.11),
    new THREE.Vector2(CASE_RADIUS - 0.07, CASE_START + 0.14),
    new THREE.Vector2(CASE_RADIUS - 0.07, CASE_START + 0.2),
    new THREE.Vector2(CASE_RADIUS, CASE_START + 0.26),
    new THREE.Vector2(CASE_RADIUS, ETCH_START + 0.002),
  ];
}

/** Brass body with the word engraved along its length, plus bump / roughness / glow masks. */
function etchTextures(word: string, fontFamily: string) {
  // u runs round the case, v runs along it; the word is drawn rotated so it reads along the axis.
  const around = 2048;
  const along = Math.round((around * (ETCH_END - ETCH_START)) / (2 * Math.PI * CASE_RADIUS));

  const make = () => {
    const c = document.createElement("canvas");
    c.width = around;
    c.height = along;
    return [c, c.getContext("2d") as CanvasRenderingContext2D] as const;
  };

  const brush = (ctx: CanvasRenderingContext2D, base: string, light: string, dark: string) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, around, along);
    // fine turning marks run round the case
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? light : dark;
      ctx.globalAlpha = 0.04 + Math.random() * 0.07;
      ctx.fillRect(0, Math.random() * along, around, 1 + Math.random());
    }
    ctx.globalAlpha = 1;
  };

  // The word sits on the face of the case that points at the camera (u = 0.25).
  const text = (ctx: CanvasRenderingContext2D, fill: string) => {
    ctx.save();
    ctx.translate(around * 0.25, along * ((ETCH_AT * (CASE_END - CASE_START) - ETCH_START) / (ETCH_END - ETCH_START)));
    ctx.rotate(-Math.PI / 2);
    ctx.font = `${Math.round(around * 0.16)}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = `${Math.round(around * 0.012)}px`;
    ctx.fillStyle = fill;
    ctx.fillText(word, 0, 0);
    ctx.restore();
  };

  const [colorCanvas, color] = make();
  brush(color, "#b8913f", "#f1d488", "#6d521d");
  color.save();
  color.translate(3, 0);
  text(color, "rgba(255,240,200,0.5)");
  color.restore();
  text(color, "#2a1d08");

  const [bumpCanvas, bump] = make();
  bump.fillStyle = "#9a9a9a";
  bump.fillRect(0, 0, around, along);
  bump.filter = "blur(2px)";
  text(bump, "#000");

  const [roughCanvas, rough] = make();
  brush(rough, "#404040", "#4c4c4c", "#333");
  text(rough, "#c0c0c0");

  const [glowCanvas, glow] = make();
  glow.fillStyle = "#000";
  glow.fillRect(0, 0, around, along);
  text(glow, "#fff");

  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { color: tex(colorCanvas, true), bump: tex(bumpCanvas, false), rough: tex(roughCanvas, false), glow: tex(glowCanvas, false) };
}

export interface Bullet {
  group: THREE.Group;
  /** World-space offset (from the group origin) of the engraved word. */
  etchOffset: THREE.Vector3;
  /** 0 → 1 glow of the engraving. */
  setGlow: (v: number) => void;
  dispose: () => void;
}

export function buildBullet(word: string, accent: string, fontFamily: string): Bullet {
  const textures = etchTextures(word, fontFamily);

  const brass = new THREE.MeshPhysicalMaterial({ color: 0xc9a24a, metalness: 1, roughness: 0.28, clearcoat: 0.4, clearcoatRoughness: 0.2 });
  const etched = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: textures.color,
    metalness: 1,
    roughness: 1,
    roughnessMap: textures.rough,
    bumpMap: textures.bump,
    bumpScale: 2.4,
    emissive: new THREE.Color(accent),
    emissiveMap: textures.glow,
    emissiveIntensity: 0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
  });
  const copper = new THREE.MeshPhysicalMaterial({ color: 0xb4643a, metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15 });
  const primer = new THREE.MeshStandardMaterial({ color: 0x9a9da3, metalness: 1, roughness: 0.35 });

  const inner = new THREE.Group();
  // Lathe revolves round +Y; turn everything so the long axis is +X.
  const axis = new THREE.Group();
  axis.rotation.z = -Math.PI / 2;
  inner.add(axis);

  axis.add(new THREE.Mesh(new THREE.LatheGeometry(baseProfile(), SEGMENTS), brass));
  // Engraved body: an open cylinder so its UVs map cleanly round and along the case.
  const bodyLen = ETCH_END - ETCH_START;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(CASE_RADIUS, CASE_RADIUS, bodyLen, SEGMENTS, 1, true), etched);
  body.position.y = ETCH_START + bodyLen / 2;
  // flip so v runs base → mouth like the canvas
  body.rotation.x = Math.PI;
  axis.add(body);
  axis.add(
    new THREE.Mesh(
      new THREE.LatheGeometry(
        [new THREE.Vector2(CASE_RADIUS, ETCH_END - 0.002), new THREE.Vector2(CASE_RADIUS, CASE_END - 0.05), new THREE.Vector2(CASE_RADIUS - 0.015, CASE_END)],
        SEGMENTS,
      ),
      brass,
    ),
  );
  axis.add(new THREE.Mesh(new THREE.LatheGeometry(headProfile(), SEGMENTS), copper));
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), primer);
  cap.rotation.x = Math.PI / 2;
  cap.position.y = CASE_START - 0.001;
  axis.add(cap);

  const centre = (CASE_START + HEAD_END) / 2;
  inner.position.x = -centre;
  const group = new THREE.Group();
  group.add(inner);

  return {
    group,
    etchOffset: new THREE.Vector3(CASE_START + ETCH_AT * (CASE_END - CASE_START) - centre, 0, 0),
    setGlow: (v) => {
      etched.emissiveIntensity = v;
    },
    dispose: () => {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      [brass, etched, copper, primer].forEach((m) => m.dispose());
      Object.values(textures).forEach((t) => t.dispose());
    },
  };
}

/** Total length of the cartridge, used to frame it. */
export const BULLET_LENGTH = HEAD_END - CASE_START;
/** Length of the engraving, so the close-up can keep the whole word in frame. */
export const BULLET_ETCH_SPAN = (ETCH_END - ETCH_START) * 0.9;
