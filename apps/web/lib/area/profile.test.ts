import { describe, expect, it, vi } from 'vitest';

import { recordFirstAudience, resolveAudienceSignal } from './profile';

describe('resolveAudienceSignal', () => {
  it('a valid ref cookie wins over the audience of the page', () => {
    expect(resolveAudienceSignal({ ref: 'ANA-TEST01', audience: 'business' })).toEqual({
      audience: 'referral',
      source: 'ref',
    });
  });
  it('ignores a malformed ref and falls back to the audience', () => {
    expect(resolveAudienceSignal({ ref: 'nope', audience: 'company' })).toEqual({
      audience: 'company',
      source: 'origin',
    });
  });
  it('is null without any signal', () => {
    expect(resolveAudienceSignal({ ref: undefined, audience: undefined })).toBeNull();
  });
});

describe('recordFirstAudience', () => {
  function client() {
    const is = vi.fn(async () => ({ error: null }));
    const eq = vi.fn(() => ({ is }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    return { from, update, eq, is };
  }

  it('updates only the own row and only while the audience is empty (write-once)', async () => {
    const c = client();
    await recordFirstAudience(c as never, 'u1', { audience: 'blog', source: 'origin' });
    expect(c.from).toHaveBeenCalledWith('user_profiles');
    expect(c.update).toHaveBeenCalledWith({ first_audience: 'blog', first_audience_source: 'origin' });
    expect(c.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(c.is).toHaveBeenCalledWith('first_audience', null);
  });

  it('does nothing without a signal', async () => {
    const c = client();
    await recordFirstAudience(c as never, 'u1', null);
    expect(c.from).not.toHaveBeenCalled();
  });
});
