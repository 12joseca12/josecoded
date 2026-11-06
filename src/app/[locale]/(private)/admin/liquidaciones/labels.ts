import type { Translate } from "@/lib/crm/contact-labels";
import type {
  PayoutActionsLabels,
  PayoutBuilderLabels,
  PayoutInvoiceLabels,
  PayoutListLabels,
  StatementLabels,
} from "@/types/payouts";

function cadences(t: Translate) {
  return {
    per_payment: t("admin.payouts.cadences.per_payment"),
    weekly: t("admin.payouts.cadences.weekly"),
    biweekly: t("admin.payouts.cadences.biweekly"),
  };
}

function statuses(t: Translate) {
  return {
    draft: t("admin.payouts.statuses.draft"),
    issued: t("admin.payouts.statuses.issued"),
    paid: t("admin.payouts.statuses.paid"),
  };
}

export function payoutListLabels(t: Translate): PayoutListLabels {
  return {
    caption: t("admin.payouts.list.caption"),
    region: t("admin.payouts.list.region"),
    columns: {
      beneficiary: t("admin.payouts.list.columns.beneficiary"),
      period: t("admin.payouts.list.columns.period"),
      cadence: t("admin.payouts.list.columns.cadence"),
      total: t("admin.payouts.list.columns.total"),
      withholding: t("admin.payouts.list.columns.withholding"),
      net: t("admin.payouts.list.columns.net"),
      status: t("admin.payouts.list.columns.status"),
      reference: t("admin.payouts.list.columns.reference"),
      actions: t("admin.payouts.list.columns.actions"),
      kind: t("admin.payouts.list.columns.kind"),
    },
    open: t("admin.payouts.list.open"),
    openAria: t("admin.payouts.list.openAria"),
    range: t("admin.payouts.list.range"),
    none: t("admin.payouts.list.none"),
    kinds: {
      commission: t("admin.payouts.list.kinds.commission"),
      freelance: t("admin.payouts.list.kinds.freelance"),
    },
    cadences: cadences(t),
    statuses: statuses(t),
  };
}

export function payoutBuilderLabels(t: Translate): PayoutBuilderLabels {
  return {
    roles: {
      closer: t("admin.payouts.builder.roles.closer"),
      freelance: t("admin.payouts.builder.roles.freelance"),
    },
    open: t("admin.payouts.builder.open"),
    title: t("admin.payouts.builder.title"),
    close: t("admin.payouts.builder.close"),
    beneficiary: t("admin.payouts.builder.beneficiary"),
    placeholder: t("admin.payouts.builder.placeholder"),
    start: t("admin.payouts.builder.start"),
    end: t("admin.payouts.builder.end"),
    suggested: t("admin.payouts.builder.suggested"),
    withholding: t("admin.payouts.builder.withholding"),
    withholdingHint: t("admin.payouts.builder.withholdingHint"),
    note: t("admin.payouts.builder.note"),
    optional: t("admin.payouts.builder.optional"),
    previewTitle: t("admin.payouts.builder.previewTitle"),
    previewCount: t("admin.payouts.builder.previewCount"),
    previewTotal: t("admin.payouts.builder.previewTotal"),
    previewEmpty: t("admin.payouts.builder.previewEmpty"),
    previewLoading: t("admin.payouts.builder.previewLoading"),
    submit: t("admin.payouts.builder.submit"),
    saving: t("admin.payouts.builder.saving"),
    done: t("admin.payouts.builder.done"),
    cadences: cadences(t),
    errors: {
      beneficiary: t("admin.payouts.builder.errors.beneficiary"),
      period: t("admin.payouts.builder.errors.period"),
      withholding: t("admin.payouts.builder.errors.withholding"),
      invalid_beneficiary: t("admin.payouts.builder.errors.invalid_beneficiary"),
      invalid_period: t("admin.payouts.builder.errors.invalid_period"),
      invalid_withholding: t("admin.payouts.builder.errors.invalid_withholding"),
      invalid_note: t("admin.payouts.builder.errors.invalid_note"),
      no_lines_in_period: t("admin.payouts.builder.errors.no_lines_in_period"),
      negative_total: t("admin.payouts.builder.errors.negative_total"),
      forbidden: t("admin.payouts.builder.errors.forbidden"),
      error: t("admin.payouts.builder.errors.error"),
    },
  };
}

