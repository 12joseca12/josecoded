import { readFileSync } from 'node:fs';

import { checkMedia, checkMediaFiles, type MediaManifest } from './check-media';
import { MANIFEST_PATH, PUBLIC_DIR, mediaHash } from './media-config';

let manifest: MediaManifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as MediaManifest;
} catch {
  console.error(`hero:media:check: cannot read ${MANIFEST_PATH}; run "pnpm hero:media"`);
  process.exit(1);
}

const errors = [...checkMedia(manifest, mediaHash()).errors, ...checkMediaFiles(manifest, PUBLIC_DIR).errors];
if (errors.length > 0) {
  for (const e of errors) console.error(`hero:media:check: ${e}`);
  process.exit(1);
}
console.log(`hero:media:check: ok (${Object.keys(manifest.files).length} files, paramsHash ${manifest.paramsHash})`);
