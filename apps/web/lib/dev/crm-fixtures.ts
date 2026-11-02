import { contactListQuerySchema, CONTACTS_PAGE_SIZE } from '@josecoded/types';

import { analyzeImport } from '@/lib/crm/import-analysis';

import type { OmenStatus } from '@/lib/admin/queries';
import type { StaffRole } from '@/lib/auth/staff';
import type { ClientAsset, ClientFile, ClientList, ClientStory, ClientTask } from '@/lib/crm/client-queries';
import type { ClientRow } from '@/lib/crm/clients';
import type { CommissionRecord } from '@/lib/crm/commissions';
import type {
  ClientRecord,
  ContactDetail,
  ContactRecord,
  DraftRecord,
  InteractionRecord,
  LeadRecord,
  StoryRecord,
} from '@/lib/crm/contact-detail';
import type { ContactPage, ContactRow, Owner } from '@/lib/crm/contacts';
import type {
  ConflictQueueData,
  ImportDone,
  ImportRecord,
  OwnConflict,
} from '@/lib/crm/import-types';
import type { CrmSummary } from '@/lib/crm/queries';
import type { SummaryExtras } from '@/lib/crm/summary-extras';
import type { TeamInvite, TeamMember } from '@/lib/team/team';
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
  imports_last: {
    id: '30000000-0000-4000-8000-000000000001',
    created: 38,
    updated: 6,
    skipped: 4,
    conflicts: 2,
    created_at: at(-2 * DAY),
  },
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
/** The preview says Omen was checked a minute ago, as the prototype does. */
export const previewOmenCheckedAt = (): Date => new Date(Date.now() - 60_000);

/** What K1 reads besides the counters; the closer's figures are her own share of the admin's. */
export function previewExtras(role: StaffRole): SummaryExtras {
  const admin = role === 'admin';
  return {
    leads: admin
      ? { new: 4, contacted: 7, proposal_sent: 5 }
      : { new: 1, contacted: 3, proposal_sent: 2 },
    commissions: admin
      ? { pending: { count: 2, amount: 248 }, approved: { count: 1, amount: 90 } }
      : { pending: { count: 1, amount: 140 }, approved: { count: 1, amount: 90 } },
    lastImport: {
      fileName: 'contactos-feria-octubre.csv',
      at: at(-1 * HOUR),
      created: 26,
      updated: 2,
      skipped: 1,
      author: admin ? 'Marta Quintana' : null,
    },
    nextStory: { clientId: ID.client, name: 'Beltrán Reformas' },
  };
}

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
  channel: ContactRow['channel'],
): ContactRow => ({
  id,
  display_name,
  kind,
  status,
  organization,
  next_action,
  next_action_at,
  last_interaction_at,
  owner_id,
  channel,
});

