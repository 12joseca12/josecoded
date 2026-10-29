// A text Jose still has to supply is written as "{{DATO: what it is}}" in both locales
// (working-agreements §10). Blocks whose content is pending are not rendered in production.
const MARKER = '{{DATO';

/** `false` while the value is empty or starts with a `{{DATO` marker: the block must not render. */
export function hasDato(value: string): boolean {
  const trimmed = value.trim();
  return trimmed !== '' && !trimmed.startsWith(MARKER);
}

/** `true` if the marker appears anywhere (also inside an href such as `/blog/{{DATO-slug}}`). */
export function isPendingDato(value: string): boolean {
  return value.includes(MARKER);
}
