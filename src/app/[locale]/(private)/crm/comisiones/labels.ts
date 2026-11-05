import type { Translate } from "@/lib/crm/contact-labels";
import type {
  CommissionHeaderTableLabels,
  CommissionLineTableLabels,
  CommissionTotalsLabels,
} from "@/types/commissions";

export function totalsLabels(t: Translate): CommissionTotalsLabels {
  return {
    label: t("crm.commissions.totals.label"),
    all: t("crm.commissions.totals.all"),
    accrued: t("crm.commissions.totals.accrued"),
    approved: t("crm.commissions.totals.approved"),
    paid: t("crm.commissions.totals.paid"),
    reversed: t("crm.commissions.totals.reversed"),
  };
}

export function lineTableLabels(t: Translate): CommissionLineTableLabels {
  return {
    caption: t("crm.commissions.lines.caption"),
    region: t("crm.commissions.lines.region"),
    columns: {
      select: t("crm.commissions.lines.columns.select"),
      date: t("crm.commissions.lines.columns.date"),
      contact: t("crm.commissions.lines.columns.contact"),
      beneficiary: t("crm.commissions.lines.columns.beneficiary"),
      nature: t("crm.commissions.lines.columns.nature"),
      base: t("crm.commissions.lines.columns.base"),
      rate: t("crm.commissions.lines.columns.rate"),
      amount: t("crm.commissions.lines.columns.amount"),
      status: t("crm.commissions.lines.columns.status"),
      payout: t("crm.commissions.lines.columns.payout"),
      actions: t("crm.commissions.lines.columns.actions"),
    },
    selectAll: t("crm.commissions.lines.selectAll"),
    selectAria: t("crm.commissions.lines.selectAria"),
    noPayout: t("crm.commissions.lines.noPayout"),
    inPayout: t("crm.commissions.lines.inPayout"),
    preparing: t("crm.commissions.lines.preparing"),
    unknownPerson: t("crm.commissions.lines.unknownPerson"),
    rejectedReason: t("crm.commissions.lines.rejectedReason"),
    roles: {
      closer: t("crm.contact.money.roles.closer"),
      parent: t("crm.contact.money.roles.parent"),
    },
    natures: {
      project: t("crm.contact.money.natures.project"),
      recurring: t("crm.contact.money.natures.recurring"),
    },
    statuses: {
      accrued: t("crm.contact.money.lineStatuses.accrued"),
      approved: t("crm.contact.money.lineStatuses.approved"),
      rejected: t("crm.contact.money.lineStatuses.rejected"),
      paid: t("crm.contact.money.lineStatuses.paid"),
      reversed: t("crm.contact.money.lineStatuses.reversed"),
    },
    approve: {
      submit: t("crm.commissions.approve.submit"),
      none: t("crm.commissions.approve.none"),
      saving: t("crm.commissions.approve.saving"),
      done: t("crm.commissions.approve.done"),
      selected: t("crm.commissions.approve.selected"),
      errors: {
        invalid_selection: t("crm.commissions.approve.errors.invalid_selection"),
        line_not_accrued: t("crm.commissions.approve.errors.line_not_accrued"),
        forbidden: t("crm.commissions.approve.errors.forbidden"),
        error: t("crm.commissions.approve.errors.error"),
      },
    },
    reject: {
      open: t("crm.commissions.reject.open"),
      openAria: t("crm.commissions.reject.openAria"),
      title: t("crm.commissions.reject.title"),
      close: t("crm.commissions.reject.close"),
      reason: t("crm.commissions.reject.reason"),
      submit: t("crm.commissions.reject.submit"),
      saving: t("crm.commissions.reject.saving"),
      done: t("crm.commissions.reject.done"),
      errors: {
        reason_required: t("crm.commissions.reject.errors.reason_required"),
        line_not_accrued: t("crm.commissions.reject.errors.line_not_accrued"),
        line_not_found: t("crm.commissions.reject.errors.line_not_found"),
        forbidden: t("crm.commissions.reject.errors.forbidden"),
        error: t("crm.commissions.reject.errors.error"),
      },
    },
  };
}

export function headerTableLabels(t: Translate): CommissionHeaderTableLabels {
  return {
    caption: t("crm.commissions.headers.caption"),
    region: t("crm.commissions.headers.region"),
    columns: {
      contact: t("crm.commissions.headers.columns.contact"),
      closer: t("crm.commissions.headers.columns.closer"),
      subcloser: t("crm.commissions.headers.columns.subcloser"),
      rates: t("crm.commissions.headers.columns.rates"),
      expected: t("crm.commissions.headers.columns.expected"),
      accrued: t("crm.commissions.headers.columns.accrued"),
    },
    rates: t("crm.commissions.headers.rates"),
    noRecurring: t("crm.commissions.headers.noRecurring"),
    empty: t("crm.commissions.headers.empty"),
    unknownPerson: t("crm.commissions.lines.unknownPerson"),
  };
}
