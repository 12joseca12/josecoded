import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../schema/baseline.sql', import.meta.url), 'utf8');
const meta = JSON.parse(readFileSync(new URL('../schema/baseline.meta.json', import.meta.url), 'utf8'));
it('baseline has the 21 inherited public tables and no radar_* tables', () => {
  const tables = [...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"?public"?\."?(\w+)"?/g)].map(m => m[1]);
  expect(tables).toHaveLength(21);
  for (const t of ['staff_members','leads','clients','client_tasks','client_assets','pack_templates','pack_extras','admin_chat_conversations','admin_chat_messages','blog_posts']) expect(tables).toContain(t);
  expect(tables.some(t => t.startsWith('radar_'))).toBe(false);
  expect(tables).not.toContain('admin_superusers');
});
it('baseline has 47 policies and the staff_role_of function', () => {
  expect((sql.match(/CREATE POLICY/g) ?? []).length).toBe(meta.policies);
  expect(meta.policies).toBe(47);
  expect(sql).toMatch(/FUNCTION "?private"?\."?staff_role_of"?/);
});
it('baseline contains no data', () => { expect(sql).not.toMatch(/^INSERT INTO/m); expect(sql).not.toMatch(/COPY .* FROM stdin/); });
