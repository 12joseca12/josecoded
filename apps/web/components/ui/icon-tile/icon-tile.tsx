import { Icon } from '@/components/ui/icon';

import styles from './icon-tile.module.css';

import type { IconName, IconTileSize, IconTileTone } from '@josecoded/types';

/**
 * Square icon holder: `md` heads a bento cell, `sm` leads a list row. `soft` is a violet tint,
 * `solid` marks the featured cell or the selected row and changes tone in 160 ms. Decorative
 * (`aria-hidden`): the text next to it names the thing.
 */
export function IconTile({
  icon,
  size = 'md',
  tone = 'soft',
}: {
  icon: IconName;
  size?: IconTileSize;
  tone?: IconTileTone;
}) {
  return (
    <span className={styles.tile} data-size={size} data-tone={tone} aria-hidden="true">
      <Icon name={icon} />
    </span>
  );
}
