import { pricingSchema } from '@josecoded/types';

import raw from '../../../content/pricing.json';

import type { PricingData } from '@josecoded/types';

/**
 * `content/pricing.json` (the last published catalogue, D54) validated at load time: an invalid file fails every
 * import, not just one caller. The gateway reads the live one through `PricingSource` and falls back to this.
 */
export const pricing: PricingData = pricingSchema.parse(raw);
