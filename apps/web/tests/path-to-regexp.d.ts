// Next bundles path-to-regexp without types; the route-rules test uses the same matcher Next does.
declare module 'next/dist/compiled/path-to-regexp' {
  export function match(
    source: string,
  ): (path: string) => false | { path: string; params: Record<string, string | string[]> };
}
