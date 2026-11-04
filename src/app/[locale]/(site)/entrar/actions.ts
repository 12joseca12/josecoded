"use server";

import { headers } from "next/headers";

import {
  handleRequestCode,
  handleStartEnrollment,
  handleStartGoogle,
  handleVerifyCode,
  handleVerifyTotp,
} from "@/lib/auth/handler";
import type {
  EnrollmentResult,
  GoogleStartResult,
  RequestCodeResult,
  VerifyCodeResult,
  VerifyTotpResult,
} from "@/types/auth";

async function clientIp(): Promise<string | null> {
  const requestHeaders = await headers();
  return requestHeaders.get("cf-connecting-ip");
}

export async function requestCode(raw: unknown): Promise<RequestCodeResult> {
  return handleRequestCode(raw, await clientIp(), process.env);
}

export async function verifyCode(raw: unknown): Promise<VerifyCodeResult> {
  return handleVerifyCode(raw, await clientIp(), process.env);
}

export async function startEnrollment(): Promise<EnrollmentResult> {
  return handleStartEnrollment(await clientIp(), process.env);
}

export async function verifyTotp(raw: unknown): Promise<VerifyTotpResult> {
  return handleVerifyTotp(raw, await clientIp(), process.env);
}

export async function startGoogle(raw: unknown): Promise<GoogleStartResult> {
  return handleStartGoogle(raw, process.env);
}
