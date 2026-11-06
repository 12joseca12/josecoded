import {
  type AttachmentLabels,
  attachmentLimits,
  attachmentMimes,
  type RoomProblem,
} from "@/types/room";

export interface FileMeta {
  name: string;
  type: string;
  size: number;
}

const allowed = new Set<string>(attachmentMimes);

export function validateFiles(
  files: FileMeta[],
): Extract<RoomProblem, "too_many" | "too_large" | "type" | "invalid"> | null {
  if (files.length > attachmentLimits.maxFiles) return "too_many";
  for (const file of files) {
    if (file.size <= 0) return "invalid";
    if (file.size > attachmentLimits.maxBytes) return "too_large";
    if (!allowed.has(file.type)) return "type";
  }
  return null;
}

const lastControlCode = 31;

export function cleanName(name: string): string {
  const flat = Array.from(name, (char) =>
    char === "/" || char === "\\" || (char.codePointAt(0) ?? 0) <= lastControlCode ? "-" : char,
  )
    .join("")
    .trim();
  if (flat === "") return "archivo";
  return flat.length > 200 ? flat.slice(-200) : flat;
}

export function attachmentPath(conversationId: string, attachmentId: string): string {
  return `conversations/${conversationId}/${attachmentId}`;
}

export function formatSize(bytes: number, labels: Pick<AttachmentLabels, "sizeKb" | "sizeMb">) {
  if (bytes >= 1024 * 1024) {
    return labels.sizeMb.replace("{n}", (bytes / (1024 * 1024)).toFixed(1));
  }
  return labels.sizeKb.replace("{n}", String(Math.max(1, Math.round(bytes / 1024))));
}

export const attachmentAccept = attachmentMimes.join(",");
