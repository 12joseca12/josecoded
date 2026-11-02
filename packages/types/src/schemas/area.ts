import { z } from 'zod';

import { EXTRA_CODES, PACK_CODES } from './pricing.ts';
import { ASSET_MAX_BYTES, ASSET_MIME_TYPES } from '../constants/index.ts';

// Boundaries of the client area (plan 5.x). Validated only on the server.

export const taskCommentSchema = z.object({
  taskId: z.uuid(),
  body: z.string().trim().min(1).max(4000),
});
export type TaskCommentInput = z.infer<typeof taskCommentSchema>;

export const assetUploadIntentSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ASSET_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(ASSET_MAX_BYTES),
});
export type AssetUploadIntent = z.infer<typeof assetUploadIntentSchema>;

export const upgradeRequestSchema = z
  .object({
    toPack: z.enum(PACK_CODES).nullable(),
    extras: z.array(z.enum(EXTRA_CODES)).max(EXTRA_CODES.length),
  })
  .refine((value) => value.toPack !== null || value.extras.length > 0, { path: ['toPack'] });
export type UpgradeRequestInput = z.infer<typeof upgradeRequestSchema>;
