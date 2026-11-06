"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { approveLines, rejectLine } from "@/lib/crm/commission-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApproveResult, RejectResult } from "@/types/commissions";

export async function approveLinesAction(locale: string, raw: unknown): Promise<ApproveResult> {
  if (!isLocale(locale)) return { status: "failed", code: "error" };
  const member = await requireZone("crm", locale);
  if (member.role !== "admin") return { status: "failed", code: "forbidden" };
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "failed", code: "error" };
  const result = await approveLines(client, raw);
  if (result.status === "done") {
    revalidatePath(`/${locale}/crm/comisiones`);
    revalidatePath(`/${locale}/admin`, "layout");
  }
  return result;
}

export async function rejectLineAction(locale: string, raw: unknown): Promise<RejectResult> {
  if (!isLocale(locale)) return { status: "failed", code: "error" };
  const member = await requireZone("crm", locale);
  if (member.role !== "admin") return { status: "failed", code: "forbidden" };
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "failed", code: "error" };
  const result = await rejectLine(client, raw);
  if (result.status === "done") {
    revalidatePath(`/${locale}/crm/comisiones`);
    revalidatePath(`/${locale}/admin`, "layout");
  }
  return result;
}
