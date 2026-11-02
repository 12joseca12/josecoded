import Image from 'next/image';

import styles from './screen-gallery.module.css';

/**
 * Screenshots of the product, from `public/projects/<slug>/`. Each one has its reserved box (an aspect
 * ratio per kind of project), so nothing shifts while it loads, and a real description. With no
 * screenshots the case shows nothing here and the glyph art stands in on the head.
 *
 * A11y: a `figure` per image with text alternative; lazy images below the fold.
 */
export function ScreenGallery({
  shots,
  kind,
  alt,
}: {
  shots: readonly string[];
  kind: 'app' | 'web';
  /** Alternative text for the n-th shot (1-based). */
  alt: (n: number) => string;
}) {
  if (shots.length === 0) return null;
  const [width, height] = kind === 'app' ? [390, 844] : [1280, 800];
  return (
    <ul className={styles.gallery} data-kind={kind}>
      {shots.map((src, index) => (
        <li key={src} className={styles.shot}>
          <Image src={src} alt={alt(index + 1)} width={width} height={height} loading="lazy" />
        </li>
      ))}
    </ul>
  );
}
