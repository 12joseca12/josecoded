import { describe, expect, it } from "vitest";

import type { RoomMember } from "@/types/room";

import { canWriteInRoom } from "./chat";

function member(userId: string, fields: Partial<RoomMember> = {}): RoomMember {
  return {
    user_id: userId,
    role: "client",
    full_name: userId,
    can_write: true,
    joined_at: "2026-11-01T00:00:00Z",
    left_at: null,
    ...fields,
  };
}

describe("canWriteInRoom", () => {
  it("allows an active member with write permission", () => {
    expect(canWriteInRoom([member("a")], "a")).toBe(true);
  });

  it("denies read-only members, those who left and strangers", () => {
    expect(canWriteInRoom([member("a", { can_write: false })], "a")).toBe(false);
    expect(canWriteInRoom([member("a", { left_at: "2026-11-02T00:00:00Z" })], "a")).toBe(false);
    expect(canWriteInRoom([member("a")], "b")).toBe(false);
  });
});
