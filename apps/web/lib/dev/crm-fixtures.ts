import { contactListQuerySchema, CONTACTS_PAGE_SIZE } from '@josecoded/types';

import type { OmenStatus } from '@/lib/admin/queries';
import type { StaffRole } from '@/lib/auth/staff';
import type { ClientRecord, ContactDetail, ContactRecord, DraftRecord, InteractionRecord, LeadRecord, StoryRecord } from '@/lib/crm/contact-detail';
import type { ContactPage, ContactRow, Owner } from '@/lib/crm/contacts';
import type { CrmSummary } from '@/lib/crm/queries';
import type { AdminCounters, CloserCounters, TeamCounters } from '@josecoded/types';

// Invented data for the dev previews of /crm and /admin (`/dev/crm`): the same shapes the Supabase reads return,
// typed with the real types, so the real views render them as they would render the database. Nothing here is a
// real person: names are made up, emails end in `.test` and phones are in the `+34 600 000 xxx` range. Dates are
// relative to «now» so the overdue contacts stay overdue whenever the preview is opened.

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const at = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString();
/** A time of day, `days` from now: 10:00 Madrid-ish is close enough for a preview. */
const inDays = (days: number): string => at(days * DAY);

const ID = {
  jose: '00000000-0000-4000-8000-000000000001',
  marta: '00000000-0000-4000-8000-000000000002',
  inigo: '00000000-0000-4000-8000-000000000003',
  noelia: '00000000-0000-4000-8000-000000000004',
  lucia: '10000000-0000-4000-8000-000000000001',
  alvaro: '10000000-0000-4000-8000-000000000002',
  client: '20000000-0000-4000-8000-000000000001',
} as const;

/** The signed-in person of the previews, as `StaffShell` wants her for the foot of the rail. */
export const PREVIEW_IDENTITY: Record<StaffRole, { name: string; rate: number }> = {
  admin: { name: 'Jose Sánchez', rate: 0 },
  closer: { name: 'Marta Quintana', rate: 20 },
};

export const OWNERS: Owner[] = [
  { user_id: ID.jose, display_name: 'Jose Sánchez', role: 'admin', disabled: false, rate: 0 },
  { user_id: ID.marta, display_name: 'Marta Quintana', role: 'closer', disabled: false, rate: 20 },
  { user_id: ID.inigo, display_name: 'Íñigo Valdés', role: 'closer', disabled: false, rate: 15 },
  { user_id: ID.noelia, display_name: 'Noelia Ferrer', role: 'closer', disabled: true, rate: 15 },
];

// ---- K1 / C1 ---------------------------------------------------------------------------------------------------

const closerCounters: CloserCounters = {
  contacts_due: 4,
  leads_open: 7,
  stories_proposed: 2,
  commissions_pending: 3,
  commissions_approved_amount: 420,
  conflicts_pending: 2,
  imports_last: { id: '30000000-0000-4000-8000-000000000001', created: 38, updated: 6, skipped: 4, conflicts: 2, created_at: at(-2 * DAY) },
};

const team: TeamCounters = { team_contacts: 214, team_leads_won_month: 5, team_leads_open: 19 };

export const ADMIN_COUNTERS: AdminCounters = {
  leads_open: 19,
  contacts_due: 11,
  chat_unread: 3,
  agencies_replied: 2,
  comments_pending: 4,
  upgrades_pending: 1,
  rewards_pending: 2,
  commissions_pending: 6,
  imports_failed_24h: 0,
  import_conflicts_pending: 2,
  stories_proposed: 5,
  content_pending: 3,
  quotes_draft: 2,
};

export const PREVIEW_OMEN: OmenStatus = 'online';

export function previewSummary(role: StaffRole): CrmSummary {
  return { role, my: closerCounters, team, admin: role === 'admin' ? ADMIN_COUNTERS : null };
}

// ---- K2 --------------------------------------------------------------------------------------------------------

