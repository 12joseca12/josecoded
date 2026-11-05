import type { SettingKind, SettingValue } from "./definitions";
import { isoToMadridLocal, madridLocalToIso } from "./madrid-time";

export function toDraft(kind: SettingKind, value: SettingValue): string {
  if (kind === "maintenance") {
    const until = typeof value === "object" && value !== null ? value.until : null;
    return until ? isoToMadridLocal(until) : "";
  }
  if (value === null || typeof value === "boolean" || typeof value === "object") return "";
  return String(value);
}

export function fromDraft(
  kind: SettingKind,
  draft: string,
  current: SettingValue,
): SettingValue | undefined {
  const text = draft.trim();
  if (kind === "month" || kind === "date") return text === "" ? null : text;
  if (kind === "hours") {
    if (text === "") return null;
    return /^\d+$/.test(text) ? Number(text) : undefined;
  }
  if (kind === "delay") return /^\d+$/.test(text) ? Number(text) : undefined;
  if (kind === "vat") return /^\d+(\.\d{1,2})?$/.test(text) ? Number(text) : undefined;
  if (kind === "maintenance") {
    const on = typeof current === "object" && current !== null ? current.on : false;
    if (text === "") return { on };
    const until = madridLocalToIso(text);
    return until === null ? undefined : { on, until };
  }
  return undefined;
}
