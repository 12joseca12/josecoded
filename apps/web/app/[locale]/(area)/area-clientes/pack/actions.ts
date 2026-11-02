'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { computeUpgrade } from '@josecoded/pricing';
import { localeSchema, upgradeRequestSchema } from '@josecoded/types';

import { getPathname } from '@/i18n/navigation';
import { getAreaContext } from '@/lib/area/queries';

import type { ExtraCode, FormState, PackCode } from '@josecoded/types';

type UpgradeFields = { toPack: string; extras: string };

const str = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value : undefined;
};

/**
 * Asks Jose for an upgrade. The price is never read from the form: the database computes it inside
 * `request_upgrade` from the list prices, and this action only checks beforehand, with the same rule
 * (`computeUpgrade`), that the request makes sense for the session's current pack, so the visitor gets
 * a clear message instead of a database error. The rule «one pending request per client» is
 * enforced by the database (`uq_upgrade_requests_pending`) and mapped to its own message.
 */
export async function requestUpgrade(
  _previous: FormState<UpgradeFields>,
  data: FormData,
): Promise<FormState<UpgradeFields>> {
  const locale = localeSchema.catch('es').parse(str(data, 'locale'));
  const t = await getTranslations({ locale, namespace: 'area.plan.upgrade.errors' });

  const rawPack = str(data, 'toPack');
  const parsed = upgradeRequestSchema.safeParse({
    toPack: rawPack ? rawPack : null,
    extras: data.getAll('extras').filter((value): value is string => typeof value === 'string'),
  });
  if (!parsed.success) return { status: 'error', formError: t('nothing') };

  const context = await getAreaContext();
  if (!context?.client || context.isAdmin) return { status: 'error', formError: t('failed') };

  try {
    computeUpgrade(
      context.client.pack_code as PackCode,
      parsed.data.toPack,
      parsed.data.extras as ExtraCode[],
    );
  } catch {
    return { status: 'error', formError: t('notAnUpgrade') };
  }

  const { error } = await context.session.supabase.rpc('request_upgrade', {
    // `null` = extras only; the generated type does not model the nullable argument
    p_to_pack_code: parsed.data.toPack as string,
    p_extras: parsed.data.extras,
  });
  if (error) {
    if (error.code === '23505') return { status: 'error', formError: t('alreadyPending') };
    if (error.code === '22023') return { status: 'error', formError: t('notAnUpgrade') };
    return { status: 'error', formError: t('failed') };
  }

  revalidatePath(getPathname({ href: '/area-clientes/pack', locale }));
  redirect(`${getPathname({ href: '/area-clientes/pack', locale })}?requested=1`);
}
