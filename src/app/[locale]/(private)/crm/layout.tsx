import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { StaffShell } from "@/components/staff/StaffShell/StaffShell";
import { isLocale, isPublished } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { getStaffShell } from "@/lib/staff/shell";

import { signOut } from "../actions";

interface CrmLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function CrmLayout({ children, params }: CrmLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale) || !isPublished(locale)) notFound();
  const member = await requireZone("crm", locale);
  const shell = await getStaffShell("crm", locale, member.role);
  return (
    <StaffShell {...shell} userName={member.fullName} signOutAction={signOut.bind(null, locale)}>
      {children}
    </StaffShell>
  );
}
