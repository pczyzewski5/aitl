import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ValidationError } from './errors';
import { INVALID_BODY_MESSAGE, parseJsonBody } from './parse-json-body';

const schema = z.object({ name: z.string().min(1) });

const createRequest = (body: string): Request =>
  new Request('http://localhost/api/example', { method: 'POST', body });

describe('parseJsonBody', () => {
  it('returns the parsed body for valid JSON', async () => {
    const request = createRequest(JSON.stringify({ name: 'value', extra: true }));

    const actual = await parseJsonBody(request, schema);

    expect(actual).toEqual({ name: 'value' });
  });

  it('throws a validation error with field errors for a body that fails the schema', async () => {
    const request = createRequest(JSON.stringify({ name: '' }));

    const actual = parseJsonBody(request, schema);

    await expect(actual).rejects.toThrow(ValidationError);
    await expect(actual).rejects.toMatchObject({
      message: INVALID_BODY_MESSAGE,
      fieldErrors: { name: expect.any(Array) },
    });
  });

  it('throws a validation error for a body that is not JSON', async () => {
    const request = createRequest('not json');

    const actual = parseJsonBody(request, schema);

    await expect(actual).rejects.toThrow(ValidationError);
  });
});
