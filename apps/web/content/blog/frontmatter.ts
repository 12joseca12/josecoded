import { parse } from 'yaml';

import { frontmatterSchema } from './schema.ts';

import type { Frontmatter } from './schema.ts';

/** The leading `---` YAML block, or `null` when the file has none. */
export function frontmatterBlock(text: string): string | null {
  return text.match(/^﻿?---\r?\n([^]*?)\r?\n---[ \t]*(?:\r?\n|$)/)?.[1] ?? null;
}

/** Parses and validates the frontmatter of a guide; throws when it is missing or invalid. */
export function parseFrontmatter(text: string): Frontmatter {
  const block = frontmatterBlock(text);
  if (block === null) throw new Error('missing frontmatter');
  return frontmatterSchema.parse(parse(block));
}
