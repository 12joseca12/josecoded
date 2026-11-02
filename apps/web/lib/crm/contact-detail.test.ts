import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guards', () => ({ getOptionalSession: async () => null }));

import { accessState } from './contact-detail';

describe('accessState', () => {
  it('is «con acceso» as soon as the client has a user', () => {
    expect(accessState({ has_access: true }, [])).toEqual({ state: 'active' });
  });
  it('is «sin invitar» when nobody asked the gateway to invite, even if the client already has an invite email', () => {
    expect(accessState({ has_access: false }, [{ kind: 'note', occurred_at: '2026-11-01T10:00:00Z' }])).toEqual({ state: 'none' });
  });
  it('is «invitado el …» with the latest invitation', () => {
    expect(
      accessState({ has_access: false }, [
        { kind: 'client_invited', occurred_at: '2026-10-30T10:00:00Z' },
        { kind: 'client_invited', occurred_at: '2026-11-01T10:00:00Z' },
      ]),
    ).toEqual({ state: 'invited', at: '2026-11-01T10:00:00Z' });
  });
});
