import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Toc } from '.';

describe('Toc', () => {
  const items = [
    { id: 'responsable', label: 'Responsable' },
    { id: 'derechos', label: 'Derechos' },
  ];

  it('lists a link to the anchor of each section, in order', () => {
    render(<Toc label="Índice" items={items} />);
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#responsable', '#derechos']);
    expect(screen.getByRole('navigation', { name: 'Índice' })).toBeTruthy();
  });

  it('renders nothing without sections and has no axe violations', async () => {
    expect(render(<Toc label="Índice" items={[]} />).container.firstChild).toBeNull();
    const { container } = render(<Toc label="Índice" items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
