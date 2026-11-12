import { describe, expect, it } from "vitest";

import type { LeadFilters, LeadRow } from "@/types/leads";

import {
  countByTab,
  filterLeads,
  hasFieldFilters,
  leadQueryMax,
  leadsHref,
  normalizeEmail,
  parseLeadFilters,
  tabOf,
  withSubmissionCounts,
} from "./lead-filters";

const closer = "00000000-0000-4000-8000-0000000000c1";

function row(patch: Partial<LeadRow>): LeadRow {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    via: "hiring",
    source: "form",
    full_name: "Hilda Hiring",
    email: "hilda@example.com",
    organization: null,
    contact_id: null,
    status: "new",
    created_at: "2026-11-01T08:00:00+00:00",
    assigned_to: null,
    discard_reason: null,
    offer: null,
    ...patch,
  };
}

const none: LeadFilters = { tab: "all", via: null, source: null, owner: null, q: "" };

const rows = [
  row({ id: "a", status: "new" }),
  row({ id: "b", status: "new", contact_id: "30000000-0000-4000-8000-000000000001" }),
  row({ id: "c", status: "assigned", assigned_to: closer, via: "freelance", source: "manual" }),
  row({ id: "d", status: "contacted", assigned_to: closer, via: null, full_name: "Zed" }),
  row({ id: "e", status: "converted", assigned_to: closer, organization: "Acme Corp" }),
  row({ id: "f", status: "discarded", via: "project" }),
];

describe("parseLeadFilters", () => {
  it("reads every filter from the query", () => {
    expect(
      parseLeadFilters({
        status: "waiting",
        via: "project",
        source: "manual",
        owner: closer,
        q: " ana ",
      }),
    ).toEqual({ tab: "waiting", via: "project", source: "manual", owner: closer, q: "ana" });
  });

  it("falls back to no filter for anything it does not know", () => {
    expect(
      parseLeadFilters({ status: "x", via: "pack", source: "fax", owner: "not-a-uuid" }),
    ).toEqual(none);
    expect(parseLeadFilters({})).toEqual(none);
  });

  it("accepts the unassigned and no-via markers, the first of repeated keys and a capped query", () => {
    expect(parseLeadFilters({ owner: "none", via: "none" })).toMatchObject({
      owner: "none",
      via: "none",
    });
    expect(parseLeadFilters({ status: ["new", "assigned"] }).tab).toBe("new");
    expect(parseLeadFilters({ q: "x".repeat(500) }).q).toHaveLength(leadQueryMax);
  });
});

describe("tabOf", () => {
  it("separates new leads from those waiting for the admin", () => {
    expect(rows.map(tabOf)).toEqual([
      "new",
      "waiting",
      "assigned",
      "assigned",
      "converted",
      "discarded",
    ]);
  });
});

describe("filterLeads", () => {
  it("filters by tab", () => {
    expect(filterLeads(rows, { ...none, tab: "assigned" }).map((entry) => entry.id)).toEqual([
      "c",
      "d",
    ]);
    expect(filterLeads(rows, none)).toHaveLength(rows.length);
  });

  it("filters by via, source and owner", () => {
    expect(filterLeads(rows, { ...none, via: "freelance" }).map((entry) => entry.id)).toEqual([
      "c",
    ]);
    expect(filterLeads(rows, { ...none, via: "none" }).map((entry) => entry.id)).toEqual(["d"]);
    expect(filterLeads(rows, { ...none, source: "manual" }).map((entry) => entry.id)).toEqual([
      "c",
    ]);
    expect(filterLeads(rows, { ...none, owner: closer })).toHaveLength(3);
    expect(filterLeads(rows, { ...none, owner: "none" }).map((entry) => entry.id)).toEqual([
      "a",
      "b",
      "f",
    ]);
  });

  it("searches name, email and organization without caring about case", () => {
    expect(filterLeads(rows, { ...none, q: "zED" }).map((entry) => entry.id)).toEqual(["d"]);
    expect(filterLeads(rows, { ...none, q: "acme" }).map((entry) => entry.id)).toEqual(["e"]);
    expect(filterLeads(rows, { ...none, q: "HILDA@" })).toHaveLength(6);
  });
});

describe("countByTab", () => {
  it("counts each tab under the field filters and ignores the active tab", () => {
    expect(countByTab(rows, { ...none, tab: "discarded" })).toEqual({
      all: 6,
      new: 1,
      waiting: 1,
      assigned: 2,
      converted: 1,
      discarded: 1,
    });
    expect(countByTab(rows, { ...none, owner: closer }).all).toBe(3);
  });
});

describe("leadsHref and hasFieldFilters", () => {
  it("keeps the other filters when switching tab", () => {
    const filters: LeadFilters = {
      tab: "new",
      via: "hiring",
      source: null,
      owner: closer,
      q: "ana b",
    };
    expect(leadsHref("/es/admin/interesados", filters, "assigned")).toBe(
      `/es/admin/interesados?status=assigned&via=hiring&owner=${closer}&q=ana+b`,
    );
    expect(leadsHref("/es/admin/interesados", none, "all")).toBe("/es/admin/interesados");
  });

  it("tells whether a field filter is active", () => {
    expect(hasFieldFilters(none)).toBe(false);
    expect(hasFieldFilters({ ...none, tab: "new" })).toBe(false);
    expect(hasFieldFilters({ ...none, q: "a" })).toBe(true);
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims, and treats blank as none", () => {
    expect(normalizeEmail(" Ana@Example.COM ")).toBe("ana@example.com");
    expect(normalizeEmail("  ")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("withSubmissionCounts", () => {
  it("counts form submissions per normalized email", () => {
    const result = withSubmissionCounts([
      row({ id: "1", email: "Ana@Example.com" }),
      row({ id: "2", email: "ana@example.com" }),
      row({ id: "3", email: "ana@example.com", source: "manual" }),
      row({ id: "4", email: "bob@example.com" }),
      row({ id: "5", email: null }),
    ]);
    expect(result.map((entry) => entry.submissionCount)).toEqual([2, 2, 2, 1, 0]);
  });

  it("gives 0 to an email that never used the form", () => {
    const [entry] = withSubmissionCounts([row({ source: "whatsapp", email: "z@example.com" })]);
    expect(entry?.submissionCount).toBe(0);
  });
});
