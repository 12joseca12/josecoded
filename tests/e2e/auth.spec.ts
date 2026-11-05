import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { staffNav } from "../../src/lib/staff/nav";
import {
  mockOrigin as mock,
  openLogin,
  requestCode as requestStaffCode,
  signInAdmin as signInStaffAdmin,
  signInOtp as signInStaffOtp,
  submitCode,
  type Tag,
  withTag,
} from "./support/staff";

interface Notice {
  title: string;
  text: string;
}

interface Messages {
  auth: {
    login: {
      title: string;
      emailLabel: string;
      send: string;
      codeTitle: string;
      codeLabel: string;
      verify: string;
      resend: string;
      resent: string;
      changeEmail: string;
      wrongCode: Notice;
      rateLimited: Notice;
      verificationFailed: Notice;
      failed: Notice;
      errors: Record<"email_invalid" | "code_invalid", string>;
    };
    totp: {
      enrollTitle: string;
      enrollStart: string;
      qrAlt: string;
      challengeTitle: string;
      codeLabel: string;
      verify: string;
      wrongCode: Notice;
    };
  };
  nav: { skipLink: string };
  admin: {
    brandLabel: string;
    navLabel: string;
    signOut: string;
    nav: {
      overview: string;
      leads: string;
      users: string;
      soon: string;
      more: string;
      moreTitle: string;
      close: string;
      switch: string;
    };
    overview: { title: string };
    leads: {
      title: string;
      region: string;
      empty: { title: string };
      error: { title: string; retry: string };
      via: { none: string; project: string };
      status: { new: string; converted: string; discarded: string };
      unassigned: string;
      actions: {
        assignLabel: string;
        assignPlaceholder: string;
        assign: string;
        discardOpen: string;
        discardReasonLabel: string;
        discardSubmit: string;
        reasonPrefix: string;
        done: { assign: string; discard: string };
        errors: { assignee: string; reason: string; stale: string };
      };
    };
  };
  crm: {
    navLabel: string;
    nav: { overview: string; contacts: string; soon: string; switch: string };
    overview: { title: string; today: { title: string } };
  };
  errors: { notFound: { title: string } };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const { login, totp } = es.auth;

interface AuthCalls {
  captcha: { token: string }[];
  otp: { email: string; create_user: boolean }[];
  verify: { email: string; token: string }[];
  enroll: unknown[];
  factorVerify: { code: string }[];
  logout: { scope: string | null }[];
  leads: { authenticated: boolean; level: string | null }[];
  rpc: { name: string; args: Record<string, string>; level: string | null }[];
}

const adminReady = staffNav.admin.filter((entry) => entry.ready).length;
const adminSoon = staffNav.admin.length - adminReady;
const crmReady = staffNav.crm.filter((entry) => entry.ready).length;

test.describe.configure({ mode: "serial" });
test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.9" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

function mailbox(email: string): string {
  return tag.mailbox(email);
}

async function authCalls(page: Page): Promise<AuthCalls> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  return (await response.json()) as AuthCalls;
}

function requestCode(page: Page, email: string) {
  return requestStaffCode(page, tag, email);
}

function signInOtp(page: Page, email: string, query = "") {
  return signInStaffOtp(page, tag, email, query);
}

function signInAdmin(page: Page, query = "") {
  return signInStaffAdmin(page, tag, query);
}

function alertWith(page: Page, text: string) {
  return page.getByRole("alert").filter({ hasText: text });
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

test("the login page is noindex and passes axe", async ({ page }) => {
  const response = await page.goto("/es/entrar");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByRole("heading", { level: 1, name: login.title })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("button", { name: /Google/ })).toHaveCount(0);
  await page.locator("[data-fake-turnstile]").waitFor({ state: "attached" });
  await expectClean(page);
});

