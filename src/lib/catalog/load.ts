import "server-only";

import { unstable_cache } from "next/cache";

import { type Catalog, codeCatalog, mergeCatalog } from "./merge";
import { fetchCatalogRows, readCatalogConfig } from "./source";
import { catalogTag } from "./tag";

export const catalogRevalidateSeconds = 300;

const readRows = unstable_cache(
  async () => {
    const config = readCatalogConfig(process.env);
    return config ? await fetchCatalogRows(config) : null;
  },
  ["catalog-rows"],
  { tags: [catalogTag], revalidate: catalogRevalidateSeconds },
);

export async function getCatalog(): Promise<Catalog> {
  try {
    return mergeCatalog(await readRows());
  } catch {
    return codeCatalog;
  }
}
