import {
  type ImportLabels,
  type ImportProblemRow,
  type ImportRowProblem,
  importTemplateHeaders,
} from "@/types/crm-import";

const byteOrderMark = String.fromCharCode(0xfeff);
const formulaStarts = ["=", "+", "-", "@", "\t", "\r"];

export function csvCell(value: string): string {
  const safe = formulaStarts.includes(value.charAt(0)) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function csvLine(cells: readonly string[]): string {
  return cells.map(csvCell).join(",");
}

export function templateCsv(): string {
  return `${csvLine(importTemplateHeaders)}\r\n`;
}

export function errorReportCsv(
  headers: readonly string[],
  problems: readonly ImportProblemRow[],
  labels: Pick<ImportLabels, "report"> & { problems: Record<ImportRowProblem, string> },
): string {
  const head = [labels.report.line, labels.report.problem, ...headers];
  const lines = problems.map((row) =>
    csvLine([
      String(row.line),
      [
        labels.report.status[row.verdict],
        ...row.problems.map((problem) => labels.problems[problem]),
      ].join("; "),
      ...row.cells,
    ]),
  );
  return `${byteOrderMark}${[csvLine(head), ...lines].join("\r\n")}\r\n`;
}
