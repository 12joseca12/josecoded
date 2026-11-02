// Links out of a contact (K3). The values were typed by people or imported from a CSV: nothing is trusted as a URL.

/** `https://…` or `http://…` only, otherwise `null` (a `javascript:` or `data:` value is never a link). Bare domains get `https://`. */
export function safeUrl(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** `wa.me` link of a phone number; Spanish numbers without a country code get +34. `null` when there are not enough digits. */
export function whatsappHref(phone: string | null | undefined): string | null {
  const raw = phone?.trim();
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.length === 9) digits = `34${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}
