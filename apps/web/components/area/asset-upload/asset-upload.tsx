'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { ASSET_MAX_BYTES, ASSET_MIME_TYPES } from '@josecoded/types';

import { deleteAsset, prepareAssetUpload, refreshMaterial } from '@/app/[locale]/(area)/area-clientes/material/actions';
import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';

import styles from './asset-upload.module.css';

import type { Locale } from '@josecoded/types';


export interface AssetUploadLabels {
  label: string;
  help: string;
  submit: string;
  uploading: string;
  done: string;
  chooseFirst: string;
  tooBig: string;
  notAllowed: string;
  failed: string;
  form: string;
}

type Status = 'idle' | 'busy' | 'done' | 'error';

/**
 * Upload box of the client material. The browser asks the action for a one-use token (the action
 * validates type and size and creates the row), then sends the bytes straight to Storage with the
 * browser client, which is loaded only when someone actually uploads. Size and type are also checked
 * here for a quick answer, but the action and the bucket (25 MiB, MIME allowlist) are the guard.
 *
 * A11y: a labelled file field in a named form; progress, success and errors are
 * text in a `role="status"` / `role="alert"` region; the button is
 * disabled while busy and the form is `aria-busy`.
 */
export function AssetUpload({ locale, labels }: { locale: Locale; labels: AssetUploadLabels }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const file = useRef<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function fail(text: string) {
    setStatus('error');
    setMessage(text);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = file.current;
    if (!chosen) return fail(labels.chooseFirst);
    if (chosen.size > ASSET_MAX_BYTES) return fail(labels.tooBig);
    if (!(ASSET_MIME_TYPES as readonly string[]).includes(chosen.type)) return fail(labels.notAllowed);

    setStatus('busy');
    setMessage(labels.uploading);

    const prepared = await prepareAssetUpload({ fileName: chosen.name, mimeType: chosen.type, sizeBytes: chosen.size });
    if (!prepared.ok) return fail(prepared.reason === 'invalid' ? labels.notAllowed : labels.failed);

    try {
      const { createClient } = await import('@/lib/supabase/browser');
      const { error } = await createClient()
        .storage.from('client-assets')
        .uploadToSignedUrl(prepared.path, prepared.token, chosen, { contentType: chosen.type });
      if (error) throw error;
    } catch {
      await deleteAsset(prepared.assetId); // no row without its file
      return fail(labels.failed);
    }

    await refreshMaterial(locale);
    setStatus('done');
    setMessage(labels.done);
    file.current = null;
    formRef.current?.reset();
    // the list is a Server Component: ask the router for fresh data
    router.refresh();
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} aria-label={labels.form} aria-busy={status === 'busy' || undefined}>
      <Field
        kind="file"
        name="file"
        label={labels.label}
        help={labels.help}
        accept={ASSET_MIME_TYPES.join(',')}
        disabled={status === 'busy'}
        onChange={(selected) => {
          file.current = selected;
          if (status !== 'busy') setStatus('idle');
        }}
      />
      <div className={styles.actions}>
        <Button type="submit" disabled={status === 'busy'}>
          {labels.submit}
        </Button>
      </div>
      {status === 'error' ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : status === 'idle' ? null : (
        <p className={styles.status} role="status">
          {message}
        </p>
      )}
    </form>
  );
}
