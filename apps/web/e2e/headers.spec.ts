import { expect, test } from '@playwright/test';

test('the framework is not advertised (no x-powered-by)', async ({ request }) => {
  for (const path of ['/', '/en', '/nope']) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.headers()['x-powered-by'], path).toBeUndefined();
  }
});
