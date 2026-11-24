import type { Logger } from 'pino';
import { logger as defaultLogger } from '../logger';
import { AppError, ValidationError, type FieldErrors } from './errors';

export const INTERNAL_ERROR_CODE = 'internal';
export const INTERNAL_ERROR_MESSAGE = 'Internal server error';
export const INTERNAL_ERROR_STATUS = 500;
export const SUCCESS_STATUS = 200;
export const UNEXPECTED_ERROR_LOG_MESSAGE = 'Unhandled error in API handler';

export type ApiSuccessBody<T> = { ok: true; data: T };
export type ApiErrorBody = {
  ok: false;
  error: { code: string; message: string; fieldErrors?: FieldErrors };
};

export type ApiRouteParams<TParams> = { params: Promise<TParams> };

export type ApiRouteFunction<TScope, TData, TContext = unknown> = (
  request: Request,
  scope: TScope,
  context: TContext,
) => Promise<TData> | TData;

function errorResponse(error: AppError): Response {
  const body: ApiErrorBody = { ok: false, error: { code: error.code, message: error.message } };

  if (error instanceof ValidationError && error.fieldErrors !== undefined) {
    body.error.fieldErrors = error.fieldErrors;
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
  return function apiHandler<TData, TContext = unknown>(
    routeFunction: ApiRouteFunction<TScope, TData, TContext>,
  ): (request: Request, context: TContext) => Promise<Response> {
    return async (request, context) => {
      try {
        const data = await routeFunction(request, createScope(), context);
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
