/** Compile-time flag (esbuild `define`): `true` under Vitest, `false` in wrangler builds (wrangler.jsonc). */
declare const __TEST_HOOKS__: boolean;

/** Vite `?raw` imports (tests read wrangler.jsonc as text: workerd has no filesystem). */
declare module '*?raw' {
  const content: string;
  export default content;
}
