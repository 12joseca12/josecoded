import type { Transition, Variants } from "motion/react";

import type { NexoState } from "@/types/nexo";

import { eyeCentres, eyePath, type EyeShape, mouthPath, type MouthShape } from "./geometry";

type Value = number | string;

interface Loop {
  rest: Value;
  frames: Value[];
  duration: number;
  delay?: number;
  times?: number[];
  repeat?: number;
}

type Spec = Value | Loop;
type PartPose = Record<string, Spec>;

export const parts = [
  "float",
  "blink",
  "eyeLeft",
  "eyeRight",
  "mouth",
  "ear",
  "armLeft",
  "armRight",
  "ring",
  "glow",
  "dots",
  "dotA",
  "dotB",
  "dotC",
  "question",
  "sleep",
] as const;
export type Part = (typeof parts)[number];

const spring: Transition = { type: "spring", stiffness: 170, damping: 19, mass: 0.9 };
const morph: Transition = { type: "spring", stiffness: 210, damping: 24 };

const loop = (rest: Value, frames: Value[], duration: number, extra: Partial<Loop> = {}): Loop => ({
  rest,
  frames,
  duration,
  ...extra,
});
const once = (rest: Value, frames: Value[], duration: number): Loop =>
  loop(rest, frames, duration, { repeat: 0 });

const eye = (x0: number, y0: number, qx: number, qy: number, x1: number, y1: number): EyeShape => ({
  x0,
  y0,
  qx,
  qy,
  x1,
  y1,
});
const mouth = (
  x0: number,
  x1: number,
  y: number,
  top: number,
  bottom: number,
  slant = 0,
): MouthShape => ({ x0, y0: y + slant, x1, y1: y - slant, top, bottom });

const shapes = {
  open: eye(0, -7, 0, 0, 0, 7),
  attentive: eye(0, -8.5, 0, 0, 0, 8.5),
  tall: eye(0, -9.5, 0, 0, 0, 9.5),
  cheer: eye(-11, 4, 0, -11, 11, 4),
  beam: eye(-12, 5, 0, -14, 12, 5),
  dot: eye(0, 0, 0, 0, 0, 0),
  squint: eye(-8, 1, 0, 0, 8, -1),
  droop: eye(-9, 5, 0, 0, 8, -3),
  closed: eye(-9, 2, 0, 8, 9, 2),
};

const eyes = (shape: EyeShape, width: number, opacity = 1) => ({
  left: { d: eyePath(eyeCentres.left, shape, false), strokeWidth: width, opacity },
  right: { d: eyePath(eyeCentres.right, shape, true), strokeWidth: width, opacity },
});

const base = 97;
const mouths = {
  smile: mouthPath(mouth(90, 110, base, base + 4, base + 10)),
  grin: mouthPath(mouth(88, 112, base, base, base + 24)),
  beam: mouthPath(mouth(85, 115, base, base + 1, base + 27)),
  attentive: mouthPath(mouth(94, 106, base + 1, base + 4, base + 8)),
  flat: mouthPath(mouth(93, 107, base + 2, base + 1, base + 4)),
  wry: mouthPath(mouth(91, 110, base + 4, base + 1, base + 5, 2)),
  frown: mouthPath(mouth(90, 110, base + 7, base + 1, base + 6)),
  rest: mouthPath(mouth(95, 105, base + 3, base + 3, base + 6)),
  speak: [
    mouthPath(mouth(92, 108, base, base + 3, base + 8)),
    mouthPath(mouth(90, 110, base, base, base + 22)),
    mouthPath(mouth(93, 107, base, base + 2, base + 13)),
    mouthPath(mouth(89, 111, base, base, base + 26)),
    mouthPath(mouth(92, 108, base, base + 3, base + 8)),
  ],
};

const still = { y: 0, rotate: 0, scale: 1 };
const rested = { opacity: 1, scale: 1 };

type Pose = Record<Part, PartPose>;

const idleBlink = loop(1, [1, 1, 0.08, 1], 4.6, { times: [0, 0.9, 0.95, 1] });
const dotsOff: PartPose = { y: 0 };
const dotBounce = (delay: number): PartPose => ({
  y: loop(0, [0, -7, 0], 0.9, { delay }),
  opacity: loop(0.55, [0.55, 1, 0.55], 0.9, { delay }),
});

type Overrides = Partial<Omit<Pose, "mouth" | "eyeLeft" | "eyeRight">>;

function pose(partial: Overrides & { eyes: ReturnType<typeof eyes>; mouth: Spec }): Pose {
  const { eyes: pair, mouth: mouthSpec, ...overrides } = partial;
  return {
    float: still,
    blink: { scaleY: 1 },
    eyeLeft: pair.left,
    eyeRight: pair.right,
    mouth: { d: mouthSpec },
    ear: rested,
    armLeft: { rotate: 0 },
    armRight: { rotate: 0 },
    ring: { opacity: 0.92 },
    glow: { opacity: 0.55 },
    dots: { opacity: 0 },
    dotA: dotsOff,
    dotB: dotsOff,
    dotC: dotsOff,
    question: { opacity: 0, scale: 0.5, y: 6 },
    sleep: { opacity: 0, y: 4 },
    ...overrides,
  };
}