test("email validation shows an accessible error", async ({ page }) => {
  await openLogin(page);
  await page.getByLabel(login.emailLabel).fill("not-an-email");
  await page.getByRole("button", { name: login.send }).click();
  await expect(page.getByText(login.errors.email_invalid)).toBeVisible();
  await expect(page.getByLabel(login.emailLabel)).toBeFocused();
  await expect(page.getByLabel(login.emailLabel)).toHaveAttribute("aria-invalid", "true");
  expect((await authCalls(page)).otp).toHaveLength(0);
});

test("an invited admin signs in with the code and the authenticator", async ({ page }) => {
  await openLogin(page);
  await requestCode(page, "enrolled@example.com");
  await expectClean(page);
  await submitCode(page, "123456");

  await expect(page).toHaveURL(/\/es\/entrar\/totp$/);
  await expect(page.getByRole("heading", { level: 1, name: totp.challengeTitle })).toBeVisible();
  await expect(page).toHaveTitle(/josecoded/);
  await expectClean(page);
  await page.getByLabel(totp.codeLabel).fill("654321");
  await page.getByRole("button", { name: totp.verify }).click();

  await expect(page).toHaveURL(/\/es\/admin$/);
  await expect(
    page.getByRole("heading", { level: 1, name: es.admin.overview.title }),
  ).toBeVisible();
  await expect(page.getByText("Jose Enrolled").locator("visible=true")).toBeVisible();

  const calls = await authCalls(page);
  expect(calls.otp).toEqual([{ email: "enrolled@example.com", create_user: false }]);
  expect(calls.captcha).toEqual([{ token: "mock-token:login" }]);
});

test("a wrong code is reported and the field is cleared", async ({ page }) => {
  await openLogin(page);
  await requestCode(page, "enrolled@example.com");
  await submitCode(page, "000111");
  await expect(alertWith(page, login.wrongCode.title)).toBeVisible();
  await expect(page.getByLabel(login.codeLabel)).toHaveValue("");
  await expectClean(page);
  await page.getByLabel(login.codeLabel).fill("12");
  await page.getByRole("button", { name: login.verify }).click();
  await expect(page.getByText(login.errors.code_invalid)).toBeVisible();
});

test("an unknown email gets the same neutral step and can never sign in", async ({ page }) => {
  await openLogin(page);
  await requestCode(page, "ghost@example.com");
  await expect(
    page.getByText(mailbox("ghost@example.com"), { exact: false }).first(),
  ).toBeVisible();
  await submitCode(page, "123456");
  await expect(alertWith(page, login.wrongCode.title)).toBeVisible();
  await expect(page).toHaveURL(/\/es\/entrar$/);
  expect((await authCalls(page)).otp[0]).toEqual({
    email: "ghost@example.com",
    create_user: false,
  });
});

test("provider rate limits and failures are explained", async ({ page }) => {
  await openLogin(page);
  await page.getByLabel(login.emailLabel).fill(mailbox("ratelimit@example.com"));
  await page.getByRole("button", { name: login.send }).click();
  await expect(alertWith(page, login.rateLimited.title)).toBeVisible();

  await page.getByLabel(login.emailLabel).fill(mailbox("down@example.com"));
  await page.getByRole("button", { name: login.send }).click();
  await expect(alertWith(page, login.failed.title)).toBeVisible();
  await expectClean(page);
});

test("a failed security check blocks the request", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("fakeTurnstileToken", "bad-token");
  });
  await openLogin(page);
  await page.getByLabel(login.emailLabel).fill(mailbox("enrolled@example.com"));
  await page.getByRole("button", { name: login.send }).click();
  await expect(alertWith(page, login.verificationFailed.title)).toBeVisible();
  expect((await authCalls(page)).otp).toHaveLength(0);
});

test("a rate limited verification is explained", async ({ page }) => {
  await openLogin(page);
  await requestCode(page, "limited@example.com");
  await submitCode(page, "123456");
  await expect(alertWith(page, login.rateLimited.title)).toBeVisible();
});

