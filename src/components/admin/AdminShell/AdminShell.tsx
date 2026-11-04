import { type ReactNode, ViewTransition } from "react";

import { Brand } from "@/components/site/Brand/Brand";
import { RouteFocus } from "@/components/site/RouteFocus/RouteFocus";
import { contentId, SkipLink } from "@/components/site/SkipLink/SkipLink";

import { AdminNav, type AdminNavItem } from "../AdminNav/AdminNav";
import styles from "./AdminShell.module.css";
import { SignOutButton } from "./SignOutButton";

export interface AdminShellLabels {
  skipLink: string;
  brandLabel: string;
  brandWord: string;
  navLabel: string;
  userLabel: string;
  signOut: string;
  signingOut: string;
}

interface AdminShellProps {
  homeHref: string;
  userName: string;
  items: AdminNavItem[];
  labels: AdminShellLabels;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}

export function AdminShell({
  homeHref,
  userName,
  items,
  labels,
  signOutAction,
  children,
}: AdminShellProps) {
  return (
    <>
      <SkipLink label={labels.skipLink} />
      <header className={styles.header}>
        <div className={styles.bar}>
          <Brand href={homeHref} label={labels.brandLabel} word={labels.brandWord} />
          <AdminNav label={labels.navLabel} items={items} />
          <p className={styles.user}>{labels.userLabel.replace("{name}", userName)}</p>
          <form action={signOutAction} className={styles.signOut}>
            <SignOutButton label={labels.signOut} loadingLabel={labels.signingOut} />
          </form>
        </div>
      </header>
      <ViewTransition default="none" update="page-swap">
        <main id={contentId} tabIndex={-1} className={styles.main}>
          {children}
        </main>
      </ViewTransition>
      <RouteFocus />
    </>
  );
}
