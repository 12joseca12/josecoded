import { Pending, isPendingVisible } from '@/components/ui/pending';
import { isPendingDato } from '@/lib/content/dato';

import styles from './credential-list.module.css';

export interface Credential {
  id: string;
  name: string;
  /** Body and year, e.g. «PeopleCert, 2024»; a `{{DATO}}` while Jose has not said whether it is obtained. */
  status: string;
}

/**
 * Certifications with their state. A credential whose state is still pending is not listed in
 * production: claiming a title nobody confirmed would be worse than leaving it out. In development
 * it shows with its marker.
 */
export function CredentialList({ items }: { items: readonly Credential[] }) {
  const shown = items.filter((item) => !isPendingDato(item.status) || isPendingVisible());
  if (shown.length === 0) return null;
  return (
    <ul className={styles.list}>
      {shown.map((item) => (
        <li key={item.id} className={styles.item}>
          <span className={styles.name}>{item.name}</span>
          <span className={styles.status}>{isPendingDato(item.status) ? <Pending>{item.status}</Pending> : item.status}</span>
        </li>
      ))}
    </ul>
  );
}
