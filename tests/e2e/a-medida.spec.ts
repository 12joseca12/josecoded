import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  offersPage: {
    compare: { tabsLabel: string; tabWeb: string; tabApp: string; title: string };
    recommender: {
      next: string;
      back: string;
      see: string;
      required: string;
      progress: string;
      progressDone: string;
      questions: Record<string, { legend: string; options: Record<string, { label: string }> }>;
      result: {
        change: string;
        cta: string;
        freelanceTitle: string;
        assumedTitle: string;
        update: string;
      };
    };
    extras: { legend: string; cta: string };
    warranty: { includedTitle: string };
  };
};

const offers = es.offersPage;
const rec = offers.recommender;
const page_ = "/es/servicios/a-medida";
const scratch = process.env.SCREENSHOT_DIR;

const option = (question: string, value: string) =>
  rec.questions[question]?.options[value]?.label ?? value;
const legend = (question: string) => rec.questions[question]?.legend ?? question;

async function pick(page: Page, question: string, ...values: string[]) {
  const group = page.locator("#recomendador fieldset");
  await expect(group.locator("legend")).toHaveText(legend(question));
  for (const value of values) await group.getByLabel(option(question, value)).check();
  await page
    .locator("#recomendador")
    .getByRole("button", { name: question === "more" ? rec.see : rec.next })
    .click();
}

async function runFlow(page: Page, answers: [string, string[]][]) {
  for (const [question, values] of answers) await pick(page, question, ...values);
}

const webFlow: [string, string[]][] = [
  ["start", ["idea"]],
  ["kind", ["web"]],
  ["size", ["medium"]],
  ["accounts", ["basic"]],
  ["management", ["me"]],
  ["more", ["payments"]],
];

const result = (page: Page) => page.locator("#recomendador [data-route]");
const card = (page: Page, slug: string) => page.locator(`[data-offer='${slug}']`);

test("permanent redirect from the old packs URL, keeping the anchor and the query", async ({
  page,
  request,
}) => {
  const direct = await request.get("/es/servicios/packs", { maxRedirects: 0 });
  expect(direct.status()).toBe(308);
  expect(direct.headers().location).toMatch(/\/es\/servicios\/a-medida$/);
  const bare = await request.get("/servicios/packs", { maxRedirects: 0 });
  expect(bare.status()).toBe(308);
  expect(bare.headers().location).toMatch(/\/es\/servicios\/a-medida$/);
  const withQuery = await request.get("/es/servicios/packs?q=idea.web", { maxRedirects: 0 });
  expect(withQuery.headers().location).toContain("/es/servicios/a-medida?q=idea.web");

  await page.goto("/es/servicios/packs#comparador");
  await expect(page).toHaveURL(/\/es\/servicios\/a-medida#comparador$/);
  await expect(page.locator("#comparador")).toBeInViewport();
});

test("keeps the search queries in the title, the h1 and the h2", async ({ page }) => {
  await page.goto(page_);
  await expect(page).toHaveTitle(/Precio de app móvil/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Precio de app móvil");
  await expect(page.locator("#comparador").getByRole("heading", { level: 2 })).toContainText(
    "Presupuesto de app",
  );
  await expect(page.locator("#recomendador").getByRole("heading", { level: 2 })).toBeVisible();
});

test.describe("comparator", () => {
  test("tabs switch between web and app with the keyboard", async ({ page }) => {
    await page.goto(page_);
    const tabs = page.getByRole("tablist", { name: offers.compare.tabsLabel });
    const web = tabs.getByRole("tab", { name: offers.compare.tabWeb });
    const app = tabs.getByRole("tab", { name: offers.compare.tabApp });
    await expect(web).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#comparador [data-offer]:visible")).toHaveCount(3);
    await web.focus();
    await page.keyboard.press("ArrowRight");
    await expect(app).toBeFocused();
    await expect(app).toHaveAttribute("aria-selected", "true");
    await expect(web).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#comparador [data-offer]:visible")).toHaveCount(2);
    await expect(page.getByRole("tabpanel")).toHaveCount(1);
    await page.keyboard.press("ArrowRight");
    await expect(web).toBeFocused();
    await page.keyboard.press("End");
    await expect(app).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(web).toHaveAttribute("aria-selected", "true");
  });

  test("every tier lists audience, inclusions, exclusions, delivery and a provisional price", async ({
    page,
  }) => {
    await page.goto(page_);
    await expect(page.locator("#comparador [data-offer]")).toHaveCount(5);
    const negocio = card(page, "web-negocio");
    await expect(negocio.getByRole("heading", { level: 3 })).toHaveText("Negocio");
    await expect(negocio.locator("ul").first().locator("li")).toHaveCount(4);
    await expect(negocio.locator("ul").nth(1).locator("li")).toHaveCount(3);
    await expect(negocio).toContainText("4–6 semanas");
    await expect(negocio.locator("[data-provisional]")).toBeVisible();
    await expect(negocio.getByRole("link")).toHaveAttribute(
      "href",
      "/es/contacto?via=project&offer=web-negocio#formulario",
    );
  });

  test("without JavaScript both platforms are listed and the tabs are gone", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(page_);
    await expect(page.getByRole("tablist")).toBeHidden();
    await expect(page.locator("#comparador [data-offer]:visible")).toHaveCount(5);
    await context.close();
  });
});

test.describe("extras", () => {
  test("lists the twelve extras with where they come included", async ({ page }) => {
    await page.goto(page_);
    const chips = page.locator("#extras [data-extra]");
    await expect(chips).toHaveCount(12);
    await expect(page.locator("#extras [data-extra='admin']")).toContainText("Incluido en:");
    await expect(page.locator("#extras [data-extra='payments']")).toContainText(
      "No va incluido en ningún nivel",
    );
  });

  for (const scripting of [true, false]) {
    test(`chosen extras reach the contact form summary ${scripting ? "with" : "without"} JavaScript`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: scripting });
      const page = await context.newPage();
      await page.goto(page_);
      const extras = page.locator("#extras");
      await extras.getByLabel(/Cobros con Stripe/).check();
      await extras.getByLabel(/Posicionamiento/).check();
      await extras.getByRole("button", { name: offers.extras.cta }).click();
      await expect(page).toHaveURL(
        /\/es\/contacto\?via=project&extras=payments&extras=seo#formulario$/,
      );
      const chip = page.getByTestId("selection-chip");
      await expect(chip).toContainText("Cobros con Stripe");
      await expect(chip).toContainText("Posicionamiento");
      await expect(chip).toContainText("000");
      await context.close();
    });
  }
});