/** Rows as the database holds them. A closer's copy never carries the owner (`contactRows`). */
const ROWS: ContactRow[] = [
  row(
    ID.lucia,
    'Lucía Ferrándiz',
    'lead',
    'proposal_sent',
    'Panadería Ferrándiz',
    'Llamar para cerrar el pack',
    inDays(-6),
    inDays(-8),
    ID.marta,
    'whatsapp',
  ),
  row(
    '10000000-0000-4000-8000-000000000003',
    'Rubén Calatayud',
    'lead',
    'contacted',
    'Calatayud Fisioterapia',
    'Enviar propuesta con dos opciones',
    inDays(-3),
    inDays(-5),
    ID.inigo,
    'email',
  ),
  row(
    '10000000-0000-4000-8000-000000000004',
    'Pilar Montoya',
    'lead',
    'new',
    null,
    'Primer contacto por WhatsApp',
    inDays(-1),
    inDays(-1),
    null,
    'web_form',
  ),
  row(
    '10000000-0000-4000-8000-000000000005',
    'Gonzalo Arrieta',
    'agency',
    'replied',
    'Estudio Arrieta & Rey',
    'Proponer videollamada de 20 minutos',
    inDays(-0.2),
    inDays(-2),
    ID.marta,
    'linkedin_inmail',
  ),
  row(
    '10000000-0000-4000-8000-000000000006',
    'Sofía Beltrán',
    'lead',
    'proposal_sent',
    'Clínica Dental Beltrán',
    'Preguntar si ha visto la propuesta',
    inDays(0.3),
    inDays(-4),
    ID.marta,
    'email',
  ),
  row(
    ID.alvaro,
    'Álvaro Beltrán',
    'client',
    'active_client',
    'Beltrán Reformas',
    'Revisar la fase de diseño con él',
    inDays(2),
    inDays(-1),
    ID.marta,
    'whatsapp',
  ),
  row(
    '10000000-0000-4000-8000-000000000007',
    'Carmen Ortuño',
    'recruiter',
    'interview',
    'Talentia Selección',
    'Confirmar hora de la entrevista',
    inDays(1),
    inDays(-3),
    ID.jose,
    'email',
  ),
  row(
    '10000000-0000-4000-8000-000000000008',
    'Hugo Sepúlveda',
    'agency',
    'invited',
    'Sepúlveda Digital',
    'Esperar respuesta a la invitación',
    inDays(5),
    inDays(-6),
    ID.inigo,
    'linkedin_invite',
  ),
  row(
    '10000000-0000-4000-8000-000000000009',
    'Irene Mascaró',
    'lead',
    'contacted',
    'Mascaró Estudio de Yoga',
    'Mandar ejemplos de webs de estudios',
    inDays(3),
    inDays(-2),
    null,
    'email',
  ),
  row(
    '10000000-0000-4000-8000-00000000000a',
    'Tomás Villalba',
    'other',
    'active',
    null,
    null,
    null,
    inDays(-12),
    ID.jose,
    null,
  ),
  row(
    '10000000-0000-4000-8000-00000000000b',
    'Beatriz Cuenca',
    'lead',
    'lost',
    'Cuenca Asesores',
    null,
    null,
    inDays(-20),
    ID.inigo,
    'whatsapp',
  ),
  row(
    '10000000-0000-4000-8000-00000000000c',
    'Nuria Esteve',
    'agency',
    'pending',
    'Esteve y Asociados',
    'Enviar invitación de LinkedIn',
    inDays(-9),
    null,
    ID.marta,
    'linkedin_invite',
  ),
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
  owner_note:
    'Quiere tienda online para el obrador. Duda entre dos packs; le preocupa el mantenimiento.',
  source: 'web_proposal',
  tags: ['obrador', 'tienda online'],
  owner_id: role === 'admin' ? ID.marta : null,
  created_at: inDays(-21),
  last_interaction_at: inDays(-8),
  organization: {
    name: 'Panadería Ferrándiz',
    website: 'https://panaderia-ferrandiz.test',
    city: 'Valencia',
  },
});

const openLead: LeadRecord = {
  id: '50000000-0000-4000-8000-000000000001',
  status: 'open',
  source: 'web_proposal',
  pack_code: 'P2',
  pack_option: 'tienda',
  amount: null,
  paid_at: null,
  message:
    'Hola, quiero vender el pan y los dulces por encargo y que la gente reserve para recoger.',
  affiliate_code: null,
  created_at: inDays(-21),
  created_by: null,
};

const leadTimeline: InteractionRecord[] = [
  interaction('7', 'note', 'closer', inDays(-8), {
    body: 'Hablamos 15 minutos. Le gusta la opción con reservas; quiere ver el precio con mantenimiento.',
  }),
  interaction('6', 'status_change', 'closer', inDays(-9), {
    payload: { from: 'contacted', to: 'proposal_sent' },
  }),
  interaction('5', 'message_sent', 'closer', inDays(-9), {
    channel: 'email',
    direction: 'out',
    subject: 'Tu propuesta de tienda online',
    body: 'Te adjunto las dos opciones con precios cerrados.',
  }),
  interaction('4', 'call', 'closer', inDays(-14), {
    channel: 'other',
    direction: 'out',
    body: 'Primera llamada: necesidades y plazos.',
  }),
  interaction('3', 'status_change', 'closer', inDays(-14), {
    payload: { from: 'new', to: 'contacted' },
  }),
  interaction('2', 'message_received', 'contact', inDays(-21), {
    channel: 'web_proposal',
    direction: 'in',
    subject: 'Propuesta',
    body: 'Quiero vender el pan por encargo y que reserven para recoger.',
  }),
  interaction('1', 'lead_created', 'system', inDays(-21), {
    payload: { source: 'web_proposal', via: 'client' },
    lead_id: openLead.id,
  }),
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
  organization: {
    name: 'Beltrán Reformas',
    website: 'https://beltran-reformas.test',
    city: 'Alicante',
  },
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
  {
    id: '80000000-0000-4000-8000-000000000001',
    channel: 'whatsapp',
    subject: 'Seguimiento de diseño',
    status: 'draft',
    generated_by: 'ai',
    created_at: inDays(-1),
  },
];

