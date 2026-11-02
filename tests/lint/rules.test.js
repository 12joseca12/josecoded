import assert from "node:assert/strict";
import { test } from "node:test";

import { ESLint } from "eslint";
import stylelint from "stylelint";

const fixture = (name) => `tests/lint/fixtures/${name}`;

const eslint = new ESLint({ ignore: false });

const eslintRules = async (name) => {
  const [result] = await eslint.lintFiles([fixture(name)]);
  return new Set(result.messages.map((message) => message.ruleId));
};

const stylelintRules = async (name) => {
  const { results } = await stylelint.lint({ files: [fixture(name)] });
  return new Set(results.flatMap((result) => result.warnings.map((warning) => warning.rule)));
};

test("a comment fails", async () => {
  assert.ok((await eslintRules("comment.ts")).has("local/no-comments"));
});

test("@ts-ignore fails", async () => {
  const rules = await eslintRules("ts-ignore.ts");
  assert.ok(rules.has("@typescript-eslint/ban-ts-comment"));
  assert.ok(rules.has("local/no-comments"));
});

test("eslint-disable fails and cannot silence the rule", async () => {
  assert.ok((await eslintRules("eslint-disable.ts")).has("local/no-comments"));
});

test("unsorted imports fail", async () => {
  assert.ok((await eslintRules("import-order.ts")).has("simple-import-sort/imports"));
});

test("a clean file passes", async () => {
  assert.equal((await eslintRules("clean.ts")).size, 0);
});

test("literal colors, px font-size, px radius and px media fail", async () => {
  const rules = await stylelintRules("bad.module.css");
  assert.ok(rules.has("color-no-hex"));
  assert.ok(rules.has("function-disallowed-list"));
  assert.ok(rules.has("unit-disallowed-list"));
  assert.ok(rules.has("scale-unlimited/declaration-strict-value"));
});

test("tokens, rem, hairlines and shadows pass", async () => {
  assert.equal((await stylelintRules("good.module.css")).size, 0);
});
