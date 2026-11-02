import { describe, expect, it } from 'vitest';

import { nextActions, storyCounts, storyTone } from './status';

describe('nextActions', () => {
  it('a proposed story is accepted or rejected by the staff (the admin and the owner closer alike)', () => {
    expect(nextActions('proposed', 'closer')).toEqual(['accept', 'reject']);
    expect(nextActions('proposed', 'admin')).toEqual(['accept', 'reject']);
  });

  it('an accepted story, whose estimate was agreed outside the web, is converted into a task', () => {
    expect(nextActions('accepted', 'closer')).toEqual(['convert']);
    expect(nextActions('accepted', 'admin')).toEqual(['convert']);
  });

  it('a converted or a rejected story has nothing left to do, for anybody', () => {
    for (const role of ['closer', 'admin', 'client'] as const) {
      expect(nextActions('converted', role)).toEqual([]);
      expect(nextActions('rejected', role)).toEqual([]);
    }
  });

  it('the client edits or deletes her story only while it is proposed, and never decides', () => {
    expect(nextActions('proposed', 'client')).toEqual(['edit', 'delete']);
    expect(nextActions('accepted', 'client')).toEqual([]);
  });
});

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
