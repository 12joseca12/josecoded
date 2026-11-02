// The estimate a story is accepted with, typed by a person: hours (`numeric(6, 1)`) and an indicative amount in
// euros without VAT (`numeric(10, 2)`). The form sends text; the Server Action turns it into numbers here, so a
// value the column would round or refuse never reaches the RPC.

const HOURS = /^\d{1,4}([.,]\d)?$/;
const AMOUNT = /^\d{1,8}([.,]\d{1,2})?$/;

/** Hours above zero with at most one decimal (`6`, `6,5`), or `null` when the text is not a valid estimate. */
export function parseHours(text: string | undefined): number | null {
  const value = (text ?? '').trim();
  if (!HOURS.test(value)) return null;
  const hours = Number(value.replace(',', '.'));
  return hours > 0 ? hours : null;
}

/** An amount of euros with up to two decimals; empty is «no amount» (`null`), anything else invalid is `'invalid'`. */
export function parseAmount(text: string | undefined): number | null | 'invalid' {
  const value = (text ?? '').trim();
  if (value === '') return null;
  return AMOUNT.test(value) ? Number(value.replace(',', '.')) : 'invalid';
}
