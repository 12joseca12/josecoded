import { describe, expect, it } from "vitest";

import type { RoomMessage } from "@/types/room";

import { mergeMessages } from "./use-room-messages";

function message(id: string, createdAt: string): RoomMessage {
  return {
    id,
    conversation_id: "11111111-1111-4111-8111-111111111111",
    author_kind: "human",
    author_id: null,
    kind: "text",
    system_event: null,
    body: id,
    sources: [],
    auto: false,
    created_at: createdAt,
  };
}

describe("mergeMessages", () => {
  it("keeps the same list when nothing is new", () => {
    const current = [message("a", "2026-11-05T10:00:00+00:00")];
    expect(mergeMessages(current, [])).toBe(current);
    expect(mergeMessages(current, [message("a", "2026-11-05T10:00:00+00:00")])).toBe(current);
  });

  it("adds only unseen messages in chronological order", () => {
    const current = [
      message("a", "2026-11-05T10:00:00+00:00"),
      message("c", "2026-11-05T10:02:00+00:00"),
    ];
    const merged = mergeMessages(current, [
      message("b", "2026-11-05T10:01:00+00:00"),
      message("a", "2026-11-05T10:00:00+00:00"),
    ]);
    expect(merged.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("breaks ties by the stored timestamp text then the id", () => {
    const merged = mergeMessages(
      [message("b", "2026-11-05T10:00:00.1234+00:00")],
      [
        message("a", "2026-11-05T10:00:00.1230+00:00"),
        message("c", "2026-11-05T10:00:00.1234+00:00"),
      ],
    );
    expect(merged.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });
});
