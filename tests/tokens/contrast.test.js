import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync("src/styles/tokens.css", "utf8");

const token = (name) => {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6});`, "i"));
  assert.ok(match, `${name} must be a hex token`);
  return match[1];
};

const luminance = (hex) => {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

test("ink on bg reaches 4.5:1", () => {
  assert.ok(contrast(token("--ink"), token("--bg")) >= 4.5);
});

test("on-dark on charcoal reaches 4.5:1", () => {
  assert.ok(contrast(token("--on-dark"), token("--charcoal")) >= 4.5);
});

test("charcoal on coral reaches 4.5:1", () => {
  assert.ok(contrast(token("--charcoal"), token("--coral")) >= 4.5);
});

test("charcoal on panel reaches 4.5:1 for Nexo bubbles", () => {
  assert.ok(contrast(token("--charcoal"), token("--panel")) >= 4.5);
});

test("ink-soft on paper reaches 4.5:1 for the chat placeholder", () => {
  assert.ok(contrast(token("--ink-soft"), token("--paper")) >= 4.5);
});