test("shows the warranty and the three maintenance plans", async ({ page }) => {
  await page.goto(page_);
  const section = page.locator("#garantia");
  await expect(section).toContainText(offers.warranty.includedTitle);
  await expect(section.locator("[data-plan]")).toHaveCount(3);
  await expect(section.locator("[data-plan] [data-provisional]")).toHaveCount(3);
});

test.describe("recommender", () => {
  test("walks the six questions and ends on a result with the CTA prefilled", async ({ page }) => {
    await page.goto(page_);
    const section = page.locator("#recomendador");
    await expect(section.getByRole("img", { name: "Paso 1 de 6" })).toBeVisible();
    await expect(section.getByRole("img", { name: "Paso 1 de 6" })).toContainText("1/6");
    await pick(page, "start", "idea");
    await expect(section.getByRole("img", { name: "Paso 2 de 6" })).toContainText("2/6");
    await expect(section.getByText("Paso 2 de 6", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\?q=idea$/);
    await expect(section.locator("legend")).toBeFocused();
    await runFlow(page, webFlow.slice(1));

    await expect(result(page)).toBeFocused();
    await expect(page).toHaveURL(/\?q=idea\.web\.medium\.basic\.me\.payments$/);
    await expect(section.getByRole("img", { name: rec.progressDone })).toContainText("6/6");
    await expect(card(page, "web-negocio").last()).toBeVisible();
    await expect(section.getByTestId("result-price")).toContainText("000");
    await expect(section.getByTestId("result-cta")).toHaveAttribute(
      "href",
      "/es/contacto?via=project&offer=web-negocio&extras=accounts,payments#formulario",
    );

    await section.getByTestId("result-cta").click();
    await expect(page).toHaveURL(
      /\/es\/contacto\?via=project&offer=web-negocio&extras=accounts,payments#formulario$/,
    );
    const chip = page.getByTestId("selection-chip");
    await expect(chip).toContainText("Negocio");
    await expect(chip).toContainText("Cuentas y permisos");
    await expect(chip).toContainText("Cobros con Stripe");
    await expect(page.locator("#formulario input[name='way'][value='project']")).toBeChecked();
  });

  test("the result survives a reload and the browser back button walks the steps", async ({
    page,
  }) => {
    await page.goto(`${page_}?q=idea.web.medium.basic.me.payments`);
    await expect(result(page)).toBeVisible();
    await page.reload();
    await expect(result(page)).toBeVisible();
    await page.goto(page_);
    await pick(page, "start", "idea");
    await pick(page, "kind", "web");
    await page.goBack();
    await expect(page.locator("#recomendador fieldset legend")).toHaveText(legend("kind"));
    await page.goBack();
    await expect(page.locator("#recomendador fieldset legend")).toHaveText(legend("start"));
    await page.goForward();
    await expect(page.locator("#recomendador fieldset legend")).toHaveText(legend("kind"));
  });

  test("asks for an answer and offers back and review", async ({ page }) => {
    await page.goto(page_);
    const section = page.locator("#recomendador");
    await section.getByRole("button", { name: rec.next }).click();
    await expect(section.getByRole("alert")).toHaveText(rec.required);
    await expect(section.locator("fieldset")).toHaveAttribute(
      "aria-describedby",
      /recommender-error/,
    );
    await pick(page, "start", "idea");
    await section.getByRole("link", { name: rec.back }).click();
    await expect(section.locator("legend")).toHaveText(legend("start"));
    await expect(section.getByLabel(option("start", "idea"))).toBeChecked();
    await page.goto(`${page_}?q=idea.web.medium.basic.me.payments`);
    await result(page).getByRole("link", { name: rec.result.change }).click();
    await expect(section.locator("legend")).toHaveText(legend("start"));
    await expect(page).toHaveURL(/paso=1/);
    await expect(section.getByLabel(option("start", "idea"))).toBeChecked();
  });

  test("edits the extras live and keeps them in the URL and the CTA", async ({ page }) => {
    await page.goto(`${page_}?q=idea.web.medium.none.rare.-`);
    const section = page.locator("#recomendador");
    await expect(section.getByRole("button", { name: rec.result.update })).toBeHidden();
    await section.getByLabel("Cobros con Stripe").check();
    await section.getByLabel("Mantenimiento").check();
    await expect(page).toHaveURL(/q=idea\.web\.medium\.none\.rare\.-\.payments_maintenance$/);
    await expect(section.getByTestId("result-cta")).toHaveAttribute(
      "href",
      "/es/contacto?via=project&offer=web-negocio&extras=payments,maintenance#formulario",
    );
    await expect(section.getByTestId("result-price")).toContainText("/mes");
    await section.getByLabel("Cobros con Stripe").uncheck();
    await expect(section.getByTestId("result-cta")).toHaveAttribute(
      "href",
      "/es/contacto?via=project&offer=web-negocio&extras=maintenance#formulario",
    );
  });

  test("web and app together recommend two tiers and preselect maintenance", async ({ page }) => {
    await page.goto(`${page_}?q=idea.both.small.none.rare.-`);
    await expect(card(page, "web-presencia").last()).toBeVisible();
    await expect(card(page, "app-primera-version").last()).toBeVisible();
    await expect(page.getByTestId("result-cta")).toHaveAttribute(
      "href",
      "/es/contacto?via=project&offer=web-presencia,app-primera-version&extras=maintenance#formulario",
    );
  });

  test("an unsure answer is flagged as assumed and offers a talk", async ({ page }) => {
    await page.goto(page_);
    await runFlow(page, [
      ["start", ["idea"]],
      ["kind", ["unsure"]],
      ["size", ["unsure"]],
      ["accounts", ["none"]],
      ["management", ["rare"]],
      ["more", []],
    ]);
    const section = page.locator("#recomendador");
    await expect(result(page)).toContainText(offers.recommender.result.assumedTitle);
    await expect(section.getByRole("link", { name: "Prefiero hablarlo primero" })).toHaveAttribute(
      "href",
      "/es/contacto?via=project#formulario",
    );
    await expect(card(page, "web-negocio").last()).toBeVisible();
  });

  test("an existing product goes to the freelance route and never gets a tier", async ({
    page,
  }) => {
    await page.goto(page_);
    await pick(page, "start", "existing");
    await expect(result(page)).toContainText(rec.result.freelanceTitle);
    await expect(page).toHaveURL(/\?q=existing$/);
    await expect(result(page).getByRole("link", { name: "Ver freelance" })).toHaveAttribute(
      "href",
      "/es/servicios/freelance",
    );
    await expect(result(page).locator("[data-offer]")).toHaveCount(0);
  });

  test("works without JavaScript through plain GET forms", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(page_);
    await runFlow(page, webFlow);
    await expect(page).toHaveURL(/\?q=idea\.web\.medium\.basic\.me\.payments#recomendador$/);
    await expect(result(page)).toBeVisible();
    await expect(page.getByTestId("result-cta")).toHaveAttribute(
      "href",
      "/es/contacto?via=project&offer=web-negocio&extras=accounts,payments#formulario",
    );
    const section = page.locator("#recomendador");
    await section.getByLabel("Cobros con Stripe").uncheck();
    await section.getByRole("button", { name: rec.result.update }).click();
    await expect(page).toHaveURL(
      /q=idea\.web\.medium\.basic\.me\.payments\.accounts#recomendador$/,
    );
    await expect(page.getByTestId("result-cta")).toHaveAttribute(
      "href",
      "/es/contacto?via=project&offer=web-negocio&extras=accounts#formulario",
    );
    await section.getByRole("link", { name: rec.result.change }).click();
    await expect(section.locator("legend")).toHaveText(legend("start"));
    await context.close();
  });

  test("the recommendation URLs are not indexable", async ({ page }) => {
    await page.goto(`${page_}?q=idea.web`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/es\/servicios\/a-medida$/,
    );
  });
});

test.describe("Nexo in the recommender", () => {
  const nexo = (page: Page) => page.locator("#recomendador aside");

  test("greets, explains, listens, thinks and celebrates", async ({ page }) => {
    await page.goto(page_);
    await page.locator("#recomendador").scrollIntoViewIfNeeded();
    await expect(nexo(page)).toHaveAttribute("data-nexo-state", "greeting");
    await expect(nexo(page)).toContainText("asistente");
    await expect(nexo(page)).toContainText("no una persona");
    await expect(nexo(page)).toHaveAttribute("data-nexo-state", "talking");

    await page.getByLabel(option("start", "idea")).hover();
    await expect(nexo(page)).toHaveAttribute("data-nexo-state", "listening");
    await page.getByLabel(option("start", "idea")).check();
    const next = page.locator("#recomendador").getByRole("button", { name: rec.next });
    await next.focus();
    await page.mouse.move(0, 0);
    await page.keyboard.press("Enter");
    await expect(nexo(page)).toHaveAttribute("data-nexo-state", "talking");

    await page.getByLabel(option("kind", "unsure")).check();
    await expect(nexo(page)).toContainText("parto de lo más habitual");
    await expect(nexo(page)).toHaveAttribute("data-nexo-state", "listening");

    await page.getByLabel(option("kind", "web")).check();
    await page.locator("#recomendador").getByRole("button", { name: rec.next }).click();
    await runFlow(page, [
      ["size", ["medium"]],
      ["accounts", ["none"]],
      ["management", ["rare"]],
    ]);
    await page.getByLabel(option("more", "payments")).check();
    await page.locator("#recomendador").getByRole("button", { name: rec.see }).click();
    await expect(nexo(page)).toHaveAttribute("data-nexo-state", "thinking");
    await expect(nexo(page)).toHaveAttribute("data-nexo-state", "happy");
    await expect(nexo(page)).toContainText("Esta es mi recomendación");
  });

  test("the avatar and the motion library load only once the recommender is near", async ({
    page,
  }) => {
    const motionMarker = "data-framer-appear-id";
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
    await page.goto(page_);
    await page.waitForLoadState("networkidle");
    expect((await Promise.all(pending)).filter(Boolean)).toEqual([]);
    await expect(page.locator("#recomendador aside svg")).toHaveCount(0);
    await page.locator("#recomendador").scrollIntoViewIfNeeded();
    await expect(page.locator("#recomendador aside svg[role='img']")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect((await Promise.all(pending)).filter(Boolean).length).toBeGreaterThan(0);
  });

  test("the avatar has an accessible name that says it is an assistant", async ({ page }) => {
    await page.goto(page_);
    await page.locator("#recomendador").scrollIntoViewIfNeeded();
    await expect(
      page.locator("#recomendador aside").getByRole("img", { name: /asistente/i }),
    ).toBeVisible();
  });
});

for (const width of [1440, 375]) {
  test(`has no axe violations on the page, a step and a result at ${width}`, async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width, height: 900 });
    const scan = async () => {
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    };
    await page.goto(page_);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scan();
    await page.getByRole("tab", { name: offers.compare.tabApp }).click();
    await scan();
    await page.goto(`${page_}?q=idea.web`);
    await page.locator("#recomendador").scrollIntoViewIfNeeded();
    await scan();
    await page.goto(`${page_}?q=idea.both.medium.basic.me.payments_seo`);
    await expect(result(page)).toBeVisible();
    await scan();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);
  });
}

test("takes the review screenshots", async ({ page }) => {
  test.skip(scratch === undefined, "SCREENSHOT_DIR is not set");
  const shot = (name: string) => `${scratch ?? ""}/amedida-${name}.png`;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(page_);
  await page.screenshot({ path: shot("page"), fullPage: true });
  await page.goto(`${page_}?q=idea.web.medium`);
  await page.locator("#recomendador").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator("#recomendador").screenshot({ path: shot("step") });
  await page.goto(`${page_}?q=idea.both.medium.basic.me.payments_seo`);
  await page.locator("#recomendador").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator("#recomendador").screenshot({ path: shot("result") });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${page_}?q=idea.web.medium.basic`);
  await page.locator("#recomendador").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: shot("mobile") });
  await page.goto(page_);
  await page.screenshot({ path: shot("mobile-page"), fullPage: true });
});
