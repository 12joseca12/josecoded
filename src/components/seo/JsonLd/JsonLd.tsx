import { serializeJsonLd } from "@/lib/seo/jsonld";
import type { JsonLdGraph } from "@/types/seo";

export function JsonLd({ data, nonce }: { data: JsonLdGraph; nonce?: string }) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
