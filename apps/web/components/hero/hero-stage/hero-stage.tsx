import { CycleBars } from '@/components/hero/cycle-bars';
import { HeroSceneGate } from '@/components/hero/hero-scene-gate';
import { env } from '@/lib/env';
import { heroMedia } from '@/lib/hero/media';

import styles from './hero-stage.module.css';

// an empty alt is not text (the stage already has its own description), so it is not a message
const DECORATIVE = '';

/**
 * The square on the right of the hero, with its three possible contents (UX v4.0 §4.1):
 * the live scene (desktop, drawn on a canvas that lives in the Backdrop), the video (phones, tablets
 * and desktops without WebGL2) and the poster (reduced motion, Save-Data, no JavaScript, and the
 * first frames of the other two on small screens: it is the LCP there).
 *
 * Markup of DT §1.6.3 with two deviations: the canvas is not here (it is created by the scene gate
 * under the light field; `<main>` is a stacking context above it), and on desktop with a fine pointer
 * the poster is hidden from the start while JavaScript runs, so the live scene is what the first
 * paint shows (decided by Jose, 2026-10-31). `HeroSceneGate` sets `data-mode` and `data-state`.
 *
 * A11y: `role="img"` with the translated description (the content is decorative: the video is
 * `aria-hidden`, the bars too); the stage is not focusable and the drag is pointer-only, so there
 * is no keyboard equivalent to provide; with reduced motion nothing moves.
 */
export function HeroStage({ label }: { label: string }) {
  const media = heroMedia(env.client.NEXT_PUBLIC_HERO_MEDIA_VERSION);

  return (
    <div className={styles.stage} data-hero-stage role="img" aria-label={label}>
      <picture className={styles.poster}>
        <source srcSet={media.posterAvif} type="image/avif" />
        <img
          className={styles.posterImage}
          src={media.posterWebp}
          width={media.size}
          height={media.size}
          fetchPriority="high"
          decoding="async"
          alt={DECORATIVE}
        />
      </picture>
      <video
        className={styles.video}
        muted
        playsInline
        loop
        preload="none"
        poster={media.posterWebp}
        aria-hidden="true"
      />
      <CycleBars />
      <HeroSceneGate sources={{ webm: media.videoWebm, mp4: media.videoMp4 }} />
    </div>
  );
}
