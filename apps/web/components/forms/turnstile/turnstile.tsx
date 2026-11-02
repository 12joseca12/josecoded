'use client';

import { useEffect, useRef } from 'react';

import { useFormContext } from '@/components/forms/form';

import styles from './turnstile.module.css';

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: 'dark';
      size: 'flexible';
      language: string;
      appearance: 'always' | 'interaction-only';
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
    script.onerror = () => {
      loading = null;
      reject(new Error('turnstile'));
    };
    document.head.append(script);
  });
  return loading;
}

/**
 * Cloudflare Turnstile widget (managed, dark). It injects the `cf-turnstile-response` hidden input
 * into the enclosing form; the Server Action verifies it with the secret key. A token is single
 * use, so after each answer of the enclosing `Form` the widget is reset to mint a new one. The
 * script loads only on the screens that render this component.
 *
 * A11y: the widget is Cloudflare's own iframe (labelled by them); the container is a plain block
 * with a minimum height so the form does not jump when the challenge appears.
 */
export function Turnstile({
  siteKey,
  action,
  locale,
  onToken,
}: {
  siteKey: string;
  action: string;
  locale: string;
  /** Called with the token when the check passes and with `null` when it expires or fails. */
  onToken?: (token: string | null) => void;
}) {
  const form = useFormContext();
  const state = form?.state;
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null);
  const notify = useRef(onToken);
  useEffect(() => {
    notify.current = onToken;
  });

  useEffect(() => {
    let cancelled = false;
    const element = container.current;
    if (!element) return;
    loadScript()
      .then((api) => {
        if (cancelled) return;
        const id = api.render(element, {
          sitekey: siteKey,
          action,
          theme: 'dark',
          size: 'flexible',
          language: locale,
          appearance: 'always',
          callback: (token) => notify.current?.(token),
          'expired-callback': () => notify.current?.(null),
          'error-callback': () => notify.current?.(null),
        });
        widget.current = { api, id };
      })
      .catch(() => undefined); // blocked script: the server rejects the missing token with a clear message
    return () => {
      cancelled = true;
      if (widget.current) {
        widget.current.api.remove(widget.current.id);
        widget.current = null;
      }
    };
  }, [siteKey, action, locale]);

  useEffect(() => {
    // every answer of the action consumed the token: ask for a new one
    if (state && state.status !== 'idle' && widget.current) widget.current.api.reset(widget.current.id);
  }, [state]);

  return <div ref={container} className={styles.box} />;
}
