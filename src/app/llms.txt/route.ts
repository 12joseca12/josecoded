import { site } from "@/config/site";
import { defaultLocale } from "@/i18n/config";
import { buildLlmsTxt } from "@/lib/seo/llms";
import { rateFixture } from "@/lib/services/rates";

export const dynamic = "force-static";

export async function GET() {
  const body = await buildLlmsTxt(site.origin, defaultLocale, rateFixture);
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
