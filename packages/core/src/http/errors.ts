export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly code = 'validation_error';
  readonly statusCode = 400;

  readonly fieldErrors: FieldErrors | undefined;

  constructor(message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends AppError {
  readonly code = 'unauthorized';
  readonly statusCode = 401;
}

export class ForbiddenError extends AppError {
  readonly code = 'forbidden';
  readonly statusCode = 403;
}

export class NotFoundError extends AppError {
  readonly code = 'not_found';
  readonly statusCode = 404;
}

export class ConflictError extends AppError {
  readonly code = 'conflict';
  readonly statusCode = 409;
}
