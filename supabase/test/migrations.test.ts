import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const dir = new URL('../migrations/', import.meta.url);
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();
const read = (n: string) => readFileSync(new URL(n, dir), 'utf8').replace(/--.*$/gm, '');

describe('migrations (DATOS §10.2)', () => {
  it('starts with the base migration and has no legacy files', () => {
    expect(files[0]).toBe('20261028100000_base.sql');
    expect(files.some((f) => /^202609|^20260930/.test(f))).toBe(false);
  });

  it('every security definer fixes search_path and revokes public/anon/authenticated', () => {
    for (const f of files)
      for (const m of read(f).matchAll(
        /create (?:or replace )?function\s+([\w.]+)\s*\(([\s\S]*?)\)[\s\S]*?language[\s\S]*?(?=;\s*$|\$\$)/gim,
      )) {
        const body = m[0];
        if (!/security definer/i.test(body)) continue;
        expect(body, m[1]).toMatch(/set search_path = ''/);
        expect(read(f), m[1]).toMatch(
          new RegExp(
            // [^;] keeps the match inside one revoke statement (a later revoke of another function must not count)
            `revoke all on function ${m[1]!.replace('.', '\\.')}\\s*\\([^;]*?\\)\\s*from public, anon, authenticated\\s*;`,
            'i',
          ),
        );
      }
  });

  it('every public table enables RLS and has no `for all` policy', () => {
    for (const f of files) {
      const sql = read(f);
      for (const t of sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi))
        expect(sql, t[1]).toMatch(
          new RegExp(`alter table public\\.${t[1]} enable row level security`, 'i'),
        );
      expect(sql).not.toMatch(/create policy[\s\S]*?for all/i);
    }
  });

  it('never uses bare auth.uid() in a policy and never creates a view', () => {
    for (const f of files) {
      const sql = read(f);
      expect(sql).not.toMatch(/(?<!\(select )auth\.uid\(\)/);
      expect(sql).not.toMatch(/create (or replace )?view/i);
    }
  });

  it('is additive after the base migration', () => {
    for (const f of files.slice(1))
      expect(read(f)).not.toMatch(/\b(drop table|truncate|delete from)\b/i);
  });

  // DATOS P11 / §10.2: every public table with updated_at carries the private.set_updated_at() trigger.
  it('every public table with updated_at has its set_updated_at trigger', () => {
    for (const f of files) {
      const sql = read(f);
      for (const t of sql.matchAll(
        /create table (?:if not exists )?public\.(\w+)\s*\(([\s\S]*?)\n\);/gi,
      )) {
        if (!/\bupdated_at\b/.test(t[2]!)) continue;
        expect(sql, t[1]).toMatch(
          new RegExp(
            `before update on public\\.${t[1]}\\s+for each row execute function private\\.set_updated_at\\(\\)`,
            'i',
          ),
        );
      }
    }
  });
});
