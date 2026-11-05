import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type ChangeStageResult,
  changeStageSchema,
  type NewContactField,
  type NewContactResult,
  newContactSchema,
} from "@/types/crm";
import type { Database } from "@/types/database";

export interface CrmActionError {
  code?: string | null;
  message?: string | null;
}

const uniqueViolation = "23505";
const insufficientPrivilege = "42501";

export function mapContactError(error: CrmActionError): NewContactResult {
  if (error.code === uniqueViolation) return { status: "duplicate" };
  if (error.code === insufficientPrivilege) return { status: "forbidden" };
  return { status: "error" };
}

export function mapStageError(error: CrmActionError): ChangeStageResult {
  if (error.code === insufficientPrivilege) return { status: "forbidden" };
  return { status: "error" };
}

const contactFields: readonly NewContactField[] = [
  "fullName",
  "email",
  "phone",
  "organization",
  "kind",
];

function invalidField(path: readonly PropertyKey[]): NewContactField {
  const [head] = path;
  return contactFields.find((field) => field === head) ?? "fullName";
}

function blankToNull(value: string): string | null {
  return value === "" ? null : value;
}

export async function createContact(
  client: SupabaseClient<Database>,
  ownerId: string,
  raw: unknown,
): Promise<NewContactResult> {
  const parsed = newContactSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "invalid", field: invalidField(parsed.error.issues[0]?.path ?? []) };
  }
  const input = parsed.data;
  try {
    const { data, error } = await client
      .from("contacts")
      .insert({
        owner_id: ownerId,
        full_name: input.fullName,
        email: blankToNull(input.email),
        phone: blankToNull(input.phone),
        organization: blankToNull(input.organization),
        kind: input.kind,
      })
      .select("id")
      .single();
    if (error) return mapContactError(error);
    return { status: "done", id: data.id };
  } catch {
    return { status: "error" };
  }
}

export async function changeDealStage(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ChangeStageResult> {
  const parsed = changeStageSchema.safeParse(raw);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0] === "reason" ? "reason" : "stage";
    return { status: "invalid", field };
  }
  const input = parsed.data;
  try {
    const { data, error } = await client
      .from("deals")
      .update({
        stage: input.stage,
        lost_reason: input.stage === "lost" ? input.reason : null,
      })
      .eq("id", input.dealId)
      .eq("updated_at", input.expectedUpdatedAt)
      .select("id");
    if (error) return mapStageError(error);
    return data.length === 0 ? { status: "stale" } : { status: "done" };
  } catch {
    return { status: "error" };
  }
}
