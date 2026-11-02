import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { collectTexts } from '@/lib/content/texts';
import { renderIntl } from '@/tests/helpers/render-intl';

import { TextsWorkspace } from './texts-workspace';

const entries = collectTexts(
  { home: { title: 'Inicio', lead: 'Hola' }, services: { head: { lead: 'Trabajo como freelance', note: 'Precios desde' } } },
  { home: { title: 'Home', lead: 'Hi' }, services: { head: { lead: 'Freelance work', note: 'Prices from' } } },
);
const published = { 'services.head.note': { es: 'Desde', en: '', version: 2 } };

const setup = (props: Partial<Parameters<typeof TextsWorkspace>[0]> = {}) =>
  renderIntl(<TextsWorkspace entries={entries} published={published} initialDrafts={{}} elsewhere={1} {...props} />);

describe('TextsWorkspace', () => {
  it('lists the first namespace with labelled, language-tagged fields and passes axe', async () => {
    const { container } = setup();
    const es = screen.getAllByLabelText(/Español/)[0] as HTMLTextAreaElement;
    expect(es.lang).toBe('es');
    expect(screen.getAllByLabelText(/Inglés/)[0]!.getAttribute('lang')).toBe('en');
    expect(es.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'home 2' }).getAttribute('aria-current')).toBe('true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('counts the unpublished changes of the whole publication as the drafts change', () => {
    setup();
    expect(screen.getByRole('region', { name: 'Publicación' }).textContent).toContain('1 cambio sin publicar');
    fireEvent.change(screen.getAllByLabelText(/Español/, { selector: 'textarea' })[0]!, { target: { value: 'Nuevo inicio' } });
    expect(screen.getByRole('region', { name: 'Publicación' }).textContent).toContain('2 cambios sin publicar');
  });

  it('searches by key or text across namespaces and announces the count', () => {
    setup();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar textos' }), { target: { value: 'FREELANCE' } });
    expect(screen.getByRole('status').textContent).toBe('1 texto para «FREELANCE»');
    expect(screen.getByRole('heading', { name: 'services.head.lead' })).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar textos' }), { target: { value: 'zzz' } });
    expect(screen.getByRole('status').textContent).toBe('Ningún texto para «zzz»');
  });

  it('restores the messages text of a key, announces it and moves the focus to its first field', () => {
    setup({ namespace: 'services' });
    const entry = screen.getByRole('article', { name: 'services.head.note' });
    expect(within(entry).getByText('Publicado v2')).toBeTruthy();
    fireEvent.click(within(entry).getByRole('button', { name: 'Restaurar el de messages para services.head.note' }));
    expect(within(entry).getByText('Modificado')).toBeTruthy();
    expect((within(entry).getByLabelText(/Español/) as HTMLTextAreaElement).value).toBe('');
    expect(document.activeElement).toBe(within(entry).getByLabelText(/Español/));
    expect(screen.getAllByRole('status').some((node) => node.textContent === 'services.head.note: vuelve el texto de messages (sin publicar)')).toBe(true);
  });
});
