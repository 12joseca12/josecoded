import { llmsBody } from '@/lib/seo/llms-response';

export const dynamic = 'force-static';

export async function GET() {
  return new Response(await llmsBody(false), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
