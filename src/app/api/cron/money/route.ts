import { cronSecretHeader, runMoneyCron } from "@/lib/cron/money";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

async function handle(request: Request): Promise<Response> {
  const result = await runMoneyCron(
    process.env.CRON_SECRET,
    request.headers.get(cronSecretHeader),
    createSupabaseServiceClient(),
  );
  return Response.json(result.body, {
    status: result.status,
    headers: { "cache-control": "no-store" },
  });
}

export const GET = handle;
export const POST = handle;