const row = (
  id: string,
  display_name: string,
  kind: ContactRow['kind'],
  status: string,
  organization: string | null,
  next_action: string | null,
  next_action_at: string | null,
  last_interaction_at: string | null,
  owner_id: string | null,
): ContactRow => ({ id, display_name, kind, status, organization, next_action, next_action_at, last_interaction_at, owner_id });

/** Rows as the database holds them. A closer's copy never carries the owner (`contactRows`). */
const ROWS: ContactRow[] = [
  row(ID.lucia, 'Lucía Ferrándiz', 'lead', 'proposal_sent', 'Panadería Ferrándiz', 'Llamar para cerrar el pack', inDays(-6), inDays(-8), ID.marta),
  row('10000000-0000-4000-8000-000000000003', 'Rubén Calatayud', 'lead', 'contacted', 'Calatayud Fisioterapia', 'Enviar propuesta con dos opciones', inDays(-3), inDays(-5), ID.inigo),
  row('10000000-0000-4000-8000-000000000004', 'Pilar Montoya', 'lead', 'new', null, 'Primer contacto por WhatsApp', inDays(-1), inDays(-1), null),
  row('10000000-0000-4000-8000-000000000005', 'Gonzalo Arrieta', 'agency', 'replied', 'Estudio Arrieta & Rey', 'Proponer videollamada de 20 minutos', inDays(-0.2), inDays(-2), ID.marta),
  row('10000000-0000-4000-8000-000000000006', 'Sofía Beltrán', 'lead', 'proposal_sent', 'Clínica Dental Beltrán', 'Preguntar si ha visto la propuesta', inDays(0.3), inDays(-4), ID.marta),
  row(ID.alvaro, 'Álvaro Beltrán', 'client', 'active_client', 'Beltrán Reformas', 'Revisar la fase de diseño con él', inDays(2), inDays(-1), ID.marta),
  row('10000000-0000-4000-8000-000000000007', 'Carmen Ortuño', 'recruiter', 'interview', 'Talentia Selección', 'Confirmar hora de la entrevista', inDays(1), inDays(-3), ID.jose),
  row('10000000-0000-4000-8000-000000000008', 'Hugo Sepúlveda', 'agency', 'invited', 'Sepúlveda Digital', 'Esperar respuesta a la invitación', inDays(5), inDays(-6), ID.inigo),
  row('10000000-0000-4000-8000-000000000009', 'Irene Mascaró', 'lead', 'contacted', 'Mascaró Estudio de Yoga', 'Mandar ejemplos de webs de estudios', inDays(3), inDays(-2), null),
  row('10000000-0000-4000-8000-00000000000a', 'Tomás Villalba', 'other', 'active', null, null, null, inDays(-12), ID.jose),
  row('10000000-0000-4000-8000-00000000000b', 'Beatriz Cuenca', 'lead', 'lost', 'Cuenca Asesores', null, null, inDays(-20), ID.inigo),
  row('10000000-0000-4000-8000-00000000000c', 'Nuria Esteve', 'agency', 'pending', 'Esteve y Asociados', 'Enviar invitación de LinkedIn', inDays(-9), null, ID.marta),
];

export function contactRows(role: StaffRole): ContactRow[] {
  const mine = role === 'admin' ? ROWS : ROWS.filter((r) => r.owner_id === ID.marta);
  // overdue first, then the next due, then those without a next action (as `next_action_at asc nulls last`)
  return mine
    .map((r) => (role === 'admin' ? r : { ...r, owner_id: null }))
    .sort((a, b) => (a.next_action_at ?? '9999').localeCompare(b.next_action_at ?? '9999'));
}

export function previewContactPage(role: StaffRole): ContactPage {
  const rows = contactRows(role);
  return {
    rows,
    total: rows.length,
    page: 1,
    pageSize: CONTACTS_PAGE_SIZE,
    owners: role === 'admin' ? OWNERS : null,
    query: contactListQuerySchema.parse({}),
  };
}

