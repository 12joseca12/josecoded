import { readFileSync } from 'node:fs';

import { mediaManifestSchema, type MediaManifest } from '@josecoded/types';

import { checkMedia, checkMediaFiles } from './check-media';
import { MANIFEST_PATH, PUBLIC_DIR, mediaHash } from './media-config';

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
} catch {
  console.error(`hero:media:check: cannot read ${MANIFEST_PATH}; run "pnpm hero:media"`);
  process.exit(1);
}
const parsed = mediaManifestSchema.safeParse(raw);
if (!parsed.success) {
  console.error(`hero:media:check: ${MANIFEST_PATH} does not match the manifest schema; run "pnpm hero:media --force"`);
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  process.exit(1);
}
const manifest: MediaManifest = parsed.data;

const errors = [...checkMedia(manifest, mediaHash()).errors, ...checkMediaFiles(manifest, PUBLIC_DIR).errors];
if (errors.length > 0) {
  for (const e of errors) console.error(`hero:media:check: ${e}`);
  process.exit(1);
}
console.log(`hero:media:check: ok (${Object.keys(manifest.files).length} files, paramsHash ${manifest.paramsHash})`);
