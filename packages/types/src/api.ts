import type { aiProposalSchema } from './schemas';
import type { z } from 'zod';

// Web <-> gateway contracts (ai_proposal now; leads, affiliates and chat from tasks 3.7+).

export type AiProposal = z.infer<typeof aiProposalSchema>;
