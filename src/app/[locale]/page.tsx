import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Hero } from "@/components/home/Hero/Hero";
import { BlockScroll } from "@/components/site/BlockScroll/BlockScroll";
import { isLocale } from "@/i18n/config";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "",
    sameSegmentAsLayout: true,
    title: "home.metaTitle",
    description: "home.metaDescription",
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <BlockScroll />
      <Hero locale={locale} />
    </>
  );
}
