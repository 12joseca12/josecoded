// Minimal typing of Vite's import.meta.glob for the tests (Vite transforms the call at build time; vite/client is
// not a dependency of this package).
interface ImportMeta {
  glob<T = unknown>(
    patterns: string | string[],
    options: { query: '?raw'; import: 'default'; eager: true },
  ): Record<string, T>;
}
