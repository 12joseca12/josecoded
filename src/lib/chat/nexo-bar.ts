import type { MessageKey } from "@/i18n/keys.generated";

export interface NexoBarLabels {
  region: string;
  tag: string;
  activeTitle: string;
  activeAnnouncement: string;
  remaining: string;
  stop: string;
  stopping: string;
  stoppedTitle: string;
  stoppedText: string;
}

type Translate = (key: MessageKey) => string;

export function buildNexoBarLabels(t: Translate): NexoBarLabels {
  return {
    region: t("chat.nexoBar.region"),
    tag: t("chat.nexoBar.tag"),
    activeTitle: t("chat.nexoBar.activeTitle"),
    activeAnnouncement: t("chat.nexoBar.activeAnnouncement"),
    remaining: t("chat.nexoBar.remaining"),
    stop: t("chat.nexoBar.stop"),
    stopping: t("chat.nexoBar.stopping"),
    stoppedTitle: t("chat.nexoBar.stoppedTitle"),
    stoppedText: t("chat.nexoBar.stoppedText"),
  };
}

export function formatCountdown(dueAt: string, now: number): string {
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) return "00:00";
  const seconds = Math.max(0, Math.ceil((due - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
