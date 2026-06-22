import { SiweMessage } from 'siwe'
import { backendFetch, setStoredToken } from './backend'

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001').replace(/\/$/, '')

export async function loginToBackend(
  address: string,
  signMessage: (args: { message: string }) => Promise<string>,
): Promise<void> {
  const { nonce } = await fetch(`${BACKEND_URL}/auth/nonce`).then((r) => r.json()) as { nonce: string }

  const message = new SiweMessage({
    domain: window.location.host,
    address,
    statement: 'Sign in to Praxis backend',
    uri: window.location.origin,
    version: '1',
    chainId: 1,
    nonce,
  })

  const prepared = message.prepareMessage()
  const signature = await signMessage({ message: prepared })

  const { accessToken } = await backendFetch<{ address: string; accessToken: string }>(
    '/auth/verify',
    {
      method: 'POST',
      body: JSON.stringify({ message: prepared, signature }),
    },
  )

  setStoredToken(accessToken)
}