/** The oldest overdue contacts: the short list under the figure of K1. */
export function previewOverdue(role: StaffRole): ContactRow[] {
  const now = new Date().toISOString();
  return contactRows(role)
    .filter((r) => r.next_action_at !== null && r.next_action_at <= now)
    .slice(0, 5);
}

// ---- K3 --------------------------------------------------------------------------------------------------------

const interaction = (
  id: string,
  kind: InteractionRecord['kind'],
  actor: InteractionRecord['actor'],
  occurred_at: string,
  extra: Partial<InteractionRecord> = {},
): InteractionRecord => ({
  id: `40000000-0000-4000-8000-${id.padStart(12, '0')}`,
  kind,
  channel: null,
  direction: 'internal',
  subject: null,
  body: null,
  occurred_at,
  actor,
  lead_id: null,
  payload: {},
  ...extra,
});

const contactBase = {
  linkedin_url: null,
  locale: 'es',
  notion_url: null,
  archived_at: null,
  tags: [],
} as const;

const leadContact = (role: StaffRole): ContactRecord => ({
  ...contactBase,
  id: ID.lucia,
  kind: 'lead',
  status: 'proposal_sent',
  display_name: 'Lucía Ferrándiz',
  role: 'Propietaria',
  email: 'lucia.ferrandiz@panaderia-ferrandiz.test',
  phone: '+34 600 000 101',
  linkedin_url: 'https://www.linkedin.com/in/lucia-ferrandiz-test',
  next_action: 'Llamar para cerrar el pack',
  next_action_at: inDays(-6),
  owner_note: 'Quiere tienda online para el obrador. Duda entre dos packs; le preocupa el mantenimiento.',
  source: 'web_proposal',
  tags: ['obrador', 'tienda online'],
  owner_id: role === 'admin' ? ID.marta : null,
  created_at: inDays(-21),
  last_interaction_at: inDays(-8),
  organization: { name: 'Panadería Ferrándiz', website: 'https://panaderia-ferrandiz.test', city: 'Valencia' },
});

const openLead: LeadRecord = {
  id: '50000000-0000-4000-8000-000000000001',
  status: 'open',
  source: 'web_proposal',
  pack_code: 'P2',
  pack_option: 'tienda',
  amount: null,
  paid_at: null,
  message: 'Hola, quiero vender el pan y los dulces por encargo y que la gente reserve para recoger.',
  affiliate_code: null,
  created_at: inDays(-21),
  created_by: null,
};

const leadTimeline: InteractionRecord[] = [
  interaction('7', 'note', 'closer', inDays(-8), { body: 'Hablamos 15 minutos. Le gusta la opción con reservas; quiere ver el precio con mantenimiento.' }),
  interaction('6', 'status_change', 'closer', inDays(-9), { payload: { from: 'contacted', to: 'proposal_sent' } }),
  interaction('5', 'message_sent', 'closer', inDays(-9), { channel: 'email', direction: 'out', subject: 'Tu propuesta de tienda online', body: 'Te adjunto las dos opciones con precios cerrados.' }),
  interaction('4', 'call', 'closer', inDays(-14), { channel: 'other', direction: 'out', body: 'Primera llamada: necesidades y plazos.' }),
  interaction('3', 'status_change', 'closer', inDays(-14), { payload: { from: 'new', to: 'contacted' } }),
  interaction('2', 'message_received', 'contact', inDays(-21), { channel: 'web_proposal', direction: 'in', subject: 'Propuesta', body: 'Quiero vender el pan por encargo y que reserven para recoger.' }),
  interaction('1', 'lead_created', 'system', inDays(-21), { payload: { source: 'web_proposal', via: 'client' }, lead_id: openLead.id }),
];

const clientContact = (role: StaffRole): ContactRecord => ({
  ...contactBase,
  id: ID.alvaro,
  kind: 'client',
  status: 'active_client',
  display_name: 'Álvaro Beltrán',
  role: 'Gerente',
  email: 'alvaro@beltran-reformas.test',
  phone: '+34 600 000 102',
  next_action: 'Revisar la fase de diseño con él',
  next_action_at: inDays(2),
  owner_note: 'Cliente del pack de web a medida. Prefiere WhatsApp a las llamadas.',
  source: 'calcom',
  tags: ['reformas'],
  owner_id: role === 'admin' ? ID.marta : null,
  created_at: inDays(-60),
  last_interaction_at: inDays(-1),
  organization: { name: 'Beltrán Reformas', website: 'https://beltran-reformas.test', city: 'Alicante' },
});

