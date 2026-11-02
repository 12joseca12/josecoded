// Build-time merge of the published text overrides over the per-screen catalogs (D53, DATOS §14.5).
// `content/overrides/messages.<locale>.json` is a flat map `{ "services.hero.title": "text" }` that the
// GitHub App commits from the admin's published drafts. This script composes `messages/<locale>/*.json`,
// applies the overrides and writes `content/generated/messages.<locale>.json`, which `i18n/messages.ts`
// loads. Every invalid override fails the build loudly with the key: nothing is silently ignored.
// Runs with plain Node (type stripping, Node >= 22.18), so internal imports carry `.ts`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EDITABLE_NAMESPACES } from '@josecoded/types';

import { loadCatalogs } from './catalogs.ts';
import { isPendingDato } from '../lib/content/dato.ts';


type Tree = { [key: string]: unknown };

const LOCALES = ['es', 'en'] as const;
const TAG = /<\/?([A-Za-z][A-Za-z0-9-]*)/g;
const ARG = /\{\s*([A-Za-z0-9_]+)/g;

const matches = (text: string, pattern: RegExp) => new Set([...text.matchAll(pattern)].map((m) => m[1]!));

/** Reads the leaf string at a dotted path, or undefined when the path is not an existing string key. */
function readLeaf(tree: Tree, path: string[]): string | undefined {
  let node: unknown = tree;
  for (const segment of path) {
    if (node === null || typeof node !== 'object' || !Object.hasOwn(node, segment)) return undefined;
    node = (node as Tree)[segment];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Why an override text is refused, or null. Plain text / ICU only: no tags and no arguments the base text lacks. */
function textProblem(base: string, value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return 'not_text';
  if (isPendingDato(value)) return 'dato_placeholder';
  const baseTags = matches(base, TAG);
  if ([...matches(value, TAG)].some((tag) => !baseTags.has(tag))) return 'html_not_allowed';
  const baseArgs = matches(base, ARG);
  if ([...matches(value, ARG)].some((arg) => !baseArgs.has(arg))) return 'unknown_argument';
  return null;
}

/**
 * Applies `overrides` (dotted key -> text) to a deep copy of `base`. Only existing string keys under an
 * editable namespace (first segment) are accepted. Throws `unknown_key|namespace_not_editable|dato_placeholder|…  <key|ns>`.
 */
export function mergeMessages<T extends Tree>(base: T, overrides: Record<string, unknown>): T {
  const merged = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    const path = key.split('.');
    const namespace = path[0]!;
    if (!(EDITABLE_NAMESPACES as readonly string[]).includes(namespace)) {
      // admin-only namespaces (auth, area, dev) and unknown ones fail the same way: only the list above is editable
      throw new Error(`namespace_not_editable ${namespace}`);
    }
    const current = readLeaf(merged, path);
    if (current === undefined) throw new Error(`unknown_key ${key}`);
    const problem = textProblem(current, value);
    if (problem) throw new Error(`${problem} ${key}`);
    const parent = path.slice(0, -1).reduce<Tree>((node, segment) => node[segment] as Tree, merged);
    parent[path.at(-1)!] = value;
  }
  return merged;
}

/** The catalog next-intl consumes, composed from the per-screen files exactly like `messages/<locale>.ts`. */
export function composeCatalogs(locale: string, root?: string): Tree {
  return Object.assign({}, ...Object.values(loadCatalogs(locale, root))) as Tree;
}

export function readOverrides(locale: string, dir = join(import.meta.dirname, '..', 'content', 'overrides')): Record<string, unknown> {
  return JSON.parse(readFileSync(join(dir, `messages.${locale}.json`), 'utf8')) as Record<string, unknown>;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = join(import.meta.dirname, '..', 'content', 'generated');
  mkdirSync(out, { recursive: true });
  for (const locale of LOCALES) {
    const merged = mergeMessages(composeCatalogs(locale), readOverrides(locale));
    writeFileSync(join(out, `messages.${locale}.json`), `${JSON.stringify(merged)}\n`);
  }
}
