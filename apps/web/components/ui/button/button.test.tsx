import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';

import { Button } from '.';

describe('Button', () => {
  it('renders a link when href is given and a disabled button otherwise', () => {
    renderIntl(
      <>
        <Button href="/proyectos">Ver proyectos</Button>
        <Button disabled>Enviar</Button>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Ver proyectos' }).getAttribute('href')).toBe('/proyectos');
    expect((screen.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('is type=button by default (never submits a form by accident) and can submit', () => {
    renderIntl(
      <>
        <Button>Uno</Button>
        <Button type="submit">Dos</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Uno' }).getAttribute('type')).toBe('button');
    expect(screen.getByRole('button', { name: 'Dos' }).getAttribute('type')).toBe('submit');
  });

  it('calls onClick, but not while disabled', () => {
    const onClick = vi.fn();
    renderIntl(
      <>
        <Button onClick={onClick}>Activo</Button>
        <Button onClick={onClick} disabled>
          Inactivo
        </Button>
      </>,
    );
    screen.getByRole('button', { name: 'Activo' }).click();
    screen.getByRole('button', { name: 'Inactivo' }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('localizes an internal href per language and leaves an external one alone', () => {
    renderIntl(
      <>
        <Button href="/servicios?pack=P2#packs">Packs</Button>
        <Button href="https://cal.com/x">Reservar</Button>
      </>,
      'en',
    );
    expect(screen.getByRole('link', { name: 'Packs' }).getAttribute('href')).toBe('/en/services?pack=P2#packs');
    expect(screen.getByRole('link', { name: 'Reservar' }).getAttribute('href')).toBe('https://cal.com/x');
  });

  it('spills the variant contract to data attributes with documented defaults', () => {
    renderIntl(
      <>
        <Button>Por defecto</Button>
        <Button variant="ghost" size="lg">
          Fantasma
        </Button>
      </>,
    );
    const byDefault = screen.getByRole('button', { name: 'Por defecto' });
    expect([byDefault.dataset.variant, byDefault.dataset.size]).toEqual(['solid', 'md']);
    const ghost = screen.getByRole('button', { name: 'Fantasma' });
    expect([ghost.dataset.variant, ghost.dataset.size]).toEqual(['ghost', 'lg']);
  });

  it('an icon-only button is named by its aria-label and hides the icon', () => {
    renderIntl(<Button iconOnly icon="search" aria-label="Buscar" />);
    const button = screen.getByRole('button', { name: 'Buscar' });
    expect(button.dataset.iconOnly).toBe('true');
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('has no axe violations in any variant', async () => {
    const { container } = renderIntl(
      <main>
        <Button href="/proyectos">Ver proyectos</Button>
        <Button variant="ghost">Reservar 20 min</Button>
        <Button disabled>Enviar</Button>
        <Button iconOnly icon="search" aria-label="Buscar" />
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
