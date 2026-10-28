import type { ScheduledJob, ScheduledJobsRepo } from '@josecoded/types';

export interface FakeScheduledJobs extends ScheduledJobsRepo {
  jobs: Map<string, ScheduledJob>;
  /** Names passed to markRan, in order. */
  ran: string[];
  /** Names passed to disable, in order (no longer listed as due). */
  disabled: string[];
}

/** In-memory `private.scheduled_jobs`: same port as the real adapter will implement (working-agreements §17.1). */
export function createFakeScheduledJobs(initial: ScheduledJob[] = []): FakeScheduledJobs {
  const jobs = new Map(initial.map((job) => [job.name, job]));
  const ran: string[] = [];
  const disabled: string[] = [];
  return {
    jobs,
    ran,
    disabled,
    listDue: async (now) =>
      [...jobs.values()]
        .filter((job) => !disabled.includes(job.name) && job.nextRunAt.getTime() <= now.getTime())
        .sort((a, b) => a.nextRunAt.getTime() - b.nextRunAt.getTime() || a.name.localeCompare(b.name)),
    markRan: async (name, _ranAt, nextRunAt) => {
      const job = jobs.get(name);
      if (job) jobs.set(name, { ...job, nextRunAt });
      ran.push(name);
    },
    disable: async (name) => {
      disabled.push(name);
    },
  };
}
