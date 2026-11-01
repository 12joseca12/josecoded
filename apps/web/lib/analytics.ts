// Typed event tracker over Umami (self-hosted on Omen, task 2.12; DT §5.6). The tracker never throws and does nothing when
// Umami is not on the page: the script is optional (no URL or website id configured), loads async, and Omen may be off.
// The 12 events are the whole vocabulary; `Radar` is not measured here. No payload carries personal data.
export interface EventMap {
  whatsapp_click: { origin: string; pack?: string; ref?: string };
  contact_submit: { via: string };
  proposal_generated: { pack: string; questions: number; source: 'ai' | 'rules' };
  proposal_sent: { pack: string; has_ref: boolean };
  chat_started: undefined;
  call_booked: undefined;
  intro_played: { skipped: boolean; reduced: boolean; mode: 'full' | 'letters' | 'none' };
  scene_open: { scene: string };
  scene_drag: undefined;
  booking_open: { origin: string };
  referral_copy: undefined;
  palette_open: undefined;
}

export type EventName = keyof EventMap;

interface UmamiWindow {
  umami?: { track?: (name: string, data?: object) => void };
}

type TrackArgs<K extends EventName> = EventMap[K] extends undefined ? [data?: undefined] : [data: EventMap[K]];

/** Sends an event if Umami is loaded. Safe on the server, before the script arrives, with the script blocked or failing. */
export function track<K extends EventName>(name: K, ...[data]: TrackArgs<K>): void {
  try {
    if (typeof window === 'undefined') return;
    (window as Window & UmamiWindow).umami?.track?.(name, data);
  } catch {
    // analytics must never break the page
  }
}

export interface UmamiScript {
  src: string;
  websiteId: string;
  /** Umami only records on this host, so previews and localhost send nothing. */
  domains: string;
}

/**
 * Where the script comes from. `url` is the origin of the Umami instance (`https://stats.josecoded.com`); without both it
 * and the website id there is no script and `track` stays a no-op.
 */
export function umamiScript({
  url,
  websiteId,
  siteUrl,
}: {
  url?: string;
  websiteId?: string;
  siteUrl: string;
}): UmamiScript | undefined {
  if (!url || !websiteId) return undefined;
  return { src: `${url.replace(/\/$/, '')}/script.js`, websiteId, domains: new URL(siteUrl).hostname };
}
