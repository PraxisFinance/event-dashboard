/**
 * Thin client for the Praxis NestJS backend.
 *
 * Auth flow:
 *  1. GET  /auth/nonce  → nonce
 *  2. Sign SIWE message with wallet (wagmi signMessage)
 *  3. POST /auth/verify → { accessToken }
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

/**
 * Endpoints that require a stable `Idempotency-Key` header (backend returns
 * 400 without it). Generate the key once per user-initiated mutation attempt
 * with `crypto.randomUUID()`, pass it via `BackendFetchOptions.idempotencyKey`,
 * and reuse the same value for retries of that same attempt. Mint a new key
 * only for a new, separate user attempt.
 *
 *   POST /referrals/bind        (praxis-baseapp)
 *   POST /faucet/sign           (praxis-baseapp)
 *   POST /faucet/eth            (praxis-baseapp)
 *   POST /twopools/deploy
 *   POST /ryd/deploy
 *   POST /vaults/deploy
 *   POST /token-lab/mint
 *   POST /events/deploy-market
 */
export interface BackendFetchOptions extends RequestInit {
  idempotencyKey?: string
}

export async function backendFetch<T = unknown>(
  path: string,
  init: BackendFetchOptions = {},
): Promise<T> {
  const { idempotencyKey, headers: initHeaders, ...rest } = init
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(initHeaders as Record<string, string> | undefined),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${BACKEND_URL}${path}`, { ...rest, headers })

  if (res.status === 401) {
    clearStoredToken()
    throw new Error('Backend session expired — please re-authenticate')
  }

  if (res.status === 409 && idempotencyKey) {
    throw new Error(
      'This action is already in progress from a previous attempt. Please wait a moment and check the result before retrying.',
    )
  }

  if (res.status === 422 && idempotencyKey) {
    throw new Error(
      'Idempotency key was reused with a different request body. This indicates a client bug — please retry as a fresh attempt.',
    )
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Backend error ${res.status}: ${body}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
