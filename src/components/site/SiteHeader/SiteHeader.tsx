"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import type { Locale } from "@/i18n/config";
import { homeSlug, resolveActive, stripLocale } from "@/lib/nav/nav";
import { useNavState } from "@/lib/nav/use-nav-state";
import type { HeaderLabels, NavItem } from "@/types/nav";

import { Brand } from "../Brand/Brand";
import { MobileMenu } from "../MobileMenu/MobileMenu";
import { CapsuleRing } from "./CapsuleRing";
import styles from "./SiteHeader.module.css";

interface SiteHeaderProps {
  locale: Locale;
  items: NavItem[];
  labels: HeaderLabels;
}

const menuId = "site-menu";

export function SiteHeader({ locale, items, labels }: SiteHeaderProps) {
  const pathname = usePathname();
  const onHome = stripLocale(pathname) === "";
  const { scrolled, condensed, section } = useNavState(onHome);
  const active = resolveActive(
    items.map((item) => item.slug),
    pathname,
    section,
  );
  const current = onHome ? "location" : "page";

  const [openPath, setOpenPath] = useState<string | null>(null);
  const menuOpen = openPath === pathname;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setOpenPath(null);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const contactHref = `/${locale}/contacto`;
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  if (pendingFrom !== null && pendingFrom !== pathname) setPendingFrom(null);
  const loading = pendingFrom !== null;
  const cta = (
    <Button
      href={contactHref}
      size="sm"
      icon={<ArrowIcon />}
      loading={loading}
      loadingLabel={labels.loading}
      onClick={() => {
        if (pathname !== contactHref) setPendingFrom(pathname);
      }}
    >
      {labels.cta}
    </Button>
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const place = useCallback(() => {
    const indicator = indicatorRef.current;
    const link = trackRef.current?.querySelector<HTMLElement>("a[aria-current]");
    if (!indicator) return;
    if (!link || link.offsetWidth === 0) {
      indicator.style.opacity = "0";
      indicator.dataset.hidden = "";
      return;
    }
    if (indicator.dataset.hidden !== undefined) {
      indicator.dataset.instant = "";
      delete indicator.dataset.hidden;
      requestAnimationFrame(() => {
        delete indicator.dataset.instant;
      });
    }
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
    indicator.style.opacity = "1";
  }, []);

  useEffect(() => {
    place();
  }, [place, active]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(place);
    observer.observe(track);
    void document.fonts.ready.then(place);
    return () => {
      observer.disconnect();
    };
  }, [place]);

  const homeHref = `/${locale}`;
  const menuLinks = [
    { href: homeHref, label: labels.home, active: active === homeSlug },
    ...items.map((item) => ({
      href: `${homeHref}/${item.slug}`,
      label: item.label,
      active: active === item.slug,
    })),
  ];

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled || undefined}
      data-condensed={condensed || undefined}
    >
      <div className={styles.bar}>
        <CapsuleRing />
        <Brand
          href={homeHref}
          label={labels.brandLabel}
          word={labels.brandWord}
          collapsed={condensed}
        />
        <nav className={styles.nav} aria-label={labels.navLabel}>
          <div className={styles.track} ref={trackRef}>
            <span className={styles.indicator} ref={indicatorRef} aria-hidden="true" />
            <ul className={styles.links}>
              {items.map((item) => (
                <li key={item.slug}>
                  <NextLink
                    href={`${homeHref}/${item.slug}`}
                    className={styles.link}
                    aria-current={active === item.slug ? current : undefined}
                  >
                    {item.label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className={styles.actions}>
          {cta}
          <span className={styles.menu}>
            <IconButton
              ref={triggerRef}
              label={labels.menuOpen}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-haspopup="dialog"
              onClick={() => {
                setOpenPath(pathname);
              }}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M3 7h14M3 13h14" />
              </svg>
            </IconButton>
          </span>
        </div>
      </div>
      <MobileMenu
        id={menuId}
        open={menuOpen}
        onClose={closeMenu}
        title={labels.menuTitle}
        closeLabel={labels.menuClose}
        hereLabel={labels.here}
        links={menuLinks}
        cta={cta}
      />
    </header>
  );
}