test("resending waits for the cooldown", async ({ page }) => {
  await page.clock.install();
  await openLogin(page);
  await requestCode(page, "enrolled@example.com");
  const resend = page.getByRole("button", { name: /Reenviar en \d+ s/ });
  await expect(resend).toBeDisabled();
  await page.clock.fastForward(61_000);
  const ready = page.getByRole("button", { name: login.resend });
  await expect(ready).toBeEnabled();
  await page.waitForTimeout(200);
  await ready.click();
  await expect(page.getByText(login.resent)).toBeVisible();
  expect((await authCalls(page)).otp).toHaveLength(2);
  await page.getByRole("button", { name: login.changeEmail }).click();
  await expect(page.getByLabel(login.emailLabel)).toBeVisible();
});

test("an admin without a device enrolls the authenticator first", async ({ page }) => {
  await signInOtp(page, "admin@example.com");
  await expect(page).toHaveURL(/\/es\/entrar\/totp$/);
  await expect(page.getByRole("heading", { level: 1, name: totp.enrollTitle })).toBeVisible();
  await expect(page).toHaveTitle(/josecoded/);
  await expectClean(page);

  await page.getByRole("button", { name: totp.enrollStart }).click();
  await expect(page.getByRole("img", { name: totp.qrAlt })).toBeVisible();
  await expect(page.getByText("JBSWY3DPEHPK3PXP")).toBeVisible();
  await expectClean(page);

  await page.getByLabel(totp.codeLabel).fill("111111");
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(alertWith(page, totp.wrongCode.title)).toBeVisible();

  await page.getByLabel(totp.codeLabel).fill("654321");
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).toHaveURL(/\/es\/admin$/);
  expect((await authCalls(page)).enroll).toHaveLength(1);
});

test("a client skips the second factor and cannot enter the admin", async ({ page }) => {
  await signInOtp(page, "client@example.com");
  await expect(page).toHaveURL(/\/es\/area$/);
  expect((await authCalls(page)).factorVerify).toHaveLength(0);

  const response = await page.goto("/es/admin");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: es.errors.notFound.title }),
  ).toBeVisible();
  expect((await authCalls(page)).leads).toHaveLength(0);
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expectClean(page);

  const nested = await page.goto("/es/admin/interesados");
  expect(nested?.status()).toBe(404);
});

test("a closer gets a 404 on the admin zone", async ({ page }) => {
  await signInOtp(page, "closer@example.com");
  await expect(page).toHaveURL(/\/es\/entrar\/totp$/);
  const response = await page.goto("/es/admin");
  expect(response?.status()).toBe(404);
});

test("anonymous visitors are sent to log in and come back to where they were going", async ({
  page,
}) => {
  await page.goto("/es/admin/interesados");
  await expect(page).toHaveURL(/\/es\/entrar\?next=%2Fes%2Fadmin%2Finteresados$/);
  await openLogin(page, "?next=%2Fes%2Fadmin%2Finteresados");
  await requestCode(page, "enrolled@example.com");
  await submitCode(page, "123456");
  await expect(page).toHaveURL(/\/es\/entrar\/totp\?next=%2Fes%2Fadmin%2Finteresados$/);
  await page.getByLabel(totp.codeLabel).fill("654321");
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).toHaveURL(/\/es\/admin\/interesados$/);
});

test("an unsafe next is ignored", async ({ page }) => {
  await signInAdmin(page, "?next=https%3A%2F%2Fevil.example");
  await expect(page).toHaveURL(/\/es\/admin$/);
});

test("an admin who has not passed the authenticator is held at the second factor", async ({
  page,
}) => {
  await signInOtp(page, "enrolled@example.com");
  await expect(page).toHaveURL(/\/es\/entrar\/totp/);
  await page.goto("/es/admin");
  await expect(page).toHaveURL(/\/es\/entrar\/totp\?next=%2Fes%2Fadmin$/);
  await page.goto("/es/admin/interesados");
  await expect(page).toHaveURL(/\/es\/entrar\/totp/);
  expect((await authCalls(page)).leads).toHaveLength(0);
});

