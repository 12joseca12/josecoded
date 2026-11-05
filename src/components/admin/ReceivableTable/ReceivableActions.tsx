"use client";

import { ConfirmAction } from "@/components/admin/ConfirmAction/ConfirmAction";
import { InvoiceSheet } from "@/components/admin/InvoiceSheet/InvoiceSheet";
import { ProformaSheet } from "@/components/admin/ProformaSheet/ProformaSheet";
import {
  type PaymentDealOption,
  type PaymentInvoiceOption,
  type PaymentScheduleOption,
  RecordPaymentSheet,
} from "@/components/admin/RecordPaymentSheet/RecordPaymentSheet";
import type {
  ConfirmLabels,
  InvoiceSheetLabels,
  PaymentsPageHandlers,
  ProformaSheetLabels,
  ReceivableActionLabels,
  RecordPaymentLabels,
} from "@/types/payments";

interface ReceivableActionsProps {
  scheduleId: string;
  dealId: string;
  label: string;
  contactName: string;
  status: "scheduled" | "proforma_sent" | "invoiced" | "paid" | "cancelled";
  amountCents: number;
  locale: string;
  today: string;
  vat: string;
  deals: PaymentDealOption[];
  schedule: PaymentScheduleOption[];
  invoices: PaymentInvoiceOption[];
  labels: {
    actions: ReceivableActionLabels;
    record: RecordPaymentLabels;
    proforma: ProformaSheetLabels;
    invoice: InvoiceSheetLabels;
    confirm: ConfirmLabels;
  };
  handlers: PaymentsPageHandlers;
}

function named(template: string, label: string, name: string): string {
  return template.replace("{label}", label).replace("{name}", name);
}

export function ReceivableActions({
  scheduleId,
  dealId,
  label,
  contactName,
  status,
  amountCents,
  locale,
  today,
  vat,
  deals,
  schedule,
  invoices,
  labels,
  handlers,
}: ReceivableActionsProps) {
  const { actions } = labels;
  const closed = status === "paid" || status === "cancelled";
  return (
    <>
      {status === "cancelled" ? null : (
        <RecordPaymentSheet
          deals={deals}
          schedule={schedule}
          invoices={invoices}
          labels={labels.record}
          record={handlers.record}
          today={today}
          preset={{ dealId, scheduleId }}
          trigger={{
            text: actions.collect,
            aria: named(actions.collectAria, label, contactName),
            variant: "light",
            size: "sm",
          }}
        />
      )}
      <ProformaSheet
        scheduleId={scheduleId}
        defaultVat={vat}
        locale={locale}
        labels={labels.proforma}
        issue={handlers.proforma}
        available={status === "scheduled"}
        trigger={{
          text: actions.proforma,
          aria: named(actions.proformaAria, label, contactName),
        }}
      />
      {status === "scheduled" || status === "proforma_sent" ? (
        <InvoiceSheet
          dealId={dealId}
          scheduleId={scheduleId}
          defaultNetCents={amountCents}
          defaultVat={vat}
          today={today}
          labels={labels.invoice}
          record={handlers.invoice}
          trigger={{
            text: actions.invoice,
            aria: named(actions.invoiceAria, label, contactName),
          }}
        />
      ) : null}
      {closed ? null : (
        <ConfirmAction
          triggerText={actions.cancel}
          triggerAria={named(actions.cancelAria, label, contactName)}
          title={labels.confirm.cancelTitle}
          text={labels.confirm.cancelText}
          submitLabel={labels.confirm.cancelSubmit}
          savingLabel={labels.confirm.saving}
          closeLabel={labels.confirm.close}
          doneMessage={labels.confirm.cancelDone}
          errors={labels.confirm.errors}
          run={() => handlers.cancelItem({ id: scheduleId })}
        />
      )}
    </>
  );
}
