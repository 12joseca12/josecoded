export const maxCents = 9_999_999_999;

export function toCents(euros: number): number {
  return Math.round(euros * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function parseMoneyToCents(input: string): number | null {
  const cleaned = input.replaceAll(/[\s€]/g, "");
  if (cleaned === "" || !/^[0-9.,]+$/.test(cleaned)) return null;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const separator = Math.max(lastComma, lastDot);
  let integerPart = cleaned;
  let decimalPart = "";
  if (separator >= 0) {
    const mark = cleaned.charAt(separator);
    const after = cleaned.length - separator - 1;
    const repeated = cleaned.split(mark).length > 2;
    const mixed = lastComma >= 0 && lastDot >= 0;
    const decimal = mixed || (!repeated && (after !== 3 || mark === ","));
    if (decimal) {
      integerPart = cleaned.slice(0, separator);
      decimalPart = cleaned.slice(separator + 1);
    }
  }
  if (/[.,]/.test(integerPart) && !/^[0-9]{1,3}([.,][0-9]{3})+$/.test(integerPart)) return null;
  integerPart = integerPart.replaceAll(/[.,]/g, "");
  if (integerPart === "" && decimalPart === "") return null;
  if (!/^[0-9]*$/.test(integerPart) || !/^[0-9]{1,2}$|^$/.test(decimalPart)) return null;
  const whole = integerPart === "" ? 0 : Number(integerPart);
  const cents = whole * 100 + Number(decimalPart.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > maxCents) return null;
  return cents;
}

export function formatCents(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatRate(rate: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rate / 100);
}

export function percentOfCents(cents: number, rate: number): number {
  const basisPoints = Math.round(rate * 100);
  const magnitude = Math.floor((Math.abs(cents) * basisPoints * 2 + 10000) / 20000);
  return cents < 0 ? -magnitude : magnitude;
}

export function centsToInput(cents: number): string {
  const whole = Math.trunc(cents / 100);
  const fraction = Math.abs(cents % 100);
  return `${String(whole)},${String(fraction).padStart(2, "0")}`;
}
