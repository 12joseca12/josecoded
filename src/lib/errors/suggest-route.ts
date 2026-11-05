import type { SuggestionId } from "@/types/errors";

interface Availability {
  projects: boolean;
}

interface Rule {
  id: SuggestionId;
  terms: readonly string[];
}

const rules: readonly Rule[] = [
  { id: "freelance", terms: ["freelance", "autonomo", "tarifa"] },
  { id: "offers", terms: ["medida", "presupuesto", "pack", "precio"] },
  { id: "projects", terms: ["proyecto", "project", "portfolio", "portafolio"] },
  { id: "privacy", terms: ["privacidad", "privacy"] },
  { id: "cookies", terms: ["cookie"] },
  { id: "notice", terms: ["aviso", "legal"] },
  { id: "contact", terms: ["contact", "hablar", "hablemos", "escribir", "correo", "email"] },
  { id: "about", terms: ["sobre", "about", "curriculum", "trayectoria", "contrata"] },
  { id: "how", terms: ["trabajo", "proceso", "metodo", "fases"] },
  { id: "services", terms: ["servicio", "service"] },
];

const minTypoLength = 6;
const maxTypoDistance = 2;
const localePrefix = /^[a-z]{2}$/;

function tokensOf(pathname: string): string[] {
  const tokens = pathname
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
  const [first] = tokens;
  return first !== undefined && localePrefix.test(first) ? tokens.slice(1) : tokens;
}

function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      current[column] = Math.min(
        (previous[column] ?? 0) + 1,
        (current[column - 1] ?? 0) + 1,
        (previous[column - 1] ?? 0) + cost,
      );
    }
    previous = current;
  }
  return previous[b.length] ?? Number.POSITIVE_INFINITY;
}

function matches(token: string, term: string): boolean {
  if (token.includes(term)) return true;
  return (
    term.length >= minTypoLength &&
    token.length >= minTypoLength &&
    distance(token.slice(0, term.length), term) <= maxTypoDistance
  );
}

export function suggestRoute(pathname: string, available: Availability): SuggestionId | null {
  const tokens = tokensOf(pathname);
  const rule = rules.find(({ terms }) =>
    terms.some((term) => tokens.some((token) => matches(token, term))),
  );
  if (!rule) return null;
  return rule.id === "projects" && !available.projects ? "about" : rule.id;
}
