import { requireDevUi } from '@/lib/dev/gate';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Dev-only previews of the CRM screens with fixtures (no Supabase, no login). Same gate as /dev/ui
// (lib/dev/gate.ts): 404 in production, never indexed, absent from the sitemap.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevCrmLayout({ children }: { children: ReactNode }) {
  requireDevUi();
  return children;
}
