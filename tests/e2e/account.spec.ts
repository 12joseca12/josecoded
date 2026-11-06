import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import {
  mockOrigin as mock,
  openLogin,
  otpCode,
  requestCode,
  signInAdmin,
  signInClient,
  signInCloser,
  submitCode,
  type Tag,
  totpCode,
  withTag,
} from "./support/staff";

interface AccountMessages {
  auth: { totp: { codeLabel: string } };
  admin: { notifications: { telegram: { title: string } } };
  account: {
    title: string;
    menuLink: string;
    nav: { back: string };
    loading: { profile: string };
    error: { title: string; retry: string };
    profile: {
      title: string;
      nameLabel: string;
      emailLabel: string;
      localeLabel: string;
      save: string;
      saved: string;
      errors: Record<string, string>;
    };
    access: {
      title: string;
      googleLinked: string;
      googleNotLinked: string;
      others: string;
      othersDone: string;
      everywhere: string;
      everywhereConfirm: { yes: string; no: string };
    };
    security: {
      title: string;
      statusOn: string;
      change: string;
      codeLabel: string;
      confirm: string;
      cancel: string;
      done: string;
      wrongCode: string;
      errors: Record<string, string>;
    };
    notifications: { link: string };
    privacy: {
      title: string;
      policy: string;
      exportTitle: string;
      deletion: {
        title: string;
        request: string;
        confirm: { yes: string; no: string };
        pendingTitle: string;
        withdraw: string;
        done: string;
        withdrawn: string;
        unavailable: string;
        errors: Record<string, string>;
      };
    };
  };
  crm: { settings: { title: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as AccountMessages;
const { account } = es;

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.91" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function setMode(page: Page, mode: Record<string, unknown>) {
  await page.request.post(`${mock}/__auth/account-mode?tag=${tag.value}`, { data: mode });
}

async function calls(page: Page, key: string): Promise<unknown[]> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  return ((await response.json()) as Record<string, unknown[]>)[key] ?? [];
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function expectBothWidths(page: Page) {
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await expectClean(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  }
}

async function openAccount(page: Page) {
  await page.goto("/es/cuenta");
  await expect(page.getByRole("heading", { level: 1, name: account.title })).toBeVisible();
  await expect(section(page, account.profile.title)).toBeVisible();
}

function section(page: Page, name: string) {
  return page.getByRole("region", { name, exact: true });
}

test("an anonymous visitor is sent to log in and comes back to the account", async ({ page }) => {
  await page.goto("/es/cuenta");
  await expect(page).toHaveURL(/\/es\/entrar\?next=%2Fes%2Fcuenta$/);
  await openLogin(page, "?next=%2Fes%2Fcuenta");
  await requestCode(page, tag, "client@example.com");
  await submitCode(page, otpCode);
  await expect(page).toHaveURL(/\/es\/cuenta$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { level: 1, name: account.title })).toBeVisible();
});

test("a closer without the second factor is asked for it before the account", async ({ page }) => {
  await page.goto("/es/entrar?next=%2Fes%2Fcuenta");
  await openLogin(page, "?next=%2Fes%2Fcuenta");
  await requestCode(page, tag, "closer@example.com");
  await submitCode(page, otpCode);
  await expect(page).toHaveURL(/\/es\/entrar\/totp\?next=%2Fes%2Fcuenta$/);
});

test("a client reaches the account from the area menu and sees only what is theirs", async ({
  page,
}) => {
  await signInClient(page, tag);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("link", { name: account.menuLink }).first().click();
  await expect(page).toHaveURL(/\/es\/cuenta$/);
  await expect(page.getByRole("heading", { level: 1, name: account.title })).toBeVisible();

  await expect(section(page, account.profile.title)).toBeVisible();
  await expect(page.getByLabel(account.profile.emailLabel, { exact: true })).toHaveValue(
    /^client\+.*@example\.com$/,
  );
  await expect(
    section(page, account.access.title).getByText(account.access.googleNotLinked),
  ).toBeVisible();
  await expect(section(page, account.security.title)).toHaveCount(0);
  await expect(section(page, es.admin.notifications.telegram.title)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { level: 3, name: account.privacy.deletion.title }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: account.privacy.policy })).toHaveAttribute(
    "href",
    "/es/legal/privacidad",
  );
  await expectBothWidths(page);

  await page.getByRole("link", { name: account.nav.back }).first().click();
  await expect(page).toHaveURL(/\/es\/area$/);
});

