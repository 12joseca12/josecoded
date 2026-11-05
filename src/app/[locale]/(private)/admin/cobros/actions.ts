"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import {
  runCancelItem,
  runIssueProforma,
  runRecordInvoice,
  runRecordPayment,
  runSetSchedule,
  runVoidInvoice,
} from "@/lib/admin/payment-actions";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { removeBillingFile, uploadBillingFile } from "@/lib/supabase/storage";
import type {
  ConfirmResult,
  IssueProformaResult,
  RecordInvoiceResult,
  RecordPaymentResult,
  SetScheduleResult,
} from "@/types/payments";

async function adminClient(locale: string) {
  if (!isLocale(locale)) return null;
  await requireZone("admin", locale);
  return createSupabaseServerClient();
}

function refresh(locale: string) {
  revalidatePath(`/${locale}/admin/cobros`);
  revalidatePath(`/${locale}/crm`, "layout");
}

export async function recordPaymentAction(
  locale: string,
  raw: unknown,
): Promise<RecordPaymentResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const result = await runRecordPayment(client, raw);
  if (result.status === "done") refresh(locale);
  return result;
}

export async function setScheduleAction(locale: string, raw: unknown): Promise<SetScheduleResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const result = await runSetSchedule(client, raw);
  if (result.status === "done") refresh(locale);
  return result;
}

export async function issueProformaAction(
  locale: string,
  raw: unknown,
): Promise<IssueProformaResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const result = await runIssueProforma(client, raw);
  if (result.status === "done") refresh(locale);
  return result;
}

export async function recordInvoiceAction(
  locale: string,
  data: FormData,
): Promise<RecordInvoiceResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const service = createSupabaseServiceClient();
  const result = await runRecordInvoice(
    client,
    service === null
      ? null
      : {
          upload: (path, file) => uploadBillingFile(service, path, file),
          remove: (path) => removeBillingFile(service, path),
        },
    data,
  );
  if (result.status === "done") refresh(locale);
  return result;
}

export async function cancelItemAction(locale: string, raw: unknown): Promise<ConfirmResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const result = await runCancelItem(client, raw);
  if (result.status === "done") refresh(locale);
  return result;
}

export async function voidInvoiceAction(locale: string, raw: unknown): Promise<ConfirmResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const result = await runVoidInvoice(client, raw);
  if (result.status === "done") refresh(locale);
  return result;
}
