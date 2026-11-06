import { DataTable } from "@/components/ui/DataTable/DataTable";
import { Heading } from "@/components/ui/Heading/Heading";
import type { ImportHistoryLabels, ImportHistoryRow } from "@/types/crm-import";

import styles from "./ImportHistory.module.css";

interface ImportHistoryProps {
  rows: ImportHistoryRow[];
  locale: string;
  labels: ImportHistoryLabels;
}

export function ImportHistory({ rows, locale, labels }: ImportHistoryProps) {
  const format = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Madrid",
  });
  return (
    <section className={styles.history} aria-labelledby="import-history-title">
      <Heading level={2} size="h4" id="import-history-title">
        {labels.title}
      </Heading>
      {rows.length === 0 ? (
        <p className={styles.empty}>{labels.empty}</p>
      ) : (
        <DataTable caption={labels.caption} region={labels.region}>
          <thead>
            <tr>
              <th scope="col">{labels.columns.file}</th>
              <th scope="col">{labels.columns.date}</th>
              <th scope="col">{labels.columns.created}</th>
              <th scope="col">{labels.columns.updated}</th>
              <th scope="col">{labels.columns.skipped}</th>
              <th scope="col">{labels.columns.invalid}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className={styles.file}>
                  {row.fileName}
                </th>
                <td>{format.format(new Date(row.createdAt))}</td>
                <td>{row.created}</td>
                <td>{row.updated}</td>
                <td>{row.skipped}</td>
                <td>{row.invalid}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}
