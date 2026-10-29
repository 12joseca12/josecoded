import { describe, expect, it } from 'vitest';

import { getSectionAvailability } from './sections';

describe('getSectionAvailability', () => {
  it('reads the generated content index', () => {
    const { lab, blog } = getSectionAvailability();
    expect(typeof lab).toBe('boolean');
    expect(typeof blog).toBe('boolean');
  });
});
