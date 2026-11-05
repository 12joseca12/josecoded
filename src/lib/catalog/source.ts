import { type Env, isLoopbackMode, present, productionSupabaseUrl } from "@/lib/contact/env";
import { type CatalogRows, catalogRowsSchema } from "@/types/catalog";

export interface CatalogSourceConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export const catalogTimeoutMs = 2500;

export function readCatalogConfig(env: Env): CatalogSourceConfig | null {
  const supabaseUrl = present(env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = present(env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !serviceRoleKey) return null;
  if (!isLoopbackMode(env) && !productionSupabaseUrl.test(supabaseUrl)) return null;
  return { supabaseUrl, serviceRoleKey };
}

const views = [
  { key: "offers", view: "public_offers", columns: "slug,price,weeks_min,weeks_max,sort" },
  { key: "extras", view: "public_extras", columns: "slug,price,sort" },
  { key: "rates", view: "public_rates", columns: "code,price" },
  { key: "plans", view: "public_maintenance_plans", columns: "slug,price_monthly,sort" },
] as const;

export async function fetchCatalogRows(
  config: CatalogSourceConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<CatalogRows | null> {
  try {
    const bodies = await Promise.all(
      views.map(async ({ view, columns }) => {
        const response = await fetchImpl(
          `${config.supabaseUrl}/rest/v1/${view}?select=${columns}`,
          {
            headers: {
              apikey: config.serviceRoleKey,
              authorization: `Bearer ${config.serviceRoleKey}`,
              accept: "application/json",
            },
            cache: "no-store",
            signal: AbortSignal.timeout(catalogTimeoutMs),
          },
        );
        if (!response.ok) return null;
        return (await response.json()) as unknown;
      }),
    );
    if (bodies.some((body) => body === null)) return null;
    const parsed = catalogRowsSchema.safeParse({
      offers: bodies[0],
      extras: bodies[1],
      rates: bodies[2],
      plans: bodies[3],
    });
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
