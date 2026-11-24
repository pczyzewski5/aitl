import { apiHandler } from '../../../http/api-handler';

export const dynamic = 'force-dynamic';

const HEALTH_STATUS_UP = 'up';

export const GET = apiHandler(() => ({ status: HEALTH_STATUS_UP }));
