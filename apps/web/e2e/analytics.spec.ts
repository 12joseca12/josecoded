import { expect, test } from '@playwright/test';

// Task 2.12: the tracker reaches Umami with typed events. A stand-in `window.umami` records the calls (the build under
// test has no Umami instance configured, which is also what makes `track` a no-op there).
type Recorded = [string, unknown];
const events = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __events: Recorded[] }).__events);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __events: Recorded[]; umami: { track: (name: string, data?: unknown) => void } };
    w.__events = [];
    w.umami = { track: (name, data) => void w.__events.push([name, data]) };
  });
});

test('the intro reports intro_played with how it ran', async ({ page }) => {
  await page.goto('/?intro');
  // the intro waits for the scene (software GL in CI is slow) and then falls: hero.spec allows it 8 s, so 5 s was too tight
  await expect
    .poll(async () => (await events(page)).map(([name]) => name), { timeout: 15_000 })
    .toContain('intro_played');
  const [, data] = (await events(page)).find(([name]) => name === 'intro_played') as Recorded;
  expect(data).toMatchObject({ skipped: expect.any(Boolean), reduced: false, mode: expect.stringMatching(/^(full|letters)$/) });
});
