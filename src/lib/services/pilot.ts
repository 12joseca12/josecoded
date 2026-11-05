import { buildContactHref } from "@/lib/contact/ways";

export function buildPilotHref(locale: string): string {
  const [path, anchor] = buildContactHref(locale, "freelance").split("#");
  return `${path}&task=pilot#${anchor}`;
}
