import { notFound } from 'next/navigation';

import { env } from '@/lib/env';

/**
 * The one switch of every `/dev/*` route (the UI catalogue and the CRM previews): they exist only where
 * `NEXT_PUBLIC_DEV_UI=1` (local, wrangler dev and the preview of a PR). In production the variable is absent, the
 * value is inlined at build time and the routes answer 404; they are never indexed (`robots.ts` disallows `/dev`)
 * and the sitemap does not list them.
 */
export const devUiEnabled = env.client.NEXT_PUBLIC_DEV_UI === '1';

/** Answers 404 unless the dev routes are enabled. Every `/dev/*` layout and page calls it first. */
export function requireDevUi(): void {
  if (!devUiEnabled) notFound();
}
