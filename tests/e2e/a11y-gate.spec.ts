import { readFileSync } from "node:fs";

import { expect, type Locator, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as {
  nav: { menuOpen: string; cta: string };
  errors: { notFound: { title: string } };
  nexoChat: { send: string };
  offersPage: { recommender: { next: string } };
};

type Rgb = [number, number, number];

const parse = (value: string): Rgb => {
  const match = /rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/.exec(value);
  if (!match) throw new Error(`unparsable colour ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

const luminance = ([r, g, b]: Rgb) => {
  const [lr = 0, lg = 0, lb = 0] = [r, g, b].map((channel) => {
    const unit = channel / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};

const token = (page: Page, name: string) =>
  page.evaluate((property) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${property})`;
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);

const color = (locator: Locator, property: "color" | "outlineColor") =>
  locator.evaluate((node, key) => getComputedStyle(node)[key], property);

for (const width of [320, 359, 390]) {
  test(`the header fits and the menu opens at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 });
    await page.goto("/es");
    const trigger = page.getByRole("button", { name: es.nav.menuOpen });
    await expect(trigger).toBeVisible();
    const box = await trigger.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? -1) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    const barRight = await page
      .getByRole("banner")
      .evaluate((node) => node.firstElementChild?.getBoundingClientRect().right ?? 0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(barRight);
    if (width < 360) {
      const document_ = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(document_).toBeLessThanOrEqual(width);
    }
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("link").first()).toBeVisible();
  });
}

test("the sign-in page does not overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/es/entrar");
  const widget = page.locator("[data-fake-turnstile] > div").first();
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(320);
});

test("the career dates use a text colour with 4.5:1 on the page background", async ({ page }) => {
  await page.goto("/es/sobre-mi");
  const period = page.locator('#trayectoria [class*="period"]').first();
  const ink = parse(await color(period, "color"));
  for (const surface of ["--bg", "--panel"]) {
    expect(contrast(ink, parse(await token(page, surface)))).toBeGreaterThanOrEqual(4.5);
  }
});

test("the focus ring inside the Nexo card is charcoal with 3:1 on coral", async ({ page }) => {
  await page.goto("/es/servicios/a-medida");
  const send = page.getByRole("button", { name: es.nexoChat.send, exact: true });
  await send.scrollIntoViewIfNeeded();
  await send.focus();
  await expect(send).toBeFocused();
  const ring = parse(await color(send, "outlineColor"));
  expect(contrast(ring, parse(await token(page, "--coral")))).toBeGreaterThanOrEqual(3);
});

test("every focus ring on the contact page has 3:1 on its surface", async ({ page }) => {
  await page.goto("/es/contacto");
  const items = page.locator("main a[href], main button, footer a[href]");
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  const fallback = parse(await token(page, "--bg"));
  for (let index = 0; index < count; index += 1) {
    const item = items.nth(index);
    if (!(await item.isVisible())) continue;
    await item.focus();
    const measured = await item.evaluate((node) => {
      const ring = getComputedStyle(node).outlineColor;
      let surface: string | null = null;
      for (let up: Element | null = node.parentElement; up; up = up.parentElement) {
        const background = getComputedStyle(up).backgroundColor;
        if (!/rgba\(.*,\s*0\)$/.test(background) && background !== "transparent") {
          surface = background;
          break;
        }
      }
      return { ring, surface };
    });
    const surface = measured.surface ? parse(measured.surface) : fallback;
    expect(contrast(parse(measured.ring), surface)).toBeGreaterThanOrEqual(3);
  }
});

test("the footer note has 4.5:1 on the page background", async ({ page }) => {
  await page.goto("/es");
  const note = page.locator('footer [class*="note"]');
  const ink = parse(await color(note, "color"));
  for (const surface of ["--bg", "--bg-deep"]) {
    expect(contrast(ink, parse(await token(page, surface)))).toBeGreaterThanOrEqual(4.5);
  }
});

test("the 404 page has its own title and passes axe", async ({ page }) => {
  await page.goto("/es/no-existe");
  await expect(page).toHaveTitle(new RegExp(`^${es.errors.notFound.title}`));
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("Enter on an extra does not submit the form", async ({ page }) => {
  await page.goto("/es/servicios/a-medida?q=idea.web.medium.basic.me.payments");
  const extra = page.locator('#recomendador input[name="e"]').first();
  await extra.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      extra.evaluate(
        (node) =>
          !node.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
          ),
      ),
    )
    .toBe(true);
  await expect(async () => {
    await extra.focus();
    await page.evaluate(() => {
      (window as unknown as { marker: number }).marker = 1;
    });
    await page.keyboard.press("Enter");
    await page.waitForLoadState("load");
    await expect(extra).toBeFocused({ timeout: 1000 });
    expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
    expect(page.url()).not.toContain("x=1");
  }).toPass();
});

test("a missing answer marks the radios as invalid", async ({ page }) => {
  await page.goto("/es/servicios/a-medida");
  const section = page.locator("#recomendador");
  const radios = section.locator('input[type="radio"]');
  await expect(radios.first()).not.toHaveAttribute("aria-invalid", "true");
  await section.getByRole("button", { name: es.offersPage.recommender.next }).click();
  await expect(section.getByRole("alert")).toBeVisible();
  const count = await radios.count();
  for (let index = 0; index < count; index += 1) {
    await expect(radios.nth(index)).toHaveAttribute("aria-invalid", "true");
  }
});

test("the contact chooser only references its panel once it exists", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/es");
  const trigger = page.locator("[data-chooser-trigger]");
  await expect(trigger).toBeVisible();
  const before = await trigger.getAttribute("aria-controls");
  if (before !== null) expect(await page.locator(`#${before}`).count()).toBe(1);
  await trigger.click();
  const controls = await trigger.getAttribute("aria-controls");
  expect(controls).not.toBeNull();
  await expect(page.locator(`#${controls ?? ""}`)).toHaveCount(1);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no animation or transition runs for longer than a frame", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document
              .getAnimations()
              .filter((animation) => {
                const timing = animation.effect?.getComputedTiming();
                const duration = Number(timing?.duration ?? 0);
                const iterations = timing?.iterations ?? 1;
                return duration > 50 || iterations > 1;
              })
              .map((animation) => animation.id || animation.constructor.name).length,
        ),
      )
      .toBe(0);
  });

  test("the nav indicator does not slide", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/es");
    const indicator = page.getByRole("banner").locator('[class*="indicator"]');
    const duration = await indicator.evaluate((node) => getComputedStyle(node).transitionDuration);
    for (const part of duration.split(",")) {
      expect(parseFloat(part) * (part.trim().endsWith("ms") ? 1 : 1000)).toBeLessThanOrEqual(50);
    }
  });
});

test.describe("touch targets", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the contact button and the footer links reach 44px", async ({ page }) => {
    await page.goto("/es");
    const cta = page.locator("[data-chooser-trigger]");
    await expect(cta).toBeVisible();
    expect((await cta.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    const links = page.locator("footer nav a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const box = await links.nth(index).boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test("the Nexo chips reach 44px", async ({ page }) => {
    await page.goto("/es/servicios/a-medida");
    const chips = page.locator(
      '[class*="NexoFaqChat"] [class*="chip"], [class*="chip"][type="button"]',
    );
    const chip = chips.first();
    await chip.scrollIntoViewIfNeeded();
    expect((await chip.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
