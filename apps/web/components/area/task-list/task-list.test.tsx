import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';
import { serverIntlMock } from '@/tests/helpers/server-intl';

vi.mock('next-intl/server', () => serverIntlMock);

import { TaskList } from './task-list';

const task = (id: string, title: string, status: 'pending' | 'in_progress' | 'done', due_at: string | null = null) => ({
  id,
  title,
  description: null,
  status,
  sort: 1,
  due_at,
});

describe('TaskList', () => {
  it('groups by state in the order in progress, pending, done and links each task to its detail', async () => {
    const ui = await TaskList({
      locale: 'es',
      tasks: [task('a', 'Send logo', 'done'), task('b', 'Review design', 'pending', '2026-11-20'), task('c', 'Pick colours', 'in_progress')],
    });
    const { container } = renderIntl(ui);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['En curso', 'Pendientes', 'Hechas']);
    expect(screen.getByRole('link', { name: 'Review design' }).getAttribute('href')).toBe('/area-clientes/tareas/b');
    expect(screen.getByText('Para el 20 nov 2026')).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('skips empty groups', async () => {
    renderIntl(await TaskList({ locale: 'es', tasks: [task('a', 'Send logo', 'done')] }));
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Hechas']);
  });

  it('shows the empty state without tasks', async () => {
    const { container } = renderIntl(await TaskList({ locale: 'es', tasks: [] }));
    expect(screen.getByText('Aún no hay tareas')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('uses the English routes in English', async () => {
    renderIntl(await TaskList({ locale: 'en', tasks: [task('a', 'Send logo', 'pending')] }), 'en');
    expect(screen.getByRole('link', { name: 'Send logo' }).getAttribute('href')).toBe('/en/client-area/tasks/a');
  });
});
