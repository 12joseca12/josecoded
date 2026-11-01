import { PageTransition } from '@/components/layout/page-transition';

import type { ReactNode } from 'react';

export default function AreaTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
