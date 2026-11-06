import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { signBillingUrl } from "@/lib/supabase/storage";

interface Context {
  params: Promise<{ locale: string; id: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !z.uuid().safeParse(id).success) notFound();
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  const service = createSupabaseServiceClient();
  if (client === null || service === null) notFound();
  const { data } = await client
    .from("payouts")
    .select("closer_invoice_path")
    .eq("id", id)
    .maybeSingle();
  if (!data?.closer_invoice_path) notFound();
  const url = await signBillingUrl(service, data.closer_invoice_path);
  if (url === null) notFound();
  return NextResponse.redirect(url, 302);
}
