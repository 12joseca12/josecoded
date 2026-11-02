import { describe, expect, it } from 'vitest';

import { canTransition, requiresNextAction, statusesFor, statusTone } from './status';

describe('statusesFor', () => {
  it('gives each kind its own set', () => {
    expect(statusesFor('agency')).toEqual(['pending', 'invited', 'inmail_sent', 'replied', 'meeting', 'collaborating', 'discarded']);
    expect(statusesFor('lead')).toContain('proposal_sent');
    expect(statusesFor('recruiter')).toContain('interview');
  });

  it('never offers a closer the statuses that «Cerrar cobrado» sets', () => {
    expect(statusesFor('lead', 'closer')).not.toContain('won');
    expect(statusesFor('lead', 'closer')).not.toContain('active_client');
    expect(statusesFor('client', 'closer')).not.toContain('active_client');
    expect(statusesFor('lead', 'closer')).toContain('lost');
  });

  it('offers the admin the whole set', () => {
    expect(statusesFor('lead', 'admin')).toEqual(statusesFor('lead'));
  });
});

describe('requiresNextAction', () => {
  it('asks for it in every status except the final ones', () => {
    expect(requiresNextAction('agency', 'discarded')).toBe(false);
    expect(requiresNextAction('agency', 'replied')).toBe(true);
    expect(requiresNextAction('lead', 'won')).toBe(false);
    expect(requiresNextAction('lead', 'closed')).toBe(false);
    expect(requiresNextAction('recruiter', 'rejected')).toBe(false);
    expect(requiresNextAction('lead', 'new')).toBe(true);
  });
});

describe('canTransition', () => {
  it('cannot move an agency to a lead status', () => {
    expect(canTransition('agency', 'pending', 'won')).toBe(false);
  });
  it('lets a closer move a lead to lost but not to won', () => {
    expect(canTransition('lead', 'contacted', 'lost', 'closer')).toBe(true);
    expect(canTransition('lead', 'contacted', 'won', 'closer')).toBe(false);
    expect(canTransition('lead', 'contacted', 'won', 'admin')).toBe(true);
  });
});

describe('statusTone', () => {
  it('marks the alive, the waiting and the finished apart', () => {
    expect(statusTone('active_client')).toBe('live');
    expect(statusTone('replied')).toBe('attention');
    expect(statusTone('lost')).toBe('muted');
    expect(statusTone('new')).toBe('neutral');
  });
});
