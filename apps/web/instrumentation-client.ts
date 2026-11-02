// Runs in the browser before the app hydrates (Next `instrumentation-client`). Zod 4 probes `Function("")` the first time
// it builds an object schema, to decide whether it may compile parsers. Under the site's Content-Security-Policy (no
// 'unsafe-eval') the probe is caught but still reported as a violation on every page, so JIT is switched off before any
// schema exists: the speed-up is irrelevant at the payload sizes of a form.
//
// Zod keeps its config on `globalThis.__zod_globalConfig` and reuses it when it finds one, so it is set here without
// importing zod: importing it put ~390 KB of JavaScript (92 KB gzipped) in every page, the home included, for a flag.
// `instrumentation-client.test.ts` fails if a zod upgrade stops honouring it.
(globalThis as { __zod_globalConfig?: object }).__zod_globalConfig = { jitless: true };

// makes this file a module for the type checker (the test imports it)
export {};
