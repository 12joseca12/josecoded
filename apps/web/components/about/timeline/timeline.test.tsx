import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Timeline } from '.';

describe('Timeline', () => {
  it('lists only entries with a real date, oldest first', () => {
    render(
      <Timeline
        locale="es"
        entries={[
          { id: 'a', label: 'josecoded v2', date: '2026-09' },
          { id: 'b', label: '3catinfo', date: '{{DATO: año}}' },
          { id: 'c', label: 'Primer proyecto', date: '2026-02' },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem').filter((item) => item.querySelector('time'));
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toMatch(/Primer proyecto/);
    expect(items[1]?.textContent).toMatch(/josecoded v2/);
    expect(screen.getAllByRole('listitem').map((item) => item.textContent).join(' ')).not.toMatch(/2026-09/);
  });

  it('renders nothing when no entry has a date and pending markers are hidden', () => {
    const { container } = render(<Timeline locale="en" entries={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
