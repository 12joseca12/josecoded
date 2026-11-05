"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface ErrorFocusSectionProps {
  className?: string;
  variant: string;
  layout: string;
  focusOnLoad: boolean;
  children: ReactNode;
}

export function ErrorFocusSection({
  className,
  variant,
  layout,
  focusOnLoad,
  children,
}: ErrorFocusSectionProps) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!focusOnLoad) return;
    const heading = root.current?.querySelector<HTMLElement>("h1, h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [focusOnLoad]);

  return (
    <section ref={root} className={className} data-variant={variant} data-layout={layout}>
      {children}
    </section>
  );
}
