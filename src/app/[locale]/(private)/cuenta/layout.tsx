import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { StaffShell } from "@/components/staff/StaffShell/StaffShell";
import { isLocale, isPublished } from "@/i18n/config";
import { requireAccount } from "@/lib/auth/session";
import { getAccountShell } from "@/lib/staff/shell";

import { signOut } from "../actions";

interface AccountLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AccountLayout({ children, params }: AccountLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale) || !isPublished(locale)) notFound();
  const member = await requireAccount(locale);
  const shell = await getAccountShell(locale, member.role);
  return (
    <StaffShell
      {...shell}
      zone="account"
      userName={member.fullName}
      signOutAction={signOut.bind(null, locale)}
    >
      {children}
    </StaffShell>
  );
}
