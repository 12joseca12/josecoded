import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { UpgradeForm } from './upgrade-form';

const labels = {
  packLegend: 'Move to a higher plan',
  packNone: 'No plan change',
  extrasLegend: 'Extras',
  extraMonthly: 'a month',
  total: 'Upgrade price',
  totalHelp: 'List difference',
  nothing: 'Pick something',
  noOptions: 'Nothing available',
  submit: 'Send request',
  form: 'Upgrade request',
};
const action = vi.fn(async () => ({ status: 'ok' as const }));

describe('UpgradeForm', () => {
  it('a P2 client choosing P3 sees 1.100 € (list difference) and cannot pick a lower or the same pack', async () => {
    const { container } = render(<UpgradeForm currentPack="P2" locale="es" action={action} labels={labels} />);
    expect(screen.getByText('Pick something')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: /P3/ }));
    expect(screen.getByText('1.100 €')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: /P1|P2/ })).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('adds the extras at list price to the pack difference', () => {
    render(<UpgradeForm currentPack="P2" locale="es" action={action} labels={labels} />);
    fireEvent.click(screen.getByRole('radio', { name: /P3/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^GEO/ }));
    expect(screen.getByText('1.400 €')).toBeTruthy(); // 1100 + 300
  });

  it('prices extras alone and drops the price when everything is unchecked', () => {
    render(<UpgradeForm currentPack="P2" locale="en" action={action} labels={labels} />);
    const seo = screen.getByRole('checkbox', { name: /SEO básico/ });
    fireEvent.click(seo);
    expect(screen.getByText('€250')).toBeTruthy();
    fireEvent.click(seo);
    expect(screen.getByText('Pick something')).toBeTruthy();
  });

  it('does not offer extras the client already has, nor a higher pack to the highest one', () => {
    render(<UpgradeForm currentPack="P4" ownedExtras={['seo_basic']} locale="es" action={action} labels={labels} />);
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByRole('checkbox', { name: /SEO básico/ })).toBeNull();
    expect(screen.getByRole('checkbox', { name: /SEO completo/ })).toBeTruthy();
  });

  it('says so when there is nothing to offer', () => {
    const everything = ['seo_basic', 'seo_full', 'geo', 'security_audit', 'maintenance_basic', 'maintenance_extended'];
    render(<UpgradeForm currentPack="P4" ownedExtras={everything} locale="es" action={action} labels={labels} />);
    expect(screen.getByText('Nothing available')).toBeTruthy();
  });

  it('the list price used on screen is the one the seed stores in the database (P3 − P2 = 1100)', () => {
    // supabase/seed/seed.sql: P2 1400, P3 2500
    render(<UpgradeForm currentPack="P2" locale="es" action={action} labels={labels} />);
    fireEvent.click(screen.getByRole('radio', { name: /P3/ }));
    expect(screen.getByText('1.100 €')).toBeTruthy();
  });
});
