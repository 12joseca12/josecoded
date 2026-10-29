'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef } from 'react';

import { MenuItem, MenuPanel } from '@/components/layout/menu-panel';
import { useShell } from '@/components/layout/shell-provider';
import { Icon } from '@/components/ui/icon';
import { usePathname } from '@/i18n/navigation';
import { currentFor } from '@/lib/layout/nav';
import { createDisclosure } from '@/lib/motion/disclosure';
import { bp } from '@/styles/breakpoints';

import styles from './mobile-menu.module.css';

import type { Disclosure } from '@/lib/motion/disclosure';
import type { Href } from '@josecoded/types';
import type { ReactNode } from 'react';

export interface MobileMenuLink {
  href: Href;
  label: string;
}

export interface MobileMenuProps {
  /** The sections of the main navigation. */
  links: readonly MobileMenuLink[];
  /** After a hairline: the agencies door. */
  secondary?: readonly MobileMenuLink[];
  /** The closing exit of the panel. */
  contact: MobileMenuLink;
  /** Contacto is the one emphasised row (v6, now an explicit prop instead of `a:last-of-type`). */
  contactHighlighted?: boolean;
  /** Defaults to the current route; tests and previews pass it. */
  currentPath?: string;
  /** Bottom slot: the segmented language switch. */
  children?: ReactNode;
}

const MENU_BREAKPOINT_REM = Number.parseFloat(bp.menu);

/**
 * The ☰ button and its panel, a native disclosure (button + panel, no dialog): non-modal, it closes
 * with Esc (focus returns to the button), by choosing a link, by focus or a tap outside, with the
 * wheel and when the window grows past the menu breakpoint. `useShell().menu` mirrors the state so
 * the palette and the menu never coexist. Without JavaScript the button is replaced by a link to
 * the footer index (`#pie`).
 *
 * A11y: `button[aria-expanded][aria-controls]` named «Menú»; the panel is a `nav` with the same
 * name; the current page carries `aria-current`; every row is 2.75 rem; the focus ring is global;
 * reduced motion removes the entry animation. Contrast: text-2 on overlay 7.6:1, text 15:1.
 */
export function MobileMenu({
  links,
  secondary = [],
  contact,
  contactHighlighted = true,
  currentPath,
  children,
}: MobileMenuProps) {
  const t = useTranslations('nav');
  const routePath = usePathname();
  const pathname = currentPath ?? routePath;
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const disclosure = useRef<Disclosure | null>(null);
  const { menu, openMenu, closeMenu } = useShell();

  useEffect(() => {
    const button = buttonRef.current;
    const panel = panelRef.current;
    if (!button || !panel) return;
    const instance = createDisclosure(button, panel, {
      closeOnWheel: true,
      closeAboveRem: MENU_BREAKPOINT_REM,
      onChange: (open) => (open ? openMenu() : closeMenu()),
    });
    disclosure.current = instance;
    return () => {
      instance.destroy();
      disclosure.current = null;
    };
  }, [openMenu, closeMenu]);

  // the shell closes the menu when the palette opens (and could open it): follow it, keep the focus
  useEffect(() => {
    const instance = disclosure.current;
    if (!instance || instance.isOpen() === menu) return;
    if (menu) instance.open();
    else instance.close({ restoreFocus: false });
  }, [menu]);

  const row = (link: MobileMenuLink) => (
    <MenuItem key={link.href} href={link.href} aria-current={currentFor(pathname, link.href)}>
      {link.label}
    </MenuItem>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.toggle}
        aria-label={t('menu')}
        aria-expanded="false"
        aria-controls={panelId}
        onClick={() => disclosure.current?.toggle()}
      >
        <span className={styles.open}>
          <Icon name="menu" />
        </span>
        <span className={styles.close}>
          <Icon name="x" />
        </span>
      </button>
      <a className={styles.noscript} href="#pie" aria-label={t('menuToFooter')}>
        <Icon name="menu" />
      </a>
      <MenuPanel id={panelId} ref={panelRef}>
        <nav aria-label={t('menu')} className={styles.nav}>
          {links.map(row)}
          {secondary.map((link, index) => (
            <MenuItem
              key={link.href}
              href={link.href}
              separated={index === 0}
              aria-current={currentFor(pathname, link.href)}
            >
              {link.label}
            </MenuItem>
          ))}
          <MenuItem
            href={contact.href}
            highlighted={contactHighlighted}
            aria-current={currentFor(pathname, contact.href)}
          >
            {contact.label}
          </MenuItem>
        </nav>
        {children}
      </MenuPanel>
    </>
  );
}
