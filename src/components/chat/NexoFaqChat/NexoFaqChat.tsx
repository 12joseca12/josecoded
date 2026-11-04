"use client";

import { useMemo } from "react";

import { createFaqGuide } from "@/lib/nexo/faq-guide";
import type { NexoChatLabels } from "@/types/nexo";
import type { FaqItem } from "@/types/services";

import { NexoChatCard } from "./NexoChatCard";

interface NexoFaqChatProps {
  items: FaqItem[];
  labels: NexoChatLabels;
  locale: string;
  formHref: string;
}

export function NexoFaqChat({ items, labels, locale, formHref }: NexoFaqChatProps) {
  const guide = useMemo(() => createFaqGuide(items), [items]);
  return <NexoChatCard guide={guide} labels={labels} locale={locale} formHref={formHref} />;
}
