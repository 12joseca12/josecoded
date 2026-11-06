"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import {
  runArchive,
  runDeleteTask,
  runMoveTask,
  runSetPhase,
  runUpsertTask,
} from "@/lib/admin/project-detail";
import {
  runAddItem,
  runApproveItems,
  runDeleteItem,
  runRejectItem,
  runSetFee,
} from "@/lib/admin/project-fee";
import {
  runAddLink,
  runDeleteLink,
  runReorderLinks,
  runUpdateLink,
} from "@/lib/admin/project-links";
import { runDecideStory } from "@/lib/admin/project-stories";
import { runSetClient, runSetFreelance } from "@/lib/admin/project-team";
import { runCreateUpdate, runDeleteUpdate, runSetVisibility } from "@/lib/admin/project-updates";
import { runCreateProject, runUpdateProject } from "@/lib/admin/projects";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TaskResult } from "@/types/admin-project-detail";
import type { FeeActionResult } from "@/types/admin-project-fee";
import type { DecideResult } from "@/types/admin-project-stories";
import type { LinkResult, TeamResult } from "@/types/admin-project-team";
import type { UpdateActionResult } from "@/types/admin-project-updates";
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

async function writeTask(
  locale: string,
  run: (
    client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  ) => Promise<TaskResult>,
): Promise<TaskResult> {
  if (!isLocale(locale)) return failed;
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error", code: "unavailable" };
  const result = await run(client);
  if (result.status === "done") revalidatePath(`/${locale}/admin/proyectos`, "layout");
  return result;
}

export async function upsertTask(locale: string, raw: unknown): Promise<TaskResult> {
  return writeTask(locale, (client) => runUpsertTask(client, raw));
}

export async function moveTask(locale: string, raw: unknown): Promise<TaskResult> {
  return writeTask(locale, (client) => runMoveTask(client, raw));
}

export async function deleteTask(locale: string, raw: unknown): Promise<TaskResult> {
  return writeTask(locale, (client) => runDeleteTask(client, raw));
}

export async function setProjectPhase(locale: string, raw: unknown): Promise<TaskResult> {
  return writeTask(locale, (client) => runSetPhase(client, raw));
}

export async function archiveProject(locale: string, raw: unknown): Promise<TaskResult> {
  return writeTask(locale, (client) => runArchive(client, raw));
}

export async function decideStory(locale: string, raw: unknown): Promise<DecideResult> {
  if (!isLocale(locale)) return failed;
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error", code: "unavailable" };
  const result = await runDecideStory(client, raw);
  if (result.status === "done") revalidatePath(`/${locale}/admin/proyectos`, "layout");
  return result;
}

async function writeWith<T extends { status: string }>(
  locale: string,
  fallback: T,
  run: (client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) => Promise<T>,
): Promise<T> {
  if (!isLocale(locale)) return fallback;
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return fallback;
  const result = await run(client);
  if (result.status === "done") revalidatePath(`/${locale}/admin/proyectos`, "layout");
  return result;
}

const linkFailed: LinkResult = { status: "error", code: "unavailable" };
const teamFailed: TeamResult = { status: "error", code: "unavailable" };

export async function addLink(locale: string, raw: unknown): Promise<LinkResult> {
  return writeWith(locale, linkFailed, (client) => runAddLink(client, raw));
}

export async function updateLink(locale: string, raw: unknown): Promise<LinkResult> {
  return writeWith(locale, linkFailed, (client) => runUpdateLink(client, raw));
}

export async function deleteLink(locale: string, raw: unknown): Promise<LinkResult> {
  return writeWith(locale, linkFailed, (client) => runDeleteLink(client, raw));
}

export async function reorderLinks(locale: string, raw: unknown): Promise<LinkResult> {
  return writeWith(locale, linkFailed, (client) => runReorderLinks(client, raw));
}

export async function setProjectClient(locale: string, raw: unknown): Promise<TeamResult> {
  return writeWith(locale, teamFailed, (client) => runSetClient(client, raw));
}

export async function setProjectFreelance(locale: string, raw: unknown): Promise<TeamResult> {
  return writeWith(locale, teamFailed, (client) => runSetFreelance(client, raw));
}

const feeFailed: FeeActionResult = { status: "error", code: "unavailable" };
const updateFailed: UpdateActionResult = { status: "error", code: "unavailable" };

export async function setFee(locale: string, raw: unknown): Promise<FeeActionResult> {
  return writeWith(locale, feeFailed, (client) => runSetFee(client, raw));
}

export async function addFeeItem(locale: string, raw: unknown): Promise<FeeActionResult> {
  return writeWith(locale, feeFailed, (client) => runAddItem(client, raw));
}

export async function approveFeeItems(locale: string, raw: unknown): Promise<FeeActionResult> {
  return writeWith(locale, feeFailed, (client) => runApproveItems(client, raw));
}

export async function rejectFeeItem(locale: string, raw: unknown): Promise<FeeActionResult> {
  return writeWith(locale, feeFailed, (client) => runRejectItem(client, raw));
}

export async function deleteFeeItem(locale: string, raw: unknown): Promise<FeeActionResult> {
  return writeWith(locale, feeFailed, (client) => runDeleteItem(client, raw));
}

export async function createUpdate(locale: string, raw: unknown): Promise<UpdateActionResult> {
  return writeWith(locale, updateFailed, (client) => runCreateUpdate(client, raw));
}

export async function setUpdateVisibility(
  locale: string,
  raw: unknown,
): Promise<UpdateActionResult> {
  return writeWith(locale, updateFailed, (client) => runSetVisibility(client, raw));
}

export async function deleteUpdate(locale: string, raw: unknown): Promise<UpdateActionResult> {
  return writeWith(locale, updateFailed, (client) => runDeleteUpdate(client, raw));
}
