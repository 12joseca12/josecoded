"use client";

import {
  domAnimation,
  LazyMotion,
  m,
  type MotionValue,
  useAnimationFrame,
  useMotionValue,
  useSpring,
} from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";

import type { NexoSize, NexoState } from "@/types/nexo";

import { orbit, orbitPaths } from "./geometry";
import styles from "./Nexo.module.css";
import { type Part, parts, ringPrecession, ringSpeed, variantsFor } from "./poses";
import { useOnScreen, useTabVisible } from "./useOnScreen";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface NexoSceneProps {
  state: NexoState;
  size: NexoSize;
  label: string;
  reducedMotion: boolean;
  paused: boolean;
}

const maxDelta = 50;

function useOrbit(state: NexoState, still: boolean, reduced: boolean) {
  const rest = useMemo(() => orbitPaths(orbit.restPrecession, orbit.restPhase), []);
  const precession = useMotionValue<number>(orbit.restPrecession);
  const phase = useMotionValue<number>(orbit.restPhase);
  const spinSpeed = useSpring(0, { stiffness: 40, damping: 18 });
  const driftSpeed = useSpring(0, { stiffness: 30, damping: 20 });
  const front = useMotionValue(rest.front);
  const back = useMotionValue(rest.back);
  const sparkFront = useMotionValue(rest.sparkFront);
  const sparkBack = useMotionValue(rest.sparkBack);
  useEffect(() => {
    spinSpeed.set(still ? 0 : ringSpeed[state]);
    driftSpeed.set(still ? 0 : ringPrecession[state]);
  }, [driftSpeed, spinSpeed, state, still]);
  useEffect(() => {
    if (!reduced) return;
    precession.set(orbit.restPrecession);
    phase.set(orbit.restPhase);
    front.set(rest.front);
    back.set(rest.back);
    sparkFront.set(rest.sparkFront);
    sparkBack.set(rest.sparkBack);
  }, [back, front, phase, precession, reduced, rest, sparkBack, sparkFront]);
  return { precession, phase, spinSpeed, driftSpeed, front, back, sparkFront, sparkBack };
}

type Orbit = ReturnType<typeof useOrbit>;

function OrbitDriver({ orbitState }: { orbitState: Orbit }) {
  const { precession, phase, spinSpeed, driftSpeed, front, back, sparkFront, sparkBack } =
    orbitState;
  useAnimationFrame((_, delta) => {
    const step = Math.min(delta, maxDelta);
    phase.set((phase.get() + step * spinSpeed.get()) % 1);
    precession.set((precession.get() + step * driftSpeed.get()) % 1);
    const paths = orbitPaths(precession.get(), phase.get());
    front.set(paths.front);
    back.set(paths.back);
    sparkFront.set(paths.sparkFront);
    sparkBack.set(paths.sparkBack);
  });
  return null;
}

function OrbitArc({
  d,
  spark,
  variants,
}: {
  d: MotionValue<string>;
  spark: MotionValue<string>;
  variants: ReturnType<typeof variantsFor>;
}) {
  return (
    <m.g variants={variants} style={{ originX: 0.5, originY: 0.5 }}>
      <m.path
        className={styles.ringGlow}
        d={d}
        strokeWidth={10}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <m.path
        className={styles.ringCore}
        d={d}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <m.path
        className={styles.ringSpark}
        d={spark}
        strokeWidth={4.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </m.g>
  );
}

export function NexoScene({ state, size, label, reducedMotion, paused }: NexoSceneProps) {
  const prefersReduced = usePrefersReducedMotion();
  const [node, setNode] = useState<SVGSVGElement | null>(null);
  const onScreen = useOnScreen(node);
  const tabVisible = useTabVisible();
  const reduced = reducedMotion || prefersReduced;
  const still = reduced || paused || !onScreen || !tabVisible;
  const id = useId().replaceAll(":", "");
  const variants = useMemo(
    () =>
      Object.fromEntries(parts.map((part) => [part, variantsFor(part, still)])) as Record<
        Part,
        ReturnType<typeof variantsFor>
      >,
    [still],
  );
  const orbitState = useOrbit(state, still, reduced);
  const fill = (name: string) => `url(#${id}${name})`;
  const { x: ox, y: oy } = orbit.centre;

  return (
    <LazyMotion features={domAnimation} strict>
      <m.svg
        key={still ? "still" : "live"}
        ref={setNode}
        className={styles.root}
        data-state={state}
        data-size={size}
        data-reduced={reduced ? "true" : undefined}
        data-paused={still && !reduced ? "true" : undefined}
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
            <g transform={`translate(${ox} ${oy})`}>
              <OrbitArc d={orbitState.back} spark={orbitState.sparkBack} variants={variants.ring} />
            </g>

            <m.g variants={variants.earLeft}>
              <circle className={styles.pod} cx={40} cy={78} r={11} />
              <circle className={styles.podGlow} cx={40} cy={78} r={8.5} strokeWidth={3} />
              <circle className={styles.podRing} cx={40} cy={78} r={6.5} strokeWidth={2} />
            </m.g>
            <m.g variants={variants.earRight}>
              <circle className={styles.pod} cx={160} cy={78} r={11} />
              <circle className={styles.podGlow} cx={160} cy={78} r={8.5} strokeWidth={3} />
              <circle className={styles.podRing} cx={160} cy={78} r={6.5} strokeWidth={2} />
            </m.g>

            <g transform="translate(0 -12)">
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
            </g>

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

            <g transform={`translate(${ox} ${oy})`}>
              <OrbitArc
                d={orbitState.front}
                spark={orbitState.sparkFront}
                variants={variants.ring}
              />
            </g>
          </m.g>
        </g>
        {still ? null : <OrbitDriver orbitState={orbitState} />}
      </m.svg>
    </LazyMotion>
  );
}
