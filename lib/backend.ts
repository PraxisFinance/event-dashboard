/**
 * Thin client for the Praxis NestJS backend.
 *
 * Auth flow:
 *  1. GET  /api/auth/nonce  → nonce
 *  2. Sign SIWE message with wallet (wagmi signMessage)
 *  3. POST /api/auth/verify → { accessToken }
 *  4. Cache token in sessionStorage; refresh on 401.
 */

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001').replace(/\/$/, '')

const TOKEN_KEY = 'praxis_backend_jwt'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

export async function backendFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers })

  if (res.status === 401) {
    clearStoredToken()
    throw new Error('Backend session expired — please re-authenticate')
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Backend error ${res.status}: ${body}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
