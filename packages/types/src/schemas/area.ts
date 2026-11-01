import { z } from 'zod';

import { EXTRA_CODES, PACK_CODES } from './pricing.ts';

// Boundaries of the client area (plan 5.x). Validated only on the server.

export const taskCommentSchema = z.object({
  taskId: z.uuid(),
  body: z.string().trim().min(1).max(4000),
});
export type TaskCommentInput = z.infer<typeof taskCommentSchema>;

/** Client-side upload limits; the bucket enforces the same ones (20261028100400_client_assets.sql). */
export const ASSET_MAX_BYTES = 26_214_400;
export const ASSET_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;

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
