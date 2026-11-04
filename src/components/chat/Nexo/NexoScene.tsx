"use client";

import {
  domAnimation,
  LazyMotion,
  m,
  type MotionValue,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useId, useMemo } from "react";

import type { NexoSize, NexoState } from "@/types/nexo";

import { orbit, orbitBack, orbitFront } from "./geometry";
import styles from "./Nexo.module.css";
import { type Part, parts, ringSpeed, variantsFor } from "./poses";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface NexoSceneProps {
  state: NexoState;
  size: NexoSize;
  label: string;
  reducedMotion: boolean;
}

const restingHighlight = 0.35;
const circuit = 2 + orbit.highlight;

function useOrbit(state: NexoState, reduced: boolean) {
  const phase = useMotionValue(restingHighlight + orbit.highlight);
  const speed = useSpring(0, { stiffness: 40, damping: 18 });
  useEffect(() => {
    speed.set(reduced ? 0 : ringSpeed[state]);
  }, [reduced, speed, state]);
  const front = useTransform(phase, (value) => (value % circuit) - orbit.highlight);
  const back = useTransform(front, (value) => value - 1);
  return { phase, speed, front, back };
}

function OrbitDriver({ phase, speed }: { phase: MotionValue<number>; speed: MotionValue<number> }) {
  useAnimationFrame((_, delta) => {
    phase.set(phase.get() + delta * speed.get());
  });
  return null;
}

function OrbitArc({
  d,
  offset,
  variants,
}: {
  d: string;
  offset: MotionValue<number>;
  variants: ReturnType<typeof variantsFor>;
}) {
  return (
    <m.g variants={variants} style={{ originX: 0.5, originY: 0.5 }}>
      <path className={styles.ringGlow} d={d} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path className={styles.ringCore} d={d} strokeWidth={4} fill="none" strokeLinecap="round" />
      <m.path
        className={styles.ringSpark}
        d={d}
        strokeWidth={4.6}
        fill="none"
        strokeLinecap="round"
        style={{ pathLength: orbit.highlight, pathSpacing: 2, pathOffset: offset }}
      />
    </m.g>
  );
}

