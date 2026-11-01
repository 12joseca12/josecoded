'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { localeSchema, taskCommentSchema } from '@josecoded/types';

import { getPathname } from '@/i18n/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

import type { FormState } from '@josecoded/types';

type CommentFields = { body: string };

const str = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value : undefined;
};

/**
 * Adds a visible comment to one of the client's tasks. The client id, the author and `internal` are
 * NOT read from the form: the client comes from the database for this session, the author is the
 * session user and the comment is never internal. RLS (`client_task_comments_insert`) is the
 * authority: it only accepts a task of the session's own client, as the author, not internal.
 */
export async function postTaskComment(
  _previous: FormState<CommentFields>,
  data: FormData,
): Promise<FormState<CommentFields>> {
  const locale = localeSchema.catch('es').parse(str(data, 'locale'));
  const t = await getTranslations({ locale, namespace: 'area.tasks.comments.form' });

  const parsed = taskCommentSchema.safeParse({ taskId: str(data, 'taskId'), body: str(data, 'body') });
  if (!parsed.success) return { status: 'error', fieldErrors: { body: t('invalid') } };

  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: 'error', formError: t('failed') };

  const { data: task } = await supabase
    .from('client_tasks')
    .select('id, client_id')
    .eq('id', parsed.data.taskId)
    .maybeSingle();
  if (!task) return { status: 'error', formError: t('failed') };

  const { error } = await supabase.from('client_task_comments').insert({
    client_id: task.client_id,
    task_id: task.id,
    author_user_id: auth.user.id,
    body: parsed.data.body,
    internal: false,
  });
  if (error) return { status: 'error', formError: t('failed') };

  revalidatePath(getPathname({ href: { pathname: '/area-clientes/tareas/[id]', params: { id: task.id } }, locale }));
  revalidatePath(getPathname({ href: '/area-clientes', locale }));
  return { status: 'ok' };
}