const clientTimeline: InteractionRecord[] = [
  interaction('16', 'story_proposed', 'contact', inDays(-3), {
    body: 'Pedir presupuesto desde la web',
  }),
  interaction('15', 'note', 'closer', inDays(-1), {
    body: 'Le ha gustado la primera propuesta de portada. Pide cambiar el azul por uno más oscuro.',
  }),
  interaction('14', 'commission', 'system', inDays(-40), { payload: { percent: 20, amount: 380 } }),
  interaction('13', 'client_invited', 'closer', inDays(-39), {}),
  interaction('12', 'lead_won', 'jose', inDays(-40), {
    payload: { amount: 1900 },
    lead_id: wonLead.id,
  }),
  interaction('11', 'status_change', 'jose', inDays(-40), {
    payload: { from: 'proposal_sent', to: 'active_client' },
  }),
  interaction('10', 'meeting', 'closer', inDays(-52), {
    channel: 'calcom',
    body: 'Videollamada de 20 minutos: alcance, plazos y forma de pago.',
  }),
  interaction('9', 'lead_created', 'system', inDays(-60), {
    payload: { source: 'calcom', via: 'client' },
    lead_id: wonLead.id,
  }),
];

export type PreviewContact = 'lead' | 'client';

/** One contact with everything K3 shows, as the role would receive it (a closer gets no owner id nor the staff list). */
export function previewContactDetail(which: PreviewContact, role: StaffRole): ContactDetail {
  const owners = role === 'admin' ? OWNERS : null;
  return which === 'lead'
    ? {
        contact: leadContact(role),
        interactions: leadTimeline,
        leads: [openLead],
        client: null,
        stories: [],
        drafts: [],
        owners,
      }
    : {
        contact: clientContact(role),
        interactions: clientTimeline,
        leads: [wonLead],
        client: clientRecord(role),
        stories,
        drafts,
        owners,
      };
}

// ---- K4 --------------------------------------------------------------------------------------------------------

const IMPORT_HEAD = 'Nombre;E-mail;Móvil;LinkedIn;Empresa;Puesto;Ciudad;Tipo;Observaciones;Fuente';
const IMPORT_ROWS = [
  'Raúl Ibáñez;raul@albahaca.test;+34 600 000 431;linkedin.com/in/ejemplo-raul;Estudio Albahaca;Director creativo;Valencia;agencia;Conocido en la feria;Feria Digital Oct',
  'Silvia Rey;silvia@reyabogados.test;;;Rey Abogados;Socia;Madrid;lead;;Feria Digital Oct',
  'Pablo Ortiz;;+34 600 000 205;;Ortiz Climatización;Gerente;Sevilla;lead;;Feria Digital Oct',
  'Lidia Cano;lidia@canoyasociados.test;;;Cano y Asociados;Gerente;Bilbao;lead;;Feria Digital Oct',
  'Mario Esteban;mario@pixelmarea.test;;;Pixel Marea;Fundador;Vigo;agencia;;Feria Digital Oct',
  'Carmen Ruiz;;;;Ruiz Interiores;Directora;Málaga;lead;;Feria Digital Oct',
  'Jorge Lara;jorge@laradental.test;+34 600 000 377;;=HYPERLINK("http://x.test");Odontólogo;Murcia;lead;;Feria Digital Oct',
  'Eva Molina;eva@talentoplus.test;;;Talento Plus;Selección;Madrid;reclutador;;Feria Digital Oct',
];
const IMPORT_FILLER = Array.from(
  { length: 22 },
  (_, i) =>
    `Contacto ${i + 9};contacto${i + 9}@feria.test;;;Empresa ${i + 9};Gerente;Madrid;lead;;Feria Digital Oct`,
);
const IMPORT_TEXT = [IMPORT_HEAD, ...IMPORT_ROWS, ...IMPORT_FILLER].join('\n');
export const IMPORT_PREVIEW_FILE = 'contactos-feria-octubre.csv';

