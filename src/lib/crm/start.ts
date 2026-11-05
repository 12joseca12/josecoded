import type { StartStep, StartStepKey } from "@/types/crm-start";

export interface StartCopy {
  title: string;
  text: string;
  action: string;
}

const order: { key: StartStepKey; path: string }[] = [
  { key: "telegram", path: "/ajustes" },
  { key: "rates", path: "/ajustes" },
  { key: "leads", path: "/interesados" },
  { key: "contact", path: "/contactos" },
  { key: "nextStep", path: "/contactos?due=1" },
];

export function buildStartSteps(
  copy: Record<StartStepKey, StartCopy>,
  locale: string,
  options: { admin: boolean },
): StartStep[] {
  return order
    .filter((entry) => !(options.admin && entry.key === "rates"))
    .map((entry) => ({
      key: entry.key,
      ...copy[entry.key],
      href: `/${locale}/crm${entry.path}`,
    }));
}
