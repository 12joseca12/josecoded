// Writes content/generated/csp-config.json (the origins the CSP allows, from the public environment of this build). The
// worker (`worker.ts`) imports it: it is bundled by wrangler, which does not see `NEXT_PUBLIC_*`. Part of `generate`.
// Runs with plain Node (type stripping, Node >= 22.18), so internal imports carry `.ts`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { cspConfigFromEnv } from '../lib/security/csp.ts';

const out = fileURLToPath(new URL('../content/generated/csp-config.json', import.meta.url));

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(cspConfigFromEnv(process.env), null, 2)}\n`);
}
