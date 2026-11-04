"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { ToastProvider, useToast } from "@/components/ui/Toast/ToastProvider";
import { toastTones } from "@/types/ui";

import styles from "./page.module.css";

export interface StatesLabels {
  skeleton: string;
  skeletonText: string;
  skeletonBlock: string;
  skeletonCircle: string;
  loadingRegion: string;
  loadingRegionLabel: string;
  toggleLoading: string;
  loadedContent: string;
  empty: string;
  emptyTitle: string;
  emptyText: string;
  emptyAction: string;
  error: string;
  errorTitle: string;
  errorText: string;
  errorRetry: string;
  errorRetried: string;
  loading: string;
  toasts: string;
  toastRegion: string;
  toastClose: string;
  tones: Record<(typeof toastTones)[number], { trigger: string; title: string; text: string }>;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Demo({ labels }: { labels: StatesLabels }) {
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const retry = async () => {
    await wait(1200);
    toast({ tone: "info", message: labels.errorRetried });
  };

  return (
    <>
      <section className={styles.section} aria-labelledby="ui-skeleton">
        <Heading level={2} size="h4" id="ui-skeleton">
          {labels.skeleton}
        </Heading>
        <div className={styles.cells}>
          <Skeleton shape="circle" />
          <div className={styles.grow}>
            <Skeleton shape="text" lines={3} />
          </div>
          <Skeleton shape="block" width="12rem" height="6rem" />
        </div>
        <Heading level={3} size="h4">
          {labels.loadingRegion}
        </Heading>
        <LoadingRegion
          loading={loading}
          label={labels.loadingRegionLabel}
          fallback={<Skeleton shape="text" lines={3} />}
        >
          <p className={styles.note}>{labels.loadedContent}</p>
        </LoadingRegion>
        <div className={styles.cells}>
          <Button
            variant="light"
            size="sm"
            onClick={() => {
              setLoading((value) => !value);
            }}
          >
            {labels.toggleLoading}
          </Button>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="ui-empty">
        <Heading level={2} size="h4" id="ui-empty">
          {labels.empty}
        </Heading>
        <EmptyState
          title={labels.emptyTitle}
          text={labels.emptyText}
          action={
            <Button variant="light" size="sm" href="#ui-empty">
              {labels.emptyAction}
            </Button>
          }
        />
      </section>

      <section className={styles.section} aria-labelledby="ui-error">
        <Heading level={2} size="h4" id="ui-error">
          {labels.error}
        </Heading>
        <ErrorState
          title={labels.errorTitle}
          text={labels.errorText}
          retryLabel={labels.errorRetry}
          loadingLabel={labels.loading}
          onRetry={retry}
        />
      </section>

      <section className={styles.section} aria-labelledby="ui-toast">
        <Heading level={2} size="h4" id="ui-toast">
          {labels.toasts}
        </Heading>
        <div className={styles.cells}>
          {toastTones.map((tone) => (
            <Button
              key={tone}
              variant={tone === "error" ? "accent" : "primary"}
              size="sm"
              onClick={() =>
                toast({ tone, title: labels.tones[tone].title, message: labels.tones[tone].text })
              }
            >
              {labels.tones[tone].trigger}
            </Button>
          ))}
        </div>
      </section>
    </>
  );
}

export function StatesDemo({ labels }: { labels: StatesLabels }) {
  return (
    <ToastProvider regionLabel={labels.toastRegion} closeLabel={labels.toastClose}>
      <Demo labels={labels} />
    </ToastProvider>
  );
}
