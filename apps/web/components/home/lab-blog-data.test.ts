import { expect, it } from 'vitest';

import { getSectionAvailability } from '@/lib/content/sections';

import { labBlogVariant } from './lab-blog-data';

it('has the demo and guides, only one of them, or no scene at all', () => {
  expect(labBlogVariant({ lab: true, blog: true })).toBe('both');
  expect(labBlogVariant({ lab: true, blog: false })).toBe('lab');
  expect(labBlogVariant({ lab: false, blog: true })).toBe('blog');
  expect(labBlogVariant({ lab: false, blog: false })).toBeNull();
});

it('is absent in production while Lab and Blog have no content, and present elsewhere', () => {
  const empty = { blog: { guides: 0 }, lab: { demos: 0 }, blogEnabled: false, labEnabled: false };
  expect(labBlogVariant(getSectionAvailability(empty, 'production'))).toBeNull();
  expect(labBlogVariant(getSectionAvailability(empty, 'preview'))).toBe('both');
  expect(labBlogVariant(getSectionAvailability({ ...empty, blog: { guides: 3 }, blogEnabled: true }, 'production'))).toBe('blog');
});
