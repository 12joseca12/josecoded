'use client';

import { useEffect } from 'react';

import { useRouter } from '@/i18n/navigation';
import { bindFocusHotkey } from '@/lib/a11y';
import { clientsHrefFromEntries } from '@/lib/crm/clients';
import { contactsHrefFromEntries } from '@/lib/crm/contacts-url';
import { toLinkTarget } from '@/lib/href';

import type { Href } from '@josecoded/types';

type Target = Parameters<ReturnType<typeof useRouter>['push']>[0];

/**
 * Progressive enhancement of the filter form (a plain GET that works without JavaScript): every change of a
 * control applies the filters at once and without a reload, the search field also applies when it is cleared, and
 * its hotkey focuses it. The submit button is hidden once this runs (`@media (scripting: none)` shows it
 * otherwise). Renders nothing. `screen` says whose URL the form builds: the inbox of contacts (default) or the list of
 * clients.
 */
export function FilterEnhancer({ formId, screen = 'contacts' }: { formId: string; screen?: 'contacts' | 'clients' }) {
  const router = useRouter();

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    const search = form.querySelector<HTMLInputElement>('input[data-hotkey]');

    const apply = () =>
      router.push(
        toLinkTarget((screen === 'clients' ? clientsHrefFromEntries : contactsHrefFromEntries)(new FormData(form).entries()) as Href) as Target,
      );
    const onSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      apply();
    };
    // typing in the search is applied with Enter (the form's own submit), not on every blur
    const onChange = (event: Event) => {
      if (event.target !== search) apply();
    };
    form.addEventListener('submit', onSubmit);
    form.addEventListener('change', onChange);
    search?.addEventListener('search', apply);
    const unbind = search?.dataset.hotkey
      ? bindFocusHotkey(search, search.dataset.hotkey)
      : undefined;
    return () => {
      form.removeEventListener('submit', onSubmit);
      form.removeEventListener('change', onChange);
      search?.removeEventListener('search', apply);
      unbind?.();
    };
  }, [formId, router, screen]);

  return null;
}
