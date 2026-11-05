import "@/lib/security/zod-jitless";

import { z } from "zod";

import { cents, invoiceStatuses } from "./money";

export const proformaRowSchema = z.object({
  id: z.uuid(),
  number: z.string().regex(/^PF-\d{4}-\d{3,}$/),
  kind: z.literal("proforma"),
  issued_at: z.string(),
  amount_net: cents,
  vat_rate: z.number(),
  vat_amount: cents,
  amount_gross: cents,
  status: z.enum(invoiceStatuses),
  payment_schedule: z.object({ label: z.string(), due_at: z.string().nullable() }).nullable(),
  deals: z
    .object({
      contacts: z.object({ full_name: z.string(), organization: z.string().nullable() }).nullable(),
    })
    .nullable(),
});

export type ProformaRow = z.infer<typeof proformaRowSchema>;

export type ProformaResult =
  { status: "ok"; proforma: ProformaRow } | { status: "missing" } | { status: "error" };

export interface ProformaPrintLabels {
  back: string;
  print: string;
  printHint: string;
  heading: string;
  notInvoice: string;
  void: string;
  number: string;
  issuedAt: string;
  dueAt: string;
  noDue: string;
  issuer: { title: string; name: string; taxId: string; location: string; email: string };
  client: { title: string };
  concept: { title: string; deal: string };
  totals: { net: string; vat: string; gross: string };
  footer: string;
  error: { title: string; text: string; retry: string; retrying: string };
}
