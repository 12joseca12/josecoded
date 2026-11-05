import { buildWhatsAppUrl } from "@/lib/contact/whatsapp";

const minDigits = 6;
const spanishMobileLength = 9;
const spanishPrefix = "34";

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, "");
}

function international(phone: string): string | null {
  const trimmed = phone.trim();
  if (!/^[\d\s+().-]+$/.test(trimmed)) return null;
  const digits = digitsOf(trimmed);
  if (digits.length < minDigits) return null;
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.length === spanishMobileLength) return `+${spanishPrefix}${digits}`;
  return `+${digits}`;
}

export function telHref(phone: string | null): string | null {
  if (phone === null) return null;
  const number = international(phone);
  return number === null ? null : `tel:${number}`;
}

export function whatsappHref(phone: string | null): string | null {
  if (phone === null) return null;
  const number = international(phone);
  return number === null ? null : buildWhatsAppUrl(number, "");
}
