import { afterEach, describe, expect, it, vi } from 'vitest';
import { UNEXPECTED_ERROR_LOG_MESSAGE } from '@aitl/core';
import { container } from '../container/container';
import { apiHandler } from './api-handler';

const request = new Request('http://localhost/api/example');

describe('apiHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gives the route function a scope of the application container', async () => {
    const handler = apiHandler((_request, scope) => scope.cradle.logger === container.cradle.logger);

    const actual = await handler(request, undefined);

    expect(await actual.json()).toEqual({ ok: true, data: true });
  });

  it('gives every call its own scope', async () => {
    const scopes: unknown[] = [];
    const handler = apiHandler((_request, scope) => scopes.push(scope));

    await handler(request, undefined);
    await handler(request, undefined);

    expect(scopes[0]).not.toBe(scopes[1]);
  });

  it('logs unexpected errors through the container logger', async () => {
    const error = vi.spyOn(container.cradle.logger, 'error').mockImplementation(() => undefined);
    const handler = apiHandler(() => {
      throw new Error('boom');
    });

    const actual = await handler(request, undefined);

    expect(actual.status).toBe(500);
    expect(error).toHaveBeenCalledWith({ err: expect.any(Error) }, UNEXPECTED_ERROR_LOG_MESSAGE);
  });
});
