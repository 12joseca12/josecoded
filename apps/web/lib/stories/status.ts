import type { StatusBadgeTone, StoryStatus } from '@josecoded/types';

// The life of a user story as the interface draws it (DATOS §14.4, D52). The database is the authority over every
// transition; this is only how a status is shown.

/** Tone of the badge of a status (the badge always carries the text too). */
export function storyTone(status: StoryStatus): StatusBadgeTone {
  switch (status) {
    case 'proposed':
      return 'attention';
    case 'accepted':
      return 'active';
    case 'converted':
      return 'live';
    case 'rejected':
      return 'muted';
  }
}

/** How many stories are in each status, every status present. */
export function storyCounts(stories: readonly { status: StoryStatus }[]): Record<StoryStatus, number> {
  const counts: Record<StoryStatus, number> = { proposed: 0, accepted: 0, converted: 0, rejected: 0 };
  for (const story of stories) counts[story.status] += 1;
  return counts;
}
