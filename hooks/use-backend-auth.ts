'use client'

import { useSignMessage } from 'wagmi'
import { useSession } from 'next-auth/react'
import { getStoredToken } from '@/lib/backend'
import { loginToBackend } from '@/lib/backend-auth'

export function useBackendAuth() {
  const { data: session } = useSession()
  const { signMessageAsync } = useSignMessage()

  const ensureAuthenticated = async (): Promise<void> => {
    if (getStoredToken()) return

    const address = (session?.user as { address?: string } | undefined)?.address
    if (!address) {
      throw new Error('No wallet connected — please sign in first')
    }

    await loginToBackend(address, ({ message }) => signMessageAsync({ message }))
  }

  return { ensureAuthenticated }
}
