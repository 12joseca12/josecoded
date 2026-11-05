export function formatMadridTime(iso: string, locale: string): string {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(instant);
}

export function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}
