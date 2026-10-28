// Shared fixture with @josecoded/types: the gateway (incl. its outbox drain) and area_lead_summary()
// read the same ai_proposal shape, and its price must be the one pricing.json gives.
import { expect, it } from 'vitest';

import { aiProposalSchema } from '@josecoded/types';

import fixture from '../../types/test/fixtures/ai-proposal.json';
import { priceForProposal } from '../src';

it('the ai_proposal fixture is valid and re-priced by pricing.json', () => {
  const proposal = aiProposalSchema.parse(fixture);
  const priced = priceForProposal(proposal.pack, proposal.extras);
  expect(priced.priceFrom).toBe(proposal.priceFrom);
  expect(priced.pricingVersion).toBe(proposal.pricingVersion);
});
