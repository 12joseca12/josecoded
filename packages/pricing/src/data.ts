import { pricingSchema } from '@josecoded/types';

import raw from '../pricing.json';

import type { PricingData } from '@josecoded/types';

/** pricing.json validated at load time: an invalid file fails every import, not just one caller. */
export const pricing: PricingData = pricingSchema.parse(raw);
