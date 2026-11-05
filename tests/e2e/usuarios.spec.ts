import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { mockOrigin, signInAdmin, signInCloser, type Tag, withTag } from "./support/staff";

interface UsersMessages {
  admin: {
    nav: { users: string };
    users: {
      title: string;
      empty: { title: string };
      error: { title: string; retry: string };
      table: { region: string };
      invitations: {
        region: string;
        status: Record<string, string>;
        actions: {
          renew: string;
          revoke: string;
          revokeConfirm: string;
          doneRenew: string;
          errors: Record<string, string>;
        };
      };
      invite: {
        open: string;
        title: string;
        email: string;
        role: string;
        roles: Record<string, string>;
        parent: string;
        closerRate: string;
        closerRecurringRate: string;
        parentRate: string;
        preview: string;
        submit: string;
        doneTitle: string;
        linkLabel: string;
        another: string;
        errors: Record<string, string>;
      };
    };
  };
}

const { users: copy, nav } = (JSON.parse(readFileSync("messages/es.json", "utf8")) as UsersMessages)
  .admin;
const next = "?next=%2Fes%2Fadmin%2Fusuarios";

interface Calls {
  invite: Record<string, unknown>[];
  renew: unknown[];
  revoke: unknown[];
  createUser: { email: string; email_confirm: boolean }[];
}

let tag: Tag = withTag();

test.beforeEach(() => {
  tag = withTag();
});

async function calls(page: Page): Promise<Calls> {
  const response = await page.request.get(`${mockOrigin}/__auth/calls?tag=${tag.value}`);
  return (await response.json()) as Calls;
}

async function setMode(page: Page, mode: string) {
  await page.request.post(`${mockOrigin}/__auth/users-mode?tag=${tag.value}`, { data: { mode } });
}

async function openUsers(page: Page) {
  await signInAdmin(page, tag, next);
  await expect(page).toHaveURL(/\/es\/admin\/usuarios$/);
  await expect(page.getByRole("heading", { level: 1, name: copy.title })).toBeVisible();
}

