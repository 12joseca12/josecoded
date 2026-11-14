import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import { hydrated } from "./support/hydrated";

interface BarMessages {
  chat: {
    nexoBar: {
      region: string;
      waitingTitle: string;
      countdownTitle: string;
      activeTitle: string;
      stop: string;
      stoppedTitle: string;
      announceStopped: string;
    };
  };
}

const { nexoBar } = (JSON.parse(readFileSync("messages/es.json", "utf8")) as BarMessages).chat;

test.describe("nexo bar on the dev page", () => {
  test.skip(process.env.ENABLE_DEV_PAGES !== "true", "dev pages are disabled");

  test("shows its states, is accessible and passes axe", async ({ page }) => {
    await page.goto("/es/dev/chat");
    await hydrated(page.getByTestId("nexo-bar-demo"));
    const demo = page.getByTestId("nexo-bar-demo");
    await expect(demo.getByRole("group", { name: nexoBar.region })).toHaveCount(6);

    const waiting = demo.locator('[data-state="waiting"]');
    await expect(waiting.getByText(nexoBar.waitingTitle)).toBeVisible();
    await expect(waiting.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    await expect(waiting.getByTestId("nexo-bar-time")).toHaveCount(0);

    const countdown = demo.locator('[data-state="countdown"]');
    await expect(countdown.getByText(nexoBar.countdownTitle)).toBeVisible();
    await expect(countdown.getByTestId("nexo-bar-time")).toHaveText(/^[67]:\d\d$/);
    await expect(countdown.getByTestId("nexo-bar-time")).toHaveAttribute("aria-hidden", "true");
    await expect(countdown.getByText(/^unos [78] minutos$/)).toHaveCount(1);
    await expect(countdown.getByRole("switch")).toHaveAttribute("aria-checked", "true");

    const active = demo.locator('[data-state="active"]');
    await expect(active.getByText(nexoBar.activeTitle)).toBeVisible();
    await expect(active.getByTestId("nexo-bar-time")).toHaveCount(0);
    await expect(active.getByRole("switch")).toHaveCount(0);
    const stop = active.getByRole("button", { name: nexoBar.stop });
    await expect(stop).toBeEnabled();

    const stopping = demo.locator('[data-state="stopping"]').getByRole("button");
    await expect(stopping).toHaveAttribute("aria-busy", "true");
    await expect(stopping).toBeDisabled();

    const stopped = demo.locator('[data-state="stopped"]');
    await expect(stopped.getByText(nexoBar.stoppedTitle)).toBeVisible();
    await expect(stopped.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await expect(stopped.getByRole("button")).toHaveCount(0);

    const results = await new AxeBuilder({ page })
      .include('[data-testid="nexo-bar-demo"]')
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("keeps focus on the text and announces the phase when stopped", async ({ page }) => {
    await page.goto("/es/dev/chat");
    const live = page.getByTestId("nexo-bar-demo").locator('[data-state="live"]');
    await hydrated(live);
    await live.getByRole("button", { name: nexoBar.stop }).click();
    await expect(live.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await expect(page.locator(":focus")).toContainText(nexoBar.stoppedTitle);
    await expect(live.getByRole("status")).toContainText(nexoBar.announceStopped);

    await live.getByRole("switch").click();
    await expect(live.getByText(nexoBar.waitingTitle)).toBeVisible();
    await expect(live.getByRole("switch")).toBeFocused();
  });
});

test.describe("nexo bar stays hidden for visitors", () => {
  test("is not rendered on /es/contacto", async ({ page }) => {
    await page.goto("/es/contacto");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("group", { name: nexoBar.region })).toHaveCount(0);
    await expect(page.getByRole("button", { name: nexoBar.stop })).toHaveCount(0);
  });
});
