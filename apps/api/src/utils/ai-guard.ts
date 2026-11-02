// Deterministic guard on what a model wrote, shared by the proposals generator (3.7) and the assistant (4.4). The model
// is never trusted with prices, links or promises: if its text carries any of them, the caller drops the whole text
// and answers with rules or with a fixed sentence. Heuristics are deliberately blunt: a false positive costs a
// fallback answer, a false negative costs an invented price on the site.

import type { PricingData } from '@josecoded/types';

export type GuardReason = 'html' | 'url' | 'amount' | 'giveaway' | 'language' | 'injection_echo' | 'prompt_leak';
export type GuardResult = { ok: true } | { ok: false; reason: GuardReason };

export interface GuardOptions {
  /** Language the answer must be in (`locale` of the request). */
  locale: 'es' | 'en';
  /**
   * Amounts the text may state (`allowedAmountsOf` the published catalogue). Absent: no amount, currency or number of three or more
   * digits is allowed at all (proposals, where prices come from rules).
   */
  allowedAmounts?: ReadonlySet<number>;
  /** Links the text may carry (`facts.links` of the published context). Absent: none. */
  allowedLinks?: readonly string[];
  /**
   * Texts the answer must not reproduce (the `donts` of the context and the rules of the system prompt): a run of
   * `LEAK_NGRAM` words shared with any of them is a leak of the instructions, not an answer.
   */
  forbiddenTexts?: readonly string[];
}

/** Words in a row that, shared with a forbidden text, mark an answer as a copy of it. */
export const LEAK_NGRAM = 8;

const HTML = /<\/?[a-z][^>]*>/i;
// Any host-looking token (`name.tld` with a letter-only TLD, optional path) is a domain: no list of TLDs to outgrow.
// File and tech names that end like a TLD (`Next.js`, `tokens.css`) are not hosts.
const URL_LIKE =
  /(?:https?:\/\/|www\.)[^\s)>\]]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}\b(?:\/[^\s)>\]]*)?/gi;
const NOT_A_TLD = new Set(['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'css', 'scss', 'html', 'htm', 'json', 'md', 'mdx', 'sh', 'sql', 'txt', 'yml', 'yaml', 'svg', 'png', 'jpg', 'jpeg', 'webp', 'pdf']);
/** `scheme:` followed by something, for any scheme but http(s): `javascript:`, `data:`, `mailto:`, `tel:`, `file:`... */
const OTHER_SCHEME = /\b([a-z][a-z0-9+.-]*):(?=\S)/gi;
const MARKDOWN_LINK = /\[[^\]]*\]\s*[([][^)\]]*[)\]]/;
const CURRENCY = /€|\$|\b(?:eur|euros?|usd|dollars?|dólares?)\b/i;
const AMOUNT = /(?:€|\$)\s*\d[\d.,]*|\d[\d.,]*\s*(?:€|\$|eur\b|euros?\b|usd\b)|\b\d{3,}(?:[.,]\d+)*\b/gi;
// A number written out followed (within a few words) by a currency: «dos mil euros», «two thousand dollars».
const NUMBER_WORDS =
  'dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|diecis[eé]is|veinte|veinti\\p{L}*|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|mil|mill[oó]n|millones|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million';