/** What the preview of step 2 returns for a 30-row file with one row that cannot be reached (the real analysis, not a mock). */
export const previewImportText = (): string => IMPORT_TEXT;
export const previewImportAnalysis = () => analyzeImport(IMPORT_TEXT, null);

export const previewImportResult = (): ImportDone => ({
  import_id: '30000000-0000-4000-8000-000000000002',
  created: 26,
  updated: 2,
  skipped: 1,
  conflicts: 1,
  errors: [{ row: 6, reason: 'invalid' }],
});

export function previewImportHistory(role: StaffRole): ImportRecord[] {
  const rows: ImportRecord[] = [
    {
      id: '30000000-0000-4000-8000-000000000002',
      fileName: IMPORT_PREVIEW_FILE,
      createdAt: at(-2 * HOUR),
      rows: 30,
      created: 26,
      updated: 2,
      skipped: 1,
      conflicts: 1,
      importer: 'Marta Quintana',
    },
    {
      id: '30000000-0000-4000-8000-000000000001',
      fileName: 'clinicas-madrid.csv',
      createdAt: at(-9 * DAY),
      rows: 58,
      created: 51,
      updated: 3,
      skipped: 2,
      conflicts: 0,
      importer: 'Marta Quintana',
    },
    {
      id: '30000000-0000-4000-8000-000000000003',
      fileName: 'agencias-levante.csv',
      createdAt: at(-13 * DAY),
      rows: 18,
      created: 18,
      updated: 0,
      skipped: 0,
      conflicts: 0,
      importer: 'Íñigo Valdés',
    },
  ];
  // a closer's history is her own (the database gives her nothing else) and carries nobody's name
  return role === 'admin'
    ? rows
    : rows
        .filter((row) => row.importer === 'Marta Quintana')
        .map((row) => ({ ...row, importer: null }));
}

export function previewOwnConflicts(role: StaffRole): OwnConflict[] {
  // the admin imports into his own portfolio, so his rows never clash; the closer sees hers with an outcome only
  return role === 'admin'
    ? []
    : [
        {
          id: '50000000-0000-4000-8000-000000000001',
          fileName: IMPORT_PREVIEW_FILE,
          line: 15,
          outcome: 'pending',
        },
        {
          id: '50000000-0000-4000-8000-000000000002',
          fileName: 'clinicas-madrid.csv',
          line: 4,
          outcome: 'assigned',
        },
        {
          id: '50000000-0000-4000-8000-000000000003',
          fileName: 'clinicas-madrid.csv',
          line: 31,
          outcome: 'not_assigned',
        },
      ];
}

