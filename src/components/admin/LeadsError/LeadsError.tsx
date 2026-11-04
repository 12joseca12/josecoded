"use client";

import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/ui/ErrorState/ErrorState";

interface LeadsErrorProps {
  title: string;
  text: string;
  retryLabel: string;
  loadingLabel: string;
}

const refreshDelayMs = 400;

export function LeadsError({ title, text, retryLabel, loadingLabel }: LeadsErrorProps) {
  const router = useRouter();
  return (
    <ErrorState
      title={title}
      text={text}
      retryLabel={retryLabel}
      loadingLabel={loadingLabel}
      headingLevel={2}
      onRetry={async () => {
        router.refresh();
        await new Promise((resolve) => setTimeout(resolve, refreshDelayMs));
      }}
    />
  );
}
