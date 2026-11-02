import { expect, it } from 'vitest';

import { assertLocal, fileFromSnapshot } from '../scripts/pull';
import { pricing } from '../src';
import { stableStringify } from '../src/serialize';

it('writes the validated snapshot with the shared serializer', () => {
  expect(fileFromSnapshot(pricing)).toBe(stableStringify(pricing));
});

it('writes nothing for a snapshot that does not match the schema', () => {
  expect(() => fileFromSnapshot({ ...pricing, hourly: -1 })).toThrow();
  expect(() => fileFromSnapshot(null)).toThrow();
});

it('only reads a local Supabase: a production key never enters this script', () => {
  expect(() => assertLocal('http://127.0.0.1:54321')).not.toThrow();
  expect(() => assertLocal('http://localhost:54321')).not.toThrow();
  expect(() => assertLocal('https://echlwywbucgbhwpncviy.supabase.co')).toThrow(/local/);
});
