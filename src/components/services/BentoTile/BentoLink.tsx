import NextLink from "next/link";
import type { ReactNode } from "react";

import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import type { BentoLinkVariant } from "@/types/services";

import styles from "./BentoTile.module.css";

interface BentoLinkProps {
  href: string;
  variant?: BentoLinkVariant;
  describedBy?: string;
  download?: boolean;
  lang?: string;
  children: ReactNode;
}

export function BentoLink({
  href,
  variant = "stretch",
  describedBy,
  download,
  lang,
  children,
}: BentoLinkProps) {
  const content = (
    <>
      {children}
      {variant === "stretch" ? (
        <span className={styles.icon}>
          <ArrowIcon />
        </span>
      ) : null}
    </>
  );
  const shared = {
    className: styles.link,
    "data-variant": variant,
    "aria-describedby": describedBy,
  };
  return download || href.startsWith("#") ? (
    <a href={href} download={download} lang={lang} {...shared}>
      {content}
    </a>
  ) : (
    <NextLink href={href} lang={lang} {...shared}>
      {content}
    </NextLink>
  );
}
