import type { Locale } from '@josecoded/types';

/** "1.400 €" (es) / "€1,400" (en). Whole euros unless the amount has cents. */
export function formatPrice(amount: number, locale: Locale): string {
  const [integer = '0', decimals] = Math.abs(amount).toFixed(2).split('.');
  const separator = locale === 'es' ? '.' : ',';
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  const number =
    decimals && decimals !== '00' ? `${grouped}${locale === 'es' ? ',' : '.'}${decimals}` : grouped;
  const sign = amount < 0 ? '-' : '';
  return locale === 'es' ? `${sign}${number} €` : `${sign}€${number}`;
}
