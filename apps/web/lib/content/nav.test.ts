import { describe, expect, it } from 'vitest';

import { navLabel } from './nav';
import { getSectionAvailability } from './sections';

describe('navLabel', () => {
  it('names the destination after what exists, and hides it when nothing does', () => {
    expect(navLabel({ lab: true, blog: true })).toBe('labBlog');
    expect(navLabel({ lab: true, blog: false })).toBe('lab');
    expect(navLabel({ lab: false, blog: true })).toBe('blog');
    expect(navLabel({ lab: false, blog: false })).toBeNull();
  });

  it('with two real guides in production the header has no Blog; with three it does', () => {
    const index = (guides: number) => ({ blog: { guides }, lab: { demos: 0 }, blogEnabled: guides >= 3, labEnabled: false });
    expect(navLabel(getSectionAvailability(index(2), 'production'))).toBeNull();
    expect(navLabel(getSectionAvailability(index(3), 'production'))).toBe('blog');
  });
});
