import { createApiHandler } from '@aitl/core';
import { container } from '../../../container/container';

export const dynamic = 'force-dynamic';

const apiHandler = createApiHandler(() => container.createScope());

export const GET = apiHandler(() => ({ status: 'up' }));
