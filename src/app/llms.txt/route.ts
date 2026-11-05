import { contact } from "@/config/contact";
import { features } from "@/config/features";
import { site } from "@/config/site";
import { hasPublishedProjects, listPosts } from "@/content";
import { defaultLocale } from "@/i18n/config";
import { sortPosts } from "@/lib/blog/posts";
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
    features.blog
      ? sortPosts(listPosts()).map((post) => ({
          slug: post.slug,
          title: post.meta.title,
          description: post.meta.description,
        }))
      : [],
  );
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
