import { requireDevUi } from '@/lib/dev/gate';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Dev-only previews of the admin screens with fixtures (no Supabase, no login). Same gate as /dev/crm.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevAdminLayout({ children }: { children: ReactNode }) {
  requireDevUi();
  return children;
}