async function openSheet(page: Page) {
  await page.getByRole("button", { name: copy.invite.open, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: copy.invite.title });
  await expect(dialog.getByLabel(copy.invite.email)).toBeVisible();
  return dialog;
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

test("the users page lists the team and the invitations and passes axe", async ({ page }) => {
  await openUsers(page);
  const team = page.getByRole("region", { name: copy.table.region });
  await expect(team.getByRole("row")).toHaveCount(6);
  const sub = team.getByRole("row", { name: /Sam Subcloser/ });
  await expect(sub).toContainText("Subcloser");
  await expect(sub).toContainText("Cleo Closer");
  await expect(team.getByRole("row", { name: /Cleo Closer/ }).first()).toContainText(
    /10\s%\s·\s5\s%/,
  );

  const invitations = page.getByRole("region", { name: copy.invitations.region });
  await expect(invitations.getByRole("row")).toHaveCount(5);
  for (const [email, status] of [
    ["pendiente@example.com", "pending"],
    ["caducada@example.com", "expired"],
    ["aceptada@example.com", "accepted"],
    ["anulada@example.com", "revoked"],
  ] as const) {
    await expect(invitations.getByRole("row", { name: new RegExp(email) })).toContainText(
      copy.invitations.status[status] ?? "",
    );
  }
  await expect(invitations.getByRole("row", { name: /aceptada@/ }).getByRole("button")).toHaveCount(
    0,
  );

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expect(page.getByRole("button", { name: copy.invite.open, exact: true })).toBeVisible();
  await expectNoViolations(page);
});

test("the users entry is enabled in the navigation", async ({ page }) => {
  await signInAdmin(page, tag);
  const rail = page.getByRole("navigation").first();
  await expect(rail.getByRole("link", { name: nav.users })).toBeVisible();
});

test("a closer cannot open the users page", async ({ page }) => {
  await signInCloser(page, tag);
  const response = await page.goto("/es/admin/usuarios");
  expect(response?.status()).toBe(404);
});

test("inviting a subcloser previews the commission and shows the link once", async ({ page }) => {
  await openUsers(page);
  const dialog = await openSheet(page);
  await expectNoViolations(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await expectNoViolations(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  const email = tag.mailbox("nueva@example.com");
  await dialog.getByLabel(copy.invite.email).fill(email);
  await dialog.getByLabel(copy.invite.role).selectOption("subcloser");
  await dialog.getByLabel(copy.invite.parent).selectOption({ label: "Cleo Closer" });
  await dialog.getByLabel(copy.invite.closerRate, { exact: true }).fill("10");
  await dialog.getByLabel(copy.invite.parentRate, { exact: true }).fill("5");
  await dialog.getByLabel(copy.invite.closerRecurringRate, { exact: true }).fill("5,5");
  const preview = dialog.getByRole("group", { name: copy.invite.preview });
  await expect(preview).toContainText(/100\s€/);
  await expect(preview).toContainText(/50\s€/);
  await expect(preview).toContainText(/55\s€/);

  await dialog.getByRole("button", { name: copy.invite.submit }).click();
  await expect(dialog.getByRole("heading", { name: copy.invite.doneTitle })).toBeFocused();
  await expect(dialog.getByLabel(copy.invite.linkLabel)).toHaveValue(
    /\/es\/invitacion\/[0-9a-f]{64}$/,
  );
  await expectNoViolations(page);

  await expect
    .poll(async () => (await calls(page)).invite[0])
    .toMatchObject({
      p_email: email,
      p_role: "closer",
      p_parent_closer_id: "00000000-0000-4000-8000-0000000000c1",
      p_closer_rate: 10,
      p_parent_rate: 5,
      p_closer_recurring_rate: 5.5,
    });
  expect((await calls(page)).createUser).toEqual([{ email, email_confirm: true }]);

  await dialog.getByRole("button", { name: copy.invite.another }).click();
  await expect(dialog.getByLabel(copy.invite.email)).toHaveValue("");
  await page.keyboard.press("Escape");
  const invitations = page.getByRole("region", { name: copy.invitations.region });
  await expect(
    invitations.getByRole("row", { name: new RegExp(email.replace("+", "\\+")) }),
  ).toContainText(copy.invitations.status.pending ?? "");
});

test("invalid input is explained and sends nothing", async ({ page }) => {
  await openUsers(page);
  const dialog = await openSheet(page);
  await dialog.getByLabel(copy.invite.email).fill("not-an-email");
  await dialog.getByRole("button", { name: copy.invite.submit }).click();
  await expect(dialog.getByText(copy.invite.errors.email ?? "")).toBeVisible();
  await expect(dialog.getByLabel(copy.invite.email)).toBeFocused();
  expect((await calls(page)).invite).toHaveLength(0);

  await dialog.getByLabel(copy.invite.email).fill(tag.mailbox("rates@example.com"));
  await dialog.getByLabel(copy.invite.closerRate, { exact: true }).fill("10");
  await dialog.getByLabel(copy.invite.closerRecurringRate, { exact: true }).fill("10");
  await dialog.getByRole("button", { name: copy.invite.submit }).click();
  await expect(dialog.getByText(copy.invite.errors.closerRecurringRate ?? "")).toBeVisible();
  expect((await calls(page)).invite).toHaveLength(0);
});

test("typed errors from the database are shown next to the email", async ({ page }) => {
  await openUsers(page);
  const dialog = await openSheet(page);
  for (const [prefix, code] of [
    ["invited", "email_already_invited"],
    ["member", "email_already_member"],
  ] as const) {
    await dialog.getByLabel(copy.invite.email).fill(tag.mailbox(`${prefix}@example.com`));
    await dialog.getByRole("button", { name: copy.invite.submit }).click();
    await expect(dialog.getByText(copy.invite.errors[code] ?? "")).toBeVisible();
    await expect(dialog.getByLabel(copy.invite.email)).toBeFocused();
  }
  expect((await calls(page)).createUser).toHaveLength(0);
});

test("a failed account creation revokes the invitation and says so", async ({ page }) => {
  await openUsers(page);
  const dialog = await openSheet(page);
  await dialog.getByLabel(copy.invite.email).fill(tag.mailbox("authdown@example.com"));
  await dialog.getByRole("button", { name: copy.invite.submit }).click();
  await expect(dialog.getByRole("alert")).toContainText(copy.invite.errors.unavailable ?? "");
  await expect.poll(async () => (await calls(page)).revoke).toHaveLength(1);
});

test("an existing account is reused instead of failing", async ({ page }) => {
  await openUsers(page);
  const dialog = await openSheet(page);
  await dialog.getByLabel(copy.invite.email).fill(tag.mailbox("exists@example.com"));
  await dialog.getByRole("button", { name: copy.invite.submit }).click();
  await expect(dialog.getByRole("heading", { name: copy.invite.doneTitle })).toBeVisible();
});

test("a pending invitation can be renewed and then revoked", async ({ page }) => {
  await openUsers(page);
  const invitations = page.getByRole("region", { name: copy.invitations.region });
  const row = invitations.getByRole("row", { name: /pendiente@/ });
  await row.getByRole("button", { name: copy.invitations.actions.renew }).click();
  await expect(row.getByText(copy.invitations.actions.doneRenew)).toBeVisible();
  await expect(row.getByRole("textbox")).toHaveValue(/\/es\/invitacion\/[0-9a-f]{64}$/);

  await row.getByText(copy.invitations.actions.revoke, { exact: true }).click();
  await row.getByRole("button", { name: copy.invitations.actions.revokeConfirm }).click();
  await expect(invitations.getByRole("row", { name: /pendiente@/ })).toContainText(
    copy.invitations.status.revoked ?? "",
  );
  await expect(
    invitations.getByRole("row", { name: /pendiente@/ }).getByRole("button"),
  ).toHaveCount(0);
  expect((await calls(page)).revoke).toHaveLength(1);
});

test("the empty state invites the first closer", async ({ page }) => {
  await setMode(page, "empty");
  await openUsers(page);
  await expect(page.getByRole("heading", { name: copy.empty.title }).first()).toBeVisible();
  await expectNoViolations(page);
});

test("a failing load shows a retry that recovers", async ({ page }) => {
  await setMode(page, "error");
  await openUsers(page);
  await expect(page.getByRole("heading", { name: copy.error.title })).toBeVisible();
  await expectNoViolations(page);
  await setMode(page, "data");
  await page.getByRole("button", { name: copy.error.retry }).click();
  await expect(page.getByRole("region", { name: copy.table.region })).toBeVisible();
});
