import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { Card } from "@/components/ui/Card/Card";
import { Prose } from "@/components/ui/Prose/Prose";
import type { TocItem } from "@/types/about";
import type { BreadcrumbItem } from "@/types/services";

import { Toc } from "../Toc/Toc";
import styles from "./LegalDoc.module.css";

interface LegalDocProps {
  title: string;
  updated: string;
  breadcrumbs: { label: string; items: BreadcrumbItem[] };
  draft: { title: string; text: string } | null;
  summary: { title: string; items: string[] } | null;
  toc: { label: string; title: string; items: TocItem[] };
  children: ReactNode;
}

export function LegalDoc({
  title,
  updated,
  breadcrumbs,
  draft,
  summary,
  toc,
  children,
}: LegalDocProps) {
  return (
    <>
      <PageHead
        title={title}
        lead={updated}
        breadcrumbs={<Breadcrumbs label={breadcrumbs.label} items={breadcrumbs.items} />}
      />
      <div className={styles.layout}>
        {toc.items.length > 0 ? (
          <aside className={styles.aside}>
            <Toc label={toc.label} title={toc.title} items={toc.items} />
          </aside>
        ) : null}
        <div className={styles.content}>
          {draft ? (
            <Card as="div" role="note" size="sm" className={styles.draft}>
              <p className={styles.draftTitle}>{draft.title}</p>
              <p>{draft.text}</p>
            </Card>
          ) : null}
          {summary && summary.items.length > 0 ? (
            <section className={styles.summary} aria-label={summary.title}>
              <p className={styles.summaryTitle}>{summary.title}</p>
              <ul className={styles.summaryList}>
                {summary.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <Prose>{children}</Prose>
        </div>
      </div>
    </>
  );
}
