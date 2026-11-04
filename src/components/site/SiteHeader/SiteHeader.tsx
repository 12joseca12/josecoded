"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import type { Locale } from "@/i18n/config";
import { chatPanelMounted, openChat } from "@/lib/chat/chat-events";
import { useOpenChat } from "@/lib/chat/use-open-chat";
import { homeSlug, resolveActive, stripLocale } from "@/lib/nav/nav";
import { useNavState } from "@/lib/nav/use-nav-state";
import type { HeaderLabels, NavCurrent, NavItem, NavLink } from "@/types/nav";

import { Brand } from "../Brand/Brand";
import { ChatButton } from "../ChatButton/ChatButton";
import { type ChooserFocus, ContactChooser } from "../ContactChooser/ContactChooser";
import { MobileMenu } from "../MobileMenu/MobileMenu";
import { SearchButton } from "../SearchButton/SearchButton";
import { CapsuleRing } from "./CapsuleRing";
import styles from "./SiteHeader.module.css";

interface SiteHeaderProps {
  locale: Locale;
  items: NavItem[];
  labels: HeaderLabels;
  whatsappHref: string | null;
  searchEnabled: boolean;
}

const menuId = "site-menu";
const chooserId = "contact-chooser";

export function SiteHeader({
  locale,
  items,
  labels,
  whatsappHref,
  searchEnabled,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const onHome = stripLocale(pathname) === "";
  const { scrolled, condensed, section } = useNavState(onHome);
  const active = resolveActive(
    items.map((item) => item.slug),
    pathname,
    section,
  );
  const sectionCurrent: NavCurrent = onHome ? "location" : "page";

  const [openPath, setOpenPath] = useState<string | null>(null);
  const menuOpen = openPath === pathname;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setOpenPath(null);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const [chooser, setChooser] = useState<{ path: string | null; focus: ChooserFocus }>({
    path: null,
    focus: "first",
  });
  const chooserOpen = chooser.path === pathname;
  const chooserOpenerRef = useRef<HTMLElement | null>(null);
  const closeChooser = useCallback(() => {
    setChooser((current) => (current.path === null ? current : { ...current, path: null }));
  }, []);
  const openChooser = useCallback(
    (focus: ChooserFocus) => {
      setChooser({ path: pathname, focus });
    },
    [pathname],
  );
  const openChatFallback = useOpenChat(locale);
  const onChatButton = (opener: HTMLElement) => {
    if (chatPanelMounted()) {
      openChat();
      return;
    }
    chooserOpenerRef.current = opener;
    openChooser("chat");
  };

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
    const link = trackRef.current?.querySelector<HTMLElement>("a[data-active]");
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
  const links: NavLink[] = [
    {
      key: "home",
      href: homeHref,
      label: labels.home,
      active: active === homeSlug,
      current: onHome ? "page" : undefined,
    },
    ...items.map((item) => {
      const isActive = active === item.slug;
      return {
        key: item.slug,
        href: `${homeHref}/${item.slug}`,
        label: item.label,
        active: isActive,
        current: isActive ? sectionCurrent : undefined,
      };
    }),
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
              {links.map((link) => (
                <li key={link.key}>
                  <NextLink
                    href={link.href}
                    className={styles.link}
                    aria-current={link.current}
                    data-active={link.active || undefined}
                  >
                    {link.label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className={styles.actions}>
          {searchEnabled ? <SearchButton labels={labels.search} /> : null}
          <ChatButton labels={labels.chat} onClick={onChatButton} />
          <ContactChooser
            id={chooserId}
            open={chooserOpen}
            focus={chooser.focus}
            onOpen={openChooser}
            onClose={closeChooser}
            triggerLabel={labels.cta}
            labels={labels.contact}
            whatsappHref={whatsappHref}
            formHref={`${contactHref}#formulario`}
            onChat={openChatFallback}
            openerRef={chooserOpenerRef}
          />
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
        links={links}
        cta={cta}
      />
    </header>
  );
}
