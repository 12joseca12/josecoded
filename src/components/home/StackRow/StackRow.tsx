import { PageSection } from "@/components/site/PageSection/PageSection";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { getCv } from "@/content/cv";
import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { resolveStack } from "@/lib/about/cv";

import styles from "./StackRow.module.css";

interface StackRowProps {
  locale: Locale;
}

const groupKeys = {
  mobile: "about.stack.groups.mobile",
  web: "about.stack.groups.web",
  backend: "about.stack.groups.backend",
  ai: "about.stack.groups.ai",
} as const satisfies Record<string, MessageKey>;

const shownGroups = ["mobile", "web", "backend", "ai"] as const;
const itemsPerGroup = 6;

export async function StackRow({ locale }: StackRowProps) {
  const t = await getTranslator(locale);
  const stack = resolveStack(getCv().stack);
  const groups = shownGroups.flatMap((id) => {
    const entry = stack.find((candidate) => candidate.group === id);
    return entry
      ? [{ id, names: entry.items.slice(0, itemsPerGroup).map((item) => item.name) }]
      : [];
  });

  return (
    <PageSection id="stack" title={t("home.stack.title")} size="wide" fit="content">
      <div className={styles.groups}>
        {groups.map((group) => (
          <section
            key={group.id}
            className={styles.group}
            aria-labelledby={`home-stack-${group.id}`}
          >
            <Heading level={3} size="h4" id={`home-stack-${group.id}`}>
              {t(groupKeys[group.id])}
            </Heading>
            <p className={styles.names}>{group.names.join(", ")}</p>
          </section>
        ))}
      </div>
      <div>
        <Link href={`/${locale}/sobre-mi#stack`} variant="arrow">
          {t("services.bento.proof.stack")}
        </Link>
      </div>
    </PageSection>
  );
}
