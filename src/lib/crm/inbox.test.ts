import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { OfferLabels } from "@/lib/admin/lead-offer";
import type { Database } from "@/types/database";

import { fetchInbox, inboxLimit, parseInboxTab, toInboxCards } from "./inbox";

interface Result {
  data: unknown;
  error: unknown;
}

const me = "00000000-0000-4000-8000-0000000000c1";
const dani = "00000000-0000-4000-8000-0000000000c2";
const idA = "10000000-0000-4000-8000-0000000000a1";
const idB = "10000000-0000-4000-8000-0000000000a2";

function builder(result: Result) {
  const calls: [string, unknown[]][] = [];
  const proxy: Record<string, unknown> = {
    then: (resolve: (value: Result) => unknown) => resolve(result),
  };
  for (const method of ["select", "not", "order", "limit", "eq"]) {
    proxy[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return proxy;
    };
  }
  return { proxy, calls };
}

function lead(id: string, assignedTo: string) {
  return {
    id,
    via: "hiring",
    source: "form",
    full_name: "Hilda Hiring",
    email: "hilda@example.com",
    organization: null,
    contact_id: null,
    status: "assigned",
    created_at: "2026-11-01T08:00:00+00:00",
    assigned_to: assignedTo,
    discard_reason: null,
    offer: null,
    phone: null,
  };
}

const inboxRow = {
  id: "10000000-0000-4000-8000-000000000003",
  first_name: "Cara",
  via: "project",
  offer: "web-negocio",
  extras: ["payments"],
  created_at: "2026-11-03T09:30:00+00:00",
  excerpt: " Quiero una web […] ",
  locale: "es",
};

function clientFor(options: { inbox?: Result; leads?: Result; people?: Result; throws?: boolean }) {
  const leads = builder(options.leads ?? { data: [], error: null });
  const people = builder(options.people ?? { data: [], error: null });
  const rpc = vi.fn(() =>
    options.throws
      ? Promise.reject(new Error("down"))
      : Promise.resolve(options.inbox ?? { data: [], error: null }),
  );
  const from = vi.fn((table: string) => (table === "profiles" ? people.proxy : leads.proxy));
  return {
    client: { from, rpc } as unknown as SupabaseClient<Database>,
    rpc,
    leads: leads.calls,
    people: people.calls,
  };
}

describe("parseInboxTab", () => {
  it("defaults to the inbox and hides the team tab without a team", () => {
    expect(parseInboxTab({}, false)).toBe("inbox");
    expect(parseInboxTab({ tab: "mine" }, false)).toBe("mine");
    expect(parseInboxTab({ tab: ["mine", "team"] }, false)).toBe("mine");
    expect(parseInboxTab({ tab: "team" }, false)).toBe("inbox");
    expect(parseInboxTab({ tab: "team" }, true)).toBe("team");
    expect(parseInboxTab({ tab: "nope" }, true)).toBe("inbox");
  });
});

describe("fetchInbox", () => {
  it("splits own leads from the team and reads the masked inbox through the RPC", async () => {
    const { client, rpc, leads } = clientFor({
      inbox: { data: [inboxRow], error: null },
      leads: { data: [lead(idA, me), lead(idB, dani)], error: null },
      people: { data: [{ id: dani, full_name: "Dani Closer" }], error: null },
    });
    const result = await fetchInbox(client, me, "closer");
    expect(rpc).toHaveBeenCalledWith("list_lead_inbox");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.inbox).toHaveLength(1);
    expect(result.mine.map((row) => row.id)).toEqual([idA]);
    expect(result.team.map((row) => row.id)).toEqual([idB]);
    expect(result.people).toEqual({ [dani]: "Dani Closer" });
    expect(result.hasTeam).toBe(true);
    expect(result.limit).toBe(inboxLimit);
    expect(leads.find(([method]) => method === "eq")).toBeUndefined();
  });

  it("gives a subcloser no team and an admin only their own leads", async () => {
    const sub = clientFor({ leads: { data: [lead(idA, me)], error: null } });
    const subResult = await fetchInbox(sub.client, me, "closer");
    expect(subResult).toMatchObject({ status: "ok", hasTeam: false, team: [] });

    const admin = clientFor({ leads: { data: [lead(idA, me)], error: null } });
    const adminResult = await fetchInbox(admin.client, me, "admin");
    expect(adminResult).toMatchObject({ status: "ok", hasTeam: false, team: [] });
    expect(admin.leads).toContainEqual(["eq", ["assigned_to", me]]);
  });

  it("reports an error for failed queries, bad shapes and thrown failures", async () => {
    const failed = clientFor({ inbox: { data: null, error: { message: "x" } } });
    expect(await fetchInbox(failed.client, me, "closer")).toEqual({ status: "error" });
    const shaped = clientFor({ inbox: { data: [{ id: "nope" }], error: null } });
    expect(await fetchInbox(shaped.client, me, "closer")).toEqual({ status: "error" });
    const thrown = clientFor({ throws: true });
    expect(await fetchInbox(thrown.client, me, "closer")).toEqual({ status: "error" });
  });
});

describe("toInboxCards", () => {
  const offers: OfferLabels = {
    offers: { "web-negocio": "Web de negocio" },
    extras: { payments: "Pagos" },
    questions: {},
  };

  it("describes the masked row without inventing data", () => {
    const [card, bare] = toInboxCards(
      [
        { ...inboxRow, id: inboxRow.id },
        {
          ...inboxRow,
          id: "10000000-0000-4000-8000-000000000004",
          via: null,
          offer: null,
          extras: [],
          excerpt: "  ",
          locale: null,
        },
      ] as never,
      "es",
      offers,
      { project: "A medida" },
      { es: "Español" },
    ) as [ReturnType<typeof toInboxCards>[number], ReturnType<typeof toInboxCards>[number]];
    expect(card).toMatchObject({
      name: "Cara",
      viaLabel: "A medida",
      offerText: "Web de negocio",
      extrasText: "Pagos",
      excerpt: "Quiero una web […]",
      localeLabel: "Español",
    });
    expect(bare).toMatchObject({
      viaLabel: null,
      offerText: null,
      extrasText: null,
      excerpt: null,
      localeLabel: null,
    });
  });
});
