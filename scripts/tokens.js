import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceFile = join(root, "src/styles/tokens.css");
const generatedFile = join(root, "src/styles/tokens.generated.ts");

const block = readFileSync(sourceFile, "utf8").match(/:root\s*\{([\s\S]*?)\n\}/);
if (!block) {
  console.error("tokens: no :root block in src/styles/tokens.css");
  process.exit(1);
}
const names = [...block[1].matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((match) => match[1]);
const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
if (duplicates.length > 0) {
  console.error(`tokens: duplicated ${[...new Set(duplicates)].join(", ")}`);
  process.exit(1);
}

const list = names.map((name) => `"${name}"`).join(", ");
const source = `export const tokenNames = [${list}] as const;\n\nexport type TokenName = (typeof tokenNames)[number];\n`;
const options = await resolveConfig(generatedFile);
const expected = await format(source, { ...options, filepath: generatedFile });

if (process.argv.includes("--write")) {
  writeFileSync(generatedFile, expected);
  console.log(`tokens: wrote ${names.length} names to src/styles/tokens.generated.ts`);
  process.exit(0);
}

const current = existsSync(generatedFile) ? readFileSync(generatedFile, "utf8") : "";
if (current !== expected) {
  console.error("tokens: src/styles/tokens.generated.ts is out of date, run pnpm tokens:types");
  process.exit(1);
}
console.log(`tokens: ok (${names.length} names)`);
