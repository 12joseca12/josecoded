import type { MessageKey } from "@/i18n/keys.generated";

const placeholder = "{responseTime}";

export function withResponseTime(t: (key: MessageKey) => string, text: string): string {
  return text.includes(placeholder) ? text.replaceAll(placeholder, t("common.responseTime")) : text;
}
