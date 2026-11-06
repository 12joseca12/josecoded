"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import {
  runBuildPayout,
  runDeletePayoutDraft,
  runIssuePayout,
  runPayPayout,
  runSetPayoutInvoice,
} from "@/lib/admin/payout-actions";
import { previewPayoutLines } from "@/lib/admin/payouts";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { removeBillingFile, uploadBillingFile } from "@/lib/supabase/storage";
import {
  type BuildPayoutResult,
  type PayoutActionResult,
  type PayoutInvoiceResult,
  type PreviewPayoutResult,
  previewPayoutSchema,
} from "@/types/payouts";

async function adminClient(locale: string) {
  if (!isLocale(locale)) return null;
  await requireZone("admin", locale);
  return createSupabaseServerClient();
}

function refresh(locale: string) {
  revalidatePath(`/${locale}/admin/liquidaciones`, "layout");
  revalidatePath(`/${locale}/crm/comisiones`);
}

export async function buildPayoutAction(locale: string, raw: unknown): Promise<BuildPayoutResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const result = await runBuildPayout(client, raw);
  if (result.status === "done") refresh(locale);
  return result;
}

export async function previewPayoutAction(
  locale: string,
  raw: unknown,
): Promise<PreviewPayoutResult> {
  const client = await adminClient(locale);
  const parsed = previewPayoutSchema.safeParse(raw);
  if (client === null || !parsed.success) return { status: "error" };
  return previewPayoutLines(client, parsed.data.beneficiaryId, parsed.data.start, parsed.data.end);
}

export async function issuePayoutAction(locale: string, raw: unknown): Promise<PayoutActionResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const result = await runIssuePayout(client, raw);
  if (result.status === "done") refresh(locale);
  return result;
}

export async function payPayoutAction(locale: string, raw: unknown): Promise<PayoutActionResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const result = await runPayPayout(client, raw);
  if (result.status === "done") refresh(locale);
  return result;
}

export async function deletePayoutDraftAction(
  locale: string,
  raw: unknown,
): Promise<PayoutActionResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const result = await runDeletePayoutDraft(client, raw);
  if (result.status === "done") revalidatePath(`/${locale}/admin/liquidaciones`);
  return result;
}

export async function uploadPayoutInvoiceAction(
  locale: string,
  data: FormData,
): Promise<PayoutInvoiceResult> {
  const client = await adminClient(locale);
  if (client === null) return { status: "failed", code: "error" };
  const service = createSupabaseServiceClient();
  const result = await runSetPayoutInvoice(
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
