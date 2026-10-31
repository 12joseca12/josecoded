import { describe, expect, it, vi } from 'vitest';

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
    expect(getSectionAvailability(index(false, true), 'production')).toEqual({ lab: true, blog: false });
    expect(getSectionAvailability(index(true, false), 'production')).toMatchObject({ lab: false });
  });

  it('blog follows the guides, independently of the lab', () => {
    expect(getSectionAvailability(index(true, false), 'production')).toEqual({ lab: false, blog: true });
    expect(getSectionAvailability(index(false, true), 'production')).toMatchObject({ blog: false });
  });

  describe('site env', () => {
    it('production follows the content index', () => {
      expect(getSectionAvailability(index(false, false), 'production')).toEqual({ lab: false, blog: false });
      expect(getSectionAvailability(index(true, false), 'production')).toEqual({ lab: false, blog: true });
    });

    it.each(['preview', 'development'] as const)('%s always shows Lab and Blog', (siteEnv) => {
      expect(getSectionAvailability(index(false, false), siteEnv)).toEqual({ lab: true, blog: true });
    });

    it('defaults to production when NEXT_PUBLIC_SITE_ENV is unset or empty', () => {
      vi.stubEnv('NEXT_PUBLIC_SITE_ENV', '');
      expect(getSectionAvailability(index(false, false))).toEqual({ lab: false, blog: false });
      vi.stubEnv('NEXT_PUBLIC_SITE_ENV', 'preview');
      expect(getSectionAvailability(index(false, false))).toEqual({ lab: true, blog: true });
      vi.unstubAllEnvs();
    });
  });

  it('rejects a malformed index', () => {
    expect(() => getSectionAvailability({ blogEnabled: true })).toThrow();
  });
});