test("a signed in admin skips the login page", async ({ page }) => {
  await signInAdmin(page);
  await expect(page).toHaveURL(/\/es\/admin$/);
  await page.goto("/es/entrar");
  await expect(page).toHaveURL(/\/es\/admin$/);
});

test("the admin shell navigates and the overview passes axe", async ({ page }) => {
  await signInAdmin(page);
  await expect(page).toHaveURL(/\/es\/admin$/);
  const nav = page.getByRole("navigation", { name: "Administración" });
  await expect(nav.getByRole("link", { name: es.admin.nav.overview })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expectClean(page);
  await nav.getByRole("link", { name: es.admin.nav.leads }).click();
  await expect(page).toHaveURL(/\/es\/admin\/interesados$/);
  await expect(nav.getByRole("link", { name: es.admin.nav.leads })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: es.admin.nav.overview })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
});

async function signInCloser(page: Page) {
  await signInOtp(page, "closer@example.com");
  await expect(page).toHaveURL(/\/es\/entrar\/totp$/);
  await page.getByRole("button", { name: totp.enrollStart }).click();
  await expect(page.getByRole("img", { name: totp.qrAlt })).toBeVisible();
  await page.getByLabel(totp.codeLabel).fill("654321");
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).toHaveURL(/\/es\/crm$/);
}

test("the admin rail is keyboard navigable and passes axe at 1440", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAdmin(page);
  await page.goto("/es/admin");
  const { nav, admin } = es;
  const rail = page.getByRole("navigation", { name: admin.navLabel });
  await expect(rail.getByRole("link")).toHaveCount(adminReady);
  await expect(rail.getByText(admin.nav.soon)).toHaveCount(adminSoon);
  await expect(rail.getByRole("link", { name: admin.nav.users })).toHaveCount(1);
  await expect(page.getByRole("button", { name: admin.nav.more })).toBeHidden();
  await expectClean(page);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: nav.skipLink })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: admin.brandLabel })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(rail.getByRole("link", { name: admin.nav.overview })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(rail.getByRole("link", { name: admin.nav.leads })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/es\/admin\/interesados$/);
  await expect(page.locator("#content")).toBeFocused();
  await expect(rail.getByRole("link", { name: admin.nav.leads })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expectClean(page);
});

