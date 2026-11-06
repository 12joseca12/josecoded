import { describe, expect, it } from "vitest";

import type { RoomSummary } from "@/types/room";

import { parseRoomParam, pickRoom } from "./chat";

function room(id: string, kind: RoomSummary["kind"]): RoomSummary {
  return {
    id,
    kind,
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
  };
}

const own = "11111111-1111-4111-8111-111111111111";
const client = "22222222-2222-4222-8222-222222222222";

describe("pickRoom", () => {
  const rooms = [room(client, "client"), room(own, "closer")];

  it("opens the requested room when the closer can see it", () => {
    expect(pickRoom(rooms, own, client)?.id).toBe(client);
  });

  it("falls back to the own room for an unknown or missing request", () => {
    expect(pickRoom(rooms, own, "33333333-3333-4333-8333-333333333333")?.id).toBe(own);
    expect(pickRoom(rooms, own, null)?.id).toBe(own);
  });
});

describe("parseRoomParam", () => {
  it("accepts only a uuid", () => {
    expect(parseRoomParam(client)).toBe(client);
    expect(parseRoomParam([client, own])).toBe(client);
    expect(parseRoomParam("sala")).toBeNull();
    expect(parseRoomParam(undefined)).toBeNull();
  });
});
