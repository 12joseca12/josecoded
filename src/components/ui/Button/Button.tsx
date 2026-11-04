"use client";

import NextLink from "next/link";
import {
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import type { ButtonSize, ButtonVariant } from "@/types/ui";

import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";
import { spawnBubbles } from "./bubbles";
import styles from "./Button.module.css";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
  iconStart?: boolean;
  badge?: boolean;
  collapse?: boolean;
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
const linkPressKeys = new Set(["Enter"]);
const pressedHoldMs = 160;

const disabledSelector = ":disabled, [aria-disabled='true']";
const centre = { x: 50, y: 50 };

const bubbleClass = styles.bubble ?? "";

function originOf(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: rect.width > 0 ? ((event.clientX - rect.left) / rect.width) * 100 : centre.x,
    y: rect.height > 0 ? ((event.clientY - rect.top) / rect.height) * 100 : centre.y,
  };
}

function emit(element: HTMLElement, origin: typeof centre) {
  if (element.matches(disabledSelector)) return;
  const burst = element.querySelector<HTMLElement>(":scope > [data-burst]");
  if (burst) spawnBubbles(burst, bubbleClass, origin);
}

function markPressed(event: KeyboardEvent<HTMLElement>) {
  const element = event.currentTarget;
  const keys = element instanceof HTMLAnchorElement ? linkPressKeys : pressKeys;
  if (event.repeat || !keys.has(event.key)) return;
  emit(element, centre);
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
    iconStart = false,
    badge = false,
    collapse = false,
    children,
    ...rest
  } = props;

  const ghost = variant === "ghost";
  const leading = ghost || iconStart;
  const slot =
    loading || icon ? (
      <span className={styles.slot} data-badge={badge || undefined} aria-hidden="true">
        {loading ? <span className={styles.spinner} /> : icon}
      </span>
    ) : null;
  const content = (
    <>
      {leading ? slot : null}
      <span className={styles.label}>{children}</span>
      {leading ? null : slot}
      <span className={styles.burst} data-burst="" aria-hidden="true" />
      {loading && loadingLabel ? <VisuallyHidden>{loadingLabel}</VisuallyHidden> : null}
    </>
  );
  const shared = {
    className: styles.button,
    "data-variant": variant,
    "data-size": size,
    "data-icon": slot && !ghost ? (iconStart ? "start" : "true") : undefined,
    "data-collapse": collapse ? "narrow" : undefined,
    "aria-busy": loading || undefined,
  };
  const withPress =
    <E extends HTMLElement>(handler?: (event: KeyboardEvent<E>) => void) =>
    (event: KeyboardEvent<E>) => {
      markPressed(event);
      handler?.(event);
    };
  const withPointer =
    <E extends HTMLElement>(handler?: (event: PointerEvent<E>) => void) =>
    (event: PointerEvent<E>) => {
      if (event.button === 0 && event.pointerType !== "touch") {
        emit(event.currentTarget, originOf(event));
      }
      handler?.(event);
    };
  const withTouchClick =
    <E extends HTMLElement>(handler?: (event: MouseEvent<E>) => void) =>
    (event: MouseEvent<E>) => {
      if ("pointerType" in event.nativeEvent && event.nativeEvent.pointerType === "touch") {
        emit(event.currentTarget, originOf(event));
      }
      handler?.(event);
    };

  if (props.href === undefined) {
    const {
      disabled,
      type = "button",
      onKeyDown,
      onPointerDown,
      onClick,
      ...buttonRest
    } = rest as ButtonAsButtonProps;
    return (
      <button
        {...buttonRest}
        {...shared}
        type={type}
        disabled={disabled === true || loading}
        onKeyDown={withPress(onKeyDown)}
        onPointerDown={withPointer(onPointerDown)}
        onClick={withTouchClick(onClick)}
      >
        {content}
      </button>
    );
  }

  const { href, disabled, onKeyDown, onPointerDown, onClick, ...linkRest } =
    rest as ButtonAsLinkProps;
  if (disabled === true || loading) {
    return (
      <a {...linkRest} {...shared} role="link" aria-disabled="true">
        {content}
      </a>
    );
  }
  return (
    <NextLink
      {...linkRest}
      {...shared}
      href={href}
      onKeyDown={withPress(onKeyDown)}
      onPointerDown={withPointer(onPointerDown)}
      onClick={withTouchClick(onClick)}
    >
      {content}
    </NextLink>
  );
}
