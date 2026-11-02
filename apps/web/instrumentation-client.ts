// Runs in the browser before the app hydrates (Next `instrumentation-client`). Zod 4 probes `Function("")` the first time
// it builds an object schema, to decide whether it may compile parsers. Under the site's Content-Security-Policy (no
// 'unsafe-eval') the probe is caught but still reported as a violation on every page, so JIT is switched off before any
// schema exists: the speed-up is irrelevant at the payload sizes of a form.
import { z } from 'zod';

z.config({ jitless: true });
