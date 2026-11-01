// zod schemas at the process boundaries (working-agreements §14.2), one file per domain.
// Types are inferred in the matching domain file: `export type Lead = z.infer<typeof leadSchema>`.
export * from './area.ts';
export * from './assistant.ts';
export * from './auth.ts';
export * from './build.ts';
export * from './chat.ts';
export * from './crm.ts';
export * from './env.ts';
export * from './leads.ts';
export * from './media.ts';
export * from './pricing.ts';
export * from './proposal.ts';
export * from './proposals.ts';
export * from './text.ts';
