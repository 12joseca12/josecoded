import "server-only";

import type { ServiceSupabase } from "./service";

export const billingBucket = "billing";
export const signedUrlSeconds = 60;

export async function uploadBillingFile(
  client: ServiceSupabase,
  path: string,
  file: File,
): Promise<boolean> {
  try {
    const { error } = await client.storage
      .from(billingBucket)
      .upload(path, file, { contentType: "application/pdf", upsert: false });
    return !error;
  } catch {
    return false;
  }
}

export async function removeBillingFile(client: ServiceSupabase, path: string): Promise<void> {
  try {
    await client.storage.from(billingBucket).remove([path]);
  } catch {
    return;
  }
}

export async function signBillingUrl(
  client: ServiceSupabase,
  path: string,
): Promise<string | null> {
  try {
    const { data, error } = await client.storage
      .from(billingBucket)
      .createSignedUrl(path, signedUrlSeconds);
    return error ? null : data.signedUrl;
  } catch {
    return null;
  }
}
