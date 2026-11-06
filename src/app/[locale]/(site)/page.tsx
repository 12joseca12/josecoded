import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Closing } from "@/components/home/Closing/Closing";
import { Hero } from "@/components/home/Hero/Hero";
import { HowStrip } from "@/components/home/HowStrip/HowStrip";
import { RecommenderTeaser } from "@/components/home/RecommenderTeaser/RecommenderTeaser";
import { ServicesStrip } from "@/components/home/ServicesStrip/ServicesStrip";
import { StackRow } from "@/components/home/StackRow/StackRow";
import { BlockScroll } from "@/components/site/BlockScroll/BlockScroll";
import { isLocale } from "@/i18n/config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getFeatures } from "@/lib/settings/features";

import styles from "./page.module.css";

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
      <div className={styles.sections}>
        <ServicesStrip locale={locale} />
        <RecommenderTeaser locale={locale} />
        <StackRow locale={locale} />
        <HowStrip locale={locale} />
        <Closing locale={locale} chat={(await getFeatures()).chat} />
      </div>
    </>
  );
}
