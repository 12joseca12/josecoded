import { getPathname } from '@/i18n/navigation';

import styles from './auth-providers.module.css';

import type { Locale, OAuthProvider } from '@josecoded/types';

const PROVIDERS: readonly OAuthProvider[] = ['google', 'github'];

/**
 * Google and GitHub as two plain links to the OAuth route handler (GET, no JavaScript needed, and no
 * form so the CSP keeps `form-action 'self'`). They are `<a>`, not the localized `Link`: a framework
 * link prefetches, and a prefetch would start (and overwrite the PKCE verifier of) a sign-in. They
 * wear the ghost button of the system through `composes`. Each carries the provider in its text.
 */
export function AuthProviders({
  locale,
  next,
  audience,
  label,
  names,
}: {
  locale: Locale;
  next?: string;
  audience?: string;
  /** Accessible name of the group. */
  label: string;
  names: Record<OAuthProvider, string>;
}) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {PROVIDERS.map((provider) => {
        const query = new URLSearchParams({ provider });
        if (next) query.set('next', next);
        if (audience) query.set('audience', audience);
        return (
          <a
            key={provider}
            href={`${getPathname({ href: '/auth/oauth', locale })}?${query}`}
            className={styles.link}
            data-variant="ghost"
            data-size="lg"
          >
            <span data-slot="label">{names[provider]}</span>
          </a>
        );
      })}
    </div>
  );
}
