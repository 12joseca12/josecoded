import { z } from 'zod';

// Boundaries of the passwordless sign-in, the profile and the TOTP factor (plan 4.1; DATOS §8.1).
// Validated only on the server (Server Actions, working-agreements §17.3).

export const emailSchema = z.email().max(254);

/** Audience hints a public page may carry into the sign-up (DT §1.12). `referral` comes from the `ref` cookie only. */
export const originAudienceSchema = z.enum(['business', 'company', 'blog']);
export type OriginAudience = z.infer<typeof originAudienceSchema>;

export const localeSchema = z.enum(['es', 'en']);

/** An internal path or nothing; `safeNext` in apps/web is the real guard. */
const nextSchema = z.string().max(512).optional();

export const signInEmailSchema = z.object({
  email: emailSchema,
  next: nextSchema,
  audience: originAudienceSchema.optional().catch(undefined),
  turnstileToken: z.string().min(1).max(4096),
});
export type SignInEmailInput = z.infer<typeof signInEmailSchema>;

export const verifyOtpSchema = z.object({
  email: emailSchema,
  token: z.string().regex(/^\d{6}$/),
  next: nextSchema,
  audience: originAudienceSchema.optional().catch(undefined),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const oauthProviderSchema = z.enum(['google', 'github']);
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

export const oauthSignInSchema = z.object({
  provider: oauthProviderSchema,
  next: nextSchema,
  audience: originAudienceSchema.optional().catch(undefined),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().max(80),
  locale: localeSchema,
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const totpCodeSchema = z.object({
  factorId: z.uuid(),
  code: z.string().regex(/^\d{6}$/),
});
export type TotpCodeInput = z.infer<typeof totpCodeSchema>;
