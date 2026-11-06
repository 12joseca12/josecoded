import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import {
  mockOrigin as mock,
  signInAdmin,
  signInCloser,
  signInOtp,
  type Tag,
  totpCode,
  withTag,
} from "./support/staff";

interface Messages {
  auth: { totp: { enrollStart: string; codeLabel: string; verify: string } };
  offersPage: {
    tiers: Record<string, { name: string }>;
    extras: { items: Record<string, { name: string }> };
  };
  crm: { leads: LeadsMessages };
}

interface LeadsMessages {
  title: string;
  tabs: { label: string; inbox: string; mine: string; team: string };
  error: { title: string; retry: string };
  inbox: {
    note: string;
    listLabel: string;
    claimAria: string;
    noMessage: string;
    empty: { title: string };
    notices: Record<"done" | "handoff" | "stale" | "quota" | "forbidden" | "error", string>;
  };
  own: {
    mineListLabel: string;
    teamListLabel: string;
    noContact: string;
    openContact: string;
    assignedTo: string;
    mineEmpty: { title: string };
    teamEmpty: { title: string };
  };
  statuses: Record<string, string>;
  vias: Record<string, string>;
}

interface InboxCall {
  name: string;
  args?: { p_lead_id: string };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const text = es.crm.leads;
const { totp } = es.auth;

const cara = "10000000-0000-4000-8000-000000000003";
const danisLead = "10000000-0000-4000-8000-0000000000d1";
const path = "/es/crm/interesados";
const next = "?next=%2Fes%2Fcrm%2Finteresados";

test.use({ extraHTTPHeaders: { "cf-connecting-ip": "203.0.113.41" } });

let tag: Tag = withTag();

test.beforeEach(async ({ request }) => {
  tag = withTag();
  await request.post(`${mock}/__auth/reset?tag=${tag.value}`);
});

async function expectClean(page: Page) {
  await expect(page).toHaveTitle(/josecoded/);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function inboxCalls(page: Page): Promise<InboxCall[]> {
  const response = await page.request.get(`${mock}/__auth/calls?tag=${tag.value}`);
  return ((await response.json()) as { inbox: InboxCall[] }).inbox;
}

async function setInbox(page: Page, state: Record<string, unknown>) {
  await page.request.post(`${mock}/__auth/inbox-state?tag=${tag.value}`, { data: state });
}

async function seed(page: Page, rows: Record<string, unknown>[]) {
  await page.request.post(`${mock}/__auth/inbox-seed?tag=${tag.value}`, { data: rows });
}

async function signInSubcloser(page: Page) {
  await signInOtp(page, tag, "dani@example.com", next);
  await page.getByRole("button", { name: totp.enrollStart }).click();
  await page.getByLabel(totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).toHaveURL(/\/es\/crm\/interesados$/);
}

async function openAsCloser(page: Page, width = 1440) {
  await page.setViewportSize({ width, height: width > 600 ? 900 : 812 });
  await signInCloser(page, tag, next);
  await expect(page).toHaveURL(/\/es\/crm\/interesados$/);
  await expect(page.getByRole("heading", { level: 1, name: text.title })).toBeVisible();
}

function alert(page: Page) {
  return page.getByRole("main").getByRole("alert");
}

async function claimLead(page: Page, name: string) {
  const button = claimButton(page, name);
  await expect
    .poll(() =>
      button.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps$"))),
    )
    .toBe(true);
  await button.click();
}

function inboxList(page: Page) {
  return page.getByRole("list", { name: text.inbox.listLabel });
}

function claimButton(page: Page, name: string) {
  return page.getByRole("button", { name: text.inbox.claimAria.replace("{name}", name) });
}

function tab(page: Page, name: string) {
  return page.getByRole("navigation", { name: text.tabs.label }).getByRole("link", { name });
}

test("a closer sees the masked inbox and nothing beyond the first name", async ({ page }) => {
  await seed(page, [
    {
      id: "10000000-0000-4000-8000-0000000000e1",
      full_name: "Mara Mensaje",
      email: "mara@example.com",
      phone: "+34 611 222 333",
      organization: "Mara SL",
      via: "freelance",
      created_at: "2026-11-04T10:00:00+00:00",
      message:
        "Escribidme a mara@example.com o al 611 222 333, o mirad https://mara.example/proyecto para ver el brief.",
    },
  ]);
  await openAsCloser(page);
  await expect(page.getByText(text.inbox.note)).toBeVisible();
  const list = inboxList(page);
  await expect(list.getByRole("listitem")).toHaveCount(2);
  const carita = list.getByRole("listitem").filter({ hasText: "Cara" });
  await expect(carita).toContainText(text.vias.project ?? "");
  await expect(carita).toContainText(es.offersPage.tiers["web-negocio"]?.name ?? "");
  await expect(carita).toContainText(es.offersPage.extras.items.payments?.name ?? "");
  await expect(carita).toContainText("Quiero una web");
  const mara = list.getByRole("listitem").filter({ hasText: "Mara" });
  await expect(mara).toContainText("[…]");
  const body = (await page.locator("main").innerText()).toLowerCase();
  for (const secret of ["pack", "example.com", "611", "mara sl", "mensaje"]) {
    expect(body).not.toContain(secret);
  }
  await expect(tab(page, text.tabs.inbox)).toHaveAttribute("aria-current", "page");
  await expectClean(page);
});

test("claiming opens the contact that was created and empties the inbox", async ({ page }) => {
  await openAsCloser(page);
  await claimLead(page, "Cara");
  await expect(page).toHaveURL(/\/es\/crm\/contactos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: "Cara Pack" })).toBeVisible();
  const claims = (await inboxCalls(page)).filter((call) => call.name === "claim_lead");
  expect(claims).toEqual([{ name: "claim_lead", args: { p_lead_id: cara } }]);

  await page.goto(path);
  await expect(page.getByRole("heading", { name: text.inbox.empty.title })).toBeVisible();
  await tab(page, text.tabs.mine).click();
  const mine = page.getByRole("list", { name: text.own.mineListLabel });
  const row = mine.getByRole("listitem").filter({ hasText: "Cara Pack" });
  await expect(row).toContainText("cara@example.com");
  await expect(row.getByRole("link", { name: /Abrir contacto/ })).toBeVisible();
});

