"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Maps linear scroll progress onto a staircase that lingers on each stop.
 * `hold` is the share of each segment spent parked on a stop, so the camera
 * "clips on" to the face, the back and the ground instead of drifting.
 */
export function stairProgress(p: number, stops: number[], hold = 0.45): number {
  if (stops.length < 2) return stops[0] ?? 0;
  const segs = stops.length - 1;
  const x = clamp01(p) * segs;
  const i = Math.min(segs - 1, Math.floor(x));
  const t = x - i;
  const h = hold / 2;
  let local: number;
  if (t <= h) local = 0;
  else if (t >= 1 - h) local = 1;
  else {
    const u = (t - h) / (1 - hold);
    local = u * u * (3 - 2 * u);
  }
  return stops[i] + (stops[i + 1] - stops[i]) * local;
}

/** Critically-damped-ish spring that chases a target value every frame. */
export function createSpring(initial = 0, stiffness = 120, damping = 18) {
  let value = initial;
  let velocity = 0;
  let target = initial;
  return {
    set target(v: number) {
      target = v;
    },
    get value() {
      return value;
    },
    jump(v: number) {
      value = target = v;
      velocity = 0;
    },
    step(dt: number) {
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;
      for (let s = 0; s < steps; s++) {
        const force = (target - value) * stiffness - velocity * damping;
        velocity += force * h;
        value += velocity * h;
      }
      return value;
    },
  };
}
