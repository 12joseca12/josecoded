import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";

import { ContentError, findPlaceholders, readContent, renderIndex } from "../src/content/loader.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const generatedFile = join(root, "src/content/index.generated.ts");

let entries;
try {
  entries = readContent(root);
} catch (error) {
  if (error instanceof ContentError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

const options = await resolveConfig(generatedFile);
const expected = await format(renderIndex(entries), { ...options, filepath: generatedFile });

if (process.argv.includes("--write")) {
  writeFileSync(generatedFile, expected);
  console.log(`content: wrote ${entries.length} entries to src/content/index.generated.ts`);
  process.exit(0);
}

const pending = findPlaceholders(root, entries);
for (const { file, line, text } of pending) {
  console.warn(`content: pending data ${file}:${line}: ${text}`);
}

const current = existsSync(generatedFile) ? readFileSync(generatedFile, "utf8") : "";
if (current !== expected) {
  console.error("content: src/content/index.generated.ts is stale: run pnpm content:build");
  process.exit(1);
}
console.log(`content: ok (${entries.length} entries, ${pending.length} pending placeholders)`);
