import { EDITABLE_NAMESPACES } from '@josecoded/types';

import type { EditableNamespace } from '@josecoded/types';

// The pure part of D2 Textos (block B35): the list of editable texts built from the real catalogs, the state of each
// one and the search. The list is the same set `merge-overrides` accepts (existing string keys under
// `EDITABLE_NAMESPACES`), so what the screen offers can be published.

export const TEXTS_PATH = '/admin/contenido?tab=textos';

type Tree = { [key: string]: unknown };

export interface TextPair {
  es: string;
  en: string;
}

/** A text of the site: its dotted key and what `messages/` says today, in both languages. */
export interface TextEntry {
  key: string;
  namespace: EditableNamespace;
  base: TextPair;
}

/** What is live as an override: its texts (empty = none for that language) and the publication that wrote it. */
export interface PublishedText extends TextPair {
  version: number;
}

/** `modified`: the draft differs from what is published; `published`: an override is live and the draft is the same. */
export type TextState = 'modified' | 'published' | 'unchanged';

export const EMPTY_PAIR: TextPair = { es: '', en: '' };

const isEditable = (namespace: string): namespace is EditableNamespace => (EDITABLE_NAMESPACES as readonly string[]).includes(namespace);

function leaf(tree: Tree, path: readonly string[]): string {
  let node: unknown = tree;
  for (const segment of path) {
    if (node === null || typeof node !== 'object' || !Object.hasOwn(node, segment)) return '';
    node = (node as Tree)[segment];
  }
  return typeof node === 'string' ? node : '';
}

/** Every string leaf under an editable namespace of the Spanish catalog, with its English counterpart. */
export function collectTexts(es: Tree, en: Tree): TextEntry[] {
  const entries: TextEntry[] = [];
  const walk = (node: unknown, path: string[]) => {
    if (typeof node === 'string') {
      entries.push({ key: path.join('.'), namespace: path[0] as EditableNamespace, base: { es: node, en: leaf(en, path) } });
    } else if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
      for (const [name, child] of Object.entries(node)) walk(child, [...path, name]);
    }
  };
  for (const [namespace, node] of Object.entries(es)) {
    if (isEditable(namespace)) walk(node, [namespace]);
  }
  return entries.sort((a, b) => EDITABLE_NAMESPACES.indexOf(a.namespace) - EDITABLE_NAMESPACES.indexOf(b.namespace));
}

/** The namespaces that have texts, in the order the site lists them, with how many texts each one has. */
export function namespaceCounts(entries: readonly TextEntry[]): { namespace: EditableNamespace; count: number }[] {
  return EDITABLE_NAMESPACES.map((namespace) => ({ namespace, count: entries.filter((entry) => entry.namespace === namespace).length })).filter(
    (item) => item.count > 0,
  );
}

export function textState(draft: TextPair, published: PublishedText | undefined): TextState {
  const same = draft.es === (published?.es ?? '') && draft.en === (published?.en ?? '');
  if (!same) return 'modified';
  return published ? 'published' : 'unchanged';
}

const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** What a search looks at, folded once: the key, both base texts and what the draft already says. */
export function haystack(entry: TextEntry, draft: TextPair = EMPTY_PAIR): string {
  return fold(`${entry.key} ${entry.base.es} ${entry.base.en} ${draft.es} ${draft.en}`);
}

/** Every word of the query must appear (accents and case ignored), in the key or in any of the texts. */
export function matchesQuery(folded: string, query: string): boolean {
  return fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => folded.includes(term));
}
