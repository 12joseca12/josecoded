import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { AreaGrid } from '@/components/area/area-card';
import { renderIntl } from '@/tests/helpers/render-intl';
import { serverIntlMock } from '@/tests/helpers/server-intl';

vi.mock('next-intl/server', () => serverIntlMock);
vi.mock('@/lib/env', () => ({
  env: { client: { NEXT_PUBLIC_WHATSAPP_NUMBER: '34600000000', NEXT_PUBLIC_CAL_LINK: 'josecoded/20min' } },
}));

import { BlogFirst } from './blog-first';
import { BusinessFirst } from './business-first';
import { CompanyFirst } from './company-first';
import { ContactStrip } from './contact-strip';
import { NeutralHome } from './neutral-home';
import { ProjectSummary } from './project-summary';
import { ProposalSummary } from './proposal-summary';
import { ReferralFirst } from './referral-first';

const client = {
  id: 'c1',
  pack_code: 'P2',
  pack_option: null,
  project_phase: 'build' as const,
  starts_at: '2026-10-01',
  delivered_at: null,
  created_at: '2026-10-01T00:00:00Z',
};
const tasks = [
  { id: 't1', title: 'Send the logo', description: null, status: 'done' as const, sort: 1, due_at: null },
  { id: 't2', title: 'Review the design', description: null, status: 'pending' as const, sort: 2, due_at: null },
];
const news = [
  { id: 'n1', task_id: 't2', author_user_id: 'jose', body: 'Design ready for review', created_at: '2026-10-20T10:00:00Z' },
  { id: 'n2', task_id: null, author_user_id: 'me', body: 'Thanks!', created_at: '2026-10-21T10:00:00Z' },
];

async function view(blocks: Promise<React.ReactNode>[], locale: 'es' | 'en' = 'es') {
  const resolved = await Promise.all(blocks);
  return renderIntl(<AreaGrid>{resolved}</AreaGrid>, locale);
}

describe('area home variants', () => {
  it('client: marks the current phase, counts what waits for the client and labels who wrote each comment', async () => {
    const { container } = await view([
      ProjectSummary({ locale: 'es', userId: 'me', client, tasks, news }),
      ContactStrip({ locale: 'es' }),
    ]);
    expect(screen.getByText('Fase 3 de 6')).toBeTruthy();
    expect(screen.getByText('Construcción').closest('li')?.getAttribute('aria-current')).toBe('step');
    expect(screen.getByText('Tienes 1 tarea esperándote')).toBeTruthy();
    expect(screen.getByText(/Review the design · Jose el/)).toBeTruthy();
    expect(screen.getByText(/^Tú el/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ver tareas' }).getAttribute('href')).toBe('/area-clientes/tareas');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('client in English uses the English path and plural', async () => {
    await view([ProjectSummary({ locale: 'en', userId: 'me', client, tasks, news })], 'en');
    expect(screen.getByText('You have 1 task waiting')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'See tasks' }).getAttribute('href')).toBe('/en/client-area/tasks');
  });

  it('proposal: pack, from price, and the state of the lead', async () => {
    const { container } = await view([
      ProposalSummary({ locale: 'es', lead: { pack_code: 'P2', pack_option: null, price_from: 1400, status: 'open', created_at: '2026-10-05T00:00:00Z' } }),
    ]);
    expect(screen.getByText('Desde 1.400 €')).toBeTruthy();
    expect(screen.getByText(/Estado: En estudio/)).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('origin variants put their first block forward and every one keeps the contact strip', async () => {
    const { container } = await view([
      ReferralFirst({ locale: 'es' }),
      BusinessFirst({ locale: 'es' }),
      CompanyFirst({ locale: 'es' }),
      BlogFirst({ locale: 'es' }),
      NeutralHome({ locale: 'es' }),
      ContactStrip({ locale: 'es' }),
    ]);
    expect(screen.getByRole('link', { name: 'Conseguir mi enlace' }).getAttribute('href')).toBe('/area-clientes/recomiendame');
    expect(screen.getByRole('link', { name: 'Pedir propuesta' }).getAttribute('href')).toBe('/propuesta');
    expect(screen.getAllByRole('link', { name: 'Reservar 20 min' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Escribir por WhatsApp' })[0]?.getAttribute('href')).toBe('https://wa.me/34600000000');
    // every pack of pricing.json with its price
    expect(screen.getByText(/desde 900 €/)).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });
});
