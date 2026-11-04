import type { ContactWay } from "@/types/contact";

import { buildWhatsAppUrl } from "./whatsapp";

interface ChannelConfig {
  whatsappNumber: string;
  ways: readonly ContactWay[];
}

export interface LiveWay extends ContactWay {
  href: string;
}

export interface LiveChannels {
  whatsappHref: string | null;
  ways: LiveWay[];
}

export function resolveChannels(config: ChannelConfig, whatsappMessage: string): LiveChannels {
  return {
    whatsappHref: buildWhatsAppUrl(config.whatsappNumber, whatsappMessage),
    ways: config.ways.map((entry) => ({ ...entry, href: `mailto:${entry.email}` })),
  };
}

export function hasLiveChannel(config: ChannelConfig): boolean {
  const { whatsappHref, ways } = resolveChannels(config, "");
  return whatsappHref !== null || ways.length > 0;
}

export function primaryEmail(ways: readonly ContactWay[]): string | null {
  return ways.find((entry) => entry.way === "contratacion")?.email ?? ways[0]?.email ?? null;
}
