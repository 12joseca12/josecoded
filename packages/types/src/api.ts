import type { aiProposalSchema, envClientSchema, envServerSchema } from './schemas';
import type { z } from 'zod';

// Process boundaries: web <-> gateway contracts (ai_proposal now; leads, affiliates and chat from
// tasks 3.7+) and the environment of apps/web.

// Ports of the gateway (working-agreements §17.1). The rest (LeadsRepo, Notifier, Mailer, ...) arrive with
// the task that introduces each adapter.
export interface Clock {
  now(): Date;
}

/** One row of `private.scheduled_jobs` (created by migration 1.8): the single five-minute cron dispatches over it. */
export interface ScheduledJob {
  name: string;
  /** 5-field cron expression, evaluated in `tz`. */
  cron: string;
  /** IANA time zone; UTC when absent (`radar.daily` runs in Europe/Madrid). */
  tz?: string;
  nextRunAt: Date;
}

export interface ScheduledJobsRepo {
  /** Enabled jobs with `nextRunAt <= now`, oldest first (ties by name). */
  listDue(now: Date): Promise<ScheduledJob[]>;
  /** Records a run and when the job is due next. */
  markRan(name: string, ranAt: Date, nextRunAt: Date): Promise<void>;
}

export type AiProposal = z.infer<typeof aiProposalSchema>;
export type EnvClient = z.infer<typeof envClientSchema>;
export type EnvServer = z.infer<typeof envServerSchema>;
