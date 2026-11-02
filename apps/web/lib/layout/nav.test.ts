import { describe, expect, it } from 'vitest';

import { currentFor, getFooterNavItems, getNavItems } from './nav';

describe('getNavItems', () => {
  it('lists Sobre mí, Servicios, Proyectos and one Lab/Blog link (no Partners, no Contacto)', () => {
    expect(getNavItems({ lab: true, blog: true }).map((i) => i.key)).toEqual(['about', 'services', 'projects', 'labBlog']);
  });

  it('names the last link after what exists and drops it when nothing does', () => {
    expect(getNavItems({ lab: false, blog: true }).map((i) => i.key)).toEqual(['about', 'services', 'projects', 'blog']);
    expect(getNavItems({ lab: true, blog: false }).map((i) => i.key)).toEqual(['about', 'services', 'projects', 'lab']);
    expect(getNavItems({ lab: false, blog: false })).toHaveLength(3);
  });

  it('points at the page that exists and at the home scene they share', () => {
    const last = (lab: boolean, blog: boolean) => getNavItems({ lab, blog }).at(-1)!;
    expect(last(true, true)).toMatchObject({ href: '/lab', scene: 'lab-blog' });
    expect(last(false, true)).toMatchObject({ href: '/blog', scene: 'lab-blog' });
  });
});

describe('getFooterNavItems', () => {
  it('keeps Lab and Blog apart, each only while it has content', () => {
    expect(getFooterNavItems({ lab: true, blog: true }).map((i) => i.key)).toEqual(['about', 'services', 'projects', 'lab', 'blog']);
    expect(getFooterNavItems({ lab: false, blog: true }).map((i) => i.key)).toEqual(['about', 'services', 'projects', 'blog']);
    expect(getFooterNavItems({ lab: false, blog: false })).toHaveLength(3);
  });
});

describe('currentFor', () => {
  it('is page for the page, true for a page inside, nothing otherwise', () => {
    expect(currentFor('/servicios', '/servicios')).toBe('page');
    expect(currentFor('/proyectos/x', '/proyectos')).toBe('true');
    expect(currentFor('/proyectos-x', '/proyectos')).toBeUndefined();
    expect(currentFor('/', '/servicios')).toBeUndefined();
    expect(currentFor(null, '/servicios')).toBeUndefined();
  });
});
