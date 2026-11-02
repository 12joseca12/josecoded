import { mkdirSync, writeFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** working-agreements §16.4: serious and critical violations fail; the rest is for the report. */
export async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
}

/**
 * Axe over one page or one region (`include`: a selector): serious and critical violations fail the
 * test (blocking, working-agreements §16.4); the moderate and minor ones go to
 * `test-results/axe-<name>.json` for the report of the PR. `name` identifies the scene or screen
 * (and the viewport, so the three runs of a scene do not overwrite each other). `freeze` switches off
 * animations and transitions first, for pages whose pieces animate in with the scroll.
 */
export async function expectNoAxeViolations(
  page: Page,
  { name, include, freeze = false }: { name: string; include?: string; freeze?: boolean },
) {
  // `freeze`: scroll-driven entries and exits and running transitions fade pieces out; axe would read the
  // half-transparent colour as low contrast. The reduced-motion run covers the static look as well.
  // (cancelled through the Web Animations API: the production CSP forbids injecting a stylesheet)
  if (freeze) await page.evaluate(() => document.getAnimations().forEach((animation) => animation.cancel()));
  const builder = new AxeBuilder({ page }).withTags(TAGS);
  const { violations } = await (include ? builder.include(include) : builder).analyze();
  const rest = violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical');
  if (rest.length > 0) {
    mkdirSync('test-results', { recursive: true });
    writeFileSync(`test-results/axe-${name}.json`, JSON.stringify(rest, null, 2));
  }
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
}
