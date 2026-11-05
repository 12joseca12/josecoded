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
import {
  blogPath,
  categoriesWithPosts,
  categoryPath,
  isBlogCategory,
  pagePath,
  paginate,
  parsePage,
  postsInCategory,
  sortPosts,
} from "@/lib/blog/posts";
import { buildPagination, buildTabs, categoryKey, toTeaser } from "@/lib/blog/view";
import { withResponseTime } from "@/lib/common/response-time";
import { nonceHeader } from "@/lib/security/nonce";
import { buildBreadcrumbList, buildGraph } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";

interface CategoryProps {
  params: Promise<{ locale: string; categoria: string }>;
  searchParams: Promise<{ pagina?: string | string[] }>;
}

export function generateStaticParams() {
  return categoriesWithPosts(listPosts()).map((categoria) => ({ categoria }));
}

export async function generateMetadata({ params, searchParams }: CategoryProps): Promise<Metadata> {
  const [{ locale, categoria }, { pagina }] = await Promise.all([params, searchParams]);
  const page = parsePage(pagina);
  if (!isLocale(locale) || !features.blog || page === null || !isBlogCategory(categoria)) return {};
  return buildPageMetadata({
    locale,
    path: pagePath(categoryPath(categoria), page),
    title: categoryKey(categoria, "metaTitle"),
    description: categoryKey(categoria, "metaDescription"),
  });
}

export default async function CategoryPage({ params, searchParams }: CategoryProps) {
  const [{ locale, categoria }, { pagina }] = await Promise.all([params, searchParams]);
  const requested = parsePage(pagina);
  if (!isLocale(locale) || !features.blog || requested === null || !isBlogCategory(categoria)) {
    notFound();
  }
  const all = sortPosts(listPosts());
  const inCategory = postsInCategory(all, categoria);
  const current = paginate(inCategory, requested);
  if (inCategory.length === 0 || !current) notFound();
  const [t, requestHeaders] = await Promise.all([getTranslator(locale), headers()]);
  const nonce = requestHeaders.get(nonceHeader) ?? undefined;

  const label = t(categoryKey(categoria, "label"));
  const crumbs = [
    { label: t("nav.home"), href: localePath(locale, "") },
    { label: t("nav.blog"), href: localePath(locale, blogPath) },
    { label, href: localePath(locale, categoryPath(categoria)) },
  ];
  const graph = buildGraph(
    buildBlog(site.origin, locale, {
      name: label,
      description: t(categoryKey(categoria, "metaDescription")),
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
        title={t(categoryKey(categoria, "title"))}
        titleSize="h2"
        accent={t(categoryKey(categoria, "accent"))}
        lead={t(categoryKey(categoria, "lead"))}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
      />
      <BlogListing
        tabsLabel={t("blog.tabs.label")}
        tabs={buildTabs(t, locale, all, categoria)}
        posts={current.items.map((post) => toTeaser(t, locale, post))}
        pagination={buildPagination(t, locale, categoryPath(categoria), current)}
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
