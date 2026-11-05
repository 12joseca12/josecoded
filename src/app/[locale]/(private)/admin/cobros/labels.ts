import type { Translate } from "@/lib/crm/contact-labels";
import type {
  ConfirmLabels,
  DocumentTableLabels,
  InvoiceSheetLabels,
  ProformaSheetLabels,
  ReceivableActionLabels,
  ReceivableTableLabels,
  RecordPaymentLabels,
  ScheduleSheetLabels,
} from "@/types/payments";

export function receivableTableLabels(t: Translate): ReceivableTableLabels {
  return {
    caption: t("admin.payments.table.caption"),
    region: t("admin.payments.table.region"),
    columns: {
      contact: t("admin.payments.table.columns.contact"),
      label: t("admin.payments.table.columns.label"),
      amount: t("admin.payments.table.columns.amount"),
      paid: t("admin.payments.table.columns.paid"),
      due: t("admin.payments.table.columns.due"),
      status: t("admin.payments.table.columns.status"),
      actions: t("admin.payments.table.columns.actions"),
    },
    paidOf: t("admin.payments.table.paidOf"),
    noDue: t("admin.payments.table.noDue"),
    overdue: t("admin.payments.table.overdue"),
    statuses: {
      scheduled: t("admin.payments.table.statuses.scheduled"),
      proforma_sent: t("admin.payments.table.statuses.proforma_sent"),
      invoiced: t("admin.payments.table.statuses.invoiced"),
      paid: t("admin.payments.table.statuses.paid"),
      cancelled: t("admin.payments.table.statuses.cancelled"),
    },
    kinds: {
      milestone: t("admin.payments.table.kinds.milestone"),
      recurring: t("admin.payments.table.kinds.recurring"),
    },
  };
}

export function receivableActionLabels(t: Translate): ReceivableActionLabels {
  return {
    collect: t("admin.payments.actions.collect"),
    collectAria: t("admin.payments.actions.collectAria"),
    proforma: t("admin.payments.actions.proforma"),
    proformaAria: t("admin.payments.actions.proformaAria"),
    invoice: t("admin.payments.actions.invoice"),
    invoiceAria: t("admin.payments.actions.invoiceAria"),
    cancel: t("admin.payments.actions.cancel"),
    cancelAria: t("admin.payments.actions.cancelAria"),
  };
}

export function documentTableLabels(t: Translate): DocumentTableLabels {
  return {
    caption: t("admin.payments.documents.caption"),
    region: t("admin.payments.documents.region"),
    columns: {
      contact: t("admin.payments.documents.columns.contact"),
      number: t("admin.payments.documents.columns.number"),
      date: t("admin.payments.documents.columns.date"),
      net: t("admin.payments.documents.columns.net"),
      vat: t("admin.payments.documents.columns.vat"),
      gross: t("admin.payments.documents.columns.gross"),
      status: t("admin.payments.documents.columns.status"),
      actions: t("admin.payments.documents.columns.actions"),
    },
    kinds: {
      proforma: t("admin.payments.documents.kinds.proforma"),
      invoice: t("admin.payments.documents.kinds.invoice"),
    },
    statuses: {
      draft: t("admin.payments.documents.statuses.draft"),
      sent: t("admin.payments.documents.statuses.sent"),
      paid: t("admin.payments.documents.statuses.paid"),
      void: t("admin.payments.documents.statuses.void"),
    },
    pdf: t("admin.payments.documents.pdf"),
    pdfAria: t("admin.payments.documents.pdfAria"),
    print: t("admin.payments.documents.print"),
    printAria: t("admin.payments.documents.printAria"),
    void: t("admin.payments.documents.void"),
    voidAria: t("admin.payments.documents.voidAria"),
  };
}

