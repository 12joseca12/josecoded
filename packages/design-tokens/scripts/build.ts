// pnpm tokens:build — writes apps/web/styles/{tokens.css,breakpoints.ts,tokens.ts} from
// .impeccable/design.json. Runs with plain Node (type stripping, Node >= 22.18).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { emitTokens } from '../src/emit.ts';

const design: unknown = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../.impeccable/design.json', import.meta.url)), 'utf8'),
);
const out = emitTokens(design);
const dir = fileURLToPath(new URL('../../../apps/web/styles/', import.meta.url));

mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}tokens.css`, out.css);
writeFileSync(`${dir}breakpoints.ts`, out.breakpointsTs);
writeFileSync(`${dir}tokens.ts`, out.tokensTs);
console.log(`tokens: ${out.names.length} custom properties -> apps/web/styles/`);
