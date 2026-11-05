import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  createProjectSchema,
  dealOptionSchema,
  type ProjectActionResult,
  type ProjectErrorCode,
  projectErrorCodes,
  type ProjectField,
  projectFields,
  type ProjectOptions,
  projectRowSchema,
  type ProjectsResult,
  updateProjectSchema,
} from "@/types/admin-projects";
import type { Database } from "@/types/database";

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const knownCodes = new Set<string>(projectErrorCodes);

export function mapProjectError(error: RpcFailure): ProjectErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as ProjectErrorCode;
  if (error.code === "42501") return "forbidden";
  return "error";
}

function firstField(issues: readonly { path: PropertyKey[] }[]): ProjectField {
  const key = issues[0]?.path[0];
  return projectFields.find((field) => field === key) ?? "name";
}

const rowsSchema = z.array(projectRowSchema);
const dealsSchema = z.array(dealOptionSchema);
const offersSchema = z.array(z.object({ slug: z.string(), name_es: z.string() }));
const peopleSchema = z.array(z.object({ id: z.uuid(), full_name: z.string() }));

export const projectsLimit = 200;

export async function fetchProjects(client: SupabaseClient<Database>): Promise<ProjectsResult> {
  try {
    const [rows, deals, offers, freelances] = await Promise.all([
      client
        .from("project_overview")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(projectsLimit),
      client
        .from("deals")
        .select("id, won_amount, contacts(full_name)")
        .eq("stage", "won")
        .order("won_at", { ascending: false })
        .limit(100),
      client.from("offers").select("slug, name_es").is("archived_at", null).order("sort"),
      client.from("team_profiles").select("id, full_name").eq("role", "freelance"),
    ]);
    if (rows.error || deals.error || offers.error || freelances.error) return { status: "error" };
    const parsedRows = rowsSchema.safeParse(rows.data);
    const parsedDeals = dealsSchema.safeParse(deals.data);
    const parsedOffers = offersSchema.safeParse(offers.data);
    const parsedPeople = peopleSchema.safeParse(freelances.data);
    if (
      !parsedRows.success ||
      !parsedDeals.success ||
      !parsedOffers.success ||
      !parsedPeople.success
    ) {
      return { status: "error" };
    }
    const options: ProjectOptions = {
      deals: parsedDeals.data.map((deal) => ({
        id: deal.id,
        label: deal.contacts?.full_name ?? deal.id,
      })),
      offers: parsedOffers.data.map((offer) => ({ slug: offer.slug, name: offer.name_es })),
      freelances: parsedPeople.data.map((person) => ({ id: person.id, name: person.full_name })),
    };
    return { status: "ok", rows: parsedRows.data, options };
  } catch {
    return { status: "error" };
  }
}

export async function runCreateProject(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ProjectActionResult> {
  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  try {
    const { data, error } = await client.rpc("create_project", {
      p_name: input.name,
      p_deal_id: input.dealId ?? undefined,
      p_offer_slug: input.offerSlug ?? undefined,
      p_brief: input.brief ?? undefined,
      p_freelance_id: input.freelanceId ?? undefined,
      p_started_at: input.startedAt ?? undefined,
      p_due_at: input.dueAt ?? undefined,
    });
    if (error) return { status: "error", code: mapProjectError(error) };
    const id = z.uuid().safeParse(data);
    return id.success ? { status: "done", id: id.data } : { status: "error", code: "error" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runUpdateProject(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<ProjectActionResult> {
  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  try {
    const { data, error } = await client
      .from("projects")
      .update({
        name: input.name,
        offer_slug: input.offerSlug,
        started_at: input.startedAt,
        due_at: input.dueAt,
      })
      .eq("id", input.id)
      .select("id");
    if (error) {
      return {
        status: "error",
        code: error.code === "23503" ? "offer_not_found" : mapProjectError(error),
      };
    }
    if (data.length === 0) return { status: "error", code: "project_not_found" };
    return { status: "done", id: input.id };
  } catch {
    return { status: "error", code: "error" };
  }
}
