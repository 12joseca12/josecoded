import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  COMMISSION_STATUSES,
  CONFLICT_RESOLUTIONS,
  CONFLICT_STATUSES,
  CONTACT_SOURCES,
  CONTENT_KINDS,
  EDITABLE_NAMESPACES,
  EXTRA_BILLINGS,
  EXTRA_CODE_RE,
  IMPORT_STATUSES,
  INTERACTION_KINDS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_RECIPIENTS,
  PACK_CODE_DB_RE,
  PACK_CODE_RE,
  PACK_KINDS,
  PRICING_ITEMS,
  PUBLICATION_STATUSES,
  QUOTE_STATUSES,
  STAFF_ROLES,
  STORY_STATUSES,
} from '../src';

// The enums added by the 1.8e migrations (DATOS v1.4) are compared with the migrations themselves, so the zod lists
// cannot drift even before `database.ts` is regenerated (test/enums.test-d.ts covers the older enums against it).
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'supabase', 'migrations');
const sql = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(dir, f), 'utf8').replace(/--.*$/gm, ''))
  .join('\n');

/** Labels of a public enum after every migration: `create type … as enum` plus `alter type … add value`, in order. */
function enumLabels(name: string): string[] {
  const created = new RegExp(`create type public\\.${name} as enum \\(([^)]*)\\)`, 'i').exec(sql);
  if (!created) throw new Error(`enum ${name} not found`);
  const labels = [...created[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
  for (const m of sql.matchAll(new RegExp(`alter type public\\.${name} add value (?:if not exists )?'([^']+)'`, 'gi'))) {
    labels.push(m[1]!);
  }
  return labels;
}

describe('zod value lists of 1.8e mirror the SQL enums', () => {
  const cases: [string, readonly string[]][] = [
    ['staff_role', STAFF_ROLES],
    ['contact_source', CONTACT_SOURCES],
    ['interaction_kind', INTERACTION_KINDS],
    ['import_status', IMPORT_STATUSES],
    ['conflict_status', CONFLICT_STATUSES],
    ['conflict_resolution', CONFLICT_RESOLUTIONS],
    ['commission_status', COMMISSION_STATUSES],
    ['notification_recipient', NOTIFICATION_RECIPIENTS],
    ['notification_channel', NOTIFICATION_CHANNELS],
    ['content_kind', CONTENT_KINDS],
    ['publication_status', PUBLICATION_STATUSES],
    ['story_status', STORY_STATUSES],
    ['pack_kind', PACK_KINDS],
    ['extra_billing', EXTRA_BILLINGS],
    ['pricing_item', PRICING_ITEMS],
    ['quote_status', QUOTE_STATUSES],
  ];
  it.each(cases)('%s', (name, list) => {
    expect([...list]).toEqual(enumLabels(name));
  });
});

describe('contracts repeated in SQL', () => {
  it('EDITABLE_NAMESPACES is the list inside content_publish_impl()', () => {
    const all = [...sql.matchAll(/v_editable constant text\[\] := array\[([^\]]*)\]/g)];
    expect(all.length).toBeGreaterThan(0);
    for (const m of all) expect([...m[1]!.matchAll(/'([^']+)'/g)].map((x) => x[1])).toEqual([...EDITABLE_NAMESPACES]);
  });

  it('pack and extra code patterns are the checks of the database', () => {
    expect(sql).toContain(`check (code ~ '${PACK_CODE_RE.source}')`);
    expect(sql).toContain(`check (code ~ '${EXTRA_CODE_RE.source}')`);
    expect(PACK_CODE_DB_RE.source).toBe(PACK_CODE_RE.source);
  });
});
