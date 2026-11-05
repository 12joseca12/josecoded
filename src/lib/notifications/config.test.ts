import { describe, expect, it } from "vitest";

import { isOutboxDrainOn, readBotUsername, telegramStartUrl } from "./config";

describe("outbox drain switch", () => {
  it("is off unless it says on", () => {
    expect(isOutboxDrainOn({})).toBe(false);
    expect(isOutboxDrainOn({ OUTBOX_DRAIN: "off" })).toBe(false);
    expect(isOutboxDrainOn({ OUTBOX_DRAIN: "true" })).toBe(false);
    expect(isOutboxDrainOn({ OUTBOX_DRAIN: " on " })).toBe(true);
  });
});

describe("bot username", () => {
  it("accepts a plain or @-prefixed name and refuses anything else", () => {
    expect(readBotUsername({ TELEGRAM_BOT_USERNAME: "josecoded_bot" })).toBe("josecoded_bot");
    expect(readBotUsername({ TELEGRAM_BOT_USERNAME: "@josecoded_bot" })).toBe("josecoded_bot");
    expect(readBotUsername({})).toBeNull();
    expect(readBotUsername({ TELEGRAM_BOT_USERNAME: "" })).toBeNull();
    expect(readBotUsername({ TELEGRAM_BOT_USERNAME: "a/b?x=1" })).toBeNull();
  });
});

describe("start link", () => {
  it("builds the deep link with the code", () => {
    expect(telegramStartUrl("josecoded_bot", "AB23CD")).toBe(
      "https://t.me/josecoded_bot?start=AB23CD",
    );
  });
});