export function recordPaymentLabels(t: Translate): RecordPaymentLabels {
  return {
    open: t("admin.payments.record.open"),
    title: t("admin.payments.record.title"),
    close: t("admin.payments.record.close"),
    deal: t("admin.payments.record.deal"),
    dealPlaceholder: t("admin.payments.record.dealPlaceholder"),
    schedule: t("admin.payments.record.schedule"),
    noSchedule: t("admin.payments.record.noSchedule"),
    kind: t("admin.payments.record.kind"),
    nature: t("admin.payments.record.nature"),
    amount: t("admin.payments.record.amount"),
    amountHint: t("admin.payments.record.amountHint"),
    date: t("admin.payments.record.date"),
    method: t("admin.payments.record.method"),
    reference: t("admin.payments.record.reference"),
    invoice: t("admin.payments.record.invoice"),
    noInvoice: t("admin.payments.record.noInvoice"),
    optional: t("admin.payments.record.optional"),
    kinds: {
      payment: t("admin.payments.record.kinds.payment"),
      refund: t("admin.payments.record.kinds.refund"),
    },
    natures: {
      project: t("admin.payments.record.natures.project"),
      recurring: t("admin.payments.record.natures.recurring"),
    },
    methods: {
      transfer: t("admin.payments.record.methods.transfer"),
      card: t("admin.payments.record.methods.card"),
      stripe: t("admin.payments.record.methods.stripe"),
      other: t("admin.payments.record.methods.other"),
    },
    submit: t("admin.payments.record.submit"),
    saving: t("admin.payments.record.saving"),
    done: t("admin.payments.record.done"),
    errors: {
      deal: t("admin.payments.record.errors.deal"),
      amount: t("admin.payments.record.errors.amount"),
      date: t("admin.payments.record.errors.date"),
      future_date: t("admin.payments.record.errors.future_date"),
      payment_exceeds_schedule: t("admin.payments.record.errors.payment_exceeds_schedule"),
      payment_exceeds_deal: t("admin.payments.record.errors.payment_exceeds_deal"),
      refund_exceeds_paid: t("admin.payments.record.errors.refund_exceeds_paid"),
      no_recurring: t("admin.payments.record.errors.no_recurring"),
      nature_mismatch: t("admin.payments.record.errors.nature_mismatch"),
      schedule_cancelled: t("admin.payments.record.errors.schedule_cancelled"),
      schedule_mismatch: t("admin.payments.record.errors.schedule_mismatch"),
      invoice_mismatch: t("admin.payments.record.errors.invoice_mismatch"),
      invoice_void: t("admin.payments.record.errors.invoice_void"),
      deal_not_won: t("admin.payments.record.errors.deal_not_won"),
      invalid_payment: t("admin.payments.record.errors.invalid_payment"),
      forbidden: t("admin.payments.record.errors.forbidden"),
      error: t("admin.payments.record.errors.error"),
    },
  };
}

export function scheduleSheetLabels(t: Translate): ScheduleSheetLabels {
  return {
    open: t("admin.payments.scheduleSheet.open"),
    title: t("admin.payments.scheduleSheet.title"),
    close: t("admin.payments.scheduleSheet.close"),
    deal: t("admin.payments.scheduleSheet.deal"),
    dealPlaceholder: t("admin.payments.scheduleSheet.dealPlaceholder"),
    won: t("admin.payments.scheduleSheet.won"),
    templates: t("admin.payments.scheduleSheet.templates"),
    template442: t("admin.payments.scheduleSheet.template442"),
    templateSingle: t("admin.payments.scheduleSheet.templateSingle"),
    items: t("admin.payments.scheduleSheet.items"),
    label: t("admin.payments.scheduleSheet.label"),
    kind: t("admin.payments.scheduleSheet.kind"),
    kinds: {
      milestone: t("admin.payments.scheduleSheet.kinds.milestone"),
      recurring: t("admin.payments.scheduleSheet.kinds.recurring"),
    },
    percent: t("admin.payments.scheduleSheet.percent"),
    amount: t("admin.payments.scheduleSheet.amount"),
    due: t("admin.payments.scheduleSheet.due"),
    add: t("admin.payments.scheduleSheet.add"),
    remove: t("admin.payments.scheduleSheet.remove"),
    removeAria: t("admin.payments.scheduleSheet.removeAria"),
    sum: t("admin.payments.scheduleSheet.sum"),
    sumOk: t("admin.payments.scheduleSheet.sumOk"),
    defaults: {
      first: t("admin.payments.scheduleSheet.defaults.first"),
      second: t("admin.payments.scheduleSheet.defaults.second"),
      last: t("admin.payments.scheduleSheet.defaults.last"),
      single: t("admin.payments.scheduleSheet.defaults.single"),
      next: t("admin.payments.scheduleSheet.defaults.next"),
    },
    replaceNote: t("admin.payments.scheduleSheet.replaceNote"),
    submit: t("admin.payments.scheduleSheet.submit"),
    saving: t("admin.payments.scheduleSheet.saving"),
    done: t("admin.payments.scheduleSheet.done"),
    errors: {
      deal: t("admin.payments.scheduleSheet.errors.deal"),
      items: t("admin.payments.scheduleSheet.errors.items"),
      schedule_total_mismatch: t("admin.payments.scheduleSheet.errors.schedule_total_mismatch"),
      invalid_schedule: t("admin.payments.scheduleSheet.errors.invalid_schedule"),
      deal_not_won: t("admin.payments.scheduleSheet.errors.deal_not_won"),
      forbidden: t("admin.payments.scheduleSheet.errors.forbidden"),
      error: t("admin.payments.scheduleSheet.errors.error"),
    },
  };
}

