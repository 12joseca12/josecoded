import { expect, type Page, test } from "@playwright/test";

const motionMarker = "data-framer-appear-id";

async function scriptsContainingMotion(page: Page, path: string) {
  const pending: Promise<string | null>[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() !== "script") return;
    pending.push(
      response
        .text()
        .then((body) => (body.includes(motionMarker) ? response.url() : null))
        .catch(() => null),
    );
  });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  return (await Promise.all(pending)).filter((url) => url !== null);
}

for (const path of ["/es", "/en", "/es/servicios", "/es/proyectos"]) {
  test(`${path} never loads the motion library`, async ({ page }) => {
    expect(await scriptsContainingMotion(page, path)).toEqual([]);
  });
}

test("the Nexo showcase does load the motion library, so the guard is meaningful", async ({
  page,
}) => {
  test.skip(process.env.ENABLE_DEV_PAGES !== "true", "dev pages are disabled");
  const loaded = await scriptsContainingMotion(page, "/es/dev/nexo");
  expect(loaded.length).toBeGreaterThan(0);
});

test("only the main preview animates in the showcase", async ({ page }) => {
  test.skip(process.env.ENABLE_DEV_PAGES !== "true", "dev pages are disabled");
  await page.goto("/es/dev/nexo");
  await expect(page.getByTestId("preview").locator("svg")).not.toHaveAttribute("data-paused");
  await expect(page.getByTestId("gallery").locator("svg").first()).toHaveAttribute(
    "data-paused",
    "true",
  );
  await expect(page.getByTestId("sizes").locator("svg").first()).toHaveAttribute(
    "data-paused",
    "true",
  );
});
