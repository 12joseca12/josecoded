import NextLink from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { ButtonSize, ButtonVariant } from "@/types/ui";

import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";
import styles from "./Button.module.css";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
}

type ButtonAsButtonProps = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof ButtonBaseProps> & { href?: undefined };

type ButtonAsLinkProps = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof ButtonBaseProps | "href"> & {
    href: string;
    disabled?: boolean;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    loadingLabel,
    icon,
    children,
    ...rest
  } = props;

  const leading = variant === "ghost";
  const slot =
    loading || icon ? (
      <span className={styles.slot} aria-hidden="true">
        {loading ? <span className={styles.spinner} /> : icon}
      </span>
    ) : null;
  const content = (
    <>
      {leading ? slot : null}
      <span>{children}</span>
      {leading ? null : slot}
      {loading && loadingLabel ? <VisuallyHidden>{loadingLabel}</VisuallyHidden> : null}
    </>
  );
  const shared = {
    className: styles.button,
    "data-variant": variant,
    "data-size": size,
    "aria-busy": loading || undefined,
  };

  if (props.href === undefined) {
    const { disabled, type = "button", ...buttonRest } = rest as ButtonAsButtonProps;
    return (
      <button {...buttonRest} {...shared} type={type} disabled={disabled === true || loading}>
        {content}
      </button>
    );
  }

  const { href, disabled, ...linkRest } = rest as ButtonAsLinkProps;
  if (disabled === true || loading) {
    return (
      <a {...linkRest} {...shared} role="link" aria-disabled="true">
        {content}
      </a>
    );
  }
  return (
    <NextLink {...linkRest} {...shared} href={href}>
      {content}
    </NextLink>
  );
}
