import { apiHandler } from '../../../http/api-handler';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(() => ({ status: 'up' }));
