import type { aiProposalSchema, envClientSchema, envServerSchema } from './schemas';
import type { z } from 'zod';

// Process boundaries: web <-> gateway contracts (ai_proposal now; leads, affiliates and chat from
// tasks 3.7+) and the environment of apps/web.

export type AiProposal = z.infer<typeof aiProposalSchema>;
export type EnvClient = z.infer<typeof envClientSchema>;
export type EnvServer = z.infer<typeof envServerSchema>;
