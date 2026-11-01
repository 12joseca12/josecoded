import { signInWithProvider } from '@/app/[locale]/(auth)/auth/actions';
import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';

import styles from './auth-providers.module.css';

import type { Locale, OAuthProvider } from '@josecoded/types';


const PROVIDERS: readonly OAuthProvider[] = ['google', 'github'];

/**
 * Google and GitHub as two independent forms (a Server Action each, no JavaScript needed): the
 * button posts the provider and the action returns the OAuth redirect. Each button carries the
 * provider in its text, so its name is never ambiguous.
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
      {PROVIDERS.map((provider) => (
        <form key={provider} action={signInWithProvider} className={styles.form}>
          <Field kind="hidden" name="provider" value={provider} />
          <Field kind="hidden" name="locale" value={locale} />
          <Field kind="hidden" name="next" value={next ?? ''} />
          <Field kind="hidden" name="audience" value={audience ?? ''} />
          <Button type="submit" variant="ghost" size="lg">
            {names[provider]}
          </Button>
        </form>
      ))}
    </div>
  );
}
