'use client'

import { useState, type ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { httpBatchStreamLink } from '@trpc/client'
import {
  mainnet,
  base,
  baseSepolia,
  polygon,
  optimism,
  arbitrum,
  sepolia,
} from 'viem/chains'
import { trpc } from '@/lib/trpc/react'
import { VaultInitializer } from '@/components/providers/vault-initializer'

const wagmiConfig = createConfig({
  chains: [mainnet, base, baseSepolia, polygon, optimism, arbitrum, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
})

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchStreamLink({ url: '/api/trpc' })],
    })
  )

  return (
    <SessionProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <VaultInitializer />
            {children}
          </trpc.Provider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  )
}
