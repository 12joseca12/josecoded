import type { StatusBadgeTone, StoryStatus } from '@josecoded/types';

// The life of a user story as the interface offers it (DATOS §14.4, D52). The database is the authority
// (`accept_/reject_/convert_user_story` check the status under lock and who may decide); this mirrors it so a screen
// draws only the buttons that will be accepted.

export type StoryRole = 'admin' | 'closer' | 'client';
export type StoryAction = 'accept' | 'reject' | 'convert' | 'edit' | 'delete';

/**
 * What a person can do with a story in a status. The staff decides (`accept`, `reject`) a proposed one and converts an
 * accepted one; the client only edits or deletes her own while it is proposed. A converted or rejected story is final.
 */
export function nextActions(status: StoryStatus, role: StoryRole): readonly StoryAction[] {
  if (role === 'client') return status === 'proposed' ? ['edit', 'delete'] : [];
  switch (status) {
    case 'proposed':
      return ['accept', 'reject'];
    case 'accepted':
      return ['convert'];
    default:
      return [];
  }
}

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