export const poses: Record<NexoState, Pose> = {
  idle: pose({
    eyes: eyes(shapes.open, 9),
    mouth: mouths.smile,
    float: { y: loop(0, [0, -4, 0], 3.8), rotate: 0, scale: 1 },
    blink: { scaleY: idleBlink },
  }),
  greeting: pose({
    eyes: eyes(shapes.cheer, 5.5),
    mouth: mouths.grin,
    float: {
      y: once(0, [0, -14, 0, -8, 0], 1.1),
      rotate: once(0, [0, -4, 3, 0], 1.1),
      scale: 1,
    },
    armRight: { rotate: loop(-35, [-28, -58, -30, -58, -28], 1.3) },
    ring: { opacity: 1 },
    glow: { opacity: 0.9 },
  }),
  listening: pose({
    eyes: eyes(shapes.attentive, 9.5),
    mouth: mouths.attentive,
    float: { y: loop(2, [2, 0.5, 2], 2.4), rotate: -4, scale: 1.04 },
    blink: { scaleY: idleBlink },
    ear: {
      opacity: loop(1, [0.85, 1, 0.85], 0.9),
      scale: loop(1, [1, 1.14, 1], 0.9),
    },
    ring: { opacity: 0.95 },
    glow: { opacity: 0.7 },
  }),
  thinking: pose({
    eyes: eyes(shapes.dot, 9, 0),
    mouth: mouths.flat,
    float: { y: -2, rotate: loop(0, [-2.5, 2.5, -2.5], 2.6), scale: 1 },
    ring: { opacity: 1 },
    glow: { opacity: 0.45 },
    dots: { opacity: 1 },
    dotA: dotBounce(0),
    dotB: dotBounce(0.15),
    dotC: dotBounce(0.3),
  }),
  talking: pose({
    eyes: eyes(shapes.open, 9),
    mouth: loop(mouths.smile, mouths.speak, 1.05),
    float: { y: loop(0, [0, -2.5, 0], 0.9), rotate: 0, scale: 1 },
    blink: { scaleY: idleBlink },
    ring: { opacity: 1 },
    glow: { opacity: 0.7 },
  }),
  happy: pose({
    eyes: eyes(shapes.beam, 6),
    mouth: mouths.beam,
    float: {
      y: once(0, [0, -12, 0, -6, 0], 0.9),
      rotate: 0,
      scale: once(1, [1, 1.07, 1], 0.9),
    },
    armLeft: { rotate: 26 },
    armRight: { rotate: -26 },
    ring: { opacity: 1 },
    glow: { opacity: 1 },
  }),
  confused: pose({
    eyes: {
      left: { d: eyePath(eyeCentres.left, shapes.tall, false), strokeWidth: 9.5, opacity: 1 },
      right: { d: eyePath(eyeCentres.right, shapes.squint, true), strokeWidth: 4.5, opacity: 1 },
    },
    mouth: mouths.wry,
    float: { y: 0, rotate: loop(8, [8, 6, 8], 2.6), scale: 1 },
    ring: { opacity: 0.8 },
    glow: { opacity: 0.45 },
    question: { opacity: 1, scale: 1, y: 0 },
  }),
  sad: pose({
    eyes: eyes(shapes.droop, 6, 0.85),
    mouth: mouths.frown,
    float: { y: 5, rotate: -2, scale: 0.98 },
    armLeft: { rotate: -6 },
    armRight: { rotate: 6 },
    ring: { opacity: 0.3 },
    glow: { opacity: 0.2 },
  }),
  sleeping: pose({
    eyes: eyes(shapes.closed, 4.5, 0.7),
    mouth: mouths.rest,
    float: { y: 6, rotate: 0, scale: loop(1, [1, 1.025, 1], 4.6) },
    ring: { opacity: 0.16 },
    glow: { opacity: 0.1 },
    sleep: { opacity: loop(1, [0.3, 1, 0.3], 3.2), y: loop(0, [0, -6, 0], 3.2) },
  }),
};

export const ringSpeed: Record<NexoState, number> = {
  idle: 0.00018,
  greeting: 0.0006,
  listening: 0.00026,
  thinking: 0.0016,
  talking: 0.0004,
  happy: 0.0008,
  confused: 0.00014,
  sad: 0.00007,
  sleeping: 0,
};

const isLoop = (spec: Spec): spec is Loop => typeof spec === "object";

function resolve(spec: PartPose, reduced: boolean) {
  const target: Record<string, Value | Value[]> = {};
  const transition: Record<string, Transition> = {};
  for (const [key, value] of Object.entries(spec)) {
    const moving = isLoop(value);
    const animated = moving && !reduced;
    target[key] = animated ? value.frames : moving ? value.rest : value;
    transition[key] = animated
      ? {
          duration: value.duration,
          delay: value.delay,
          times: value.times,
          repeat: value.repeat ?? Infinity,
          ease: "easeInOut",
        }
      : reduced
        ? { duration: 0 }
        : key === "d"
          ? morph
          : spring;
  }
  return { ...target, transition } as Variants[string];
}

export function variantsFor(part: Part, reduced: boolean) {
  const out: Variants = {};
  for (const [state, pose] of Object.entries(poses)) {
    out[state] = resolve(pose[part], reduced);
    out[`${state}:rest`] = resolve(pose[part], true);
  }
  return out;
}
