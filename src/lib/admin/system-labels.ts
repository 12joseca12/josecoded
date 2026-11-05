import type { MessageKey } from "@/i18n/keys.generated";
import { settingGroups, type SettingKey, settingKeys } from "@/lib/settings/definitions";
import {
  type JobKind,
  jobKinds,
  type JobStatus,
  jobStatuses,
  type JobTableLabels,
  type OmenStatusLabels,
  type SettingItemLabels,
  type SwitchListLabels,
} from "@/types/system";

type Translate = (key: MessageKey) => string;

type LabelId<K extends string> = K extends `${infer Head}.${infer Tail}`
  ? `${Head}_${LabelId<Tail>}`
  : K;

function labelId<K extends string>(key: K): LabelId<K> {
  return key.replaceAll(".", "_") as LabelId<K>;
}

function mapOf<K extends string, V>(keys: readonly K[], build: (key: K) => V): Record<K, V> {
  return Object.fromEntries(keys.map((key) => [key, build(key)])) as Record<K, V>;
}

export function buildSwitchListLabels(t: Translate): SwitchListLabels {
  return {
    region: t("admin.system.settings.region"),
    groups: mapOf(settingGroups, (group) => ({
      title: t(`admin.system.settings.groups.${group}.title`),
      text: t(`admin.system.settings.groups.${group}.text`),
    })),
    items: mapOf(settingKeys, (key: SettingKey): SettingItemLabels => ({
      name: t(`admin.system.settings.items.${labelId(key)}.name`),
      hint: t(`admin.system.settings.items.${labelId(key)}.hint`),
    })),
    row: {
      on: t("admin.system.settings.row.on"),
      off: t("admin.system.settings.row.off"),
      save: t("admin.system.settings.row.save"),
      saving: t("admin.system.settings.row.saving"),
      saved: t("admin.system.settings.row.saved"),
      updatedAt: t("admin.system.settings.row.updatedAt"),
      neverSaved: t("admin.system.settings.row.neverSaved"),
      wired: t("admin.system.settings.row.wired"),
      notWired: t("admin.system.settings.row.notWired"),
      maintenanceUntil: t("admin.system.settings.row.maintenanceUntil"),
      unit: {
        hours: t("admin.system.settings.row.unit.hours"),
        delay: t("admin.system.settings.row.unit.delay"),
        vat: t("admin.system.settings.row.unit.vat"),
      },
      cadence: {
        per_payment: t("admin.system.settings.row.cadence.per_payment"),
        weekly: t("admin.system.settings.row.cadence.weekly"),
        biweekly: t("admin.system.settings.row.cadence.biweekly"),
      },
      errors: {
        invalid: t("admin.system.settings.row.errors.invalid"),
        forbidden: t("admin.system.settings.row.errors.forbidden"),
        unavailable: t("admin.system.settings.row.errors.unavailable"),
        error: t("admin.system.settings.row.errors.error"),
      },
    },
  };
}

export function buildOmenLabels(t: Translate): OmenStatusLabels {
  return {
    title: t("admin.system.omen.title"),
    tone: {
      live: t("admin.system.omen.tone.live"),
      slow: t("admin.system.omen.tone.slow"),
      down: t("admin.system.omen.tone.down"),
      none: t("admin.system.omen.tone.none"),
    },
    bandNone: t("admin.system.omen.bandNone"),
    bandDown: t("admin.system.omen.bandDown"),
    seen: t("admin.system.omen.seen"),
    seenNever: t("admin.system.omen.seenNever"),
    version: t("admin.system.omen.version"),
    versionNone: t("admin.system.omen.versionNone"),
    models: t("admin.system.omen.models"),
    modelsNone: t("admin.system.omen.modelsNone"),
    queue: {
      queued: t("admin.system.omen.queue.queued"),
      running: t("admin.system.omen.queue.running"),
      failed: t("admin.system.omen.queue.failed"),
    },
    minutes: t("admin.system.omen.minutes"),
    unavailable: t("admin.system.omen.unavailable"),
  };
}

export function buildJobTableLabels(t: Translate): JobTableLabels {
  const filters = ["all", ...jobStatuses] as const;
  return {
    region: t("admin.system.jobs.region"),
    caption: t("admin.system.jobs.caption"),
    filterLabel: t("admin.system.jobs.filterLabel"),
    filters: mapOf(filters, (key: "all" | JobStatus) => t(`admin.system.jobs.filters.${key}`)),
    columns: {
      kind: t("admin.system.jobs.columns.kind"),
      status: t("admin.system.jobs.columns.status"),
      attempts: t("admin.system.jobs.columns.attempts"),
      runAfter: t("admin.system.jobs.columns.runAfter"),
      error: t("admin.system.jobs.columns.error"),
      actions: t("admin.system.jobs.columns.actions"),
    },
    kinds: mapOf(jobKinds, (kind: JobKind) => t(`admin.system.jobs.kinds.${labelId(kind)}`)),
    status: mapOf(jobStatuses, (status: JobStatus) => t(`admin.system.jobs.status.${status}`)),
    noError: t("admin.system.jobs.noError"),
    errorMore: t("admin.system.jobs.errorMore"),
    retry: t("admin.system.jobs.retry"),
    retrying: t("admin.system.jobs.retrying"),
    cancel: t("admin.system.jobs.cancel"),
    cancelling: t("admin.system.jobs.cancelling"),
    confirmRetry: t("admin.system.jobs.confirmRetry"),
    confirmCancel: t("admin.system.jobs.confirmCancel"),
    confirmYes: t("admin.system.jobs.confirmYes"),
    confirmNo: t("admin.system.jobs.confirmNo"),
    done: {
      retry: t("admin.system.jobs.done.retry"),
      cancel: t("admin.system.jobs.done.cancel"),
    },
    errors: {
      stale: t("admin.system.jobs.errors.stale"),
      forbidden: t("admin.system.jobs.errors.forbidden"),
      error: t("admin.system.jobs.errors.error"),
    },
  };
}
