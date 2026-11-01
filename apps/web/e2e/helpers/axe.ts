import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** working-agreements §16.4: serious and critical violations fail; the rest is for the report. */
export async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
}
