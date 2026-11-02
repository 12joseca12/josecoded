import { z } from 'zod';

// Client user stories (task 1.8e, DATOS v1.4 §14.2, D52). The client writes the text; the decision and the estimate
// are RPCs of the admin or the owner closer (`accept_user_story`, `reject_user_story`, `convert_user_story`).

export const STORY_STATUSES = ['proposed', 'accepted', 'rejected', 'converted'] as const;
export const storyStatusSchema = z.enum(STORY_STATUSES);

/** Max criteria per story: the check of `client_user_stories.acceptance_criteria`. */
export const STORY_MAX_CRITERIA = 12;

export const userStoryInputSchema = z.object({
  title: z.string().trim().min(1).max(140),
  as_a: z.string().trim().min(1).max(200),
  i_want: z.string().trim().min(1).max(500),
  so_that: z.string().trim().min(1).max(500),
  acceptance_criteria: z.array(z.string().trim().min(1).max(300)).max(STORY_MAX_CRITERIA).default([]),
});

/** Arguments of `accept_user_story()`. */
export const acceptUserStoryInputSchema = z.object({
  story_id: z.uuid(),
  estimate_hours: z.number().min(0).max(9999).nullable(),
  estimate_amount: z.number().min(0).max(99_999_999).nullable(),
  note: z.string().trim().max(1000).nullable().default(null),
  create_task: z.boolean().default(true),
});
