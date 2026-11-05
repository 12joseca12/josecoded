import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import { Prose } from "@/components/ui/Prose/Prose";
import { defaultLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import type { CaseKind } from "@/types/projects";

import styles from "./CaseSection.module.css";

const titleKeys: Record<CaseKind, MessageKey> = {
  challenge: "projects.case.challenge",
  did: "projects.case.did",
  result: "projects.case.result",
};

interface CaseSectionProps {
  kind: CaseKind;
  children: ReactNode;
}

export async function CaseSection({ kind, children }: CaseSectionProps) {
  const t = await getTranslator(defaultLocale);
  const id = `caso-${kind}`;
  return (
    <section className={styles.section} aria-labelledby={`${id}-title`} data-kind={kind}>
      <Heading level={2} id={`${id}-title`} marker>
        {t(titleKeys[kind])}
      </Heading>
      <Prose>{children}</Prose>
    </section>
  );
}