export function previewConflictQueue(): ConflictQueueData {
  return {
    pending: [
      {
        id: '50000000-0000-4000-8000-000000000001',
        fileName: IMPORT_PREVIEW_FILE,
        line: 15,
        importerId: ID.marta,
        importerName: 'Marta Quintana',
        createdAt: at(-2 * HOUR),
        imported: {
          display_name: 'Raúl Ibáñez',
          email: 'raul@albahaca.test',
          phone: '+34 600 000 431',
          linkedin_url: null,
          organization: 'Estudio Albahaca',
          role: 'Director creativo',
          city: null,
          kind: 'agency',
          notes: null,
          tags: [],
        },
        existing: {
          id: '60000000-0000-4000-8000-000000000001',
          name: 'Raúl Ibáñez',
          kind: 'agency',
          status: 'inmail_sent',
          ownerName: 'Jose Sánchez',
          email: 'raul@albahaca.test',
          phone: null,
          linkedin_url: null,
          organization: 'Estudio Albahaca',
          role: null,
          lastInteractionAt: at(-5 * DAY),
        },
      },
    ],
    resolved: [
      {
        id: '50000000-0000-4000-8000-000000000002',
        fileName: 'clinicas-madrid.csv',
        line: 4,
        importerName: 'Marta Quintana',
        rowName: 'Clínica Sanz',
        rowKind: 'lead',
        resolution: 'assign_importer',
        ownerName: 'Marta Quintana',
        resolvedAt: at(-8 * DAY),
      },
      {
        id: '50000000-0000-4000-8000-000000000003',
        fileName: 'clinicas-madrid.csv',
        line: 31,
        importerName: 'Marta Quintana',
        rowName: 'Dental Arganzuela',
        rowKind: 'lead',
        resolution: 'assign_existing',
        ownerName: 'Íñigo Valdés',
        resolvedAt: at(-8 * DAY),
      },
    ],
  };
}

// ---- K5 --------------------------------------------------------------------------------------------------------

/**
 * The commissions of the previews. Marta (20 %) has one of each live state and an old one closed when her rate was
 * 8 %, so the row that explains «tasa actual» is there; Íñigo and Noelia (switched off, still owed) complete the admin's
 * list with the rejected one. The totals of the admin are 248, 90, 412 and 90 euros: those of ref/crm/comisiones.html.
 */
const commission = (
  id: string,
  closer: Owner,
  contactName: string,
  organization: string,
  packCode: string,
  packOption: string,
  closedDaysAgo: number,
  baseAmount: number,
  percent: number,
  status: CommissionRecord['status'],
  extra: Partial<CommissionRecord> = {},
): CommissionRecord => ({
  id,
  closerId: closer.user_id,
  closerName: closer.display_name,
  closerDisabled: closer.disabled,
  closerRate: closer.rate,
  contactName,
  organization,
  packCode,
  packOption,
  closedAt: at(-closedDaysAgo * DAY),
  baseAmount,
  percent,
  amount: Math.round(baseAmount * percent) / 100,
  status,
  approvedAt: null,
  paidAt: null,
  paidNote: null,
  rejectedReason: null,
  ...extra,
});

const [, MARTA, INIGO, NOELIA] = OWNERS as [Owner, Owner, Owner, Owner];

const COMMISSIONS: CommissionRecord[] = [
  commission('50000000-0000-4000-8000-000000000001', MARTA, 'Marina Soler', 'Clínica Dental Soler', 'P2', 'Pedidos / reservas', 2, 700, 20, 'pending'),
  commission('50000000-0000-4000-8000-000000000002', INIGO, 'Hugo Navarro', 'Taller Navarro', 'P1', 'Web básica', 5, 720, 15, 'pending'),
  commission('50000000-0000-4000-8000-000000000003', MARTA, 'Laura Campos', 'Fisio Campos', 'P1', 'Web básica', 13, 450, 20, 'approved', { approvedAt: at(-10 * DAY) }),
  commission('50000000-0000-4000-8000-000000000004', MARTA, 'Ana Ruiz', 'Panadería La Espiga', 'P2', 'Pedidos / reservas', 31, 1400, 8, 'paid', { approvedAt: at(-24 * DAY), paidAt: at(-18 * DAY), paidNote: 'Transferencia' }),
  commission('50000000-0000-4000-8000-000000000005', INIGO, 'Ramón Peña', 'Cooperativa Olivar Alto', 'P3', 'Gestión', 38, 2000, 15, 'paid', { approvedAt: at(-30 * DAY), paidAt: at(-23 * DAY), paidNote: 'Transferencia' }),
  commission('50000000-0000-4000-8000-000000000006', NOELIA, 'Óscar Prieto', 'Prieto Reformas', 'P1', 'Web básica', 51, 600, 15, 'rejected', { rejectedReason: 'Cobro devuelto por el banco' }),
];

/** What `staff_commissions()` returns: a closer her own rows, the admin all of them. */
export function previewCommissions(role: StaffRole): CommissionRecord[] {
  return role === 'admin' ? COMMISSIONS : COMMISSIONS.filter((row) => row.closerId === MARTA.user_id);
}

