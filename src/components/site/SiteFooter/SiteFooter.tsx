import NextLink from "next/link";

import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import type { NavItem } from "@/types/nav";

import { Brand } from "../Brand/Brand";
import styles from "./SiteFooter.module.css";

interface SiteFooterProps {
  locale: Locale;
  items: NavItem[];
}

const legal: { slug: string; key: MessageKey }[] = [
  { slug: "aviso", key: "footer.notice" },
  { slug: "privacidad", key: "footer.privacy" },
  { slug: "cookies", key: "footer.cookies" },
];

export async function SiteFooter({ locale, items }: SiteFooterProps) {
  const t = await getTranslator(locale);
  const home = `/${locale}`;
  return (
    <footer className={styles.footer}>
      <div className={styles.row}>
        <Brand href={home} label={t("nav.brandLabel")} word={t("nav.brandWord")} />
        <nav aria-label={t("footer.navLabel")}>
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.slug}>
                <NextLink href={`${home}/${item.slug}`} className={styles.link}>
                  {item.label}
                </NextLink>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t("footer.legalLabel")}>
          <ul className={styles.list}>
            {legal.map((entry) => (
              <li key={entry.slug}>
                <NextLink href={`${home}/legal/${entry.slug}`} className={styles.link}>
                  {t(entry.key)}
                </NextLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className={styles.note}>{t("footer.copyright")}</p>
      </div>
    </footer>
  );
}
