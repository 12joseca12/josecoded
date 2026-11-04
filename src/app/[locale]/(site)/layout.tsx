import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SiteChrome } from "@/components/site/SiteChrome/SiteChrome";
import { isLocale, isPublished } from "@/i18n/config";

interface SiteLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function SiteLayout({ children, params }: SiteLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale) || !isPublished(locale)) notFound();
  return <SiteChrome locale={locale}>{children}</SiteChrome>;
}
