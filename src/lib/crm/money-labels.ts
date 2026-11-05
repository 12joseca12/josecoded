import type { CancelRecurringLabels, DealMoneyLabels, WinSheetLabels } from "@/types/deal-win";

import type { Translate } from "./contact-labels";

export function winSheetLabels(t: Translate): WinSheetLabels {
  return {
    open: t("crm.contact.win.open"),
    openAria: t("crm.contact.win.openAria"),
    title: t("crm.contact.win.title"),
    close: t("crm.contact.win.close"),
    wonAmount: t("crm.contact.win.wonAmount"),
    wonAmountHint: t("crm.contact.win.wonAmountHint"),
    recurring: t("crm.contact.win.recurring"),
    recurringHint: t("crm.contact.win.recurringHint"),
    optional: t("crm.contact.win.optional"),
    previewTitle: t("crm.contact.win.previewTitle"),
    previewEmpty: t("crm.contact.win.previewEmpty"),
    previewLine: t("crm.contact.win.previewLine"),
    previewParentAnonymous: t("crm.contact.win.previewParentAnonymous"),
    previewRecurring: t("crm.contact.win.previewRecurring"),
    previewTotal: t("crm.contact.win.previewTotal"),
    freezeNote: t("crm.contact.win.freezeNote"),
    parentRole: t("crm.contact.win.parentRole"),
    closerRole: t("crm.contact.win.closerRole"),
    noCommission: {
      hiring: t("crm.contact.win.noCommission.hiring"),
      admin: t("crm.contact.win.noCommission.admin"),
      unknown_owner: t("crm.contact.win.noCommission.unknown_owner"),
      no_rate: t("crm.contact.win.noCommission.no_rate"),
    },
    submit: t("crm.contact.win.submit"),
    saving: t("crm.contact.win.saving"),
    done: t("crm.contact.win.done"),
    errors: {
      wonAmount: t("crm.contact.win.errors.wonAmount"),
      recurringMonthly: t("crm.contact.win.errors.recurringMonthly"),
      forbidden: t("crm.contact.win.errors.forbidden"),
      not_found: t("crm.contact.win.errors.not_found"),
      already_won: t("crm.contact.win.errors.already_won"),
      lost: t("crm.contact.win.errors.lost"),
      error: t("crm.contact.win.errors.error"),
    },
  };
}

export function cancelRecurringLabels(t: Translate): CancelRecurringLabels {
  return {
    open: t("crm.contact.cancelRecurring.open"),
    openAria: t("crm.contact.cancelRecurring.openAria"),
    title: t("crm.contact.cancelRecurring.title"),
    close: t("crm.contact.cancelRecurring.close"),
    text: t("crm.contact.cancelRecurring.text"),
    submit: t("crm.contact.cancelRecurring.submit"),
    saving: t("crm.contact.cancelRecurring.saving"),
    done: t("crm.contact.cancelRecurring.done"),
    errors: {
      forbidden: t("crm.contact.cancelRecurring.errors.forbidden"),
      not_recurring: t("crm.contact.cancelRecurring.errors.not_recurring"),
      already_cancelled: t("crm.contact.cancelRecurring.errors.already_cancelled"),
      error: t("crm.contact.cancelRecurring.errors.error"),
    },
  };
}

