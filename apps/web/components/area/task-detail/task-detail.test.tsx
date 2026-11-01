import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';
import { serverIntlMock } from '@/tests/helpers/server-intl';

vi.mock('next-intl/server', () => serverIntlMock);
vi.mock('@/app/[locale]/(area)/area-clientes/tareas/actions', () => ({
  postTaskComment: vi.fn(async () => ({ status: 'idle' })),
}));

import { TaskDetail } from './task-detail';

const task = { id: 't1', title: 'Review design', description: 'Look at the home <b>mock</b>', status: 'pending' as const, sort: 1, due_at: null };
const comments = [
  { id: 'c1', task_id: 't1', author_user_id: 'jose', body: 'Ready for you', created_at: '2026-10-20T10:00:00Z' },
  { id: 'c2', task_id: 't1', author_user_id: 'me', body: '<script>alert(1)</script>', created_at: '2026-10-21T10:00:00Z' },
];

describe('TaskDetail', () => {
  it('shows who wrote each comment, escapes the text and offers the comment box', async () => {
    const { container } = renderIntl(await TaskDetail({ locale: 'es', userId: 'me', task, comments }));
    const list = screen.getByRole('list', { name: 'Comentarios de la tarea' });
    expect(list.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText(/^Jose · /)).toBeTruthy();
    expect(screen.getByText(/^Tú · /)).toBeTruthy();
    // the markup in a comment or in the description is text, never elements
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText('<script>alert(1)</script>')).toBeTruthy();
    expect(screen.getByLabelText('Escribe un comentario').getAttribute('maxlength')).toBe('4000');
    expect(screen.getByRole('button', { name: 'Enviar comentario' })).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('says there are no comments yet', async () => {
    renderIntl(await TaskDetail({ locale: 'en', userId: 'me', task, comments: [] }), 'en');
    expect(screen.getByText('No comments on this task yet.')).toBeTruthy();
  });
});
