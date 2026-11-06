import { expect, type Locator } from "@playwright/test";

export async function hydrated(locator: Locator): Promise<void> {
  await expect
    .poll(() =>
      locator.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps$"))),
    )
    .toBe(true);
}
