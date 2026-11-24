import { createApiHandler } from '@aitl/core';
import { container } from '../container/container';

export const apiHandler = createApiHandler(() => container.createScope(), container.cradle.logger);
