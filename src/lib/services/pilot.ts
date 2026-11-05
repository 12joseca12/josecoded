import { buildContactHref } from "@/lib/contact/ways";

export function buildPilotHref(locale: string): string {
  const [path, anchor] = buildContactHref(locale, "freelance").split("#");
  return `${path}&task=pilot#${anchor}`;
}

export function isPilotRequest(params: { task?: string | string[] | undefined }): boolean {
  const task = Array.isArray(params.task) ? params.task[0] : params.task;
  return task === "pilot";
}
