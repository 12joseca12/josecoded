import { describe, expect, it } from 'vitest';

import { initials, isCurrentStaffPath, staffNav } from './nav';

const hrefs = (items: readonly { href: string }[]) => items.map((item) => item.href);

describe('staffNav for /crm', () => {
  it('shows a closer the four destinations of the rail and the bar of four', () => {
    const nav = staffNav('crm', 'closer');
    expect(hrefs(nav.primary)).toEqual(['/crm', '/crm/contactos', '/crm/clientes', '/crm/comisiones']);
    // variant D «4»: Resumen leaves the bar (the brand and the sheet reach it); «Más» is the fourth tab
    expect(hrefs(nav.bar)).toEqual(['/crm/contactos', '/crm/clientes', '/crm/comisiones']);
    expect(hrefs(nav.sheet)).toEqual(['/crm', '/crm/importar', '/crm/ajustes']);
  });

  it('puts Resumen back in the bar with the variant of five', () => {
    expect(hrefs(staffNav('crm', 'closer', { bar: 5 }).bar)).toEqual([
      '/crm',
      '/crm/contactos',
      '/crm/clientes',
      '/crm/comisiones',
    ]);
    expect(hrefs(staffNav('crm', 'closer', { bar: 5 }).sheet)).toEqual(['/crm/importar', '/crm/ajustes']);
  });

  it('gives only the admin the way into /admin', () => {
    const everything = (nav: ReturnType<typeof staffNav>) => hrefs([...nav.primary, ...nav.more, ...nav.bar, ...nav.sheet]);
    expect(everything(staffNav('crm', 'closer')).some((href) => href.startsWith('/admin'))).toBe(false);
    expect(hrefs(staffNav('crm', 'admin').more)).toContain('/admin');
  });
});

describe('staffNav for /admin', () => {
  it('has Resumen, Clientes, Equipo and the rest under «Más»', () => {
    const nav = staffNav('admin', 'admin');
    expect(hrefs(nav.primary)).toEqual(['/admin', '/crm/clientes', '/admin/equipo']);
    expect(hrefs(nav.bar)).toEqual(['/admin', '/crm/clientes', '/admin/equipo']);
    expect(hrefs(nav.more)).toEqual(['/crm', '/admin/contenido', '/admin/notificaciones', '/crm/ajustes']);
    expect(hrefs(nav.sheet)).toEqual(hrefs(nav.more));
  });

  it('refuses to build the admin navigation for a closer', () => {
    expect(() => staffNav('admin', 'closer')).toThrow();
  });
});

describe('isCurrentStaffPath', () => {
  it('matches the zone roots exactly and the rest by prefix', () => {
    expect(isCurrentStaffPath('/crm', '/crm')).toBe(true);
    expect(isCurrentStaffPath('/crm/contactos', '/crm')).toBe(false);
    expect(isCurrentStaffPath('/admin', '/admin')).toBe(true);
    expect(isCurrentStaffPath('/admin/equipo', '/admin')).toBe(false);
    expect(isCurrentStaffPath('/crm/contactos', '/crm/contactos')).toBe(true);
    expect(isCurrentStaffPath('/crm/contactos/abc', '/crm/contactos')).toBe(true);
    expect(isCurrentStaffPath('/crm/contactos-viejos', '/crm/contactos')).toBe(false);
  });

  it('ignores a query string or hash on the item', () => {
    expect(isCurrentStaffPath('/crm/importar', '/crm/importar?tab=conflictos')).toBe(true);
  });
});

describe('initials', () => {
  it('takes the first letters of the first two words', () => {
    expect(initials('Carla Méndez')).toBe('CM');
    expect(initials('  jose  carlos  sánchez ')).toBe('JC');
    expect(initials('Jose')).toBe('J');
  });
  it('falls back to a dot when there is no name', () => {
    expect(initials('')).toBe('·');
    expect(initials(null)).toBe('·');
  });
});
