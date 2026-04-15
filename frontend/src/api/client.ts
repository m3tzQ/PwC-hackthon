import type { ApiEnvelope } from '../types/domain'

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '')

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export async function requestApi<TData>(path: string, init?: RequestInit): Promise<ApiEnvelope<TData>> {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  let payload: ApiEnvelope<TData> | null = null
  try {
    payload = (await response.json()) as ApiEnvelope<TData>
  } catch {
    if (!response.ok) {
      throw new ApiRequestError('Request failed and response was not JSON.', response.status)
    }
    throw new ApiRequestError('Invalid JSON response format.', response.status)
  }

  if (!response.ok || !payload.success) {
    const errorMessage = payload.error?.message ?? `Request failed with status ${response.status}`
    throw new ApiRequestError(errorMessage, response.status, payload.error?.details)
  }

  return payload
}

export async function getData<TData>(path: string): Promise<TData> {
  const payload = await requestApi<TData>(path)
  return payload.data
}

export async function postData<TData, TBody>(path: string, body: TBody): Promise<TData> {
  const payload = await requestApi<TData>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return payload.data
}

export async function patchData<TData, TBody>(path: string, body: TBody): Promise<TData> {
  const payload = await requestApi<TData>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return payload.data
}
