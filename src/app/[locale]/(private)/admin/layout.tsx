import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell/AdminShell";
import { isLocale, isPublished } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";

import { signOut } from "../actions";

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale) || !isPublished(locale)) notFound();
  const member = await requireZone("admin", locale);
  const t = await getTranslator(locale);
  const home = `/${locale}/admin`;
  return (
    <AdminShell
      homeHref={home}
      userName={member.fullName}
      items={[
        { href: home, label: t("admin.nav.overview") },
        { href: `${home}/interesados`, label: t("admin.nav.leads") },
      ]}
      labels={{
        skipLink: t("nav.skipLink"),
        brandLabel: t("admin.brandLabel"),
        brandWord: t("admin.brandWord"),
        navLabel: t("admin.navLabel"),
        userLabel: t("admin.userLabel"),
        signOut: t("admin.signOut"),
        signingOut: t("admin.signingOut"),
      }}
      signOutAction={signOut.bind(null, locale)}
    >
      {children}
    </AdminShell>
  );
}
