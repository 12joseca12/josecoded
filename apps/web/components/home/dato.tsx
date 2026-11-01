import { Pending, isPendingVisible } from '@/components/ui/pending';
import { isPendingDato } from '@/lib/content/dato';

import type { ReactNode } from 'react';

/**
 * A text of the scenes that Jose still has to supply. Ready, it is the text; pending, it is the
 * visible marker in development and previews and `null` in production, so a block built on it
 * (`value && <p>…</p>`) is simply not rendered there. Messages that hold a marker are read with
 * `t.raw`: the marker is not ICU syntax.
 */
export function datoText(value: string): ReactNode {
  if (!isPendingDato(value)) return value;
  return isPendingVisible() ? <Pending>{value}</Pending> : null;
}