const wonLead: LeadRecord = {
  ...openLead,
  id: '50000000-0000-4000-8000-000000000002',
  status: 'won',
  source: 'calcom',
  pack_code: 'P3',
  pack_option: null,
  amount: 1900,
  paid_at: inDays(-40),
  message: null,
  created_at: inDays(-60),
};

const clientRecord = (role: StaffRole): ClientRecord => ({
  id: ID.client,
  user_id: role === 'admin' ? '60000000-0000-4000-8000-000000000001' : null,
  invite_email: 'alvaro@beltran-reformas.test',
  pack_code: 'P3',
  pack_option: null,
  project_phase: 'design',
  has_access: true,
  starts_at: inDays(-38),
  delivered_at: null,
});

const stories: StoryRecord[] = [
  {
    id: '70000000-0000-4000-8000-000000000001',
    title: 'Pedir presupuesto desde la web',
    as_a: 'propietario de una vivienda',
    i_want: 'pedir un presupuesto con fotos de mi casa',
    so_that: 'no tener que llamar para empezar',
    acceptance_criteria: ['Se pueden adjuntar hasta 5 fotos', 'Llega un aviso por email al equipo'],
    status: 'proposed',
    created_at: inDays(-3),
  },
  {
    id: '70000000-0000-4000-8000-000000000002',
    title: 'Ver reformas terminadas',
    as_a: 'visitante',
    i_want: 'ver fotos de antes y después',
    so_that: 'fiarme del trabajo antes de escribir',
    acceptance_criteria: ['Galería con filtro por tipo de obra'],
    status: 'accepted',
    created_at: inDays(-12),
  },
];

const drafts: DraftRecord[] = [
  { id: '80000000-0000-4000-8000-000000000001', channel: 'whatsapp', subject: 'Seguimiento de diseño', status: 'draft', generated_by: 'ai', created_at: inDays(-1) },
];

const clientTimeline: InteractionRecord[] = [
  interaction('16', 'story_proposed', 'contact', inDays(-3), { body: 'Pedir presupuesto desde la web' }),
  interaction('15', 'note', 'closer', inDays(-1), { body: 'Le ha gustado la primera propuesta de portada. Pide cambiar el azul por uno más oscuro.' }),
  interaction('14', 'commission', 'system', inDays(-40), { payload: { percent: 20, amount: 380 } }),
  interaction('13', 'client_invited', 'closer', inDays(-39), {}),
  interaction('12', 'lead_won', 'jose', inDays(-40), { payload: { amount: 1900 }, lead_id: wonLead.id }),
  interaction('11', 'status_change', 'jose', inDays(-40), { payload: { from: 'proposal_sent', to: 'active_client' } }),
  interaction('10', 'meeting', 'closer', inDays(-52), { channel: 'calcom', body: 'Videollamada de 20 minutos: alcance, plazos y forma de pago.' }),
  interaction('9', 'lead_created', 'system', inDays(-60), { payload: { source: 'calcom', via: 'client' }, lead_id: wonLead.id }),
];

export type PreviewContact = 'lead' | 'client';

/** One contact with everything K3 shows, as the role would receive it (a closer gets no owner id nor the staff list). */
export function previewContactDetail(which: PreviewContact, role: StaffRole): ContactDetail {
  const owners = role === 'admin' ? OWNERS : null;
  return which === 'lead'
    ? { contact: leadContact(role), interactions: leadTimeline, leads: [openLead], client: null, stories: [], drafts: [], owners }
    : { contact: clientContact(role), interactions: clientTimeline, leads: [wonLead], client: clientRecord(role), stories, drafts, owners };
}
