const API_PREFIX = '/api/';
const CSRF_HEADER = 'X-Requested-With';
const CSRF_HEADER_VALUE = 'aitl';
const CONTENT_TYPE_HEADER = 'Content-Type';
const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_METHOD = 'GET';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ApiFieldErrors = Readonly<Record<string, readonly string[]>>;

interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: ApiFieldErrors;
  retryAfterSeconds?: number;
}

type ApiCallResult<Data> =
  | { ok: true; status: number; data: Data }
  | { ok: false; kind: 'api-error'; status: number; error: ApiErrorBody }
  | { ok: false; kind: 'invalid-response'; status: number }
  | { ok: false; kind: 'network' };

interface ApiCallOptions {
  method?: ApiMethod;
  body?: unknown;
}

type ParsedEnvelope = { ok: true; data: unknown } | { ok: false; error: ApiErrorBody };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseErrorBody(value: unknown): ApiErrorBody | undefined {
  if (!isRecord(value) || typeof value.code !== 'string' || typeof value.message !== 'string') {
    return undefined;
  }

  const error: ApiErrorBody = { code: value.code, message: value.message };
  if (isRecord(value.fieldErrors)) {
    error.fieldErrors = value.fieldErrors as ApiFieldErrors;
  }
  if (typeof value.retryAfterSeconds === 'number') {
    error.retryAfterSeconds = value.retryAfterSeconds;
  }

  return error;
}

function parseEnvelope(body: unknown): ParsedEnvelope | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  if (body.ok === true && 'data' in body) {
    return { ok: true, data: body.data };
  }

  const error = body.ok === false ? parseErrorBody(body.error) : undefined;

  return error === undefined ? undefined : { ok: false, error };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function apiCall<Data>(path: string, options: ApiCallOptions = {}): Promise<ApiCallResult<Data>> {
  if (!path.startsWith(API_PREFIX)) {
    throw new TypeError(`apiCall accepts only paths starting with ${API_PREFIX}`);
  }

  const headers: Record<string, string> = { [CSRF_HEADER]: CSRF_HEADER_VALUE };
  const init: RequestInit = { method: options.method ?? DEFAULT_METHOD, headers };
  if (options.body !== undefined) {
    headers[CONTENT_TYPE_HEADER] = JSON_CONTENT_TYPE;
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    return { ok: false, kind: 'network' };
  }

  const envelope = parseEnvelope(await readJson(response));
  if (envelope === undefined) {
    return { ok: false, kind: 'invalid-response', status: response.status };
  }

  if (envelope.ok) {
    return { ok: true, status: response.status, data: envelope.data as Data };
  }

  return { ok: false, kind: 'api-error', status: response.status, error: envelope.error };
}

export { apiCall };
export type { ApiCallOptions, ApiCallResult, ApiErrorBody, ApiFieldErrors, ApiMethod };
