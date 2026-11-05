import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { BlogClosing } from "@/components/blog/BlogClosing/BlogClosing";
import { BlogListing } from "@/components/blog/BlogListing/BlogListing";
import { JsonLd } from "@/components/seo/JsonLd/JsonLd";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { features } from "@/config/features";
import { site } from "@/config/site";
import { listPosts } from "@/content";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { blogId, buildBlog, buildPostList } from "@/lib/blog/jsonld";
import { blogPath, pagePath, paginate, parsePage, sortPosts } from "@/lib/blog/posts";
import { buildPagination, buildTabs, toTeaser } from "@/lib/blog/view";
import { withResponseTime } from "@/lib/common/response-time";
import { nonceHeader } from "@/lib/security/nonce";
import { buildBreadcrumbList, buildGraph } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";

interface BlogProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pagina?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: BlogProps): Promise<Metadata> {
  const [{ locale }, { pagina }] = await Promise.all([params, searchParams]);
  const page = parsePage(pagina);
  if (!isLocale(locale) || !features.blog || page === null) return {};
  return buildPageMetadata({
    locale,
    path: pagePath(blogPath, page),
    title: "blog.meta.title",
    description: "blog.meta.description",
  });
}

export default async function BlogPage({ params, searchParams }: BlogProps) {
  const [{ locale }, { pagina }] = await Promise.all([params, searchParams]);
  const requested = parsePage(pagina);
  const posts = sortPosts(listPosts());
  if (!isLocale(locale) || !features.blog || requested === null || posts.length === 0) notFound();
  const current = paginate(posts, requested);
  if (!current) notFound();
  const [t, requestHeaders] = await Promise.all([getTranslator(locale), headers()]);
  const nonce = requestHeaders.get(nonceHeader) ?? undefined;

  const crumbs = [
    { label: t("nav.home"), href: localePath(locale, "") },
    { label: t("nav.blog"), href: localePath(locale, blogPath) },
  ];
  const graph = buildGraph(
    buildBlog(site.origin, locale, {
      name: t("nav.blog"),
      description: t("blog.meta.description"),
    }),
    buildPostList(
      site.origin,
      locale,
      blogId(site.origin, locale),
      current.items.map((post) => ({ slug: post.slug, title: post.meta.title })),
    ),
    buildBreadcrumbList(
      site.origin,
      crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
    ),
  );

  return (
    <>
      <JsonLd data={graph} nonce={nonce} />
      <PageHead
        title={t("blog.head.title")}
        titleSize="h2"
        accent={t("blog.head.accent")}
        lead={t("blog.head.lead")}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
      />
      <BlogListing
        tabsLabel={t("blog.tabs.label")}
        tabs={buildTabs(t, locale, posts, null)}
        posts={current.items.map((post) => toTeaser(t, locale, post))}
        pagination={buildPagination(t, locale, blogPath, current)}
        closing={
          <BlogClosing
            title={t("blog.closing.title")}
            text={withResponseTime(t, t("blog.closing.text"))}
            cta={t("blog.closing.cta")}
            href={localePath(locale, "/contacto")}
          />
        }
      />
    </>
  );
}
