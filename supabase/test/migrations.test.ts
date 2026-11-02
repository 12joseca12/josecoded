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

  // What the migration itself runs must not remove data or tables. Function bodies ($$…$$) are left out: a function
  // that deletes at run time (chat_purge_anonymous, retention P10) changes nothing when the migration is applied. A
  // `do` block runs while the migration applies, so its body is kept and checked.
  it('is additive after the base migration', () => {
    const topLevel = (sql: string) =>
      sql.replace(/(\bdo\s+(?:language\s+\w+\s+)?)?\$(\w*)\$[\s\S]*?\$\2\$/gi, (m, run?: string) => (run ? m : '$$'));
    expect(topLevel('select 1; create function f() returns void language sql as $$ delete from x $$; truncate y')).toBe(
      'select 1; create function f() returns void language sql as $$; truncate y',
    );
    expect(topLevel('do $$ begin delete from x; end $$;')).toMatch(/delete from/);
    expect(topLevel('DO language plpgsql $b$ begin truncate x; end $b$;')).toMatch(/truncate/);
    for (const f of files.slice(1))
      expect(topLevel(read(f)), f).not.toMatch(/\b(drop table|truncate|delete from)\b/i);
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
  // DATOS §14.7 rules added with 1.8e (plan v3.4).
  it('never drops a column or a type value, and enum values are added in migrations that do nothing else', () => {
    for (const f of files.slice(1)) {
      const sql = read(f);
      expect(sql, f).not.toMatch(/\bdrop column\b/i);
      if (/\balter type\b[^;]*\badd value\b/i.test(sql)) {
        const other = sql
          .split(';')
          .map((st) => st.trim())
          .filter((st) => st && !/^alter type [\w.]+ add value\b/i.test(st));
        expect(other, `${f}: add value must stand alone (P6)`).toEqual([]);
      }
    }
  });

  it('every dropped policy is created again with the same name on the same table in the same file', () => {
    for (const f of files) {
      const sql = read(f);
      for (const d of sql.matchAll(/drop policy (?:if exists )?(\w+) on ([\w.]+)\s*;/gi))
        expect(sql, `${f}: ${d[1]}`).toMatch(new RegExp(`create policy ${d[1]} on ${d[2]!.replace('.', '\\.')}\\b`, 'i'));
    }
  });

  it('a file creates at most one policy per table and action (no multiple permissive policies)', () => {
    for (const f of files) {
      const seen = new Map<string, string>();
      for (const m of read(f).matchAll(/create policy (\w+) on ([\w.]+)\s+for (select|insert|update|delete)\s+to (\w+)/gi)) {
        const key = `${m[2]}:${m[3]!.toLowerCase()}:${m[4]}`;
        expect(seen.get(key), `${f}: ${m[2]} ${m[3]} has ${seen.get(key)} and ${m[1]}`).toBeUndefined();
        seen.set(key, m[1]!);
      }
    }
  });

  it('no security definer function in public is granted to authenticated (invoker wrappers over private impls)', () => {
    for (const f of files.filter((n) => n > '20261029')) {
      const sql = read(f);
      for (const m of sql.matchAll(/create (?:or replace )?function\s+(public\.\w+)\s*\(([\s\S]*?)\)[\s\S]*?language[\s\S]*?(?=;\s*$|\$\$)/gim)) {
        if (!/security definer/i.test(m[0])) continue;
        expect(sql, `${f}: ${m[1]} is definer in public`).not.toMatch(
          new RegExp(`grant execute on function ${m[1]!.replace('.', '\\.')}\\s*\\([^;]*?\\)\\s*to[^;]*\\bauthenticated\\b`, 'i'),
        );
      }
    }
  });

  it('every table created after the base migration enables RLS and has at least one policy', () => {
    for (const f of files.slice(1)) {
      const sql = read(f);
      for (const t of sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi))
        expect(sql, `${f}: ${t[1]} has no policy`).toMatch(new RegExp(`create policy \\w+ on public\\.${t[1]}\\b`, 'i'));
    }
  });
});
