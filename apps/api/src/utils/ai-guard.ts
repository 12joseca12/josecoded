// Deterministic guard on what a model wrote, shared by the proposals generator (3.7) and the assistant (4.4). The model
// is never trusted with prices, links or promises: if its text carries any of them, the caller drops the whole text
// and answers with rules or with a fixed sentence. Heuristics are deliberately blunt: a false positive costs a
// fallback answer, a false negative costs an invented price on the site.

export type GuardReason = 'html' | 'url' | 'amount' | 'giveaway' | 'language' | 'injection_echo';
export type GuardResult = { ok: true } | { ok: false; reason: GuardReason };

export interface GuardOptions {
  /** Language the answer must be in (`locale` of the request). */
  locale: 'es' | 'en';
  /**
   * Amounts the text may state (the prices of `pricing.json`). Absent: no amount, currency or number of three or more
   * digits is allowed at all (proposals, where prices come from rules).
   */
  allowedAmounts?: ReadonlySet<number>;
  /** Links the text may carry (`facts.links` of the published context). Absent: none. */
  allowedLinks?: readonly string[];
}

const HTML = /<\/?[a-z][^>]*>/i;
const URL_LIKE =
  /(?:https?:\/\/|www\.)[^\s)>\]]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|es|io|dev|net|org|app|ai|co|eu|info|xyz|me|ly)\b(?:\/[^\s)>\]]*)?/gi;
const CURRENCY = /€|\$|\b(?:eur|euros?|usd|dollars?|dólares?)\b/i;
const AMOUNT = /(?:€|\$)\s*\d[\d.,]*|\d[\d.,]*\s*(?:€|\$|eur\b|euros?\b|usd\b)|\b\d{3,}(?:[.,]\d+)*\b/gi;
const GIVEAWAY =
  /\b(?:gratis|gratuito|gratuita|regalo|regalamos|free|gift|sin coste|sin cargo|descuento|discount|rebaja|100\s?%)\b/i;
const INJECTION_ECHO =
  /\b(?:system prompt|prompt del sistema|instrucciones del sistema|ignore (?:all |the )?(?:previous|above)|ignora (?:todas )?las instrucciones|as an ai language model|como modelo de lenguaje)\b/i;

const STOPWORDS = {
  es: ['el', 'la', 'los', 'las', 'de', 'que', 'y', 'en', 'un', 'una', 'con', 'para', 'por', 'se', 'del', 'al', 'como', 'más', 'pero', 'su', 'tu', 'puedes', 'tienes', 'si'],
  en: ['the', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'with', 'you', 'your', 'are', 'it', 'on', 'as', 'this', 'be', 'can', 'will', 'we', 'have', 'not'],
} as const;

/** `1.400`, `1,400` and `1400` are 1400; `49,50` is 49.5. */
export function parseAmount(raw: string): number {
  const digits = raw.replace(/[^\d.,]/g, '').replace(/[.,]+$/, '');
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(digits)) return Number(digits.replace(/[.,]/g, ''));
  return Number(digits.replace(',', '.'));
}

function wordsOf(text: string): string[] {
  return text.toLowerCase().match(/[a-zñáéíóúü]+/g) ?? [];
}

function wrongLanguage(text: string, locale: 'es' | 'en'): boolean {
  const words = wordsOf(text);
  const count = (list: readonly string[]) => words.filter((w) => list.includes(w)).length;
  const own = count(STOPWORDS[locale]);
  const other = count(STOPWORDS[locale === 'es' ? 'en' : 'es']);
  return other >= 3 && other > own;
}

function linkAllowed(found: string, allowed: readonly string[]): boolean {
  const clean = found.replace(/[.,;:!?]+$/, '').toLowerCase();
  return allowed.some((link) => {
    const base = link.toLowerCase().replace(/\/$/, '');
    return clean.replace(/\/$/, '') === base || clean.startsWith(`${base}/`);
  });
}

export function guardModelOutput(text: string, options: GuardOptions): GuardResult {
  if (HTML.test(text)) return { ok: false, reason: 'html' };
  if (INJECTION_ECHO.test(text)) return { ok: false, reason: 'injection_echo' };

  const links = text.match(URL_LIKE) ?? [];
  if (links.some((link) => !linkAllowed(link, options.allowedLinks ?? []))) return { ok: false, reason: 'url' };

  if (GIVEAWAY.test(text)) return { ok: false, reason: 'giveaway' };

  const { allowedAmounts } = options;
  if (!allowedAmounts) {
    if (CURRENCY.test(text) || /\b\d{3,}\b/.test(text)) return { ok: false, reason: 'amount' };
  } else {
    // a currency sign with no figure ("cuesta mucho €") is not a price, but a stated figure must be a listed one
    for (const found of text.match(AMOUNT) ?? []) {
      if (!allowedAmounts.has(parseAmount(found))) return { ok: false, reason: 'amount' };
    }
  }

  if (wrongLanguage(text, options.locale)) return { ok: false, reason: 'language' };
  return { ok: true };
}
