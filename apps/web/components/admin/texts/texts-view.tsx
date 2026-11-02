import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { TextsWorkspace } from './texts-workspace';

import type { PublishedText, TextEntry, TextPair } from '@/lib/content/texts';
import type { EditableNamespace } from '@josecoded/types';

/**
 * The Textos tab of D2 as a view of already-read data (admin only): the page reads the catalogs, the dev preview feeds
 * fixtures. Only the sentences of this screen travel to the browser.
 */
export async function TextsView({
  entries,
  published = {},
  drafts = {},
  elsewhere = 0,
  namespace,
  notice,
}: {
  entries: readonly TextEntry[];
  published?: Readonly<Record<string, PublishedText>>;
  drafts?: Readonly<Record<string, TextPair>>;
  elsewhere?: number;
  namespace?: EditableNamespace;
  notice?: string;
}) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ adminTexts: messages.adminTexts }}>
      <TextsWorkspace entries={entries} published={published} initialDrafts={drafts} elsewhere={elsewhere} namespace={namespace} notice={notice} />
    </NextIntlClientProvider>
  );
}
