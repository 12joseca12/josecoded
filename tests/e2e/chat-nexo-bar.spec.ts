import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { hydrated } from "./support/hydrated";

interface BarMessages {
  chat: { nexoBar: { region: string; stop: string; stoppedTitle: string; stoppedText: string } };
}

const { nexoBar } = (JSON.parse(readFileSync("messages/es.json", "utf8")) as BarMessages).chat;

test.describe("nexo bar on the dev page", () => {
  test.skip(process.env.ENABLE_DEV_PAGES !== "true", "dev pages are disabled");

  test("shows its states, is accessible and passes axe", async ({ page }) => {
    await page.goto("/es/dev/chat");
    await hydrated(page.getByTestId("nexo-bar-demo"));
    const demo = page.getByTestId("nexo-bar-demo");
    const regions = demo.getByRole("group", { name: nexoBar.region });
    await expect(regions).toHaveCount(3);

    const active = demo.locator('[data-state="active"]');
    await expect(active.getByTestId("nexo-bar-time")).toHaveText(/^0[67]:\d\d$/);
    const stop = active.getByRole("button", { name: nexoBar.stop });
    await expect(stop).toBeEnabled();
    await stop.focus();
    await expect(stop).toBeFocused();

    const stopping = demo.locator('[data-state="stopping"]').getByRole("button");
    await expect(stopping).toHaveAttribute("aria-busy", "true");
    await expect(stopping).toBeDisabled();

    const stopped = demo.locator('[data-state="stopped"]');
    await expect(stopped.getByText(nexoBar.stoppedTitle)).toBeVisible();
    await expect(stopped.getByRole("button")).toHaveCount(0);

    const results = await new AxeBuilder({ page })
      .include('[data-testid="nexo-bar-demo"]')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("nexo bar stays hidden for visitors", () => {
  for (const path of ["/es", "/es/contacto"]) {
    test(`is not rendered on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("group", { name: nexoBar.region })).toHaveCount(0);
      await expect(page.getByRole("button", { name: nexoBar.stop })).toHaveCount(0);
    });
  }
});
