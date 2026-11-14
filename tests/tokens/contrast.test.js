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

const colour = (name) => {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`, "i"));
  assert.ok(match, `${name} must exist`);
  const value = match[1].trim();
  const alias = value.match(/^var\((--[\w-]+)\)$/);
  if (alias) return colour(alias[1]);
  if (value.startsWith("#"))
    return { rgb: [1, 3, 5].map((s) => parseInt(value.slice(s, s + 2), 16)), alpha: 1 };
  const parts = value.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)$/);
  assert.ok(parts, `${name} must be hex or rgb()`);
  return {
    rgb: [parts[1], parts[2], parts[3]].map(Number),
    alpha: parts[4] === undefined ? 1 : Number(parts[4]),
  };
};

const over = (top, below) => ({
  rgb: top.rgb.map((c, i) => c * top.alpha + below.rgb[i] * (1 - top.alpha)),
  alpha: 1,
});

const lum = ({ rgb }) =>
  luminance(`#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`);

const ratio = (a, b) => {
  const [light, dark] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

const backdrops = [colour("--bg"), colour("--charcoal"), { rgb: [255, 255, 255], alpha: 1 }];
const glassOf = (back) => over(colour("--chat-glass"), back);

for (const [index, back] of backdrops.entries()) {
  const glass = glassOf(back);
  const surfaces = {
    glass,
    plate: over(colour("--chat-plate"), glass),
    pill: over(colour("--chat-pill"), glass),
    "error plate": over(colour("--chat-error-plate"), glass),
    "Jose bubble": over(colour("--chat-bubble-jose"), glass),
    "Nexo bubble": over(colour("--chat-bubble-nexo"), glass),
  };
  const worst = index === 1 ? "dark backdrop" : "backdrop";
  for (const [label, surface] of Object.entries(surfaces)) {
    for (const ink of ["--ink", "--ink-soft"]) {
      test(`${ink} on ${label} over ${worst} ${index} reaches 4.5:1`, () => {
        assert.ok(ratio(colour(ink), surface) >= 4.5);
      });
    }
  }
  test(`error text on error plate over ${worst} ${index} reaches 4.5:1`, () => {
    assert.ok(ratio(colour("--error"), surfaces["error plate"]) >= 4.5);
  });
}

test("own bubble text reaches 4.5:1", () => {
  assert.ok(ratio(colour("--on-dark"), colour("--chat-bubble-own")) >= 4.5);
});

test("chat input line reaches 3:1 against the input field", () => {
  for (const back of backdrops) {
    const field = over(colour("--chat-input"), glassOf(back));
    const line = over(colour("--chat-input-line"), field);
    assert.ok(ratio(line, field) >= 3);
  }
});

test("chat input line reaches 3:1 against the glass", () => {
  for (const back of backdrops) {
    const glass = glassOf(back);
    assert.ok(ratio(over(colour("--chat-input-line"), glass), glass) >= 3);
  }
});
