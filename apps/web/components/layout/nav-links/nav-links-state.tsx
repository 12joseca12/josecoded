'use client';

import { useEffect } from 'react';

import { usePathname } from '@/i18n/navigation';
import { currentFor } from '@/lib/layout/nav';
import { observeActiveSection } from '@/lib/motion/active-section';

/**
 * Client island of `NavLinks`: renders nothing and, after hydration, marks the links the server
 * rendered (`data-href`, `data-scene`). The attributes are set on the DOM because React does not
 * own them on those anchors; the cost is that `aria-current` is absent from the first HTML.
 */
export function NavLinksState({ navId }: { navId: string }) {
  const pathname = usePathname();
  const onHome = pathname === '/';

  useEffect(() => {
    const links = [...(document.getElementById(navId)?.querySelectorAll<HTMLAnchorElement>('a[data-href]') ?? [])];
    for (const link of links) {
      const current = onHome ? undefined : currentFor(pathname, link.dataset.href ?? '');
      if (current) link.setAttribute('aria-current', current);
      else link.removeAttribute('aria-current');
      link.removeAttribute('data-here');
    }
    if (!onHome) return;
    const scenes = links.map((link) => link.dataset.scene ?? '');
    return observeActiveSection(scenes, (scene) => {
      for (const link of links) {
        if (link.dataset.scene === scene) link.setAttribute('data-here', 'true');
        else link.removeAttribute('data-here');
      }
    });
  }, [navId, pathname, onHome]);

  return null;
}
