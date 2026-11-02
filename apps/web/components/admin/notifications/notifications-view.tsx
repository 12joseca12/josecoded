import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { RuleEditor } from './rule-editor';

import type { RuleCandidate, RulesState } from '@/lib/notifications/rules';

/**
 * D3, the notification rules, as a view of already-read data (admin only: the page guards with `requireAdmin()`):
 * the page fetches and the dev preview feeds it fixtures. Only the sentences of this screen travel to the browser.
 * `editable` is false on the real page until `setRule` exists (B43.b).
 */
export async function NotificationsView({
  rules,
  candidates,
  editable,
}: {
  rules: RulesState;
  candidates: readonly RuleCandidate[];
  editable: boolean;
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ adminNotifications: messages.adminNotifications }}>
      <RuleEditor initial={rules} candidates={candidates} editable={editable} />
    </NextIntlClientProvider>
  );
}
