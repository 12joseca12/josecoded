import "server-only";

import { unstable_cache } from "next/cache";

import { type Catalog, codeCatalog, mergeCatalog } from "./merge";
import { fetchCatalogRows, readCatalogConfig } from "./source";
import { catalogTag } from "./tag";

export const catalogRevalidateSeconds = 300;

async function readRows() {
  const config = readCatalogConfig(process.env);
  if (!config) return null;
  return unstable_cache(() => fetchCatalogRows(config), ["catalog-rows", config.supabaseUrl], {
    tags: [catalogTag],
    revalidate: catalogRevalidateSeconds,
  })();
}

export async function getCatalog(): Promise<Catalog> {
  try {
    return mergeCatalog(await readRows());
  } catch {
    return codeCatalog;
  }
}
