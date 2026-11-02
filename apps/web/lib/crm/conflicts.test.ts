import { describe, expect, it } from 'vitest';

import {
  conflictOutcomeForImporter,
  differingFields,
  parseConflictRow,
  RESOLUTION_ORDER,
  resolutionLabel,
} from './conflicts';

describe('conflictOutcomeForImporter', () => {
  it('says only what the importer may know: waiting, assigned to her, or not', () => {
    expect(conflictOutcomeForImporter({ status: 'pending', resolution: null })).toBe('pending');
    expect(conflictOutcomeForImporter({ status: 'resolved', resolution: 'assign_importer' })).toBe(
      'assigned',
    );
    for (const resolution of ['assign_existing', 'merge', 'discard'] as const) {
      expect(conflictOutcomeForImporter({ status: 'resolved', resolution })).toBe('not_assigned');
    }
  });

  it('treats a resolved row without resolution as not assigned, never as assigned', () => {
    expect(conflictOutcomeForImporter({ status: 'resolved', resolution: null })).toBe(
      'not_assigned',
    );
  });
});

describe('resolutionLabel', () => {
  it('names the two people in the action it describes', () => {
    expect(resolutionLabel('assign_existing', 'Carla', 'Jose')).toEqual({
      key: 'keep',
      values: { importer: 'Carla', owner: 'Jose' },
    });
    expect(resolutionLabel('assign_importer', 'Carla', 'Jose').key).toBe('assign');
    expect(resolutionLabel('merge', 'Carla', 'Jose').key).toBe('merge');
    expect(resolutionLabel('discard', 'Carla', 'Jose').key).toBe('discard');
  });

  it('offers the four actions in the order of the screen', () => {
    expect(RESOLUTION_ORDER).toEqual(['assign_existing', 'assign_importer', 'merge', 'discard']);
  });
});

describe('parseConflictRow', () => {
  it('reads the jsonb the database keeps, nulls included, and survives anything else', () => {
    const row = parseConflictRow({
      display_name: ' Raúl ',
      email: 'r@x.test',
      phone: null,
      tags: ['feria'],
      kind: 'agency',
      extra: 1,
    });
    expect(row).toMatchObject({
      display_name: 'Raúl',
      email: 'r@x.test',
      phone: null,
      tags: ['feria'],
      kind: 'agency',
      city: null,
    });
    expect(parseConflictRow(null).display_name).toBeNull();
    expect(parseConflictRow('x').tags).toEqual([]);
    expect(parseConflictRow({ tags: 'nope', email: 5 }).tags).toEqual([]);
  });
});

describe('differingFields', () => {
  const imported = parseConflictRow({
    email: 'RAUL@x.test',
    phone: '+34 600',
    organization: 'Estudio',
    role: 'Director',
  });
  it('marks what the imported row adds or contradicts, ignoring case and spacing', () => {
    expect(
      differingFields(imported, {
        email: 'raul@x.test',
        phone: null,
        linkedin_url: null,
        organization: 'estudio ',
        role: null,
      }),
    ).toEqual(['phone', 'role']);
  });
  it('never marks a field the imported row left empty', () => {
    expect(
      differingFields(parseConflictRow({}), {
        email: 'a@x.test',
        phone: '1',
        linkedin_url: null,
        organization: null,
        role: null,
      }),
    ).toEqual([]);
  });
});
