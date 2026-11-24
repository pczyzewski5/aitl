import type { Logger } from 'pino';
import { logger as defaultLogger } from '../logger';
import { AppError, TooManyRequestsError, ValidationError, type FieldErrors } from './errors';

export const INTERNAL_ERROR_CODE = 'internal';
export const INTERNAL_ERROR_MESSAGE = 'Internal server error';
export const INTERNAL_ERROR_STATUS = 500;
export const SUCCESS_STATUS = 200;
export const RETRY_AFTER_HEADER = 'Retry-After';
export const UNEXPECTED_ERROR_LOG_MESSAGE = 'Unhandled error in API handler';

export type ApiSuccessBody<T> = { ok: true; data: T };
export type ApiErrorBody = {
  ok: false;
  error: { code: string; message: string; fieldErrors?: FieldErrors; retryAfterSeconds?: number };
};

export type ApiRouteFunction<TScope, TData> = (request: Request, scope: TScope) => Promise<TData> | TData;

function errorResponse(error: AppError): Response {
  const body: ApiErrorBody = { ok: false, error: { code: error.code, message: error.message } };

  if (error instanceof ValidationError && error.fieldErrors !== undefined) {
    body.error.fieldErrors = error.fieldErrors;
  }

  if (error instanceof TooManyRequestsError) {
    body.error.retryAfterSeconds = error.retryAfterSeconds;

    return Response.json(body, {
      status: error.statusCode,
      headers: { [RETRY_AFTER_HEADER]: String(error.retryAfterSeconds) },
    });
  }

  return Response.json(body, { status: error.statusCode });
}

function internalErrorResponse(): Response {
  const body: ApiErrorBody = {
    ok: false,
    error: { code: INTERNAL_ERROR_CODE, message: INTERNAL_ERROR_MESSAGE },
  };

  return Response.json(body, { status: INTERNAL_ERROR_STATUS });
}

export function createApiHandler<TScope>(createScope: () => TScope, log: Logger = defaultLogger) {
  return function apiHandler<TData>(
    routeFunction: ApiRouteFunction<TScope, TData>,
  ): (request: Request) => Promise<Response> {
    return async (request) => {
      try {
        const data = await routeFunction(request, createScope());
        const body: ApiSuccessBody<TData> = { ok: true, data };

        return Response.json(body, { status: SUCCESS_STATUS });
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error);
        }

        log.error({ err: error }, UNEXPECTED_ERROR_LOG_MESSAGE);

        return internalErrorResponse();
      }
    };
  };
}
