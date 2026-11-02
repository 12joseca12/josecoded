import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';

import styles from './notify-block.module.css';

export interface NotifyBlockLabels {
  title: string;
  text: string;
  email: string;
  submit: string;
  /** Why the button cannot be pressed yet. */
  soon: string;
}

/**
 * «Avísame de nuevas guías»: one email field and its (ghost: the page's one violet action is the closing) button, at the foot of a guide. This is the screen only (block
 * B05): the button is disabled until the lead is wired (B06: Server Action -> `POST /leads`, `source: 'web_notify'`).
 *
 * A11y: a `section` named by its `h2`; the field has a real label and `autocomplete="email"`; the disabled button
 * is explained by the text under it, linked with `aria-describedby`.
 */
export function NotifyBlock({ labels }: { labels: NotifyBlockLabels }) {
  return (
    <Surface as="section" radius="tcard" aria-labelledby="notify-title">
      <div className={styles.inner}>
        <h2 id="notify-title" className={styles.title}>
          {labels.title}
        </h2>
        <p className={styles.text}>{labels.text}</p>
        <form className={styles.form} aria-label={labels.title}>
          <Field kind="email" name="email" label={labels.email} autoComplete="email" required disabled />
          <Button type="submit" variant="ghost" disabled aria-describedby="notify-soon">
            {labels.submit}
          </Button>
        </form>
        <p id="notify-soon" className={styles.soon}>
          {labels.soon}
        </p>
      </div>
    </Surface>
  );
}