test("the admin bottom bar and the more sheet work at 375", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signInAdmin(page);
  await page.goto("/es/admin");
  const { admin } = es;
  const bar = page.getByRole("navigation", { name: admin.navLabel });
  await expect(bar.getByRole("link", { name: admin.nav.overview })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(bar.getByRole("link", { name: admin.nav.leads })).toBeVisible();
  const more = bar.getByRole("button", { name: admin.nav.more });
  await expect(more).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectClean(page);

  await more.click();
  const sheet = page.getByRole("dialog", { name: admin.nav.moreTitle });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("link")).toHaveCount(adminReady + 1);
  await expect(sheet.getByText(admin.nav.soon)).toHaveCount(adminSoon);
  await expect(sheet.getByRole("button", { name: admin.signOut })).toBeVisible();
  await expect(sheet.getByRole("link", { name: admin.nav.switch })).toBeVisible();
  await expectClean(page);

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(more).toBeFocused();

  await more.click();
  await sheet.getByRole("link", { name: admin.nav.leads }).click();
  await expect(page).toHaveURL(/\/es\/admin\/interesados$/);
  await expect(sheet).toBeHidden();
  await expect(bar.getByRole("link", { name: admin.nav.leads })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("a closer lands on the CRM shell and cannot enter the admin", async ({ page }) => {
  await signInCloser(page);
  const { crm } = es;
  await expect(page.getByRole("heading", { level: 1, name: crm.overview.title })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: crm.overview.today.title }),
  ).toBeVisible();
  const rail = page.getByRole("navigation", { name: crm.navLabel });
  await expect(rail.getByRole("link", { name: crm.nav.overview })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(rail.getByRole("link")).toHaveCount(crmReady);
  await expect(rail.getByText(crm.nav.soon).first()).toBeVisible();
  await expect(page.getByRole("link", { name: es.admin.nav.switch })).toHaveCount(0);
  await expect(page.getByRole("link", { name: crm.nav.switch })).toHaveCount(0);
  await expectClean(page);

  for (const path of ["/es/admin", "/es/admin/interesados"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
});

test("an admin enters the CRM and switches zone from the shell", async ({ page }) => {
  await signInAdmin(page);
  await page.goto("/es/admin");
  await page.getByRole("link", { name: es.admin.nav.switch }).click();
  await expect(page).toHaveURL(/\/es\/crm$/);
  await expect(page.getByRole("heading", { level: 1, name: es.crm.overview.title })).toBeVisible();
  await expectClean(page);
  await page.getByRole("link", { name: es.crm.nav.switch }).click();
  await expect(page).toHaveURL(/\/es\/admin$/);
});

test("an anonymous visitor to the CRM is sent to log in and comes back", async ({ page }) => {
  await page.goto("/es/crm");
  await expect(page).toHaveURL(/\/es\/entrar\?next=%2Fes%2Fcrm$/);
});

test("the leads list shows the newest first and passes axe", async ({ page }) => {
  await signInAdmin(page, "?next=%2Fes%2Fadmin%2Finteresados");
  await expect(page).toHaveURL(/\/es\/admin\/interesados$/);
  await expect(page.getByRole("heading", { level: 1, name: es.admin.leads.title })).toBeVisible();
  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  const rows = table.locator("tbody tr");
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText("Cara Pack");
  await expect(rows.nth(0)).toContainText("cara@example.com");
  await expect(rows.nth(0)).toContainText(es.admin.leads.status.new);
  await expect(rows.nth(3)).toContainText("Nico Nexo");
  await expect(rows.nth(3)).toContainText(es.admin.leads.via.none);
  await expect(page.getByRole("region", { name: es.admin.leads.region })).toBeVisible();
  await expectClean(page);
  const calls = await authCalls(page);
  expect(calls.leads.at(-1)).toEqual({ authenticated: true, level: "aal2" });
});

async function openLeads(page: Page) {
  await signInAdmin(page, "?next=%2Fes%2Fadmin%2Finteresados");
  await expect(page).toHaveURL(/\/es\/admin\/interesados$/);
  await expect(page.getByRole("table")).toBeVisible();
}

function leadRow(page: Page, name: string) {
  return page.getByRole("row").filter({ hasText: name });
}

test("the leads list shows the offer, who holds each lead and the actions", async ({ page }) => {
  await openLeads(page);
  const cara = leadRow(page, "Cara Pack");
  await expect(cara).toContainText(es.admin.leads.via.project);
  await expect(cara).toContainText("web-negocio");
  await expect(cara).toContainText(es.admin.leads.unassigned);
  await expect(leadRow(page, "Hilda Hiring")).toContainText("Cleo Closer");
  const select = cara.getByLabel(es.admin.leads.actions.assignLabel);
  await expect(select.getByRole("option")).toHaveText([
    es.admin.leads.actions.assignPlaceholder,
    "Cleo Closer",
    "Dani Closer",
  ]);
  await expect(leadRow(page, "Nico Nexo")).toContainText(
    `${es.admin.leads.actions.reasonPrefix} Duplicado`,
  );
  await expect(leadRow(page, "Nico Nexo").getByRole("button")).toHaveCount(0);
  await expectClean(page);
});

test("an admin assigns a lead to a closer", async ({ page }) => {
  await openLeads(page);
  const cara = leadRow(page, "Cara Pack");
  await cara.getByLabel(es.admin.leads.actions.assignLabel).selectOption({ label: "Dani Closer" });
  await cara.getByRole("button", { name: es.admin.leads.actions.assign }).click();
  await expect(cara).toContainText(es.admin.leads.status.converted);
  await expect(cara).toContainText("Dani Closer");
  await expect(cara.getByRole("status")).toHaveText(es.admin.leads.actions.done.assign);
  await expect(cara.getByText(es.admin.leads.actions.discardOpen)).toHaveCount(0);
  const { rpc } = await authCalls(page);
  expect(rpc).toEqual([
    {
      name: "assign_lead",
      args: {
        p_lead_id: "10000000-0000-4000-8000-000000000003",
        p_user_id: "00000000-0000-4000-8000-0000000000c2",
      },
      level: "aal2",
    },
  ]);
});

test("assigning needs a closer and reports a lead that already changed", async ({
  page,
  request,
}) => {
  await openLeads(page);
  const cara = leadRow(page, "Cara Pack");
  await cara.getByRole("button", { name: es.admin.leads.actions.assign }).click();
  await expect(cara.getByRole("alert")).toHaveText(es.admin.leads.actions.errors.assignee);
  expect((await authCalls(page)).rpc).toHaveLength(0);

  await request.post(`${mock}/__auth/rpc-error?tag=${tag.value}`, {
    data: { error: { code: "P0001", message: "lead_already_claimed" } },
  });
  await cara.getByLabel(es.admin.leads.actions.assignLabel).selectOption({ label: "Cleo Closer" });
  await cara.getByRole("button", { name: es.admin.leads.actions.assign }).click();
  await expect(cara.getByRole("alert")).toHaveText(es.admin.leads.actions.errors.stale);
  await expect(cara).toContainText(es.admin.leads.status.new);
});

test("an admin discards a lead with a reason", async ({ page }) => {
  await openLeads(page);
  const cara = leadRow(page, "Cara Pack");
  await cara.getByText(es.admin.leads.actions.discardOpen).click();
  await cara.getByRole("button", { name: es.admin.leads.actions.discardSubmit }).click();
  await expect(cara.getByRole("alert")).toHaveText(es.admin.leads.actions.errors.reason);
  expect((await authCalls(page)).rpc).toHaveLength(0);

  await cara.getByLabel(es.admin.leads.actions.discardReasonLabel).fill("Fuera de alcance");
  await cara.getByRole("button", { name: es.admin.leads.actions.discardSubmit }).click();
  await expect(cara).toContainText(es.admin.leads.status.discarded);
  await expect(cara).toContainText(`${es.admin.leads.actions.reasonPrefix} Fuera de alcance`);
  const { rpc } = await authCalls(page);
  expect(rpc.map((call) => [call.name, call.args.p_reason])).toEqual([
    ["discard_lead", "Fuera de alcance"],
  ]);
});

test("the leads list has empty and error states", async ({ page, request }) => {
  await signInAdmin(page, "?next=%2Fes%2Fadmin%2Finteresados");
  await request.post(`${mock}/__auth/leads-mode?tag=${tag.value}`, { data: { mode: "empty" } });
  await page.reload();
  await expect(page.getByRole("heading", { name: es.admin.leads.empty.title })).toBeVisible();
  await expectClean(page);

  await request.post(`${mock}/__auth/leads-mode?tag=${tag.value}`, { data: { mode: "error" } });
  await page.reload();
  await expect(alertWith(page, es.admin.leads.error.title)).toBeVisible();
  await expectClean(page);

  await request.post(`${mock}/__auth/leads-mode?tag=${tag.value}`, { data: { mode: "data" } });
  await page.getByRole("button", { name: es.admin.leads.error.retry }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("signing out ends the session", async ({ page }) => {
  await signInAdmin(page);
  await page.getByRole("button", { name: es.admin.signOut }).click();
  await expect(page).toHaveURL(/\/es\/entrar$/);
  expect((await authCalls(page)).logout).toEqual([{ scope: "local" }]);
  await page.goto("/es/admin");
  await expect(page).toHaveURL(/\/es\/entrar\?next=%2Fes%2Fadmin$/);
});

test("the public pages stay out of the auth proxy", async ({ page }) => {
  await page.goto("/es/contacto");
  const cookies = await page.context().cookies();
  expect(cookies.filter((cookie) => cookie.name.startsWith("sb-"))).toHaveLength(0);
});
