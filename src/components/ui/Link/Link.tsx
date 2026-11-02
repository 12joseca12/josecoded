import NextLink from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { LinkVariant } from "@/types/ui";

import { ArrowIcon } from "../icons/ArrowIcon";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";
import styles from "./Link.module.css";

export interface LinkProps extends Omit<ComponentPropsWithoutRef<"a">, "href" | "children"> {
  href: string;
  variant?: LinkVariant;
  external?: boolean;
  newTabLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function Link({
  href,
  variant = "inline",
  external = false,
  newTabLabel,
  icon,
  children,
  ...rest
}: LinkProps) {
  const content = (
    <>
      {children}
      {external && newTabLabel ? <VisuallyHidden>{newTabLabel}</VisuallyHidden> : null}
      {variant === "arrow" ? <span className={styles.icon}>{icon ?? <ArrowIcon />}</span> : null}
    </>
  );

  if (external) {
    return (
      <a
        {...rest}
        href={href}
        className={styles.link}
        data-variant={variant}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }
  return (
    <NextLink {...rest} href={href} className={styles.link} data-variant={variant}>
      {content}
    </NextLink>
  );
}
