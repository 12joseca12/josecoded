import { buildContactHref } from "@/lib/contact/ways";

export function buildAuditHref(locale: string): string {
  const [path, anchor] = buildContactHref(locale, "freelance").split("#");
  return `${path}&task=audit#${anchor}`;
}

export function isAuditRequest(params: { task?: string | string[] | undefined }): boolean {
  const task = Array.isArray(params.task) ? params.task[0] : params.task;
  return task === "audit";
}
