import { feedResponse } from '@/lib/seo/feed-response';

export const dynamic = 'force-static';

export const GET = () => feedResponse('es');
