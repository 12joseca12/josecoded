export type StartStepKey = "telegram" | "rates" | "leads" | "contact" | "nextStep";

export interface StartStep {
  key: StartStepKey;
  title: string;
  text: string;
  action: string;
  href: string;
}
