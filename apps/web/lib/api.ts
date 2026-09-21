import { ApiErrorBody } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = await response.json();
    } catch {
      // response had no JSON body
    }
    throw new ApiError(response.status, body?.code, body?.message ?? 'Ocurrió un error inesperado');
  }

  const rawBody = await response.text();
  if (!rawBody) {
    return undefined as T;
  }

  return JSON.parse(rawBody) as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: 'GET' }, token),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),
  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
};
