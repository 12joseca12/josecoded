import { PageTransition } from '@/components/layout/page-transition';

import type { ReactNode } from 'react';

// A template, unlike a layout, is re-created on every navigation: that is what makes the page leave
// and enter. It sits inside the (public) layout, under the frame, so the header and the footer stay
// put and only the page cross-fades.
export default function PublicTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