// ---- K6 --------------------------------------------------------------------------------------------------------

const clientRow = (
  n: number,
  owner: Owner,
  name: string,
  organization: string,
  packCode: string,
  packOption: string,
  phase: ClientRow['phase'],
  access: ClientRow['access'],
  storiesPending: number,
): ClientRow => ({
  id: `60000000-0000-4000-8000-00000000000${n}`,
  contactId: `60000000-0000-4000-8000-00000000010${n}`,
  name,
  organization,
  email: `cliente${n}@ejemplo.test`,
  packCode,
  packOption,
  phase,
  access,
  ownerId: owner.user_id,
  storiesPending,
});

const CLIENT_ROWS: ClientRow[] = [
  clientRow(1, MARTA, 'Ana Ruiz', 'Panadería La Espiga', 'P2', 'Pedidos / reservas', 'build', { state: 'active' }, 1),
  clientRow(2, MARTA, 'Laura Campos', 'Fisio Campos', 'P1', 'Web básica', 'delivered', { state: 'none' }, 1),
  clientRow(3, INIGO, 'Ramón Peña', 'Cooperativa Olivar Alto', 'P3', 'Gestión', 'design', { state: 'invited', at: inDays(-5) }, 0),
  clientRow(4, INIGO, 'Martín Vega', 'Vega Fontanería', 'P1', 'Web básica', 'review', { state: 'active' }, 2),
  clientRow(5, OWNERS[0] as Owner, 'Beatriz Soto', 'Academia Soto', 'P5', 'App móvil', 'kickoff', { state: 'none' }, 0),
  clientRow(6, MARTA, 'Óscar Prieto', 'Prieto Reformas', 'P1', 'Web básica', 'maintenance', { state: 'active' }, 0),
];

/** What `staff_clients()` and the reads around it return: a closer her own clients, the admin all of them with the staff. */
export function previewClientList(role: StaffRole): ClientList {
  return role === 'admin'
    ? { rows: CLIENT_ROWS, owners: OWNERS }
    : { rows: CLIENT_ROWS.filter((row) => row.ownerId === MARTA.user_id).map((row) => ({ ...row, ownerId: null })), owners: null };
}

const story = (
  n: number,
  status: ClientStory['status'],
  title: string,
  as_a: string,
  i_want: string,
  so_that: string,
  acceptance_criteria: string[],
  days: number,
  extra: Partial<ClientStory> = {},
): ClientStory => ({
  id: `70000000-0000-4000-8000-00000000010${n}`,
  title,
  as_a,
  i_want,
  so_that,
  acceptance_criteria,
  status,
  created_at: inDays(-days),
  estimate_hours: null,
  estimate_amount: null,
  estimate_note: null,
  decided_at: null,
  task_id: null,
  ...extra,
});

const TASK_ID = '71000000-0000-4000-8000-000000000003';

/** Ana's stories, one in each state: the sheet of the decision is opened from the first one. */
export const CLIENT_STORIES: ClientStory[] = [
  story(1, 'proposed', 'Reservar encargos para recoger', 'cliente habitual de la panadería', 'reservar una tarta o un pan especial para un día y una hora', 'recogerlo sin esperar cola', ['Elijo producto, día y franja de recogida', 'Solo veo franjas con hueco', 'Recibo la confirmación por correo', 'La panadería ve la reserva en su panel'], 3),
  story(2, 'accepted', 'Aviso cuando el pedido esté listo', 'cliente que encarga por la web', 'recibir un aviso cuando mi pedido esté listo', 'no ir antes de tiempo', ['Aviso por correo al marcarlo listo', 'Texto con hora de recogida'], 11, { estimate_hours: 6, estimate_amount: 240, estimate_note: 'Va con el módulo de pedidos.', decided_at: inDays(-9) }),
  story(3, 'converted', 'Ocultar productos agotados', 'dueña de la panadería', 'marcar un producto como agotado', 'que no me lo pidan', ['Un interruptor por producto', 'Se oculta en la carta al momento'], 18, { estimate_hours: 2, decided_at: inDays(-16), task_id: TASK_ID }),
  story(4, 'rejected', 'Cambiar la tipografía de la carta', 'dueña de la panadería', 'otra tipografía en la carta', 'que se parezca a mi letrero', ['Misma letra que el letrero'], 23, { estimate_note: 'Queda fuera del pack; lo vemos en una ampliación de diseño.', decided_at: inDays(-21) }),
];

