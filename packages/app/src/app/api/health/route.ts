import { createApiHandler } from '@aitl/core';

export const dynamic = 'force-dynamic';

const apiHandler = createApiHandler(() => ({}));

export const GET = apiHandler(() => ({ status: 'up' }));
