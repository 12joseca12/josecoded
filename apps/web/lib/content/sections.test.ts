import { describe, expect, it } from 'vitest';

import { getSectionAvailability } from './sections';

const index = (blogEnabled: boolean, labEnabled: boolean) => ({
  blog: { guides: blogEnabled ? 3 : 0 },
  lab: { demos: labEnabled ? 2 : 0 },
  blogEnabled,
  labEnabled,
});

describe('getSectionAvailability', () => {
  it('reads the generated content index', () => {
    const { lab, blog } = getSectionAvailability();
    expect(typeof lab).toBe('boolean');
    expect(typeof blog).toBe('boolean');
  });

  it('lab follows the lab demos, independently of the blog', () => {
    expect(getSectionAvailability(index(false, true))).toEqual({ lab: true, blog: false });
    expect(getSectionAvailability(index(true, false))).toMatchObject({ lab: false });
  });

  it('blog follows the guides, independently of the lab', () => {
    expect(getSectionAvailability(index(true, false))).toEqual({ lab: false, blog: true });
    expect(getSectionAvailability(index(false, true))).toMatchObject({ blog: false });
  });

  it('rejects a malformed index', () => {
    expect(() => getSectionAvailability({ blogEnabled: true })).toThrow();
  });
});
