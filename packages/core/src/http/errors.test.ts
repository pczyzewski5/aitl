import { describe, expect, it } from 'vitest';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  InvalidCredentialsError,
  NotFoundError,
  TooManyRequestsError,
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
    { error: new InvalidCredentialsError('bad'), code: 'invalid_credentials', statusCode: 401, name: 'InvalidCredentialsError' },
    { error: new TooManyRequestsError('slow', 60), code: 'too_many_attempts', statusCode: 429, name: 'TooManyRequestsError' },
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

describe('TooManyRequestsError', () => {
  it('carries the retry delay', () => {
    const actual = new TooManyRequestsError('slow down', 900);

    expect(actual.retryAfterSeconds).toBe(900);
  });
});
