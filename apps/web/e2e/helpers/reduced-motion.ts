import type { Page } from '@playwright/test';

/** Everything the page prints to the console as an error, and every uncaught exception, while a test runs. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    // a missing favicon is not the page's error; dev-only React hydration notes are not either
    if (message.type() === 'error' && !/favicon|Failed to load resource|hydrat/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}

/** React stores its props on a DOM node when it hydrates it: interactions before that do nothing. */
export async function hydrated(page: Page, selector: string) {
  await page.waitForFunction(
    (sel) => Object.keys(document.querySelector(sel) ?? {}).some((key) => key.startsWith('__reactProps')),
    selector,
  );
}
