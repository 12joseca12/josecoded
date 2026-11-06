import { describe, expect, it } from "vitest";

import type { RoomSummary } from "@/types/room";

import { countByTab, parseChatTab, tabOf } from "./chat";

function room(fields: Partial<RoomSummary>): RoomSummary {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    kind: "closer",
    status: "open",
    last_activity_at: "2026-11-05T10:00:00+00:00",
    last_message_excerpt: null,
    unread_count: 0,
    ai_active: true,
    ai_enabled: true,
    consent_state: "n/a",
    counterpart_name: null,
    first_page_path: null,
    project_id: null,
    ...fields,
  };
}

describe("tabOf", () => {
  it("puts archived rooms first, whatever their kind", () => {
    expect(tabOf(room({ kind: "visitor", status: "archived" }))).toBe("archived");
  });

  it("groups open rooms by who is on the other side", () => {
    expect(tabOf(room({ kind: "visitor" }))).toBe("visitors");
    expect(tabOf(room({ kind: "closer" }))).toBe("people");
    expect(tabOf(room({ kind: "freelance" }))).toBe("people");
    expect(tabOf(room({ kind: "client" }))).toBe("clients");
  });
});

describe("countByTab", () => {
  it("counts every room once", () => {
    expect(
      countByTab([
        room({ kind: "visitor" }),
        room({}),
        room({ status: "archived" }),
        room({ kind: "client" }),
      ]),
    ).toEqual({ visitors: 1, people: 1, clients: 1, archived: 1 });
  });
});

describe("parseChatTab", () => {
  it("falls back to visitors", () => {
    expect(parseChatTab(undefined)).toBe("visitors");
    expect(parseChatTab("nope")).toBe("visitors");
    expect(parseChatTab(["clients", "people"])).toBe("clients");
    expect(parseChatTab("archived")).toBe("archived");
  });
});
