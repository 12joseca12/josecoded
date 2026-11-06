import { useId } from "react";

import { DataTable } from "@/components/ui/DataTable/DataTable";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import {
  type ImportField,
  importFields,
  type ImportLabels,
  type ImportMapping,
  type ImportPreviewData,
  type ImportPreviewRow,
} from "@/types/crm-import";

import styles from "./ImportPreview.module.css";

interface ImportPreviewProps {
  data: ImportPreviewData;
  mapping: ImportMapping;
  labels: ImportLabels;
  busy: boolean;
  onMapping: (mapping: ImportMapping) => void;
}

const emptyCell = "—";
const tableFields: readonly ImportField[] = ["fullName", "email", "phone", "organization", "kind"];

function cellOf(row: ImportPreviewRow, mapping: ImportMapping, field: ImportField): string {
  const index = mapping[field];
  const value = index === null ? "" : (row.cells[index] ?? "");
  return value === "" ? emptyCell : value;
}

function fill(template: string, values: Record<string, number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
}

const tones = { ok: "done", duplicate: "muted", invalid: "alert" } as const;

export function ImportPreview({ data, mapping, labels, busy, onMapping }: ImportPreviewProps) {
  const base = useId();
  const { totals } = data;
  const text = labels.preview;
  const truncated = totals.rows > data.sample.length;

  return (
    <section className={styles.preview} aria-busy={busy || undefined}>
      <fieldset className={styles.mapping} disabled={busy}>
        <legend className={styles.legend}>{labels.mapping.legend}</legend>
        <p className={styles.hint}>{labels.mapping.hint}</p>
        <div className={styles.selects}>
          {importFields.map((field) => {
            const id = `${base}-${field}`;
            const required = field === "fullName";
            return (
              <div key={field} className={styles.select}>
                <label htmlFor={id}>
                  {labels.mapping.fields[field]}
                  {required ? (
                    <span className={styles.required}> {labels.mapping.required}</span>
                  ) : null}
                </label>
                <select
                  id={id}
                  name={`map-${field}`}
                  value={mapping[field] ?? ""}
                  aria-invalid={required && mapping.fullName === null ? true : undefined}
                  onChange={(event) => {
                    const raw = event.currentTarget.value;
                    onMapping({ ...mapping, [field]: raw === "" ? null : Number(raw) });
                  }}
                >
                  <option value="">{labels.mapping.none}</option>
                  {data.headers.map((header, index) => (
                    <option key={`${index}-${header}`} value={index}>
                      {header === "" ? `#${index + 1}` : header}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        {mapping.fullName === null ? (
          <p className={styles.alert} role="alert">
            {labels.mapping.missingName}
          </p>
        ) : null}
      </fieldset>

      <h2 className={styles.title}>{text.title}</h2>
      <p className={styles.summary} role="status">
        {fill(text.summary, {
          rows: totals.rows,
          valid: totals.valid,
          duplicates: totals.duplicates,
          invalid: totals.invalid,
        })}
      </p>
      {data.alreadyImported ? (
        <p className={styles.alert} role="alert">
          {text.alreadyImported}
        </p>
      ) : null}
      {totals.neutralized > 0 ? <p className={styles.hint}>{text.neutralized}</p> : null}

      <DataTable caption={text.caption} region={text.region} size="lg">
        <thead>
          <tr>
            <th scope="col">{text.line}</th>
            {tableFields.map((field) => (
              <th key={field} scope="col">
                {labels.mapping.fields[field]}
              </th>
            ))}
            <th scope="col">{text.verdict}</th>
          </tr>
        </thead>
        <tbody>
          {data.sample.map((row) => (
            <tr key={row.line}>
              <th scope="row">{row.line}</th>
              {tableFields.map((field) => (
                <td key={field}>{cellOf(row, mapping, field)}</td>
              ))}
              <td>
                <div className={styles.verdict}>
                  <StatusPill tone={tones[row.verdict]}>{text.verdicts[row.verdict]}</StatusPill>
                  {row.problems.map((problem) => (
                    <span key={problem} className={styles.problem}>
                      {text.problems[problem]}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      {truncated ? <p className={styles.hint}>{text.truncated}</p> : null}
    </section>
  );
}