const CLIENT_TASKS: ClientTask[] = [
  { id: '71000000-0000-4000-8000-000000000001', title: 'Carta de productos con fotos', status: 'done' },
  { id: '71000000-0000-4000-8000-000000000002', title: 'Pagos con Bizum en la recogida', status: 'in_progress' },
  { id: '71000000-0000-4000-8000-000000000004', title: 'Pedidos para recoger', status: 'in_progress' },
  { id: TASK_ID, title: 'Ocultar agotados en la carta', status: 'pending' },
  { id: '71000000-0000-4000-8000-000000000005', title: 'Textos legales', status: 'done' },
];

const CLIENT_ASSETS: ClientAsset[] = [
  { id: '72000000-0000-4000-8000-000000000001', name: 'logo-la-espiga.svg', sizeBytes: 12 * 1024 },
  { id: '72000000-0000-4000-8000-000000000002', name: 'fotos-productos.zip', sizeBytes: 18 * 1024 * 1024 },
  { id: '72000000-0000-4000-8000-000000000003', name: 'textos-carta.docx', sizeBytes: 40 * 1024 },
];

/**
 * The file of Ana (client 1) with everything she has, or, with `empty`, the one of Laura (client 2, not invited yet):
 * the empty states and the «Habilitar acceso» button. The material only for the admin, the owner only for the admin.
 */
export function previewClientFile(role: StaffRole, empty = false): ClientFile {
  const { rows } = previewClientList(role);
  return {
    client: rows[empty ? 1 : 0] as ClientRow,
    owner: role === 'admin' ? MARTA : null,
    tasks: empty ? [] : CLIENT_TASKS,
    stories: empty ? [] : CLIENT_STORIES,
    assets: role === 'admin' ? (empty ? [] : CLIENT_ASSETS) : null,
  };
}

// ---- D1 · Team -------------------------------------------------------------------------------------------------

const portfolio = (all: number) => ({ all });

/** The admin, three closers (one without Telegram, one who has not logged in yet, one deactivated) and two invitations (one expired). */
export function previewTeam(): { members: TeamMember[]; invites: TeamInvite[] } {
  const member = (id: string, name: string, email: string, rest: Partial<TeamMember>): TeamMember => ({
    id,
    name,
    email,
    role: 'closer',
    disabled: false,
    rate: 10,
    telegram: false,
    totp: true,
    portfolio: portfolio(0),
    pendingCount: 0,
    pendingAmount: 0,
    ...rest,
  });
  return {
    members: [
      member(ID.jose, 'Jose Sánchez', 'admin@josecoded.test', { role: 'admin', rate: null, telegram: true, portfolio: portfolio(61) }),
      member(ID.marta, 'Marta Quintana', 'marta@correo.test', { rate: 20, telegram: true, portfolio: portfolio(34), pendingCount: 1, pendingAmount: 140 }),
      member(ID.inigo, 'Íñigo Valdés', 'inigo@correo.test', { rate: 15, portfolio: portfolio(29), pendingCount: 2, pendingAmount: 108 }),
      member('00000000-0000-4000-8000-000000000005', 'Lucía Prado', 'lucia@correo.test', { totp: false }),
      member(ID.noelia, 'Noelia Ferrer', 'noelia@correo.test', { rate: 15, disabled: true, portfolio: portfolio(4) }),
    ],
    invites: [
      { id: '30000000-0000-4000-8000-000000000001', email: 'clara.nieto@correo.test', role: 'closer', rate: 10, expiresAt: at(5 * DAY) },
      { id: '30000000-0000-4000-8000-000000000002', email: 'martin.f@correo.test', role: 'closer', rate: 12, expiresAt: at(-8 * DAY) },
    ],
  };
}