test("a lead someone else claimed first is explained and leaves the list", async ({ page }) => {
  await openAsCloser(page);
  await setInbox(page, { claim: "stale" });
  await claimLead(page, "Cara");
  await expect(alert(page)).toHaveText(text.inbox.notices.stale);
  await expect(page).toHaveURL(/\/es\/crm\/interesados$/);
  await expect(page.getByRole("heading", { name: text.inbox.empty.title })).toBeVisible();
});

test("the daily claim limit, the admin hand-off and a failure each get their own message", async ({
  page,
}) => {
  await openAsCloser(page);
  await setInbox(page, { claim: "quota" });
  await claimLead(page, "Cara");
  await expect(alert(page)).toHaveText(text.inbox.notices.quota);
  await expect(claimButton(page, "Cara")).toBeEnabled();

  await setInbox(page, { claim: "error" });
  await claimLead(page, "Cara");
  await expect(alert(page)).toHaveText(text.inbox.notices.error);

  await setInbox(page, { claim: "handoff" });
  await claimLead(page, "Cara");
  await expect(alert(page)).toHaveText(text.inbox.notices.handoff);
  await expect(page.getByRole("heading", { name: text.inbox.empty.title })).toBeVisible();
});

test("the closer sees her own leads in full and her team's leads under their owner", async ({
  page,
}) => {
  await seed(page, [
    {
      id: danisLead,
      full_name: "Teo Equipo",
      email: "teo@example.com",
      phone: "600 999 888",
      via: "hiring",
      status: "assigned",
      assigned_to: "00000000-0000-4000-8000-0000000000c2",
      created_at: "2026-11-04T09:00:00+00:00",
    },
  ]);
  await openAsCloser(page);
  await tab(page, text.tabs.mine).click();
  await expect(page).toHaveURL(/[?&]tab=mine/);
  const mine = page.getByRole("list", { name: text.own.mineListLabel });
  await expect(mine.getByRole("listitem")).toHaveCount(2);
  const felix = mine.getByRole("listitem").filter({ hasText: "Félix Freelance" });
  await expect(felix).toContainText("felix@example.com");
  await expect(felix).toContainText(text.statuses.contacted ?? "");
  await expect(felix).toContainText(text.own.noContact);
  const hilda = mine.getByRole("listitem").filter({ hasText: "Hilda Hiring" });
  await expect(hilda.getByRole("link", { name: /Abrir contacto/ })).toHaveAttribute(
    "href",
    /\/es\/crm\/contactos\/20000000-0000-4000-8000-0000000000a1$/,
  );
  await expect(mine).not.toContainText("Teo Equipo");
  await expectClean(page);

  await tab(page, text.tabs.team).click();
  const team = page.getByRole("list", { name: text.own.teamListLabel });
  const teo = team.getByRole("listitem").filter({ hasText: "Teo Equipo" });
  await expect(teo).toContainText("teo@example.com");
  await expect(teo).toContainText(text.own.assignedTo.replace("{name}", "Dani Closer"));
  await expectClean(page);
});

