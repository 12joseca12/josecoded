import { NextResponse } from "next/server";

import { readSessionState } from "@/lib/auth/session";
import {
  deleteProjectDocument,
  type DocumentDeps,
  signProjectDocument,
  statusOf,
  uploadProjectDocument,
} from "@/lib/documents/project-documents";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { DocumentErrorCode } from "@/types/project-documents";

function problem(code: DocumentErrorCode) {
  return NextResponse.json({ status: "error", code }, { status: statusOf(code) });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

async function dependencies(): Promise<DocumentDeps | DocumentErrorCode> {
  const client = await createSupabaseServerClient();
  const service = createSupabaseServiceClient();
  if (client === null || service === null) return "unavailable";
  let state;
  try {
    state = await readSessionState(client);
  } catch {
    return "unavailable";
  }
  if (state.status !== "member") return "forbidden";
  const staff = state.role === "admin" && state.level === "aal2";
  if (!staff && state.role !== "client") return "forbidden";
  return { client, service, userId: state.userId };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return problem("forbidden");
  const deps = await dependencies();
  if (typeof deps === "string") return problem(deps);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return problem("invalid_request");
  }
  const result = await uploadProjectDocument(deps, form);
  return result.status === "done"
    ? NextResponse.json(result, { status: 201 })
    : problem(result.code);
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return problem("forbidden");
  const deps = await dependencies();
  if (typeof deps === "string") return problem(deps);
  const result = await deleteProjectDocument(deps, new URL(request.url).searchParams.get("id"));
  return result.status === "done" ? NextResponse.json(result) : problem(result.code);
}

export async function GET(request: Request) {
  const deps = await dependencies();
  if (typeof deps === "string") return problem(deps);
  const result = await signProjectDocument(deps, new URL(request.url).searchParams.get("id"));
  if (result.status === "error") return problem(result.code);
  return NextResponse.redirect(result.url, 302);
}
