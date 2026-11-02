import type {
  acceptUserStoryInputSchema,
  appCodeSchema,
  appPackSchema,
  buildInfoSchema,
  CONTENT_KINDS,
  contentEntrySchema,
  contentIndexSchema,
  EDITABLE_NAMESPACES,
  EXTRA_BILLINGS,
  extraCodeSchema,
  extraInputSchema,
  extraSchema,
  localizedTextSchema,
  packCodeSchema,
  packInputSchema,
  packOptionInputSchema,
  packSchema,
  PACK_KINDS,
  PRICING_ITEMS,
  pricingSchema,
  pricingSettingsInputSchema,
  PUBLICATION_STATUSES,
  quoteDiscountInputSchema,
  quoteInputSchema,
  quoteItemInputSchema,
  QUOTE_STATUSES,
  siteSettingsSchema,
  STORY_STATUSES,
  userStoryInputSchema,
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

// Editable site content (task 1.8e, D53). Inferred from the zod lists until database.ts is regenerated with the new
// enums; test/enums-sql.test.ts compares the lists with the migrations.
export type ContentKind = (typeof CONTENT_KINDS)[number];
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];
export type EditableNamespace = (typeof EDITABLE_NAMESPACES)[number];
/** What `content_save_draft()` receives, discriminated by `kind`. */
export type ContentEntry = z.infer<typeof contentEntrySchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

// Price catalogue and quotes (task 1.8e, Q23/D54): the admin RPC inputs. They live here, with the pricing data they
// edit (the barrel allows one file per domain).
export type PackKind = (typeof PACK_KINDS)[number];
export type ExtraBilling = (typeof EXTRA_BILLINGS)[number];
export type PricingItem = (typeof PRICING_ITEMS)[number];
export type PackInput = z.infer<typeof packInputSchema>;
export type PackOptionInput = z.infer<typeof packOptionInputSchema>;
export type ExtraInput = z.infer<typeof extraInputSchema>;
export type PricingSettingsInput = z.infer<typeof pricingSettingsInputSchema>;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type QuoteInput = z.infer<typeof quoteInputSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemInputSchema>;
export type QuoteDiscountInput = z.infer<typeof quoteDiscountInputSchema>;

// Client user stories (D52).
export type StoryStatus = (typeof STORY_STATUSES)[number];
export type UserStoryInput = z.infer<typeof userStoryInputSchema>;
export type AcceptUserStoryInput = z.infer<typeof acceptUserStoryInputSchema>;
