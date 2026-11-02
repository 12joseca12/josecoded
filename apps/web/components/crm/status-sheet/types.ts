import type { ContactKind } from '@josecoded/types';

/** What the status sheet needs to know about a contact: plain data, safe to hand to a client component. */
export interface StatusSheetContact {
  id: string;
  name: string;
  /** Company, already shown next to the name. */
  organization: string | null;
  kind: ContactKind;
  status: string;
  nextAction: string | null;
  /** `YYYY-MM-DD` and `HH:MM` on the Madrid clock, as the inputs want them. */
  date: string | null;
  time: string | null;
}

export interface StatusOption {
  value: string;
  label: string;
}

/** Statuses of each kind that the person may choose (a closer's lists leave out «won» and «active_client»). */
export type StatusOptions = Record<ContactKind, StatusOption[]>;

export interface StatusSheetLabels {
  title: string;
  /** The status field. */
  status: string;
  nextAction: string;
  nextActionHelp: string;
  date: string;
  time: string;
  submit: string;
  cancel: string;
  close: string;
  saved: string;
  locale: 'es' | 'en';
}
