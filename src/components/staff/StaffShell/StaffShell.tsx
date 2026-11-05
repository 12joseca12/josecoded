import { type ReactNode, ViewTransition } from "react";

import { Brand } from "@/components/site/Brand/Brand";
import { RouteFocus } from "@/components/site/RouteFocus/RouteFocus";
import { contentId, SkipLink } from "@/components/site/SkipLink/SkipLink";
import { Button } from "@/components/ui/Button/Button";
import type { StaffNavItem, StaffShellLabels, StaffSwitch, StaffZone } from "@/types/staff";

import { StaffNav } from "../StaffNav/StaffNav";
import { SignOutButton } from "./SignOutButton";
import styles from "./StaffShell.module.css";

interface StaffShellProps {
  zone: StaffZone;
  homeHref: string;
  userName: string;
  items: StaffNavItem[];
  labels: StaffShellLabels;
  zoneSwitch: StaffSwitch | null;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}

export function StaffShell({
  zone,
  homeHref,
  userName,
  items,
  labels,
  zoneSwitch,
  signOutAction,
  children,
}: StaffShellProps) {
  const account = (
    <div className={styles.account}>
      <p className={styles.user}>{labels.userLabel.replace("{name}", userName)}</p>
      {zoneSwitch ? (
        <Button href={zoneSwitch.href} variant="quiet" size="sm">
          {zoneSwitch.label}
        </Button>
      ) : null}
      <form action={signOutAction}>
        <SignOutButton label={labels.signOut} loadingLabel={labels.signingOut} />
      </form>
    </div>
  );

  return (
    <>
      <SkipLink label={labels.skipLink} />
      <div className={styles.frame} data-zone={zone}>
        <header className={styles.rail}>
          <Brand href={homeHref} label={labels.brandLabel} word={labels.brandWord} />
          <StaffNav
            label={labels.navLabel}
            items={items}
            soonLabel={labels.soon}
            moreLabel={labels.more}
            moreTitle={labels.moreTitle}
            closeLabel={labels.close}
            sheetFooter={account}
          />
          <div className={styles.railAccount}>{account}</div>
        </header>
        <ViewTransition default="none" update="page-swap">
          <main id={contentId} tabIndex={-1} className={styles.main}>
            {children}
          </main>
        </ViewTransition>
      </div>
      <RouteFocus />
    </>
  );
}
