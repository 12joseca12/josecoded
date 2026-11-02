import { isPendingDato } from './dato';

/**
 * Fills `{name}` in a long text of `content/` with a value that must not be written by hand (a price,
 * a number of weeks). A pending text is returned as it is (its braces are a marker, not a variable);
 * an unknown name stays in the text so that a typo is visible instead of silently empty.
 */
export function interpolate(text: string, vars: Readonly<Record<string, string>>): string {
  if (isPendingDato(text)) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => vars[name] ?? whole);
}
