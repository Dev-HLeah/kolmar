import { DEFAULT_USER_ROLE, type UserRole } from '../auth/roles'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i

export function getApiUrl(path: string) {
  const normalizedBaseUrl = ABSOLUTE_URL_PATTERN.test(API_BASE_URL)
    ? API_BASE_URL
    : `https://${API_BASE_URL}`

  return `${normalizedBaseUrl.replace(/\/$/, '')}${path}`
}

let activeRole: UserRole = DEFAULT_USER_ROLE

export function setApiRole(role: UserRole) {
  activeRole = role
}

export function getApiRole() {
  return activeRole
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      ...init?.headers,
      'x-user-role': activeRole,
    },
  })

  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function apiGet<T>(path: string): Promise<T> {
  return requestJson<T>(path)
}

export async function apiPost<TResponse, TBody extends object>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export async function apiPatch<TResponse, TBody extends object>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export async function apiDelete<TResponse>(path: string): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: 'DELETE',
  })
}
