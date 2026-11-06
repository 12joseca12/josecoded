import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  addLinkSchema,
  deleteLinkSchema,
  type LinkErrorCode,
  linkErrorCodes,
  type LinkField,
  linkFields,
  type LinkResult,
  linkRowSchema,
  type LinksResult,
  reorderLinksSchema,
  updateLinkSchema,
} from "@/types/admin-project-team";
import type { Database } from "@/types/database";

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const knownCodes = new Set<string>(linkErrorCodes);

export function mapLinkError(error: RpcFailure): LinkErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as LinkErrorCode;
  if (error.code === "23505") return "duplicate_url";
  if (error.code === "23514") return "invalid_url";
  if (error.code === "23503") return "project_not_found";
  if (error.code === "42501") return "forbidden";
  return "error";
}

function firstField(issues: readonly { path: PropertyKey[] }[]): LinkField {
  const key = issues[0]?.path[0];
  return linkFields.find((field) => field === key) ?? "name";
}

const linksSchema = z.array(linkRowSchema);

export async function fetchProjectLinks(
  client: SupabaseClient<Database>,
  projectId: string,
): Promise<LinksResult> {
  try {
    const { data, error } = await client
      .from("project_links")
      .select("id, project_id, name, url, usage, sort")
      .eq("project_id", projectId)
      .order("sort");
    if (error) return { status: "error" };
    const parsed = linksSchema.safeParse(data);
    return parsed.success ? { status: "ok", links: parsed.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export async function runAddLink(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<LinkResult> {
  const parsed = addLinkSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  try {
    const { error } = await client.from("project_links").insert({
      project_id: input.projectId,
      name: input.name,
      url: input.url,
      usage: input.usage,
    });
    return error ? { status: "error", code: mapLinkError(error) } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runUpdateLink(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<LinkResult> {
  const parsed = updateLinkSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  try {
    const { data, error } = await client
      .from("project_links")
      .update({ name: input.name, url: input.url, usage: input.usage })
      .eq("id", input.id)
      .select("id");
    if (error) return { status: "error", code: mapLinkError(error) };
    return data.length === 0 ? { status: "error", code: "link_not_found" } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runDeleteLink(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<LinkResult> {
  const parsed = deleteLinkSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "link_not_found" };
  try {
    const { data, error } = await client
      .from("project_links")
      .delete()
      .eq("id", parsed.data.id)
      .select("id");
    if (error) return { status: "error", code: mapLinkError(error) };
    return data.length === 0 ? { status: "error", code: "link_not_found" } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runReorderLinks(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<LinkResult> {
  const parsed = reorderLinksSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "ids_mismatch" };
  try {
    const { error } = await client.rpc("reorder_project_links", {
      p_project_id: parsed.data.projectId,
      p_ids: parsed.data.ids,
    });
    return error ? { status: "error", code: mapLinkError(error) } : { status: "done" };
  } catch {
    return { status: "error", code: "error" };
  }
}
