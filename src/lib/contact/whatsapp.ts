const pendingMarker = "{{DATO";
const minDigits = 8;
const maxDigits = 15;

export function buildWhatsAppUrl(number: string, message: string): string | null {
  if (number.includes(pendingMarker)) return null;
  if (!/^[\d\s+().-]+$/.test(number)) return null;
  const digits = number.replace(/\D/g, "");
  if (digits.length < minDigits || digits.length > maxDigits) return null;
  const text = message.trim();
  const query = text === "" ? "" : `?text=${encodeURIComponent(text)}`;
  return `https://wa.me/${digits}${query}`;
}
