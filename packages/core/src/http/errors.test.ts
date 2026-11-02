import { describe, expect, it } from 'vitest';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors';

describe('AppError hierarchy', () => {
  it.each([
    { error: new UnauthorizedError('no session'), code: 'unauthorized', statusCode: 401, name: 'UnauthorizedError' },
    { error: new ForbiddenError('not yours'), code: 'forbidden', statusCode: 403, name: 'ForbiddenError' },
    { error: new NotFoundError('missing'), code: 'not_found', statusCode: 404, name: 'NotFoundError' },
    { error: new ConflictError('duplicate'), code: 'conflict', statusCode: 409, name: 'ConflictError' },
    { error: new ValidationError('invalid'), code: 'validation_error', statusCode: 400, name: 'ValidationError' },
  ])('maps $name to code and HTTP status', ({ error, code, statusCode, name }) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
    expect(error.statusCode).toBe(statusCode);
    expect(error.name).toBe(name);
  });

  it('keeps the message', () => {
    expect(new NotFoundError('missing').message).toBe('missing');
  });

  it('carries field errors on validation errors', () => {
    const fieldErrors = { amount: ['must be positive'] };

    const actual = new ValidationError('invalid', fieldErrors);

    expect(actual.fieldErrors).toEqual(fieldErrors);
  });

  it('has no field errors by default', () => {
    expect(new ValidationError('invalid').fieldErrors).toBeUndefined();
  });
});
