import type { ReactNode } from "react";

import { defaultLocale, type Locale } from "@/i18n/config";
import { errorCodes, type ErrorCopy, type ErrorVariant } from "@/types/errors";
import type { HeadingLevel } from "@/types/ui";

import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Heading } from "../Heading/Heading";
import { Link } from "../Link/Link";
import { ErrorFocusSection } from "./ErrorFocusSection";
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
  children?: ReactNode;
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
  children,
}: ErrorPageProps) {
  const { title, text } = copy[variant];
  const { actions } = copy;

  return (
    <ErrorFocusSection
      className={styles.page}
      variant={variant}
      layout={layout}
      focusOnLoad={focusOnLoad}
    >
      <Card tone="glass" size="lg" elevation="float" className={styles.card}>
        <p className={styles.code} aria-hidden="true">
          {errorCodes[variant]}
        </p>
        <Heading level={headingLevel} size="h3">
          {title}
        </Heading>
        <p className={styles.text}>{text}</p>
        {children}
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
            <Link href={`/${locale}/contacto`}>{actions.contact}</Link>
          ) : null}
        </div>
      </Card>
    </ErrorFocusSection>
  );
}
