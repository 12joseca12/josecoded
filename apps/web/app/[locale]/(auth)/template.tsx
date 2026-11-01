import { PageTransition } from '@/components/layout/page-transition';

import type { ReactNode } from 'react';

export default function AuthTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
