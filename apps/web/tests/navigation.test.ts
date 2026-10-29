import { describe, expect, it } from 'vitest';

import { getPathname } from '../i18n/navigation';

describe('getPathname with dynamic templates', () => {
  it.each([
    ['es', '/proyectos/[slug]', { slug: 'x' }, '/proyectos/x'],
    ['en', '/proyectos/[slug]', { slug: 'x' }, '/en/projects/x'],
    ['en', '/blog/[slug]', { slug: 'x' }, '/en/blog/x'],
    ['en', '/lab/[slug]', { slug: 'x' }, '/en/lab/x'],
    ['es', '/area-clientes/tareas/[id]', { id: '7' }, '/area-clientes/tareas/7'],
    ['en', '/area-clientes/tareas/[id]', { id: '7' }, '/en/client-area/tasks/7'],
  ] as const)('%s %s -> %s', (locale, pathname, params, expected) => {
    expect(getPathname({ href: { pathname, params } as never, locale })).toBe(expected);
  });
});
