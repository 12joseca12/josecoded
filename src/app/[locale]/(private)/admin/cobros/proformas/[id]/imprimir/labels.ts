import type { Translate } from "@/lib/crm/contact-labels";
import type { ProformaPrintLabels } from "@/types/proforma";

export function proformaPrintLabels(t: Translate): ProformaPrintLabels {
  return {
    back: t("admin.proformaPrint.back"),
    print: t("admin.proformaPrint.print"),
    printHint: t("admin.proformaPrint.printHint"),
    heading: t("admin.proformaPrint.heading"),
    notInvoice: t("admin.proformaPrint.notInvoice"),
    void: t("admin.proformaPrint.void"),
    number: t("admin.proformaPrint.number"),
    issuedAt: t("admin.proformaPrint.issuedAt"),
    dueAt: t("admin.proformaPrint.dueAt"),
    noDue: t("admin.proformaPrint.noDue"),
    issuer: {
      title: t("admin.proformaPrint.issuer.title"),
      name: t("admin.proformaPrint.issuer.name"),
      taxId: t("admin.proformaPrint.issuer.taxId"),
      location: t("admin.proformaPrint.issuer.location"),
      email: t("admin.proformaPrint.issuer.email"),
    },
    client: {
      title: t("admin.proformaPrint.client.title"),
    },
    concept: {
      title: t("admin.proformaPrint.concept.title"),
      deal: t("admin.proformaPrint.concept.deal"),
    },
    totals: {
      net: t("admin.proformaPrint.totals.net"),
      vat: t("admin.proformaPrint.totals.vat"),
      gross: t("admin.proformaPrint.totals.gross"),
    },
    footer: t("admin.proformaPrint.footer"),
    error: {
      title: t("admin.proformaPrint.error.title"),
      text: t("admin.proformaPrint.error.text"),
      retry: t("admin.proformaPrint.error.retry"),
      retrying: t("admin.proformaPrint.error.retrying"),
    },
  };
}