export function payoutActionsLabels(t: Translate): PayoutActionsLabels {
  return {
    title: t("admin.payouts.actions.title"),
    issue: t("admin.payouts.actions.issue"),
    issueSaving: t("admin.payouts.actions.issueSaving"),
    issueDone: t("admin.payouts.actions.issueDone"),
    markPaid: t("admin.payouts.actions.markPaid"),
    deleteDraft: t("admin.payouts.actions.deleteDraft"),
    errors: {
      invalid_transition: t("admin.payouts.actions.errors.invalid_transition"),
      payout_not_draft: t("admin.payouts.actions.errors.payout_not_draft"),
      payout_not_found: t("admin.payouts.actions.errors.payout_not_found"),
      paid_at_required: t("admin.payouts.pay.errors.paid_at_required"),
      reference_required: t("admin.payouts.pay.errors.reference_required"),
      future_date: t("admin.payouts.pay.errors.future_date"),
      forbidden: t("admin.payouts.actions.errors.forbidden"),
      error: t("admin.payouts.actions.errors.error"),
    },
    pay: {
      title: t("admin.payouts.pay.title"),
      close: t("admin.payouts.pay.close"),
      text: t("admin.payouts.pay.text"),
      date: t("admin.payouts.pay.date"),
      reference: t("admin.payouts.pay.reference"),
      submit: t("admin.payouts.pay.submit"),
      saving: t("admin.payouts.pay.saving"),
      done: t("admin.payouts.pay.done"),
      errors: {
        date: t("admin.payouts.pay.errors.date"),
        reference: t("admin.payouts.pay.errors.reference"),
        invalid_transition: t("admin.payouts.pay.errors.invalid_transition"),
        payout_not_draft: t("admin.payouts.actions.errors.payout_not_draft"),
        payout_not_found: t("admin.payouts.pay.errors.payout_not_found"),
        paid_at_required: t("admin.payouts.pay.errors.paid_at_required"),
        reference_required: t("admin.payouts.pay.errors.reference_required"),
        future_date: t("admin.payouts.pay.errors.future_date"),
        forbidden: t("admin.payouts.pay.errors.forbidden"),
        error: t("admin.payouts.pay.errors.error"),
      },
    },
    deleteConfirm: {
      title: t("admin.payouts.deleteConfirm.title"),
      text: t("admin.payouts.deleteConfirm.text"),
      submit: t("admin.payouts.deleteConfirm.submit"),
      done: t("admin.payouts.deleteConfirm.done"),
      saving: t("admin.payouts.deleteConfirm.saving"),
      close: t("admin.payouts.deleteConfirm.close"),
    },
  };
}

export function payoutInvoiceLabels(t: Translate): PayoutInvoiceLabels {
  return {
    title: t("admin.payouts.invoice.title"),
    none: t("admin.payouts.invoice.none"),
    open: t("admin.payouts.invoice.open"),
    upload: t("admin.payouts.invoice.upload"),
    file: t("admin.payouts.invoice.file"),
    hint: t("admin.payouts.invoice.hint"),
    submit: t("admin.payouts.invoice.submit"),
    saving: t("admin.payouts.invoice.saving"),
    done: t("admin.payouts.invoice.done"),
    errors: {
      file: t("admin.payouts.invoice.errors.file"),
      fileType: t("admin.payouts.invoice.errors.fileType"),
      fileSize: t("admin.payouts.invoice.errors.fileSize"),
      upload: t("admin.payouts.invoice.errors.upload"),
      invalid_path: t("admin.payouts.invoice.errors.invalid_path"),
      payout_not_found: t("admin.payouts.invoice.errors.payout_not_found"),
      forbidden: t("admin.payouts.invoice.errors.forbidden"),
      error: t("admin.payouts.invoice.errors.error"),
    },
  };
}

export function statementLabels(t: Translate): StatementLabels {
  return {
    print: t("admin.payouts.statement.print"),
    printHint: t("admin.payouts.statement.printHint"),
    title: t("admin.payouts.statement.title"),
    issuer: t("admin.payouts.statement.issuer"),
    beneficiary: t("admin.payouts.statement.beneficiary"),
    period: t("admin.payouts.statement.period"),
    range: t("admin.payouts.statement.range"),
    notPayment: t("admin.payouts.statement.notPayment"),
    footer: t("admin.payouts.statement.footer"),
    summary: t("admin.payouts.detail.summary"),
    cadence: t("admin.payouts.detail.cadence"),
    total: t("admin.payouts.detail.total"),
    withholding: t("admin.payouts.detail.withholding"),
    net: t("admin.payouts.detail.net"),
    status: t("admin.payouts.detail.status"),
    issuedAt: t("admin.payouts.detail.issuedAt"),
    paidAt: t("admin.payouts.detail.paidAt"),
    reference: t("admin.payouts.detail.reference"),
    note: t("admin.payouts.detail.note"),
    linesTitle: t("admin.payouts.detail.linesTitle"),
    linesEmpty: t("admin.payouts.detail.linesEmpty"),
    linesCaption: t("admin.payouts.detail.linesCaption"),
    linesRegion: t("admin.payouts.detail.linesRegion"),
    linesColumns: {
      date: t("admin.payouts.detail.linesColumns.date"),
      contact: t("admin.payouts.detail.linesColumns.contact"),
      nature: t("admin.payouts.detail.linesColumns.nature"),
      base: t("admin.payouts.detail.linesColumns.base"),
      rate: t("admin.payouts.detail.linesColumns.rate"),
      amount: t("admin.payouts.detail.linesColumns.amount"),
    },
    items: {
      statementTitle: t("admin.payouts.detail.items.statementTitle"),
      title: t("admin.payouts.detail.items.title"),
      empty: t("admin.payouts.detail.items.empty"),
      caption: t("admin.payouts.detail.items.caption"),
      region: t("admin.payouts.detail.items.region"),
      columns: {
        date: t("admin.payouts.detail.items.columns.date"),
        label: t("admin.payouts.detail.items.columns.label"),
        hours: t("admin.payouts.detail.items.columns.hours"),
        amount: t("admin.payouts.detail.items.columns.amount"),
      },
      notInvoice: t("admin.payouts.detail.items.notInvoice"),
    },
    cadences: cadences(t),
    statuses: statuses(t),
    natures: {
      project: t("crm.contact.money.natures.project"),
      recurring: t("crm.contact.money.natures.recurring"),
    },
  };
}
