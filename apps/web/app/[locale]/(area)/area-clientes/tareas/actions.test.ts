// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  user: { id: 'me' } as null | { id: string },
  task: { id: '11111111-1111-4111-8111-111111111111', client_id: 'client-1' } as null | { id: string; client_id: string },
  insert: vi.fn(),
  taskFilter: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({
    auth: { getUser: async () => ({ data: { user: db.user } }) },
    from: (table: string) =>
      table === 'client_tasks'
        ? { select: () => ({ eq: (...args: unknown[]) => { db.taskFilter(...args); return { maybeSingle: async () => ({ data: db.task }) }; } }) }
        : { insert: async (row: unknown) => { db.insert(row); return { error: null }; } },
  }),
}));

import { postTaskComment } from './actions';

const idle = { status: 'idle' } as const;
function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}
const ok = { taskId: '11111111-1111-4111-8111-111111111111', body: '  Hello  ', locale: 'es' };

beforeEach(() => {
  vi.clearAllMocks();
  db.user = { id: 'me' };
  db.task = { id: '11111111-1111-4111-8111-111111111111', client_id: 'client-1' };
});

describe('postTaskComment', () => {
  it('takes client, author and internal from the server, never from the form', async () => {
    const state = await postTaskComment(idle, form({ ...ok, client_id: 'evil', author_user_id: 'evil', internal: 'true' }));
    expect(state).toEqual({ status: 'ok' });
    expect(db.insert).toHaveBeenCalledWith({
      client_id: 'client-1',
      task_id: '11111111-1111-4111-8111-111111111111',
      author_user_id: 'me',
      body: 'Hello',
      internal: false,
    });
  });

  it.each([[''], ['   '], ['x'.repeat(4001)]])('refuses a body that is empty or too long (%#)', async (body) => {
    const state = await postTaskComment(idle, form({ ...ok, body }));
    expect(state).toMatchObject({ status: 'error', fieldErrors: { body: 'area.tasks.comments.form.invalid' } });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('refuses a task id that is not a uuid', async () => {
    expect(await postTaskComment(idle, form({ ...ok, taskId: '1; drop table' }))).toMatchObject({ status: 'error' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('refuses an anonymous call', async () => {
    db.user = null;
    expect(await postTaskComment(idle, form(ok))).toMatchObject({ status: 'error', formError: 'area.tasks.comments.form.failed' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('refuses a task the session cannot see (another client): nothing is inserted', async () => {
    db.task = null;
    expect(await postTaskComment(idle, form(ok))).toMatchObject({ status: 'error' });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
