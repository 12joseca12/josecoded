import type { StaffRole } from '@/lib/auth/staff';
import type { Href, IconName } from '@josecoded/types';

// Navigation of the staff zone (ref/crm README §3.1): one model for both shells, so the rail, the bottom
// bar and the «Más» sheet cannot drift. Pure data; `StaffShell` translates the labels and the client islands
// only mark the current one. The routes that are not built yet (contactos, clientes…) are linked all the same.

export type StaffZone = 'crm' | 'admin';

/** Keys under `crm.nav` in the messages. */
export type StaffNavId =
  | 'summary'
  | 'contacts'
  | 'clients'
  | 'commissions'
  | 'team'
  | 'import'
  | 'settings'
  | 'admin'
  | 'crm'
  | 'content'
  | 'notifications';

export interface StaffNavItem {
  id: StaffNavId;
  /** Spanish canonical path (these screens have no English slug). */
  href: Href;
  icon: IconName;
}

export interface StaffNavModel {
  /** The destinations of the rail, in order. */
  primary: readonly StaffNavItem[];
  /** The group «Más» of the rail. */
  more: readonly StaffNavItem[];
  /** The tabs of the bottom bar before the «Más» button. */
  bar: readonly StaffNavItem[];
  /** What the «Más» sheet lists: what the bar does not show. */
  sheet: readonly StaffNavItem[];
}

/**
 * README §4 D, provisional until Jose reviews the prototype: `4` keeps Resumen out of the bar (the brand
 * leads to it), `5` puts it in front. Changing it is one number.
 */
export const DEFAULT_BAR: 4 | 5 = 4;

const item = (id: StaffNavId, href: Href, icon: IconName): StaffNavItem => ({ id, href, icon });

const SUMMARY = item('summary', '/crm', 'house');
const CONTACTS = item('contacts', '/crm/contactos', 'users');
const CLIENTS = item('clients', '/crm/clientes', 'briefcase-business');
const COMMISSIONS = item('commissions', '/crm/comisiones', 'wallet');
const IMPORT = item('import', '/crm/importar', 'upload');
const SETTINGS = item('settings', '/crm/ajustes', 'settings');

export function staffNav(zone: StaffZone, role: StaffRole, options: { bar?: 4 | 5 } = {}): StaffNavModel {
  if (zone === 'admin') {
    if (role !== 'admin') throw new Error('the admin navigation is for the admin');
    const primary = [item('summary', '/admin', 'house'), CLIENTS, item('team', '/admin/equipo', 'shield-check')];
    const more = [
      item('crm', '/crm', 'users'),
      item('content', '/admin/contenido', 'layers'),
      item('notifications', '/admin/notificaciones', 'bell'),
      SETTINGS,
    ];
    return { primary, more, bar: primary, sheet: more };
  }

  const primary = [SUMMARY, CONTACTS, CLIENTS, COMMISSIONS];
  const more = [IMPORT, SETTINGS, ...(role === 'admin' ? [item('admin', '/admin', 'shield-check')] : [])];
  const bar = (options.bar ?? DEFAULT_BAR) === 5 ? primary : primary.filter((entry) => entry !== SUMMARY);
  return { primary, more, bar, sheet: [...primary.filter((entry) => !bar.includes(entry)), ...more] };
}

/**
 * The zone roots (`/crm`, `/admin`) are current only on themselves; any other destination also covers its
 * children (`/crm/contactos/<id>`). A query or hash on the item is ignored.
 */
export function isCurrentStaffPath(pathname: string, href: string): boolean {
  const target = href.split(/[?#]/)[0] ?? href;
  if (target === '/crm' || target === '/admin') return pathname === target;
  return pathname === target || pathname.startsWith(`${target}/`);
}

/** Letters of the avatar: the first of each of the first two words. */
export function initials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '·';
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase('es'))
    .join('');
}
