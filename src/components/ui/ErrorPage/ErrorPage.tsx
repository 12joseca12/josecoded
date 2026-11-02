"use client";

import { useEffect, useRef } from "react";

import { defaultLocale, type Locale } from "@/i18n/config";
import { errorCodes, type ErrorCopy, type ErrorVariant } from "@/types/errors";
import type { HeadingLevel } from "@/types/ui";

import { Button } from "../Button/Button";
import { Heading } from "../Heading/Heading";
import { Link } from "../Link/Link";
import styles from "./ErrorPage.module.css";

export interface ErrorPageProps {
  variant: ErrorVariant;
  copy: ErrorCopy;
  locale?: Locale;
  onRetry?: () => void;
  retrying?: boolean;
  layout?: "page" | "inline";
  headingLevel?: HeadingLevel;
  focusOnLoad?: boolean;
}

export function ErrorPage({
  variant,
  copy,
  locale = defaultLocale,
  onRetry,
  retrying = false,
  layout = "page",
  headingLevel = 1,
  focusOnLoad = true,
}: ErrorPageProps) {
  const root = useRef<HTMLElement>(null);
  const { title, text } = copy[variant];
  const { actions } = copy;

  useEffect(() => {
    if (!focusOnLoad) return;
    const heading = root.current?.querySelector<HTMLElement>("h1, h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [focusOnLoad]);

  return (
    <section ref={root} className={styles.page} data-variant={variant} data-layout={layout}>
      <div className={styles.card}>
        <p className={styles.code} aria-hidden="true">
          {errorCodes[variant]}
        </p>
        <Heading level={headingLevel} size="h3">
          {title}
        </Heading>
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>
          {onRetry ? (
            <Button
              variant="primary"
              loading={retrying}
              loadingLabel={actions.retrying}
              onClick={onRetry}
            >
              {actions.retry}
            </Button>
          ) : null}
          <Button variant={onRetry ? "light" : "primary"} href={`/${locale}`}>
            {actions.home}
          </Button>
          {variant === "notFound" ? (
            <>
              <Link href={`/${locale}/proyectos`}>{actions.projects}</Link>
              <Link href={`/${locale}/chat`}>{actions.chat}</Link>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
