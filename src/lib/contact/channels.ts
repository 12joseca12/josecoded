import { buildWhatsAppUrl } from "./whatsapp";

interface ChannelConfig {
  whatsappNumber: string;
  email: string;
}

export interface LiveChannels {
  whatsappHref: string | null;
  emailHref: string | null;
  email: string | null;
}

const pendingMarker = "{{DATO";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function resolveChannels(config: ChannelConfig, whatsappMessage: string): LiveChannels {
  const email = config.email.includes(pendingMarker) ? null : config.email.trim();
  const validEmail = email !== null && emailPattern.test(email) ? email : null;
  return {
    whatsappHref: buildWhatsAppUrl(config.whatsappNumber, whatsappMessage),
    emailHref: validEmail ? `mailto:${validEmail}` : null,
    email: validEmail,
  };
}

export function hasLiveChannel(config: ChannelConfig): boolean {
  const { whatsappHref, email } = resolveChannels(config, "");
  return whatsappHref !== null || email !== null;
}
