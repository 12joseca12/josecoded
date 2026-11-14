import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";

import {
  ContentError,
  findPlaceholders,
  readContent,
  readCv,
  renderIndex,
  renderProjectMetaIndex,
} from "../src/content/loader.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const generatedFile = join(root, "src/content/index.generated.ts");
const metaFile = join(root, "src/content/projects-meta.generated.ts");

let entries;
try {
  entries = readContent(root);
  readCv(root);
} catch (error) {
  if (error instanceof ContentError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

const options = await resolveConfig(generatedFile);
const expected = await format(renderIndex(entries), { ...options, filepath: generatedFile });
const expectedMeta = await format(renderProjectMetaIndex(entries), {
  ...options,
  filepath: metaFile,
});

if (process.argv.includes("--write")) {
  writeFileSync(generatedFile, expected);
  writeFileSync(metaFile, expectedMeta);
  console.log(`content: wrote ${entries.length} entries to src/content/index.generated.ts`);
  process.exit(0);
}

const pendingSources = [
  "content/cv.json",
  "src/lib/services/rates.ts",
  "src/config/profiles.ts",
  "messages/es.json",
].map((file) => ({ file }));
const pending = findPlaceholders(root, [...entries, ...pendingSources]);
for (const { file, line, text } of pending) {
  console.warn(`content: pending data ${file}:${line}: ${text}`);
}

const current = existsSync(generatedFile) ? readFileSync(generatedFile, "utf8") : "";
const currentMeta = existsSync(metaFile) ? readFileSync(metaFile, "utf8") : "";
if (current !== expected || currentMeta !== expectedMeta) {
  console.error("content: generated content files are stale: run pnpm content:build");
  process.exit(1);
}
console.log(`content: ok (${entries.length} entries, ${pending.length} pending placeholders)`);