const SPELLED_AMOUNT = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${NUMBER_WORDS})(?![\\p{L}\\p{N}])(?:[\\s-]+[\\p{L}]+){0,4}?[\\s-]+(?:euros?|eur|usd|d[oó]lares?|dollars?)(?![\\p{L}])`,
  'iu',
);
const GIVEAWAY =
  /\b(?:gratis|gratuito|gratuita|regalo|regalamos|free|gift|sin coste|sin cargo|descuento|discount|rebaja|100\s?%)\b/i;
const INJECTION_ECHO =
  /\b(?:system prompt|prompt del sistema|instrucciones del sistema|ignore (?:all |the )?(?:previous|above)|ignora (?:todas )?las instrucciones|as an ai language model|como modelo de lenguaje)\b/i;

const STOPWORDS = {
  es: ['el', 'la', 'los', 'las', 'de', 'que', 'y', 'en', 'un', 'una', 'con', 'para', 'por', 'se', 'del', 'al', 'como', 'más', 'pero', 'su', 'tu', 'puedes', 'tienes', 'si'],
  en: ['the', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'with', 'you', 'your', 'are', 'it', 'on', 'as', 'this', 'be', 'can', 'will', 'we', 'have', 'not'],
} as const;

/**
 * Every figure of a price catalogue that is on sale (prices of active packs, apps and extras, hourly and feature): the only amounts
 * a text may state. The price of an inactive offer is not one: the assistant must not quote what the admin switched off.
 */
export function allowedAmountsOf(data: PricingData): Set<number> {
  const onSale = <T extends { active?: boolean }>(items: readonly T[]) => items.filter((i) => i.active !== false);
  return new Set([
    data.hourly,
    data.feature,
    ...onSale(data.packs).map((p) => p.price),
    ...onSale(data.apps).map((a) => a.price),
    ...onSale(data.extras).map((e) => e.price),
  ]);
}

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

/**
 * What the checks read: NFKC folds full-width digits and letters, ligatures and compatibility forms into plain ones,
 * and every ideographic or full-width full stop becomes `.` so `ejemplo。com` is the domain it looks like.
 */
function canonical(text: string): string {
  return text.normalize('NFKC').replace(/[\u3002\uff61\uff0e]/g, '.');
}

function ngrams(words: readonly string[], n: number): Set<string> {
  const grams = new Set<string>();
  for (let i = 0; i + n <= words.length; i += 1) grams.add(words.slice(i, i + n).join(' '));
  return grams;
}

function tokens(text: string): string[] {
  return canonical(text).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Whether `text` repeats a run of `LEAK_NGRAM` words of any of `sources`. */
export function leaksText(text: string, sources: readonly string[]): boolean {
  const own = tokens(text);
  if (own.length < LEAK_NGRAM) return false;
  const textGrams = ngrams(own, LEAK_NGRAM);
  return sources.some((source) => {
    for (const gram of ngrams(tokens(source), LEAK_NGRAM)) if (textGrams.has(gram)) return true;
    return false;
  });
}

/** A scheme or `www.` is always a link; a bare `name.tld` is one unless the tail is a file or tech suffix (`Next.js`). */
function isLinkCandidate(found: string): boolean {
  if (/^(?:https?:\/\/|www\.)/i.test(found)) return true;
  const host = found.split('/')[0] ?? '';
  return !NOT_A_TLD.has((host.split('.').pop() ?? '').toLowerCase());
}

function hasForeignScheme(text: string): boolean {
  for (const match of text.matchAll(OTHER_SCHEME)) {
    if (!/^https?$/i.test(match[1] ?? '')) return true;
  }
  return false;
}

export function guardModelOutput(rawText: string, options: GuardOptions): GuardResult {
  const text = canonical(rawText);
  if (HTML.test(text)) return { ok: false, reason: 'html' };
  if (INJECTION_ECHO.test(text)) return { ok: false, reason: 'injection_echo' };

  if (options.forbiddenTexts && leaksText(text, options.forbiddenTexts)) return { ok: false, reason: 'prompt_leak' };

  // chat content is rendered as plain text, so a link is never clickable: none is allowed in markdown form either
  if (hasForeignScheme(text) || MARKDOWN_LINK.test(text)) return { ok: false, reason: 'url' };
  const links = (text.match(URL_LIKE) ?? []).filter(isLinkCandidate);
  if (links.some((link) => !linkAllowed(link, options.allowedLinks ?? []))) return { ok: false, reason: 'url' };

  if (GIVEAWAY.test(text)) return { ok: false, reason: 'giveaway' };
  if (SPELLED_AMOUNT.test(text)) return { ok: false, reason: 'amount' };

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