test("a client edits the name and the language, and the shell shows the new name", async ({
  page,
}) => {
  await signInClient(page, tag);
  await openAccount(page);
  const profile = section(page, account.profile.title);

  await page.getByLabel(account.profile.nameLabel, { exact: true }).fill("   ");
  await profile.getByRole("button", { name: account.profile.save }).click();
  await expect(profile.getByText(account.profile.errors.name_required ?? "")).toBeVisible();
  await expect(page.getByLabel(account.profile.nameLabel, { exact: true })).toBeFocused();

  await page.getByLabel(account.profile.nameLabel, { exact: true }).fill("Carla Nueva");
  await page.getByLabel(account.profile.localeLabel, { exact: true }).selectOption("en");
  await profile.getByRole("button", { name: account.profile.save }).click();
  await expect(
    profile.getByRole("status").filter({ hasText: account.profile.saved }),
  ).toBeVisible();
  await expect(page.getByText("Sesión iniciada como Carla Nueva").first()).toBeAttached();

  await page.reload();
  await expect(page.getByLabel(account.profile.nameLabel, { exact: true })).toHaveValue(
    "Carla Nueva",
  );
  await expect(page.getByLabel(account.profile.localeLabel, { exact: true })).toHaveValue("en");
  expect(
    (await calls(page, "account")).filter(
      (call) => (call as { name: string }).name === "update_my_profile",
    ),
  ).toMatchObject([
    { name: "update_my_profile", args: { p_full_name: "Carla Nueva", p_locale: "en" } },
  ]);
});

test("a failing save keeps the form and says so", async ({ page }) => {
  await signInClient(page, tag);
  await openAccount(page);
  await setMode(page, { save: "error" });
  await page.getByRole("button", { name: account.profile.save }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: account.profile.errors.error ?? "" }),
  ).toBeVisible();
  await expect(page.getByLabel(account.profile.nameLabel, { exact: true })).toBeVisible();
});

test("a client requests the deletion, sees it pending and can withdraw it", async ({ page }) => {
  await signInClient(page, tag);
  await openAccount(page);
  const deletion = account.privacy.deletion;
  await page.getByRole("button", { name: deletion.request }).click();
  const confirm = page.getByRole("group", { name: /./ }).filter({ hasText: deletion.confirm.yes });
  await expect(confirm.getByRole("button", { name: deletion.confirm.yes })).toBeFocused();
  await confirm.getByRole("button", { name: deletion.confirm.no }).click();
  await expect(page.getByRole("button", { name: deletion.request })).toBeFocused();

  await page.getByRole("button", { name: deletion.request }).click();
  await page.getByRole("button", { name: deletion.confirm.yes }).click();
  await expect(page.getByRole("status").filter({ hasText: deletion.done })).toBeVisible();
  await expect(page.getByRole("group", { name: deletion.pendingTitle })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("group", { name: deletion.pendingTitle })).toBeVisible();
  await expectClean(page);

  await page.getByRole("button", { name: deletion.withdraw }).click();
  await expect(page.getByRole("status").filter({ hasText: deletion.withdrawn })).toBeVisible();
  await expect(page.getByRole("button", { name: deletion.request })).toBeVisible();
});

test("without the deletion RPC the page falls back to the contact path", async ({ page }) => {
  await setMode(page, { deletion: "missing" });
  await signInClient(page, tag);
  await openAccount(page);
  await expect(page.getByText(account.privacy.deletion.unavailable)).toBeVisible();
  await expect(page.getByRole("button", { name: account.privacy.deletion.request })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /hola@josecoded\.com/ })).toHaveAttribute(
    "href",
    "mailto:hola@josecoded.com",
  );
});

test("a failing deletion request reports it and keeps the button", async ({ page }) => {
  await signInClient(page, tag);
  await openAccount(page);
  await setMode(page, { deletion: "error" });
  await page.getByRole("button", { name: account.privacy.deletion.request }).click();
  await page.getByRole("button", { name: account.privacy.deletion.confirm.yes }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: account.privacy.deletion.errors.error ?? "" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: account.privacy.deletion.request })).toBeVisible();
});

test("the admin sees the second factor, Google and Telegram, but cannot ask to be deleted", async ({
  page,
}) => {
  await signInAdmin(page, tag);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/es/admin");
  await page.getByRole("link", { name: account.menuLink }).first().click();
  await expect(page).toHaveURL(/\/es\/cuenta$/);
  await expect(section(page, account.profile.title)).toBeVisible();
  await expect(
    section(page, account.access.title).getByText(account.access.googleLinked),
  ).toBeVisible();
  await expect(
    section(page, account.security.title).getByText(account.security.statusOn),
  ).toBeVisible();
  await expect(section(page, es.admin.notifications.telegram.title)).toBeVisible();
  await expect(page.getByRole("link", { name: account.notifications.link })).toHaveAttribute(
    "href",
    "/es/admin/notificaciones",
  );
  await expect(
    page.getByRole("heading", { level: 3, name: account.privacy.deletion.title }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { level: 3, name: account.privacy.exportTitle }),
  ).toBeVisible();
  await expectBothWidths(page);

  await page.getByRole("link", { name: account.nav.back }).first().click();
  await expect(page).toHaveURL(/\/es\/admin$/);
});

