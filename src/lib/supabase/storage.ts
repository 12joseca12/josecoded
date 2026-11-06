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

export const chatBucket = "chat-attachments";

export async function uploadChatFile(
  client: ServiceSupabase,
  path: string,
  file: File,
): Promise<boolean> {
  try {
    const { error } = await client.storage
      .from(chatBucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    return !error;
  } catch {
    return false;
  }
}

export async function removeChatFiles(client: ServiceSupabase, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    await client.storage.from(chatBucket).remove(paths);
  } catch {
    return;
  }
}

export async function signChatUrl(
  client: ServiceSupabase,
  path: string,
  downloadName: string,
): Promise<string | null> {
  try {
    const { data, error } = await client.storage
      .from(chatBucket)
      .createSignedUrl(path, signedUrlSeconds, { download: downloadName });
    return error ? null : data.signedUrl;
  } catch {
    return null;
  }
}
