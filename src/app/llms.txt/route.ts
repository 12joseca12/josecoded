import { contact } from "@/config/contact";
import { features } from "@/config/features";
import { site } from "@/config/site";
import { hasPublishedProjects, listPosts, listProjects } from "@/content";
import { defaultLocale } from "@/i18n/config";
import { sortPosts } from "@/lib/blog/posts";
import { getCatalog } from "@/lib/catalog/load";
import { buildLlmsTxt } from "@/lib/seo/llms";

export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  const { rates } = await getCatalog();
  const body = await buildLlmsTxt(
    site.origin,
    defaultLocale,
    rates,
    contact.ways,
    hasPublishedProjects(),
    listProjects().map(({ slug, meta }) => ({ slug, title: meta.title, headline: meta.headline })),
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
