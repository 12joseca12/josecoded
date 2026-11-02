import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';

import styles from './publish-bar.module.css';

/**
 * The bar of D2 Contenido: what is waiting to be published, the preview and the publication. It sticks under the top
 * bar so it stays in reach while a long list scrolls. The two actions exist only when the screen is given their
 * handlers (the draft and the publication are the next block): without them they are disabled and say why.
 *
 * A11y: a named region; the count is text, the badge colour only reinforces it; a disabled action points at the reason
 * with `aria-describedby`.
 */
export function PublishBar({ count, onPreview, onPublish }: { count: number; onPreview?: () => void; onPublish?: () => void }) {
  const t = useTranslations('adminTexts.bar');
  const reason = useId();
  const wired = onPreview !== undefined && onPublish !== undefined;
  return (
    <div className={styles.bar} role="region" aria-label={t('label')}>
      <span className={styles.count}>
        <StatusBadge tone={count > 0 ? 'attention' : 'muted'}>{count > 0 ? t('pending', { count }) : t('none')}</StatusBadge>
      </span>
      <Button variant="ghost" size="sm" icon="eye" disabled={!wired} onClick={onPreview} aria-describedby={wired ? undefined : reason}>
        {t('preview')}
      </Button>
      <Button variant="solid" size="sm" icon="rocket" disabled={!wired || count === 0} onClick={onPublish} aria-describedby={wired ? undefined : reason}>
        {t('publish')}
      </Button>
      {wired ? null : (
        <span id={reason} className="sr-only">
          {t('soon')}
        </span>
      )}
    </div>
  );
}
