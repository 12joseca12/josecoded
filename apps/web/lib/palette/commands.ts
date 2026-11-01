import type { SectionAvailability } from '@/lib/content/sections';
import type { Href, IconName } from '@josecoded/types';

/** Which hint a command shows next to its label: the format of a file, a starting price, a rate. */
export type CommandHint = 'pdf' | 'from' | 'perHour';

export interface CommandSpec {
  id: CommandId;
  group: 'goTo' | 'actions';
  icon: IconName;
  href: Href;
  /** The command exists only while that section has content (Lab, Blog). */
  need?: 'lab' | 'blog';
  hint?: CommandHint;
}

export const COMMAND_IDS = [
  'about',
  'services',
  'projects',
  'lab',
  'blog',
  'partners',
  'packs',
  'hourly',
  'proposal',
  'cv',
  'book',
  'whatsapp',
  'contact',
  'chat',
  'login',
] as const;

export type CommandId = (typeof COMMAND_IDS)[number];

/**
 * The commands of ⌘K (home-v7 README §6.5, spec v2.0), in the order they are listed. Labels, hints
 * and keywords are in `messages` (`nav.*`, `actions.*`, `palette.*`); the destinations that are
 * not a page of this site (the call, WhatsApp) are filled in by the component that builds the list
 * from the public variables. «Descargar CV» goes to the hiring route of Services, where the CV is.
 */
export const COMMAND_SPECS: readonly CommandSpec[] = [
  { id: 'about', group: 'goTo', icon: 'user', href: '/sobre-mi' },
  { id: 'services', group: 'goTo', icon: 'route', href: '/servicios' },
  { id: 'projects', group: 'goTo', icon: 'layout-grid', href: '/proyectos' },
  { id: 'lab', group: 'goTo', icon: 'flask-conical', href: '/lab', need: 'lab' },
  { id: 'blog', group: 'goTo', icon: 'book-open', href: '/blog', need: 'blog' },
  { id: 'partners', group: 'goTo', icon: 'handshake', href: '/partners' },
  { id: 'packs', group: 'actions', icon: 'package', href: '/servicios#packs', hint: 'from' },
  { id: 'hourly', group: 'actions', icon: 'clock', href: '/servicios#por-hora', hint: 'perHour' },
  { id: 'proposal', group: 'actions', icon: 'sparkles', href: '/propuesta' },
  { id: 'cv', group: 'actions', icon: 'download', href: '/servicios#contratacion', hint: 'pdf' },
  { id: 'book', group: 'actions', icon: 'calendar', href: '/servicios#por-hora' },
  { id: 'whatsapp', group: 'actions', icon: 'message-circle', href: '/contacto' },
  { id: 'contact', group: 'actions', icon: 'mail', href: '/contacto' },
  { id: 'chat', group: 'actions', icon: 'message-square', href: '/chat' },
  { id: 'login', group: 'actions', icon: 'log-in', href: '/auth/login' },
];

/** The commands whose section exists: Lab and Blog drop out when they have no content. */
export function availableCommands(
  availability: SectionAvailability,
  specs: readonly CommandSpec[] = COMMAND_SPECS,
): CommandSpec[] {
  return specs.filter((spec) => (spec.need ? availability[spec.need] : true));
}
