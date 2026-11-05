"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { runCreateProject, runUpdateProject } from "@/lib/admin/projects";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectActionResult } from "@/types/admin-projects";

const failed = { status: "error", code: "error" } as const;

async function write(
  locale: string,
  run: (
    client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  ) => Promise<ProjectActionResult>,
): Promise<ProjectActionResult> {
  if (!isLocale(locale)) return failed;
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error", code: "unavailable" };
  const result = await run(client);
  if (result.status === "done") revalidatePath(`/${locale}/admin/proyectos`);
  return result;
}

export async function createProject(locale: string, raw: unknown): Promise<ProjectActionResult> {
  return write(locale, (client) => runCreateProject(client, raw));
}

export async function updateProject(locale: string, raw: unknown): Promise<ProjectActionResult> {
  return write(locale, (client) => runUpdateProject(client, raw));
}
