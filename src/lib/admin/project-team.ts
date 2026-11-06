import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  personSchema,
  setClientSchema,
  setFreelanceSchema,
  type TeamErrorCode,
  teamErrorCodes,
  type TeamPeopleResult,
  type TeamResult,
} from "@/types/admin-project-team";
import type { Database } from "@/types/database";

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const knownCodes = new Set<string>(teamErrorCodes);

export function mapTeamError(error: RpcFailure): TeamErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as TeamErrorCode;
  if (error.code === "42501") return "forbidden";
  return "error";
}

const peopleSchema = z.array(personSchema);

export async function fetchTeamPeople(client: SupabaseClient<Database>): Promise<TeamPeopleResult> {
  try {
    const { data, error } = await client
      .from("team_profiles")
      .select("id, full_name, role")
      .in("role", ["client", "freelance"])
      .order("full_name");
    if (error) return { status: "error" };
    const parsed = peopleSchema.safeParse(data);
    if (!parsed.success) return { status: "error" };
    const pick = (role: "client" | "freelance") =>
      parsed.data
        .filter((person) => person.role === role)
        .map((person) => ({ id: person.id, name: person.full_name }));
    return { status: "ok", clients: pick("client"), freelances: pick("freelance") };
  } catch {
    return { status: "error" };
  }
}

export async function runSetClient(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<TeamResult> {
  const parsed = setClientSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  try {
    const { error } = await client.rpc("set_project_client", {
      p_id: parsed.data.projectId,
      p_user_id: parsed.data.userId,
    });
    return error ? { status: "error", code: mapTeamError(error) } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runSetFreelance(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<TeamResult> {
  const parsed = setFreelanceSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  try {
    const { error } = await client.rpc("set_project_freelance", {
      p_id: parsed.data.projectId,
      p_user_id: parsed.data.userId ?? undefined,
    });
    return error ? { status: "error", code: mapTeamError(error) } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

const roomIdSchema = z.array(z.object({ id: z.uuid() }));

export async function fetchProjectRoomId(
  client: SupabaseClient<Database>,
  projectId: string,
): Promise<string | null> {
  try {
    const { data, error } = await client
      .from("conversations")
      .select("id")
      .eq("project_id", projectId)
      .eq("kind", "client")
      .limit(1);
    if (error) return null;
    const parsed = roomIdSchema.safeParse(data);
    return parsed.success ? (parsed.data[0]?.id ?? null) : null;
  } catch {
    return null;
  }
}