export function dealMoneyLabels(t: Translate): DealMoneyLabels {
  return {
    title: t("crm.contact.money.title"),
    loading: t("crm.contact.money.loading"),
    empty: t("crm.contact.money.empty"),
    emptyText: t("crm.contact.money.emptyText"),
    dealHeading: t("crm.contact.money.dealHeading"),
    expected: t("crm.contact.money.expected"),
    expectedLine: t("crm.contact.money.expectedLine"),
    expectedNone: t("crm.contact.money.expectedNone"),
    scheduleTitle: t("crm.contact.money.scheduleTitle"),
    scheduleEmpty: t("crm.contact.money.scheduleEmpty"),
    scheduleColumns: {
      label: t("crm.contact.money.scheduleColumns.label"),
      amount: t("crm.contact.money.scheduleColumns.amount"),
      due: t("crm.contact.money.scheduleColumns.due"),
      status: t("crm.contact.money.scheduleColumns.status"),
    },
    scheduleStatuses: {
      scheduled: t("crm.contact.money.scheduleStatuses.scheduled"),
      proforma_sent: t("crm.contact.money.scheduleStatuses.proforma_sent"),
      invoiced: t("crm.contact.money.scheduleStatuses.invoiced"),
      paid: t("crm.contact.money.scheduleStatuses.paid"),
      cancelled: t("crm.contact.money.scheduleStatuses.cancelled"),
    },
    scheduleKinds: {
      milestone: t("crm.contact.money.scheduleKinds.milestone"),
      recurring: t("crm.contact.money.scheduleKinds.recurring"),
    },
    overdue: t("crm.contact.money.overdue"),
    paymentsTitle: t("crm.contact.money.paymentsTitle"),
    paymentsEmpty: t("crm.contact.money.paymentsEmpty"),
    paymentsColumns: {
      date: t("crm.contact.money.paymentsColumns.date"),
      kind: t("crm.contact.money.paymentsColumns.kind"),
      nature: t("crm.contact.money.paymentsColumns.nature"),
      amount: t("crm.contact.money.paymentsColumns.amount"),
      method: t("crm.contact.money.paymentsColumns.method"),
      reference: t("crm.contact.money.paymentsColumns.reference"),
    },
    paymentKinds: {
      payment: t("crm.contact.money.paymentKinds.payment"),
      refund: t("crm.contact.money.paymentKinds.refund"),
    },
    paymentMethods: {
      transfer: t("crm.contact.money.paymentMethods.transfer"),
      card: t("crm.contact.money.paymentMethods.card"),
      stripe: t("crm.contact.money.paymentMethods.stripe"),
      other: t("crm.contact.money.paymentMethods.other"),
    },
    natures: {
      project: t("crm.contact.money.natures.project"),
      recurring: t("crm.contact.money.natures.recurring"),
    },
    linesTitle: t("crm.contact.money.linesTitle"),
    linesEmpty: t("crm.contact.money.linesEmpty"),
    linesColumns: {
      date: t("crm.contact.money.linesColumns.date"),
      beneficiary: t("crm.contact.money.linesColumns.beneficiary"),
      role: t("crm.contact.money.linesColumns.role"),
      nature: t("crm.contact.money.linesColumns.nature"),
      base: t("crm.contact.money.linesColumns.base"),
      rate: t("crm.contact.money.linesColumns.rate"),
      amount: t("crm.contact.money.linesColumns.amount"),
      status: t("crm.contact.money.linesColumns.status"),
    },
    roles: {
      closer: t("crm.contact.money.roles.closer"),
      parent: t("crm.contact.money.roles.parent"),
    },
    lineStatuses: {
      accrued: t("crm.contact.money.lineStatuses.accrued"),
      approved: t("crm.contact.money.lineStatuses.approved"),
      rejected: t("crm.contact.money.lineStatuses.rejected"),
      paid: t("crm.contact.money.lineStatuses.paid"),
      reversed: t("crm.contact.money.lineStatuses.reversed"),
    },
    invoicesTitle: t("crm.contact.money.invoicesTitle"),
    invoicesEmpty: t("crm.contact.money.invoicesEmpty"),
    invoicesColumns: {
      number: t("crm.contact.money.invoicesColumns.number"),
      date: t("crm.contact.money.invoicesColumns.date"),
      net: t("crm.contact.money.invoicesColumns.net"),
      vat: t("crm.contact.money.invoicesColumns.vat"),
      gross: t("crm.contact.money.invoicesColumns.gross"),
      status: t("crm.contact.money.invoicesColumns.status"),
    },
    invoiceKinds: {
      proforma: t("crm.contact.money.invoiceKinds.proforma"),
      invoice: t("crm.contact.money.invoiceKinds.invoice"),
    },
    invoiceStatuses: {
      draft: t("crm.contact.money.invoiceStatuses.draft"),
      sent: t("crm.contact.money.invoiceStatuses.sent"),
      paid: t("crm.contact.money.invoiceStatuses.paid"),
      void: t("crm.contact.money.invoiceStatuses.void"),
    },
    unknownPerson: t("crm.contact.money.unknownPerson"),
    tableLabel: t("crm.contact.money.tableLabel"),
    error: {
      title: t("crm.contact.money.error.title"),
      text: t("crm.contact.money.error.text"),
      retry: t("crm.contact.money.error.retry"),
      retrying: t("crm.contact.money.error.retrying"),
    },
  };
}
