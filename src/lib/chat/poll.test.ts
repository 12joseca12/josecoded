import { describe, expect, it } from "vitest";

import { roomPollMs } from "./poll";

describe("roomPollMs", () => {
  it("defaults to four seconds", () => {
    expect(roomPollMs({})).toBe(4000);
  });

  it("accepts a sane override and ignores the rest", () => {
    expect(roomPollMs({ E2E_ROOM_POLL_MS: "300" })).toBe(300);
    expect(roomPollMs({ E2E_ROOM_POLL_MS: "10" })).toBe(4000);
    expect(roomPollMs({ E2E_ROOM_POLL_MS: "abc" })).toBe(4000);
  });
});
