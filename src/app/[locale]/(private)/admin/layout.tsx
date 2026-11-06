import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { StaffShell } from "@/components/staff/StaffShell/StaffShell";
import { isLocale, isPublished } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { getStaffShell } from "@/lib/staff/shell";

import { signOut } from "../actions";

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale) || !isPublished(locale)) notFound();
  const member = await requireZone("admin", locale);
  const shell = await getStaffShell("admin", locale, member.role);
  return (
    <StaffShell
      {...shell}
      zone="admin"
      userName={member.fullName}
      signOutAction={signOut.bind(null, locale)}
    >
      {children}
    </StaffShell>
  );
}
