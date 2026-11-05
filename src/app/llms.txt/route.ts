import { contact } from "@/config/contact";
import { site } from "@/config/site";
import { hasPublishedProjects } from "@/content";
import { defaultLocale } from "@/i18n/config";
import { buildLlmsTxt } from "@/lib/seo/llms";
import { rates } from "@/lib/services/rates";

export const dynamic = "force-static";

export async function GET() {
  const body = await buildLlmsTxt(
    site.origin,
    defaultLocale,
    rates,
    contact.ways,
    hasPublishedProjects(),
  );
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
