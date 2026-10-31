import { CycleBars } from '@/components/hero/cycle-bars';
import { HeroModeScript } from '@/components/hero/hero-mode-script';
import { HeroSceneGate } from '@/components/hero/hero-scene-gate';
import { env } from '@/lib/env';
import { heroMedia } from '@/lib/hero/media';

import styles from './hero-stage.module.css';

// Transparent pixel for the desktop that will run the live scene: the poster is never shown there,
// so it is not downloaded either (the preload scanner evaluates `media` and `scripting`).
const BLANK_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const SCENE_DESKTOP =
  '(min-width: 56.25rem) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (scripting: enabled)';

// an empty alt is not text (the stage already has its own description), so it is not a message
const DECORATIVE = '';

/**
 * The square on the right of the hero, with its three possible contents (UX v4.0 §4.1):
 * the live scene (desktop, drawn on a canvas that lives in the Backdrop), the video (phones, tablets
 * and desktops without WebGL2) and the poster (reduced motion, Save-Data, no JavaScript, and the
 * first frames of the other two on small screens: it is the LCP there).
 *
 * Markup of DT §1.6.3 with deviations: the canvas is not here (it is created by the scene gate
 * under the light field; `<main>` is a stacking context above it), and on a desktop that will run
 * the live scene the poster is hidden from the first paint and not even downloaded (decided by Jose,
 * 2026-10-31): `HeroModeScript` marks the stage `data-mode="scene"` before it is painted and a blank
 * pixel `<source>` takes the place of the poster for that case (and only with scripts enabled).
 * `HeroSceneGate` sets `data-mode` and `data-state` afterwards, and brings the poster back
 * (removing the placeholder) whenever the scene is not what runs. The `<video>` has no `poster`
 * attribute: the poster below it is the same image, downloaded once.
 *
 * A11y: `role="img"` with the translated description (the content is decorative: the video is
 * `aria-hidden`, the bars too); the stage is not focusable and the drag is pointer-only, so there
 * is no keyboard equivalent to provide; with reduced motion nothing moves.
 */
export function HeroStage({ label }: { label: string }) {
  const media = heroMedia(env.client.NEXT_PUBLIC_HERO_MEDIA_VERSION);

  return (
    <div className={styles.stage} data-hero-stage role="img" aria-label={label}>
      <HeroModeScript />
      <picture className={styles.poster}>
        <source data-poster-placeholder media={SCENE_DESKTOP} srcSet={BLANK_PIXEL} type="image/gif" />
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
        aria-hidden="true"
      />
      <CycleBars />
      <HeroSceneGate sources={{ webm: media.videoWebm, mp4: media.videoMp4 }} />
    </div>
  );
}