export function proformaSheetLabels(t: Translate): ProformaSheetLabels {
  return {
    title: t("admin.payments.proformaSheet.title"),
    close: t("admin.payments.proformaSheet.close"),
    text: t("admin.payments.proformaSheet.text"),
    vat: t("admin.payments.proformaSheet.vat"),
    vatHint: t("admin.payments.proformaSheet.vatHint"),
    submit: t("admin.payments.proformaSheet.submit"),
    saving: t("admin.payments.proformaSheet.saving"),
    done: t("admin.payments.proformaSheet.done"),
    view: t("admin.payments.proformaSheet.view"),
    errors: {
      vat: t("admin.payments.proformaSheet.errors.vat"),
      proforma_already_issued: t("admin.payments.proformaSheet.errors.proforma_already_issued"),
      schedule_not_issuable: t("admin.payments.proformaSheet.errors.schedule_not_issuable"),
      schedule_not_found: t("admin.payments.proformaSheet.errors.schedule_not_found"),
      forbidden: t("admin.payments.proformaSheet.errors.forbidden"),
      error: t("admin.payments.proformaSheet.errors.error"),
    },
  };
}

export function invoiceSheetLabels(t: Translate): InvoiceSheetLabels {
  return {
    title: t("admin.payments.invoiceSheet.title"),
    close: t("admin.payments.invoiceSheet.close"),
    text: t("admin.payments.invoiceSheet.text"),
    number: t("admin.payments.invoiceSheet.number"),
    date: t("admin.payments.invoiceSheet.date"),
    net: t("admin.payments.invoiceSheet.net"),
    vat: t("admin.payments.invoiceSheet.vat"),
    file: t("admin.payments.invoiceSheet.file"),
    fileHint: t("admin.payments.invoiceSheet.fileHint"),
    optional: t("admin.payments.invoiceSheet.optional"),
    submit: t("admin.payments.invoiceSheet.submit"),
    saving: t("admin.payments.invoiceSheet.saving"),
    done: t("admin.payments.invoiceSheet.done"),
    errors: {
      number: t("admin.payments.invoiceSheet.errors.number"),
      date: t("admin.payments.invoiceSheet.errors.date"),
      net: t("admin.payments.invoiceSheet.errors.net"),
      vat: t("admin.payments.invoiceSheet.errors.vat"),
      fileType: t("admin.payments.invoiceSheet.errors.fileType"),
      fileSize: t("admin.payments.invoiceSheet.errors.fileSize"),
      upload: t("admin.payments.invoiceSheet.errors.upload"),
      invoice_number_reserved: t("admin.payments.invoiceSheet.errors.invoice_number_reserved"),
      invoice_number_taken: t("admin.payments.invoiceSheet.errors.invoice_number_taken"),
      invalid_invoice: t("admin.payments.invoiceSheet.errors.invalid_invoice"),
      schedule_mismatch: t("admin.payments.invoiceSheet.errors.schedule_mismatch"),
      schedule_cancelled: t("admin.payments.invoiceSheet.errors.schedule_cancelled"),
      forbidden: t("admin.payments.invoiceSheet.errors.forbidden"),
      error: t("admin.payments.invoiceSheet.errors.error"),
    },
  };
}

export function confirmLabels(t: Translate): ConfirmLabels {
  return {
    cancelTitle: t("admin.payments.confirm.cancelTitle"),
    cancelText: t("admin.payments.confirm.cancelText"),
    cancelSubmit: t("admin.payments.confirm.cancelSubmit"),
    cancelDone: t("admin.payments.confirm.cancelDone"),
    voidTitle: t("admin.payments.confirm.voidTitle"),
    voidText: t("admin.payments.confirm.voidText"),
    voidSubmit: t("admin.payments.confirm.voidSubmit"),
    voidDone: t("admin.payments.confirm.voidDone"),
    saving: t("admin.payments.confirm.saving"),
    close: t("admin.payments.confirm.close"),
    errors: {
      schedule_has_payments: t("admin.payments.confirm.errors.schedule_has_payments"),
      schedule_has_invoice: t("admin.payments.confirm.errors.schedule_has_invoice"),
      invoice_has_payments: t("admin.payments.confirm.errors.invoice_has_payments"),
      invoice_not_voidable: t("admin.payments.confirm.errors.invoice_not_voidable"),
      forbidden: t("admin.payments.confirm.errors.forbidden"),
      error: t("admin.payments.confirm.errors.error"),
    },
  };
}
