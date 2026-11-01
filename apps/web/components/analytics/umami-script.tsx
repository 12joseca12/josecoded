import { umamiScript } from '@/lib/analytics';
import { env } from '@/lib/env';

/**
 * Umami tracker (task 2.12). `async` so it never blocks the render, and it fails silently if Omen is off (`track` is a
 * no-op until `window.umami` exists). Nothing renders without the instance URL and the website id; `data-domains` limits
 * recording to the production host.
 */
export function UmamiScript() {
  const script = umamiScript({
    url: env.client.NEXT_PUBLIC_UMAMI_URL,
    websiteId: env.client.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    siteUrl: env.client.NEXT_PUBLIC_SITE_URL,
  });
  if (!script) return null;
  return <script async src={script.src} data-website-id={script.websiteId} data-domains={script.domains} />;
}