export function NexoScene({ state, size, label, reducedMotion }: NexoSceneProps) {
  const prefersReduced = usePrefersReducedMotion();
  const reduced = reducedMotion || prefersReduced;
  const id = useId().replaceAll(":", "");
  const variants = useMemo(
    () =>
      Object.fromEntries(parts.map((part) => [part, variantsFor(part, reduced)])) as Record<
        Part,
        ReturnType<typeof variantsFor>
      >,
    [reduced],
  );
  const { phase, speed, front, back } = useOrbit(state, reduced);
  const fill = (name: string) => `url(#${id}${name})`;
  const { x: ox, y: oy } = orbit.centre;

  return (
    <LazyMotion features={domAnimation} strict>
      <m.svg
        className={styles.root}
        data-state={state}
        data-size={size}
        data-reduced={reduced ? "true" : undefined}
        viewBox="0 0 200 200"
        role="img"
        aria-label={label}
        focusable="false"
        initial={`${state}:rest`}
        animate={state}
      >
        <defs>
          <linearGradient id={`${id}head`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" className={styles.stopLight} />
            <stop offset="0.55" className={styles.stopMist} />
            <stop offset="1" className={styles.stopSteel} />
          </linearGradient>
          <linearGradient id={`${id}visor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={styles.stopVisorTop} />
            <stop offset="1" className={styles.stopVisorBottom} />
          </linearGradient>
          <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" className={styles.stopCoral} stopOpacity="0.38" />
            <stop offset="1" className={styles.stopCoral} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g aria-hidden="true">
          <m.g variants={variants.float} style={{ originX: 0.5, originY: 1 }}>
            <g transform={`translate(${ox} ${oy}) rotate(${orbit.tilt})`}>
              <OrbitArc d={orbitBack} offset={back} variants={variants.ring} />
            </g>

            <m.g variants={variants.ear}>
              <circle className={styles.pod} cx={31} cy={78} r={17} />
              <circle className={styles.podGlow} cx={31} cy={78} r={13} strokeWidth={4} />
              <circle className={styles.podRing} cx={31} cy={78} r={10.5} strokeWidth={2.6} />
            </m.g>
            <m.g variants={variants.ear}>
              <circle className={styles.pod} cx={169} cy={78} r={17} />
              <circle className={styles.podGlow} cx={169} cy={78} r={13} strokeWidth={4} />
              <circle className={styles.podRing} cx={169} cy={78} r={10.5} strokeWidth={2.6} />
            </m.g>

            <path
              fill={fill("head")}
              d="M100 128C122 128 134 144 134 164C134 184 120 196 100 196C80 196 66 184 66 164C66 144 78 128 100 128Z"
            />
            <path
              className={styles.panel}
              d="M100 146C112 146 119 156 119 168C119 182 111 190 100 190C89 190 81 182 81 168C81 156 88 146 100 146Z"
            />
            <path
              className={styles.glyph}
              d="M92.5 161.5L86.5 168L92.5 174.5M107.5 161.5L113.5 168L107.5 174.5M102.5 160L97.5 176"
              strokeWidth={2.4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <m.ellipse
              className={styles.arm}
              fill={fill("head")}
              cx={59}
              cy={152}
              rx={9}
              ry={13}
              variants={variants.armLeft}
              style={{ originX: 0.5, originY: 0.15 }}
            />
            <m.ellipse
              className={styles.arm}
              fill={fill("head")}
              cx={141}
              cy={152}
              rx={9}
              ry={13}
              variants={variants.armRight}
              style={{ originX: 0.5, originY: 0.15 }}
            />

            <path
              fill={fill("head")}
              d="M100 16C138 16 164 40 164 76C164 106 140 124 100 124C60 124 36 106 36 76C36 40 62 16 100 16Z"
            />
            <path
              className={styles.sheen}
              d="M60 38C68 28 82 23 98 22"
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
            />
            <path
              fill={fill("visor")}
              d="M100 34C134 34 152 52 152 76C152 98 134 112 100 112C66 112 48 98 48 76C48 52 66 34 100 34Z"
            />
            <m.ellipse
              fill={fill("glow")}
              cx={100}
              cy={82}
              rx={44}
              ry={30}
              variants={variants.glow}
            />
            <path
              className={styles.gloss}
              d="M62 54C68 45 80 40 94 39"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />

            <m.g variants={variants.blink} style={{ originX: 0.5, originY: 0.5 }}>
              <m.path
                className={styles.light}
                variants={variants.eyeLeft}
                fill="none"
                strokeLinecap="round"
              />
              <m.path
                className={styles.light}
                variants={variants.eyeRight}
                fill="none"
                strokeLinecap="round"
              />
            </m.g>
            <m.path className={styles.mouth} variants={variants.mouth} />

            <m.g variants={variants.dots}>
              <m.circle className={styles.dot} cx={86} cy={74} r={4.5} variants={variants.dotA} />
              <m.circle className={styles.dot} cx={100} cy={74} r={4.5} variants={variants.dotB} />
              <m.circle className={styles.dot} cx={114} cy={74} r={4.5} variants={variants.dotC} />
            </m.g>

            <m.g variants={variants.question} style={{ originX: 0.5, originY: 1 }}>
              <path
                className={styles.mark}
                d="M148 22Q148 14 156 14Q164 14 164 21Q164 26 158 30Q155 32 155 37"
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
              />
              <circle className={styles.markDot} cx={155} cy={44} r={2.6} />
            </m.g>

            <m.g variants={variants.sleep}>
              <path
                className={styles.mark}
                d="M150 30H160L150 42H160"
                strokeWidth={3.4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </m.g>

            <g transform={`translate(${ox} ${oy}) rotate(${orbit.tilt})`}>
              <OrbitArc d={orbitFront} offset={front} variants={variants.ring} />
            </g>
          </m.g>
        </g>
        {reduced ? null : <OrbitDriver phase={phase} speed={speed} />}
      </m.svg>
    </LazyMotion>
  );
}
