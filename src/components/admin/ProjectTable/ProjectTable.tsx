import { ProjectSheet } from "@/components/admin/ProjectSheet/ProjectSheet";
import { Link } from "@/components/ui/Link/Link";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/admin/users";
import type {
  ProjectHandler,
  ProjectOptions,
  ProjectRow,
  ProjectSheetLabels,
  ProjectTableLabels,
} from "@/types/admin-projects";

import styles from "./ProjectTable.module.css";

interface ProjectTableProps {
  rows: ProjectRow[];
  options: ProjectOptions;
  locale: string;
  labels: ProjectTableLabels;
  sheetLabels: ProjectSheetLabels;
  update: ProjectHandler;
}

function datesOf(row: ProjectRow, locale: string, none: string): string {
  const from = row.started_at === null ? null : formatDay(row.started_at, locale);
  const to = row.due_at === null ? null : formatDay(row.due_at, locale);
  if (from === null && to === null) return none;
  return `${from ?? "—"} → ${to ?? "—"}`;
}

export function ProjectTable({
  rows,
  options,
  locale,
  labels,
  sheetLabels,
  update,
}: ProjectTableProps) {
  const offers = new Map(options.offers.map((offer) => [offer.slug, offer.name]));
  return (
    <div className={styles.region} role="region" aria-label={labels.region} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{labels.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.columns.name}</th>
            <th scope="col">{labels.columns.phase}</th>
            <th scope="col">{labels.columns.progress}</th>
            <th scope="col" className={styles.number}>
              {labels.columns.stories}
            </th>
            <th scope="col">{labels.columns.freelance}</th>
            <th scope="col">{labels.columns.dates}</th>
            <th scope="col">{labels.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-closed={row.status === "closed" ? "true" : undefined}>
              <th scope="row" className={styles.name}>
                <Link href={`/${locale}/admin/proyectos/${row.id}`}>{row.name}</Link>
                <span className={styles.meta}>
                  {row.client_name ?? labels.noClient}
                  {row.offer_slug !== null
                    ? ` · ${offers.get(row.offer_slug) ?? row.offer_slug}`
                    : ""}
                </span>
              </th>
              <td>
                <StatusPill tone={row.status === "closed" ? "muted" : "neutral"}>
                  {row.status === "active" ? labels.phases[row.phase] : labels.statuses[row.status]}
                </StatusPill>
              </td>
              <td>
                <progress
                  className={styles.progress}
                  value={row.percent}
                  max={100}
                  aria-label={labels.progress.replace("{name}", row.name)}
                />
                <span className={styles.meta}>
                  {labels.progressText
                    .replace("{done}", String(row.done))
                    .replace("{total}", String(row.total))
                    .replace("{percent}", String(row.percent))}
                </span>
              </td>
              <td className={styles.number}>
                {row.stories_to_decide > 0 ? (
                  <StatusPill tone="alert">
                    {labels.storiesToDecide.replace("{count}", String(row.stories_to_decide))}
                  </StatusPill>
                ) : (
                  0
                )}
              </td>
              <td>{row.freelance_name ?? labels.none}</td>
              <td className={styles.nowrap}>{datesOf(row, locale, labels.none)}</td>
              <td>
                <ProjectSheet
                  mode="edit"
                  project={row}
                  options={options}
                  labels={sheetLabels}
                  submit={update}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
