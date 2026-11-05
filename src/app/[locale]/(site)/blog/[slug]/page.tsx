import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AuthorBox } from "@/components/blog/AuthorBox/AuthorBox";
import { PostLayout } from "@/components/blog/PostLayout/PostLayout";
import { PostTeaser } from "@/components/blog/PostTeaser/PostTeaser";
import { PrintButton } from "@/components/blog/PrintButton/PrintButton";
import { RelatedService } from "@/components/blog/RelatedService/RelatedService";
import { Toc } from "@/components/legal/Toc/Toc";
import { JsonLd } from "@/components/seo/JsonLd/JsonLd";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { Faq } from "@/components/ui/Faq/Faq";
import { Heading } from "@/components/ui/Heading/Heading";
import { Prose } from "@/components/ui/Prose/Prose";
import { features } from "@/config/features";
import { site } from "@/config/site";
import { getPost, listPosts } from "@/content";
import { isLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { buildBlogPosting } from "@/lib/blog/jsonld";
import {
  blogPath,
  categoryPath,
  postPath,
  relatedPosts,
  servicePaths,
  sortPosts,
  splitTitle,
} from "@/lib/blog/posts";
import { categoryKey, formatDate, readingLabel, toTeaser } from "@/lib/blog/view";
import { nonceHeader } from "@/lib/security/nonce";
import { buildBreadcrumbList, buildFaqPage, buildGraph } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";
import type { RelatedServiceData } from "@/types/blog";

import styles from "./page.module.css";

interface PostProps {
  params: Promise<{ locale: string; slug: string }>;
}

const faqAnchor = "preguntas-frecuentes";

export function generateStaticParams() {
  return listPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!isLocale(locale) || !features.blog || !post) return {};
  return buildPageMetadata({
    locale,
    path: postPath(slug),
    title: { literal: post.meta.metaTitle ?? post.meta.title },
    description: { literal: post.meta.description },
    openGraphType: "article",
    article: { published: post.meta.date, modified: post.meta.updated },
  });
}

export default async function PostPage({ params }: PostProps) {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!isLocale(locale) || !features.blog || !post) notFound();
  const [t, requestHeaders, { default: Body }] = await Promise.all([
    getTranslator(locale),
    headers(),
    post.load(),
  ]);
  const nonce = requestHeaders.get(nonceHeader) ?? undefined;
  const { meta } = post;

  const serviceKey = (field: string) =>
    `blog.service.${meta.relatedService}.${field}` as MessageKey;
  const service: RelatedServiceData = {
    title: t(serviceKey("title")),
    text: t(serviceKey("text")),
    cta: t(serviceKey("cta")),
    href: localePath(locale, servicePaths[meta.relatedService]),
  };

  const categoryLabel = t(categoryKey(meta.category, "label"));
  const crumbs = [
    { label: t("nav.home"), href: localePath(locale, "") },
    { label: t("nav.blog"), href: localePath(locale, blogPath) },
    { label: categoryLabel, href: localePath(locale, categoryPath(meta.category)) },
    { label: meta.title },
  ];
  const faq = meta.faq.map((item, index) => ({ id: `faq-${index + 1}`, ...item }));
  const graph = buildGraph(
    buildBlogPosting(site.origin, locale, {
      slug,
      title: meta.title,
      description: meta.description,
      published: meta.date,
      modified: meta.updated,
      section: categoryLabel,
      words: post.words,
    }),
    ...(faq.length > 0 ? [buildFaqPage(faq)] : []),
    buildBreadcrumbList(
      site.origin,
      crumbs.map((crumb) => ({
        name: crumb.label,
        path: crumb.href ?? localePath(locale, postPath(slug)),
      })),
    ),
  );

  const { head, accent } = splitTitle(meta.title);
  const tocItems = [
    ...post.headings,
    ...(faq.length > 0 ? [{ id: faqAnchor, label: t("blog.post.faq.title") }] : []),
  ];
  const related = relatedPosts(sortPosts(listPosts()), post);

  return (
    <>
      <JsonLd data={graph} nonce={nonce} />
      <PageHead
        title={head}
        titleSize="h2"
        accent={accent}
        lead={meta.description}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
      >
        <AuthorBox
          author={{
            label: t("blog.post.author.label"),
            name: t("seo.person.name"),
            credential: t(`blog.post.author.credential.${meta.category}` as MessageKey),
            published: meta.date,
            publishedPrefix: t("blog.post.author.published"),
            publishedLabel: formatDate(locale, meta.date),
            updated: meta.updated,
            updatedPrefix: t("blog.post.author.updated"),
            updatedLabel: formatDate(locale, meta.updated),
            readingLabel: readingLabel(t, post.words),
          }}
        />
        {meta.kind === "resource" ? <PrintButton label={t("blog.post.print")} /> : null}
      </PageHead>
      <PostLayout
        toc={
          <Toc label={t("blog.post.toc.label")} title={t("blog.post.toc.title")} items={tocItems} />
        }
      >
        <Prose>
          <Body components={{ RelatedService: () => <RelatedService service={service} /> }} />
        </Prose>
        <RelatedService service={service} variant="closing" />
        {faq.length > 0 ? (
          <section className={styles.section} aria-labelledby={faqAnchor}>
            <Heading level={2} size="h3" id={faqAnchor}>
              {t("blog.post.faq.title")}
            </Heading>
            <Faq items={faq} />
          </section>
        ) : null}
        {related.length > 0 ? (
          <section
            className={styles.section}
            aria-labelledby="related-title"
            data-print="hide"
            data-wide
          >
            <Heading level={2} size="h3" id="related-title">
              {t("blog.post.related.title")}
            </Heading>
            <ul className={styles.related}>
              {related.map((entry) => (
                <li key={entry.slug}>
                  <PostTeaser post={toTeaser(t, locale, entry)} headingLevel={3} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PostLayout>
    </>
  );
}
