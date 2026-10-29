import { describe, expect, it } from 'vitest';

import { currentFor, getNavItems } from './nav';

describe('getNavItems', () => {
  it('lists Sobre mí, Servicios, Proyectos, Lab and Blog (no Partners, no Contacto)', () => {
    expect(getNavItems({ lab: true, blog: true }).map((i) => i.key)).toEqual([
      'about',
      'services',
      'projects',
      'lab',
      'blog',
    ]);
  });

  it('drops Lab and Blog independently when they have no content', () => {
    expect(getNavItems({ lab: false, blog: true }).map((i) => i.key)).toEqual(['about', 'services', 'projects', 'blog']);
    expect(getNavItems({ lab: true, blog: false }).map((i) => i.key)).toEqual(['about', 'services', 'projects', 'lab']);
    expect(getNavItems({ lab: false, blog: false })).toHaveLength(3);
  });

  it('points Lab and Blog at the one home scene they share', () => {
    const scenes = getNavItems({ lab: true, blog: true }).filter((i) => i.key === 'lab' || i.key === 'blog');
    expect(new Set(scenes.map((i) => i.scene))).toEqual(new Set(['lab-blog']));
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
