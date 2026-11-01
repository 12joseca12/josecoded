import type { JsonLdGraph, JsonLdNode } from '@/lib/seo/jsonld';

/** `<` escaped so that no value can close the script element; U+2028/2029 for old parsers. */
export function serializeJsonLd(data: JsonLdGraph | JsonLdNode): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

/**
 * Structured data block. `application/ld+json` is data, not code: the CSP does not need a hash for it. Server component,
 * so it ships no JavaScript.
 */
export function JsonLd({ data }: { data: JsonLdGraph | JsonLdNode }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
