export const phaseIds = ["discover", "design", "build", "publish", "maintain"] as const;
export type PhaseId = (typeof phaseIds)[number];

export interface PhaseItem {
  id: PhaseId;
  label: string;
}

export interface RailLabels {
  list: string;
  pause: string;
  resume: string;
  pauseText: string;
  resumeText: string;
}

export const phaseNoteKinds = ["brief", "system", "code", "ship", "care"] as const;
export type PhaseNoteKind = (typeof phaseNoteKinds)[number];
