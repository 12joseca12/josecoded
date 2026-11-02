import { describe, expect, it } from 'vitest';

import { storyCounts, storyTone } from './status';

describe('storyTone', () => {
  it('waits (amber) while proposed, is live once it is a task, and muted when rejected', () => {
    expect(storyTone('proposed')).toBe('attention');
    expect(storyTone('accepted')).toBe('active');
    expect(storyTone('converted')).toBe('live');
    expect(storyTone('rejected')).toBe('muted');
  });
});

describe('storyCounts', () => {
  it('counts every status, the empty ones as zero', () => {
    expect(storyCounts([{ status: 'proposed' }, { status: 'proposed' }, { status: 'converted' }])).toEqual({
      proposed: 2,
      accepted: 0,
      converted: 1,
      rejected: 0,
    });
    expect(storyCounts([])).toEqual({ proposed: 0, accepted: 0, converted: 0, rejected: 0 });
  });
});
