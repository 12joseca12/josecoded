import type {
  appCodeSchema,
  appPackSchema,
  buildInfoSchema,
  contentIndexSchema,
  extraCodeSchema,
  extraSchema,
  localizedTextSchema,
  packCodeSchema,
  packSchema,
  pricingSchema,
} from './schemas';
import type { z } from 'zod';

// Versioned content: pricing today; projects, services, FAQ, blog and CV arrive in tasks 3.1+.

export type PackCode = z.infer<typeof packCodeSchema>;
export type AppCode = z.infer<typeof appCodeSchema>;
export type ExtraCode = z.infer<typeof extraCodeSchema>;
export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type Pack = z.infer<typeof packSchema>;
export type AppPack = z.infer<typeof appPackSchema>;
export type Extra = z.infer<typeof extraSchema>;
export type PricingData = z.infer<typeof pricingSchema>;
export type BuildInfo = z.infer<typeof buildInfoSchema>;
export type ContentIndex = z.infer<typeof contentIndexSchema>;
