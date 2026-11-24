import { z } from 'zod';
import { ValidationError, type FieldErrors } from './errors';

export const INVALID_BODY_MESSAGE = 'Invalid request body';

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const body: unknown = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors as FieldErrors;

    throw new ValidationError(INVALID_BODY_MESSAGE, fieldErrors);
  }

  return result.data;
}