test("a closer changes the authenticator device and the old one is removed", async ({ page }) => {
  await signInCloser(page, tag);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAccount(page);
  const security = section(page, account.security.title);
  await expect(page.getByRole("link", { name: account.notifications.link })).toHaveAttribute(
    "href",
    "/es/crm/ajustes",
  );

  await security.getByRole("button", { name: account.security.change }).click();
  await expect(security.getByRole("img")).toBeVisible();
  await expect(security.locator("code")).toHaveText("JBSWY3DPEHPK3PXP");
  await expectBothWidths(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await security.getByLabel(account.security.codeLabel, { exact: true }).fill("12");
  await security.getByRole("button", { name: account.security.confirm }).click();
  await expect(security.getByText(account.security.errors.code_invalid ?? "")).toBeVisible();

  await security.getByLabel(account.security.codeLabel, { exact: true }).fill("111111");
  await security.getByRole("button", { name: account.security.confirm }).click();
  await expect(
    security.getByRole("alert").filter({ hasText: account.security.wrongCode }),
  ).toBeVisible();

  await security.getByLabel(account.security.codeLabel, { exact: true }).fill(totpCode);
  await security.getByRole("button", { name: account.security.confirm }).click();
  await expect(
    security.getByRole("status").filter({ hasText: account.security.done }),
  ).toBeVisible();
  await expect(security.getByRole("button", { name: account.security.change })).toBeVisible();
  expect(await calls(page, "enroll")).toHaveLength(2);

  await page.goto("/es/crm");
  await expect(page).toHaveURL(/\/es\/crm$/);
});

test("cancelling the device change leaves the factor as it was", async ({ page }) => {
  await signInCloser(page, tag);
  await openAccount(page);
  const security = section(page, account.security.title);
  await security.getByRole("button", { name: account.security.change }).click();
  await security.getByRole("button", { name: account.security.cancel }).click();
  await expect(security.getByRole("button", { name: account.security.change })).toBeVisible();
  await expect(security.getByRole("img")).toHaveCount(0);
});

test("closing the other sessions logs out the other device and keeps this one", async ({
  page,
  browser,
}) => {
  await signInClient(page, tag);
  const other = await browser.newContext({
    extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.91" },
  });
  const second = await other.newPage();
  await signInClient(second, tag);
  await second.goto("/es/cuenta");
  await expect(second.getByRole("heading", { level: 1, name: account.title })).toBeVisible();

  await openAccount(page);
  await page.getByRole("button", { name: account.access.others }).click();
  await expect(
    page.getByRole("status").filter({ hasText: account.access.othersDone }),
  ).toBeVisible();
  expect(await calls(page, "logout")).toContainEqual({ scope: "others" });

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: account.title })).toBeVisible();
  await second.reload();
  await expect(second).toHaveURL(/\/es\/entrar/);
  await other.close();
});

test("signing out everywhere asks first and sends this device to log in", async ({ page }) => {
  await signInClient(page, tag);
  await openAccount(page);
  await page.getByRole("button", { name: account.access.everywhere }).click();
  await page.getByRole("button", { name: account.access.everywhereConfirm.no }).click();
  await expect(page.getByRole("button", { name: account.access.everywhere })).toBeFocused();

  await page.getByRole("button", { name: account.access.everywhere }).click();
  await page.getByRole("button", { name: account.access.everywhereConfirm.yes }).click();
  await expect(page).toHaveURL(/\/es\/entrar/);
  expect(await calls(page, "logout")).toContainEqual({ scope: "global" });
  await page.goto("/es/cuenta");
  await expect(page).toHaveURL(/\/es\/entrar\?next=%2Fes%2Fcuenta$/);
});

test("the profile shows a skeleton while it loads and an error with a retry when it fails", async ({
  page,
}) => {
  await signInClient(page, tag);
  await setMode(page, { profile: "slow" });
  await page.goto("/es/cuenta", { waitUntil: "commit" });
  await expect(
    page.getByRole("status").filter({ hasText: account.loading.profile }),
  ).toBeAttached();
  await expect(section(page, account.profile.title)).toBeVisible();

  await setMode(page, { profile: "error" });
  await page.reload();
  await expect(page.getByRole("heading", { level: 2, name: account.error.title })).toBeVisible();
  await expectClean(page);

  await setMode(page, { profile: "data" });
  await page.getByRole("button", { name: account.error.retry }).click();
  await expect(section(page, account.profile.title)).toBeVisible();
});
