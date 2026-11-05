import { headers } from "next/headers";

import { JsonLd } from "@/components/seo/JsonLd/JsonLd";
import { nonceHeader } from "@/lib/security/nonce";
import { buildGraph } from "@/lib/seo/jsonld";
import type { JsonLdNode } from "@/types/seo";

export async function PageGraph({ nodes }: { nodes: JsonLdNode[] }) {
  const nonce = (await headers()).get(nonceHeader) ?? undefined;
  return <JsonLd data={buildGraph(...nodes)} nonce={nonce} />;
}
