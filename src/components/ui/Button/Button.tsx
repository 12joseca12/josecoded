"use client";

import NextLink from "next/link";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";

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

const pressKeys = new Set(["Enter", " "]);
const pressedHoldMs = 160;

function markPressed(event: KeyboardEvent<HTMLElement>) {
  if (event.repeat || !pressKeys.has(event.key)) return;
  const element = event.currentTarget;
  element.dataset.pressed = "true";
  const release = () => {
    element.removeEventListener("keyup", onKeyUp);
    element.removeEventListener("blur", release);
    delete element.dataset.pressed;
  };
  const onKeyUp = () => {
    setTimeout(release, pressedHoldMs);
  };
  element.addEventListener("keyup", onKeyUp, { once: true });
  element.addEventListener("blur", release, { once: true });
}

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
    "data-icon": slot && !leading ? "true" : undefined,
    "aria-busy": loading || undefined,
  };
  const withPress =
    <E extends HTMLElement>(handler?: (event: KeyboardEvent<E>) => void) =>
    (event: KeyboardEvent<E>) => {
      markPressed(event);
      handler?.(event);
    };

  if (props.href === undefined) {
    const { disabled, type = "button", onKeyDown, ...buttonRest } = rest as ButtonAsButtonProps;
    return (
      <button
        {...buttonRest}
        {...shared}
        type={type}
        disabled={disabled === true || loading}
        onKeyDown={withPress(onKeyDown)}
      >
        {content}
      </button>
    );
  }

  const { href, disabled, onKeyDown, ...linkRest } = rest as ButtonAsLinkProps;
  if (disabled === true || loading) {
    return (
      <a {...linkRest} {...shared} role="link" aria-disabled="true">
        {content}
      </a>
    );
  }
  return (
    <NextLink {...linkRest} {...shared} href={href} onKeyDown={withPress(onKeyDown)}>
      {content}
    </NextLink>
  );
}
