import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { defaultLocale } from "@/i18n/config";
import { getErrorCopy } from "@/i18n/errors";

export function generateMetadata(): Metadata {
  return { title: getErrorCopy(defaultLocale).notFound.title };
}

export default function UnknownPath() {
  notFound();
}
