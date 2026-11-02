'use server';

import { getTranslations } from 'next-intl/server';

import { localeSchema, userStoryInputSchema } from '@josecoded/types';

import { devUiEnabled } from '@/lib/dev/gate';

import type { FormState } from '@josecoded/types';

type Fields = { title: string; as_a: string; i_want: string; so_that: string; criteria: string };

const str = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
};

/**
 * The action of the story form in `/dev/area/historias/nueva`: it runs the same `userStoryInputSchema` the real action
 * will (B16) and answers like it, but saves nothing. Only where the dev routes exist.
 */
export async function previewCreateStory(_previous: FormState<Fields>, data: FormData): Promise<FormState<Fields>> {
  const locale = localeSchema.catch('es').parse(str(data, 'locale'));
  const t = await getTranslations({ locale, namespace: 'area.stories.form' });
  if (!devUiEnabled) return { status: 'error', formError: t('failed') };

  const criteria = data.getAll('criteria').filter((value): value is string => typeof value === 'string' && value.trim() !== '');
  const parsed = userStoryInputSchema.safeParse({
    title: str(data, 'title'),
    as_a: str(data, 'as_a'),
    i_want: str(data, 'i_want'),
    so_that: str(data, 'so_that'),
    acceptance_criteria: criteria,
  });
  if (parsed.success) return { status: 'ok' };

  const fieldErrors: FormState<Fields>['fieldErrors'] = {};
  for (const issue of parsed.error.issues) {
    const head = String(issue.path[0]);
    const key = (head === 'acceptance_criteria' ? 'criteria' : head) as keyof Fields;
    if (fieldErrors[key]) continue;
    fieldErrors[key] =
      issue.code === 'too_big' ? t('tooLong', { max: Number(issue.maximum) }) : t('required');
  }
  return {
    status: 'error',
    fieldErrors,
    values: { title: str(data, 'title'), as_a: str(data, 'as_a'), i_want: str(data, 'i_want'), so_that: str(data, 'so_that') },
  };
}
