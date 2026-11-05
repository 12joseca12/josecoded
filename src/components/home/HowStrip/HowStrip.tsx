import { Link } from "@/components/ui/Link/Link";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";

import styles from "./HowStrip.module.css";

interface HowStripProps {
  locale: Locale;
}

export async function HowStrip({ locale }: HowStripProps) {
  const t = await getTranslator(locale);

  return (
    <section
      id="como-trabajo"
      data-block
      className={styles.strip}
      aria-label={t("services.how.title")}
    >
      <div className={styles.body}>
        <p className={styles.line}>{t("home.how.line")}</p>
        <Link href={`/${locale}/como-trabajo`} variant="arrow">
          {t("services.how.more")}
        </Link>
      </div>
    </section>
  );
}
