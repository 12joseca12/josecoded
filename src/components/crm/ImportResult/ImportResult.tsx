import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import type { ImportLabels, ImportSummary } from "@/types/crm-import";

import styles from "./ImportResult.module.css";

interface ImportResultProps {
  labels: ImportLabels;
  summary: ImportSummary;
  hasReport: boolean;
  contactsHref: string;
  onReport: () => void;
  onAgain: () => void;
}

function fill(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function ImportResult({
  labels,
  summary,
  hasReport,
  contactsHref,
  onReport,
  onAgain,
}: ImportResultProps) {
  const text = labels.result;
  const lines: { key: keyof ImportSummary; text: string }[] = [
    { key: "created", text: fill(text.created, summary.created) },
    { key: "updated", text: fill(text.updated, summary.updated) },
    { key: "skipped", text: fill(text.skipped, summary.skipped) },
    { key: "invalid", text: fill(text.invalid, summary.invalid) },
  ];

  return (
    <section className={styles.result} aria-labelledby="import-result-title">
      <Heading level={2} size="h4" id="import-result-title">
        {text.title}
      </Heading>
      <div role="status">
        <ul className={styles.list}>
          {lines.map((line) => (
            <li key={line.key} data-kind={line.key}>
              {line.text}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.actions}>
        <Button variant="accent" href={contactsHref}>
          {text.contacts}
        </Button>
        {hasReport ? (
          <Button variant="ghost" onClick={onReport}>
            {text.report}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onAgain}>
          {text.again}
        </Button>
      </div>
    </section>
  );
}
