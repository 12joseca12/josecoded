// Job `content.poll_deploy` (`*/5`, DATOS §14.5, §14.6): for each publication committed by the bot, looks up the run of the deploy
// workflow for its commit and marks it `deployed` or `failed` (which enqueues `content.deployed` / `content.deploy_failed` for the
// admin's Telegram). A run still going, or not there yet, is left for the next tick; if none shows up within three hours the publication
// is reported as failed (`no_deploy_run`), because the deploy workflow is started by hand until it is wired to pushes to main.
import { judgeDeploy } from '../services/content-publish.service';
import { logEvent } from '../utils/http-error';

import type { JobHandler } from './job';

export const CONTENT_POLL_DEPLOY = 'content.poll_deploy';

/** The list, then per publication a run lookup and (when it ends) a mark. */
const SUBREQUESTS_PER_PUBLICATION = 2;
const MAX_PUBLICATIONS = 5;

export const pollContentDeploys: JobHandler = async ({ deps, budget, now }) => {
  const { contentPublications: publications, repoWriter: writer } = deps;
  if (!publications || !writer) return; // no secret key, or the App is not set up: nothing to watch
  if (budget.remaining < 1 + 1 + SUBREQUESTS_PER_PUBLICATION) return; // the list, a token, and one publication

  budget.take();
  const committed = await publications.listCommitted(MAX_PUBLICATIONS);
  for (const publication of committed) {
    if (!publication.commitSha) continue;
    if (budget.remaining < SUBREQUESTS_PER_PUBLICATION + 1) break;
    try {
      const run = await writer.workflowRunForSha(publication.commitSha, { onRequest: () => budget.take() });
      const verdict = judgeDeploy(run, publication.committedAt, now);
      if (!verdict) continue;
      budget.take();
      await publications.mark({ id: publication.id, ...verdict });
    } catch (error) {
      if (error instanceof Error && error.name === 'BudgetExhaustedError') break;
      // a lookup that failed is tried again next tick; only the fixed reason is logged
      logEvent('content', 'poll_deploy_failed', { reason: error instanceof Error ? error.message.slice(0, 60) : 'error' });
    }
  }
};
