import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { contact } from "@/config/contact";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { withResponseTime } from "@/lib/common/response-time";

import styles from "./Closing.module.css";

interface ClosingProps {
  locale: Locale;
}

const titleId = "closing-title";

export async function Closing({ locale }: ClosingProps) {
  const t = await getTranslator(locale);
  const email = contact.ways.find((entry) => entry.way === "contratacion")?.email;

  return (
    <section id="cierre" data-block className={styles.closing} aria-labelledby={titleId}>
      <div className={styles.body}>
        <Heading level={2} size="h2" id={titleId} accent={t("home.closing.accent")}>
          {t("home.closing.title")}
        </Heading>
        <p className={styles.lead}>{withResponseTime(t, t("home.closing.lead"))}</p>
        <div className={styles.actions}>
          <Button href={`/${locale}/contacto`} variant="ghost">
            {t("home.closing.cta")}
          </Button>
          {email ? (
            <p className={styles.direct}>
              {t("home.closing.email")} <Link href={`mailto:${email}`}>{email}</Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
