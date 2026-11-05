import type { MessageKey } from "@/i18n/keys.generated";
import { type AuditKind, type AuditListLabels, type AuditTable, auditTables } from "@/types/audit";
import { type CounterKey, counterKeys } from "@/types/overview";

type Translate = (key: MessageKey) => string;

const auditKinds: readonly AuditKind[] = ["insert", "update", "delete", "totp_reset", "other"];

function record<T extends string>(t: Translate, prefix: string, names: readonly T[]) {
  return Object.fromEntries(
    names.map((name) => [name, t(`${prefix}.${name}` as MessageKey)]),
  ) as Record<T, string>;
}

export function buildAuditListLabels(t: Translate): AuditListLabels {
  return {
    region: t("admin.audit.list.region"),
    tables: record<AuditTable>(t, "admin.audit.tables", auditTables),
    kinds: record<AuditKind>(t, "admin.audit.kinds", auditKinds),
    system: t("admin.audit.list.system"),
    noChanges: t("admin.audit.list.noChanges"),
    emptyValue: t("admin.audit.list.emptyValue"),
    record: t("admin.audit.list.record"),
    moreChanges: t("admin.audit.list.moreChanges"),
  };
}

export function buildCounterLabels(t: Translate): Record<CounterKey, string> {
  return record<CounterKey>(t, "admin.overview.cells.labels", counterKeys);
}
