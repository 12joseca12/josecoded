import { formatCents } from "@/lib/money";
import type { FeeCardLabels, FeeSummary } from "@/types/freelance-fees";

export function fillLine(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export function feeLine(summary: FeeSummary, locale: string, labels: FeeCardLabels): string {
  if (summary.mode === "fixed") {
    return fillLine(labels.fixed, { amount: formatCents(summary.amount ?? 0, locale) });
  }
  if (summary.mode === "hourly") {
    const base = fillLine(labels.hourly, { rate: formatCents(summary.hourly_rate ?? 0, locale) });
    return summary.hours_cap === null
      ? base
      : `${base} · ${fillLine(labels.hourlyCap, { hours: String(summary.hours_cap) })}`;
  }
  return labels.milestones;
}
