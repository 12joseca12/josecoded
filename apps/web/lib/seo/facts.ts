import { hasDato } from '@/lib/content/dato';

/** The facts about Jose that structured data may state. Every field is absent until Jose supplies it (no {{DATO}} leaks). */
export interface SiteFacts {
  givenNames?: string;
  surnames?: string;
  city?: string;
  /** Absolute URL or site path of the portrait. */
  photo?: string;
  email?: string;
  githubUser?: string;
  linkedinUrl?: string;
}

const FIELDS = ['givenNames', 'surnames', 'city', 'photo', 'email', 'githubUser', 'linkedinUrl'] as const;

/** Keeps the `facts.*` messages that hold a real value. */
export function readFacts(raw: Record<string, string>): SiteFacts {
  const facts: SiteFacts = {};
  for (const field of FIELDS) {
    const value = raw[field]?.trim();
    if (value !== undefined && hasDato(value)) facts[field] = value;
  }
  return facts;
}

export const fullName = (facts: SiteFacts): string | undefined =>
  facts.givenNames && facts.surnames ? `${facts.givenNames} ${facts.surnames}` : undefined;

/** Public profiles that identify the same entity (`sameAs`). Only https URLs. */
export function sameAs(facts: SiteFacts): string[] {
  const urls = [
    facts.linkedinUrl,
    facts.githubUser ? `https://github.com/${facts.githubUser}` : undefined,
  ];
  return urls.filter((url): url is string => url !== undefined && url.startsWith('https://'));
}
