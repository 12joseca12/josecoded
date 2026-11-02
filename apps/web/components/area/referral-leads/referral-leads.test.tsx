import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';
import { serverIntlMock } from '@/tests/helpers/server-intl';

vi.mock('next-intl/server', () => serverIntlMock);

import { RewardsList } from '../rewards-list';
import { ReferralLeads } from './referral-leads';

describe('referral lists', () => {
  it('lists referred leads by pack, state and date, with no contact field', async () => {
    const { container } = renderIntl(
      await ReferralLeads({
        locale: 'es',
        leads: [{ lead_id: 'l1', created_at: '2026-10-05T10:00:00Z', status: 'won', pack_code: 'P2', reward_status: 'pending' }],
      }),
    );
    expect(screen.getByText(/^Contratado · /)).toBeTruthy();
    expect(screen.getByText('P2 · Pedidos / reservas')).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the empty states', async () => {
    renderIntl(await ReferralLeads({ locale: 'es', leads: [] }));
    expect(screen.getByText('Aún no hay recomendaciones')).toBeTruthy();
    renderIntl(await RewardsList({ locale: 'es', rewards: [] }));
    expect(screen.getByText('Aún no hay recompensas')).toBeTruthy();
  });

  it('rewards: months of maintenance or euros, pending or paid, in words', async () => {
    const { container } = renderIntl(
      await RewardsList({
        locale: 'es',
        rewards: [
          { id: 'r1', type: 'maintenance_months', amount: 3, status: 'pending', paid_at: null, created_at: '2026-10-05T10:00:00Z' },
          { id: 'r2', type: 'percent', amount: 280, status: 'paid', paid_at: '2026-10-20T10:00:00Z', created_at: '2026-10-05T10:00:00Z' },
        ],
      }),
    );
    expect(screen.getByText('3 meses de mantenimiento')).toBeTruthy();
    expect(screen.getByText('280 €')).toBeTruthy();
    expect(screen.getByText(/^Pendiente · /)).toBeTruthy();
    expect(screen.getByText(/^Abonada · /)).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });
});
