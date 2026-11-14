import type { MessageKey } from "@/i18n/keys.generated";

export type NexoBarKind = "waiting" | "countdown" | "active" | "stopped";

export interface NexoBarLabels {
  region: string;
  tag: string;
  waitingTitle: string;
  waitingText: string;
  countdownTitle: string;
  countdownText: string;
  approxMinutes: string;
  approxSoon: string;
  activeTitle: string;
  activeText: string;
  stop: string;
  stopping: string;
  stoppedTitle: string;
  stoppedText: string;
  announceWaiting: string;
  announceActive: string;
  announceStopped: string;
}

type Translate = (key: MessageKey) => string;

export function buildNexoBarLabels(t: Translate): NexoBarLabels {
  return {
    region: t("chat.nexoBar.region"),
    tag: t("chat.nexoBar.tag"),
    waitingTitle: t("chat.nexoBar.waitingTitle"),
    waitingText: t("chat.nexoBar.waitingText"),
    countdownTitle: t("chat.nexoBar.countdownTitle"),
    countdownText: t("chat.nexoBar.countdownText"),
    approxMinutes: t("chat.nexoBar.approxMinutes"),
    approxSoon: t("chat.nexoBar.approxSoon"),
    activeTitle: t("chat.nexoBar.activeTitle"),
    activeText: t("chat.nexoBar.activeText"),
    stop: t("chat.nexoBar.stop"),
    stopping: t("chat.nexoBar.stopping"),
    stoppedTitle: t("chat.nexoBar.stoppedTitle"),
    stoppedText: t("chat.nexoBar.stoppedText"),
    announceWaiting: t("chat.nexoBar.announceWaiting"),
    announceActive: t("chat.nexoBar.announceActive"),
    announceStopped: t("chat.nexoBar.announceStopped"),
  };
}

export const defaultWindowMs = 600_000;

function remainingSeconds(dueAt: string, now: number): number {
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) return 0;
  return Math.max(0, Math.ceil((due - now) / 1000));
}

export function formatCountdown(dueAt: string, now: number): string {
  const seconds = remainingSeconds(dueAt, now);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes)}:${String(rest).padStart(2, "0")}`;
}

export function approximateMinutes(dueAt: string, now: number): number {
  return Math.ceil(remainingSeconds(dueAt, now) / 60);
}

export function describeApproximate(
  labels: Pick<NexoBarLabels, "approxMinutes" | "approxSoon">,
  dueAt: string,
  now: number,
): string {
  const minutes = approximateMinutes(dueAt, now);
  if (minutes <= 1) return labels.approxSoon;
  return labels.approxMinutes.replace("{minutes}", String(minutes));
}

export function remainingFraction(dueAt: string, now: number, windowMs: number): number {
  if (windowMs <= 0) return 0;
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) return 0;
  return Math.min(1, Math.max(0, (due - now) / windowMs));
}

export interface CountdownTimer {
  setInterval: (handler: () => void, ms: number) => unknown;
  clearInterval: (handle: unknown) => void;
  now: () => number;
}

const browserTimer: CountdownTimer = {
  setInterval: (handler, ms) => setInterval(handler, ms),
  clearInterval: (handle) => {
    clearInterval(handle as ReturnType<typeof setInterval>);
  },
  now: () => Date.now(),
};

export function runCountdown(
  dueAt: string,
  onTick: (at: number) => void,
  timer: CountdownTimer = browserTimer,
): () => void {
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) return () => undefined;
  const handle = timer.setInterval(update, 1000);
  function update() {
    const at = timer.now();
    onTick(at);
    if (at >= due) timer.clearInterval(handle);
  }
  update();
  return () => {
    timer.clearInterval(handle);
  };
}