test("a subcloser has no team tab and sees only her own leads", async ({ page }) => {
  await seed(page, [
    {
      id: danisLead,
      full_name: "Teo Equipo",
      email: "teo@example.com",
      status: "assigned",
      assigned_to: "00000000-0000-4000-8000-0000000000c2",
    },
  ]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInSubcloser(page);
  await expect(tab(page, text.tabs.mine)).toBeVisible();
  await expect(tab(page, text.tabs.team)).toHaveCount(0);
  await page.goto(`${path}?tab=team`);
  await expect(tab(page, text.tabs.inbox)).toHaveAttribute("aria-current", "page");
  await tab(page, text.tabs.mine).click();
  const mine = page.getByRole("list", { name: text.own.mineListLabel });
  await expect(mine.getByRole("listitem")).toHaveCount(1);
  await expect(mine).toContainText("Teo Equipo");
});

test("an empty tab and an empty inbox say so", async ({ page }) => {
  await openAsCloser(page);
  await setInbox(page, { mode: "empty" });
  await page.reload();
  await expect(page.getByRole("heading", { name: text.inbox.empty.title })).toBeVisible();
  await tab(page, text.tabs.team).click();
  await expect(page.getByRole("heading", { name: text.own.teamEmpty.title })).toBeVisible();
  await expectClean(page);
});

test("a failed load shows the error screen and retries", async ({ page }) => {
  await openAsCloser(page);
  await setInbox(page, { mode: "error" });
  await page.reload();
  await expect(page.getByRole("heading", { name: text.error.title })).toBeVisible();
  await setInbox(page, { mode: "data" });
  await page.getByRole("button", { name: text.error.retry }).click();
  await expect(inboxList(page)).toBeVisible();
});

test("on a phone the inbox is a column of cards that still passes axe", async ({ page }) => {
  await openAsCloser(page, 375);
  const card = inboxList(page).getByRole("listitem").first();
  await expect(card).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await card.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(300);
  await expectClean(page);
  await claimLead(page, "Cara");
  await expect(page).toHaveURL(/\/es\/crm\/contactos\/[0-9a-f-]{36}$/);
});

test("the admin can reach the inbox, claim from it and has no team tab", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAdmin(page, tag, next);
  await expect(page).toHaveURL(/\/es\/crm\/interesados$/);
  await expect(tab(page, text.tabs.team)).toHaveCount(0);
  await expectClean(page);
  await claimLead(page, "Cara");
  await expect(page).toHaveURL(/\/es\/crm\/contactos\/[0-9a-f-]{36}$/);
});

test("the navigation lists the screen and marks it as current", async ({ page }) => {
  await openAsCloser(page);
  const nav = page.getByRole("navigation", { name: "CRM" });
  await expect(nav.getByRole("link", { name: "Interesados" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
