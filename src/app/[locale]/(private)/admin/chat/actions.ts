"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateContactResult } from "@/types/admin-chat";

const failed = (code: string): CreateContactResult => ({ status: "failed", code });

export async function createContactFromChat(
  locale: string,
  leadId: string,
): Promise<CreateContactResult> {
  if (!isLocale(locale) || !z.uuid().safeParse(leadId).success) return failed("error");
  const member = await requireZone("admin", locale);
  if (member.role !== "admin") return failed("forbidden");
  const client = await createSupabaseServerClient();
  if (client === null) return failed("error");
  try {
    const { data, error } = await client.rpc("assign_lead", {
      p_lead_id: leadId,
      p_user_id: member.userId,
    });
    if (error) {
      if (error.code === "42501") return failed("forbidden");
      return failed(error.message.length <= 40 ? error.message : "error");
    }
    revalidatePath(`/${locale}/admin/chat`, "layout");
    return { status: "done", contactId: typeof data === "string" ? data : null };
  } catch {
    return failed("error");
  }
}
