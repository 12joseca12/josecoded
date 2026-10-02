// zod schemas at the process boundaries (working-agreements §14.2), one file per domain.
// Types are inferred in the matching domain file: `export type Lead = z.infer<typeof leadSchema>`.
export * from './pricing';
export * from './proposal';
