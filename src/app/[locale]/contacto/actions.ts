"use server";

import { headers } from "next/headers";

import { handleContact } from "@/lib/contact/handler";
import type { ContactSubmitResult } from "@/types/contact-form";

export async function submitContact(raw: unknown): Promise<ContactSubmitResult> {
  const requestHeaders = await headers();
  return handleContact(raw, { env: process.env, ip: requestHeaders.get("cf-connecting-ip") });
}
