import { CopyField } from '@/components/shared/copy-field';

import styles from './share-row.module.css';

/**
 * Share the guide: its address as selectable text with a «Copiar enlace» button. No third-party script and no social
 * widget; if the browser refuses the clipboard, the address is selected so it can be copied by hand (CopyField).
 *
 * A11y: a `section` named by its heading; the result of the copy is announced by the field's own status region.
 */
export function ShareRow({
  title,
  label,
  url,
  labels,
}: {
  title: string;
  label: string;
  url: string;
  labels: { copy: string; copied: string; failed: string };
}) {
  return (
    <section className={styles.row} aria-labelledby="share-title">
      <h2 id="share-title" className={styles.title}>
        {title}
      </h2>
      <CopyField label={label} value={url} labels={labels} />
    </section>
  );
}
