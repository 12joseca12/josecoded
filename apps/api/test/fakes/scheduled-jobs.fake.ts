import type { ScheduledJob, ScheduledJobsRepo } from '@josecoded/types';

export interface FakeScheduledJobs extends ScheduledJobsRepo {
  jobs: Map<string, ScheduledJob>;
  /** Names passed to markRan, in order. */
  ran: string[];
}

/** In-memory `private.scheduled_jobs`: same port as the real adapter will implement (working-agreements §17.1). */
export function createFakeScheduledJobs(initial: ScheduledJob[] = []): FakeScheduledJobs {
  const jobs = new Map(initial.map((job) => [job.name, job]));
  const ran: string[] = [];
  return {
    jobs,
    ran,
    listDue: async (now) =>
      [...jobs.values()]
        .filter((job) => job.nextRunAt.getTime() <= now.getTime())
        .sort((a, b) => a.nextRunAt.getTime() - b.nextRunAt.getTime() || a.name.localeCompare(b.name)),
    markRan: async (name, _ranAt, nextRunAt) => {
      const job = jobs.get(name);
      if (job) jobs.set(name, { ...job, nextRunAt });
      ran.push(name);
    },
  };
}
