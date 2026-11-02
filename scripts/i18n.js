import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const generatedFile = join(root, "src/i18n/keys.generated.ts");
const baseLocale = "es";
const locales = ["es", "en"];

function flatten(tree, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

function load(locale) {
  const file = join(root, "messages", `${locale}.json`);
  if (!existsSync(file)) return null;
  return flatten(JSON.parse(readFileSync(file, "utf8")));
}

async function render(keys) {
  const source = `export type MessageKey = ${keys.map((key) => `"${key}"`).join(" | ")};\n`;
  const options = await resolveConfig(generatedFile);
  return format(source, { ...options, filepath: generatedFile });
}

const base = load(baseLocale);
const keys = Object.keys(base).sort();
const expected = await render(keys);

if (process.argv.includes("--write")) {
  writeFileSync(generatedFile, expected);
  console.log(`i18n: wrote ${keys.length} keys to src/i18n/keys.generated.ts`);
  process.exit(0);
}

const problems = [];

for (const locale of locales) {
  const messages = load(locale);
  if (!messages) {
    problems.push(`${locale}: messages/${locale}.json not found`);
    continue;
  }
  if (locale !== baseLocale) {
    for (const key of keys) {
      if (!(key in messages)) problems.push(`${locale}: missing key "${key}"`);
    }
    for (const key of Object.keys(messages)) {
      if (!(key in base)) problems.push(`${locale}: extra key "${key}" not in ${baseLocale}`);
    }
  }
  for (const [key, value] of Object.entries(messages)) {
    if (value.includes("{{DATO")) problems.push(`${locale}: placeholder in "${key}": ${value}`);
  }
}

const current = existsSync(generatedFile) ? readFileSync(generatedFile, "utf8") : "";
if (current !== expected) {
  problems.push("src/i18n/keys.generated.ts is stale: run pnpm i18n:keys");
}

if (problems.length > 0) {
  console.error(problems.map((p) => `i18n: ${p}`).join("\n"));
  process.exit(1);
}
console.log(`i18n: ok (${keys.length} keys, ${locales.length} locales)`);
