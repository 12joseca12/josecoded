import type { ReactNode } from 'react';

// Pass-through root layout: <html> and <body> live in app/[locale]/layout.tsx (the language comes
// from the route) and in app/not-found.tsx (URLs outside any locale). Next requires this file
// because app/not-found.tsx exists.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
