/**
 * The one serializer of the published catalogue: keys sorted at every level, arrays in order, two spaces, a final
 * newline. `pricing:pull` (local) and the gateway's bot (task 3.8c, `buildTree`) both write `content/pricing.json`
 * with it, so the same catalogue is the same bytes whoever commits it (Postgres `jsonb` does not keep key order).
 */
export function stableStringify(value: unknown): string {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, sortKeys(item)]),
    );
  }
  return value;
}
