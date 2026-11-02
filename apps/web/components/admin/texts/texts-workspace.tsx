'use client';

import { useTranslations } from 'next-intl';
import { useDeferredValue, useMemo, useState } from 'react';

import { TabNav } from '@/components/crm/tab-nav';
import { PageHead } from '@/components/staff/page-head';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EMPTY_PAIR, haystack, matchesQuery, namespaceCounts, textState } from '@/lib/content/texts';

import { ContentSearch } from './content-search';
import { contentTabs } from './content-tabs';
import { OverrideEditor } from './override-editor';
import { PublishBar } from './publish-bar';
import styles from './texts-workspace.module.css';

import type { PublishedText, TextEntry, TextPair } from '@/lib/content/texts';
import type { EditableNamespace } from '@josecoded/types';

const PAGE = 30;

/**
 * The Textos tab of D2 as one screen with its state in the browser: the namespaces, the search, the editors and the
 * count in the publish bar, which follows what is typed. The server hands it the real list of texts and what is
 * published; the draft is the next block (it saves through Server Actions and feeds `initialDrafts`), so for now
 * what is typed stays here (`notice` says so on the real page).
 *
 * A11y: the namespaces are a `nav` of buttons (`aria-current` on the open one); one polite status line announces how
 * many texts a search found and that a text went back to `messages`; «Mostrar más» keeps the focus where it was.
 */
export function TextsWorkspace({
  entries,
  published,
  initialDrafts,
  elsewhere,
  namespace: initialNamespace,
  notice,
}: {
  entries: readonly TextEntry[];
  /** What is live as an override, by key. */
  published: Readonly<Record<string, PublishedText>>;
  /** What the draft already says, by key (an empty one is the base text). */
  initialDrafts: Readonly<Record<string, TextPair>>;
  /** Unpublished changes of the other tabs (prices), so the bar counts the whole publication. */
  elsewhere: number;
  /** The namespace that opens (the first one by default). */
  namespace?: EditableNamespace;
  notice?: string;
}) {
  const t = useTranslations('adminTexts');
  const namespaces = useMemo(() => namespaceCounts(entries), [entries]);
  const folded = useMemo(() => entries.map((entry) => haystack(entry)), [entries]);
  const [drafts, setDrafts] = useState<Record<string, TextPair>>(() => ({ ...initialDrafts }));
  const [namespace, setNamespace] = useState<EditableNamespace>(initialNamespace ?? namespaces[0]?.namespace ?? 'home');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [restored, setRestored] = useState<string | null>(null);
  const needle = useDeferredValue(query);
  const searching = needle.trim() !== '';

  const draftOf = (key: string): TextPair => drafts[key] ?? (published[key] ? { es: published[key].es, en: published[key].en } : EMPTY_PAIR);

  const modified = useMemo(
    () => Object.keys({ ...published, ...drafts }).filter((key) => textState(drafts[key] ?? (published[key] ? { es: published[key].es, en: published[key].en } : EMPTY_PAIR), published[key]) === 'modified').length,
    [drafts, published],
  );

  const matches = useMemo(
    () =>
      entries.filter((entry, index) => {
        if (!searching) return true;
        const draft = drafts[entry.key];
        return matchesQuery(folded[index]!, needle) || (draft !== undefined && matchesQuery(haystack(entry, draft), needle));
      }),
    [entries, folded, drafts, needle, searching],
  );
  const shown = searching ? matches : matches.filter((entry) => entry.namespace === namespace);
  const counts = (name: EditableNamespace, total: number) => (searching ? matches.filter((entry) => entry.namespace === name).length : total);
  const status =
    restored ?? (searching ? t('search.results', { count: matches.length, query: needle.trim() }) : t('search.browsing', { count: shown.length, namespace }));

  const set = (key: string, lang: 'es' | 'en', value: string) => {
    setRestored(null);
    setDrafts((current) => ({ ...current, [key]: { ...(current[key] ?? draftOf(key)), [lang]: value } }));
  };
  const restore = (key: string) => {
    setDrafts((current) => ({ ...current, [key]: EMPTY_PAIR }));
    setRestored(t('editor.restored', { key }));
  };
  const open = (name: EditableNamespace) => {
    setQuery('');
    setNamespace(name);
    setLimit(PAGE);
    setRestored(null);
  };

  return (
    <>
      <PublishBar count={modified + elsewhere} />
      <PageHead title={t('title')} tone={t('tone')} lead={t('lead')} />
      <TabNav label={t('tabsLabel')} current="textos" items={contentTabs({ texts: t('tabs.texts'), prices: t('tabs.prices') }, { texts: modified, prices: elsewhere })} />
      {notice ? (
        <p className={styles.note} data-tone="attention" role="status">
          <Icon name="triangle-alert" />
          <span>{notice}</span>
        </p>
      ) : null}
      <div className={styles.layout}>
        <nav aria-label={t('namespaces.label')} className={styles.ns}>
          {namespaces.map((item) => {
            const current = !searching && item.namespace === namespace;
            return (
              <button key={item.namespace} type="button" className={styles.nsItem} aria-current={current ? 'true' : undefined} onClick={() => open(item.namespace)}>
                <span>{item.namespace}</span>
                <span className={styles.nsCount}>{counts(item.namespace, item.count)}</span>
              </button>
            );
          })}
        </nav>
        <div className={styles.main}>
          <div className={styles.toolbar}>
            <ContentSearch
              value={query}
              onChange={(value) => {
                setQuery(value);
                setLimit(PAGE);
                setRestored(null);
              }}
            />
          </div>
          <p className={styles.note}>
            <Icon name="info" />
            <span>{t('note')}</span>
          </p>
          <p role="status" className={searching || restored ? styles.status : 'sr-only'}>
            {status}
          </p>
          {shown.length === 0 ? (
            <p className={styles.empty}>{t('list.empty')}</p>
          ) : (
            <ul role="list" aria-label={t('list.label')} className={styles.list}>
              {shown.slice(0, limit).map((entry) => (
                <li key={entry.key} className={styles.item}>
                  <OverrideEditor
                    entry={entry}
                    draft={draftOf(entry.key)}
                    published={published[entry.key]}
                    onChange={(lang, value) => set(entry.key, lang, value)}
                    onRestore={() => restore(entry.key)}
                  />
                </li>
              ))}
            </ul>
          )}
          {shown.length > limit ? (
            <div className={styles.more}>
              <Button variant="ghost" onClick={() => setLimit((current) => current + PAGE)}>
                {t('list.more', { count: Math.min(PAGE, shown.length - limit) })}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
