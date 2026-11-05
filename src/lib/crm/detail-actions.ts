import type { SupabaseClient } from "@supabase/supabase-js";

import { openDealStages } from "@/types/crm";
import {
  type AddActivityField,
  type AddActivityResult,
  addActivitySchema,
  type ReassignResult,
  reassignSchema,
} from "@/types/crm-detail";
import type { Database } from "@/types/database";

const insufficientPrivilege = "42501";
const foreignKeyViolation = "23503";

const activityFields: readonly AddActivityField[] = ["kind", "body", "dealId"];

export async function addActivity(
  client: SupabaseClient<Database>,
  authorId: string,
  raw: unknown,
): Promise<AddActivityResult> {
  const parsed = addActivitySchema.safeParse(raw);
  if (!parsed.success) {
    const head = parsed.error.issues[0]?.path[0];
    return { status: "invalid", field: activityFields.find((field) => field === head) ?? "body" };
  }
  const input = parsed.data;
  try {
    const { error } = await client.from("activities").insert({
      contact_id: input.contactId,
      deal_id: input.dealId === "" ? null : input.dealId,
      author_id: authorId,
      kind: input.kind,
      body: input.body,
    });
    if (!error) return { status: "done" };
    if (error.code === foreignKeyViolation) return { status: "invalid", field: "dealId" };
    if (error.code === insufficientPrivilege) return { status: "forbidden" };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export async function reassignContact(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ReassignResult> {
  const parsed = reassignSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  const { contactId, ownerId } = parsed.data;
  try {
    const people = await client
      .from("profiles")
      .select("id, is_active")
      .in("role", ["admin", "closer"]);
    if (people.error) return { status: "error" };
    if (!people.data.some((person) => person.id === ownerId && person.is_active)) {
      return { status: "invalid" };
    }
    const moved = await client
      .from("contacts")
      .update({ owner_id: ownerId })
      .eq("id", contactId)
      .select("id");
    if (moved.error) {
      return { status: moved.error.code === insufficientPrivilege ? "forbidden" : "error" };
    }
    if (moved.data.length === 0) return { status: "forbidden" };
    const deals = await client
      .from("deals")
      .update({ owner_id: ownerId })
      .eq("contact_id", contactId)
      .in("stage", [...openDealStages]);
    if (deals.error) return { status: "error" };
    return { status: "done" };
  } catch {
    return { status: "error" };
  }
}
