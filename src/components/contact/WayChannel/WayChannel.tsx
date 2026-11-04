import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";

import { ChannelCard } from "../ChannelCard/ChannelCard";
import { CopyButton } from "../CopyButton/CopyButton";
import styles from "./WayChannel.module.css";

interface WayChannelProps {
  id: string;
  title: string;
  hint: string;
  email: string;
  href: string;
  openLabel: string;
  copyLabel: string;
  copyAriaLabel: string;
  copiedLabel: string;
}

export function WayChannel({
  id,
  title,
  hint,
  email,
  href,
  openLabel,
  copyLabel,
  copyAriaLabel,
  copiedLabel,
}: WayChannelProps) {
  return (
    <ChannelCard id={id} title={title} hint={hint}>
      <div className={styles.body}>
        <p className={styles.email} data-email="">
          {email}
        </p>
        <div className={styles.actions}>
          <Button href={href} icon={<ArrowIcon />}>
            {openLabel}
          </Button>
          <CopyButton
            value={email}
            label={copyLabel}
            ariaLabel={copyAriaLabel}
            doneLabel={copiedLabel}
          />
        </div>
      </div>
    </ChannelCard>
  );
}
