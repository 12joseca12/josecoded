import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { MiniChat } from '.';

it('renders both lines complete for assistive technology and has no axe violations', async () => {
  const { container } = render(<MiniChat label="Ejemplo de conversación" visitor="Hola Jose" reply="Claro" />);
  expect(screen.getByRole('group', { name: 'Ejemplo de conversación' })).toBeTruthy();
  const reads = [...container.querySelectorAll('.sr-only')].map((n) => n.textContent);
  expect(reads).toEqual(['Hola Jose', 'Claro']);
  expect(await axe(container)).toHaveNoViolations();
});
