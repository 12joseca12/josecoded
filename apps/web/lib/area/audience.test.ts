import { expect, it } from 'vitest';

import { resolveAreaVariant } from './audience';

import type { AreaVariantInput } from './audience';

const lead = { pack_code: 'P2' };
const profile = (first_audience: NonNullable<AreaVariantInput['profile']>['first_audience']) => ({ first_audience });

it.each([
  // a project beats everything
  [{ client: { id: 'c' }, lead, profile: profile('referral') }, 'client'],
  [{ client: { id: 'c' }, lead: null, profile: null }, 'client'],
  // a proposal beats the origin signal
  [{ client: null, lead, profile: profile('referral') }, 'proposal'],
  [{ client: null, lead, profile: null }, 'proposal'],
  // the origin signal decides between the rest
  [{ client: null, lead: null, profile: profile('referral') }, 'referral'],
  [{ client: null, lead: null, profile: profile('business') }, 'business'],
  [{ client: null, lead: null, profile: profile('company') }, 'company'],
  [{ client: null, lead: null, profile: profile('blog') }, 'blog'],
  // origins without a tailored face, an empty signal and a missing profile
  [{ client: null, lead: null, profile: profile('curious') }, 'neutral'],
  [{ client: null, lead: null, profile: profile('recruiter') }, 'neutral'],
  [{ client: null, lead: null, profile: profile(null) }, 'neutral'],
  [{ client: null, lead: null, profile: null }, 'neutral'],
] as [AreaVariantInput, string][])('%o -> %s', (input, expected) => {
  expect(resolveAreaVariant(input)).toBe(expected);
});
