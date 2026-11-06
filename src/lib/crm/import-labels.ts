import type { MessageKey } from "@/i18n/keys.generated";
import type { ImportHistoryLabels, ImportLabels } from "@/types/crm-import";

export type Translate = (key: MessageKey) => string;

export function importLabels(t: Translate): ImportLabels {
  return {
    pick: t("crm.import.pick"),
    pickAgain: t("crm.import.pickAgain"),
    hint: t("crm.import.hint"),
    selected: t("crm.import.selected"),
    checking: t("crm.import.checking"),
    rejections: {
      empty: t("crm.import.rejections.empty"),
      tooLarge: t("crm.import.rejections.tooLarge"),
      extension: t("crm.import.rejections.extension"),
      mime: t("crm.import.rejections.mime"),
      binary: t("crm.import.rejections.binary"),
      executable: t("crm.import.rejections.executable"),
      encoding: t("crm.import.rejections.encoding"),
      tooManyRows: t("crm.import.rejections.tooManyRows"),
      tooManyColumns: t("crm.import.rejections.tooManyColumns"),
      malformed: t("crm.import.rejections.malformed"),
      noHeader: t("crm.import.rejections.noHeader"),
      noFile: t("crm.import.rejections.noFile"),
      error: t("crm.import.rejections.error"),
      forbidden: t("crm.import.rejections.forbidden"),
    },
    templateDownload: t("crm.import.templateDownload"),
    mapping: {
      legend: t("crm.import.mapping.legend"),
      hint: t("crm.import.mapping.hint"),
      none: t("crm.import.mapping.none"),
      required: t("crm.import.mapping.required"),
      missingName: t("crm.import.mapping.missingName"),
      fields: {
        fullName: t("crm.import.mapping.fields.fullName"),
        email: t("crm.import.mapping.fields.email"),
        phone: t("crm.import.mapping.fields.phone"),
        organization: t("crm.import.mapping.fields.organization"),
        kind: t("crm.import.mapping.fields.kind"),
        notes: t("crm.import.mapping.fields.notes"),
      },
    },
    preview: {
      title: t("crm.import.preview.title"),
      caption: t("crm.import.preview.caption"),
      region: t("crm.import.preview.region"),
      line: t("crm.import.preview.line"),
      verdict: t("crm.import.preview.verdict"),
      summary: t("crm.import.preview.summary"),
      truncated: t("crm.import.preview.truncated"),
      alreadyImported: t("crm.import.preview.alreadyImported"),
      neutralized: t("crm.import.preview.neutralized"),
      verdicts: {
        ok: t("crm.import.preview.verdicts.ok"),
        duplicate: t("crm.import.preview.verdicts.duplicate"),
        invalid: t("crm.import.preview.verdicts.invalid"),
      },
      problems: {
        columns: t("crm.import.preview.problems.columns"),
        fullName: t("crm.import.preview.problems.fullName"),
        email: t("crm.import.preview.problems.email"),
        phone: t("crm.import.preview.problems.phone"),
        organization: t("crm.import.preview.problems.organization"),
        kind: t("crm.import.preview.problems.kind"),
        notes: t("crm.import.preview.problems.notes"),
        duplicateInFile: t("crm.import.preview.problems.duplicateInFile"),
      },
    },
    options: {
      legend: t("crm.import.options.legend"),
      skip: t("crm.import.options.skip"),
      skipHint: t("crm.import.options.skipHint"),
      update: t("crm.import.options.update"),
      updateHint: t("crm.import.options.updateHint"),
      owner: t("crm.import.options.owner"),
    },
    confirm: t("crm.import.confirm"),
    importing: t("crm.import.importing"),
    cancel: t("crm.import.cancel"),
    result: {
      title: t("crm.import.result.title"),
      created: t("crm.import.result.created"),
      updated: t("crm.import.result.updated"),
      skipped: t("crm.import.result.skipped"),
      invalid: t("crm.import.result.invalid"),
      report: t("crm.import.result.report"),
      again: t("crm.import.result.again"),
      contacts: t("crm.import.result.contacts"),
    },
    report: {
      line: t("crm.import.report.line"),
      problem: t("crm.import.report.problem"),
      status: {
        duplicate: t("crm.import.report.status.duplicate"),
        invalid: t("crm.import.report.status.invalid"),
      },
    },
    errors: {
      missingName: t("crm.import.errors.missingName"),
      alreadyImported: t("crm.import.errors.alreadyImported"),
      failed: t("crm.import.errors.failed"),
    },
  };
}

export function importHistoryLabels(t: Translate): ImportHistoryLabels {
  return {
    title: t("crm.import.history.title"),
    caption: t("crm.import.history.caption"),
    region: t("crm.import.history.region"),
    empty: t("crm.import.history.empty"),
    columns: {
      file: t("crm.import.history.columns.file"),
      date: t("crm.import.history.columns.date"),
      created: t("crm.import.history.columns.created"),
      updated: t("crm.import.history.columns.updated"),
      skipped: t("crm.import.history.columns.skipped"),
      invalid: t("crm.import.history.columns.invalid"),
    },
  };
}
