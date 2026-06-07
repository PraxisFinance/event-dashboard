'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { SiweMessage } from 'siwe'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/button'
import { Loader2, ShieldCheck, Wallet, LogOut } from 'lucide-react'

export function LoginPage() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { mutateAsync: signMessageAsync } = useSignMessage()
  const { status } = useSession()
  const router = useRouter()

  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  const handleConnect = () => {
    const injected = connectors.find((c) => c.type === 'injected')
    if (injected) connect({ connector: injected })
  }

  const handleSignIn = async () => {
    if (!address || !chain) return
    setIsSigning(true)
    setError(null)

    try {
      const nonceRes = await fetch('/api/auth/nonce')
      if (!nonceRes.ok) throw new Error('Failed to fetch nonce')
      const { nonce } = await nonceRes.json()

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Praxis Events Dashboard.',
        uri: window.location.origin,
        version: '1',
        chainId: chain.id,
        nonce,
      })

      const signature = await signMessageAsync({
        message: siweMessage.prepareMessage(),
      })

      const result = await signIn('credentials', {
        message: JSON.stringify(siweMessage),
        signature,
        redirect: false,
      })

      if (result?.error) {
        setError('Verification failed. Please try again.')
      }
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('denied')) {
        setError('Signature request was rejected.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSigning(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono font-bold text-sm tracking-widest text-foreground bg-secondary px-3 py-1 rounded">
            PRAXIS
          </span>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">Events Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with your Ethereum wallet
            </p>
          </div>
        </div>

        <div className="w-full border border-border rounded-lg bg-card p-6 flex flex-col gap-5">
          {!isConnected ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                <Wallet className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Connect your wallet to continue
              </p>
              <Button onClick={handleConnect} className="w-full">
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary mx-auto">
                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="rounded-md bg-secondary/50 border border-border px-3 py-2.5 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Connected as</p>
                  <p className="text-sm font-mono text-foreground">
                    {address?.slice(0, 6)}…{address?.slice(-4)}
                  </p>
                  {chain && (
                    <p className="text-xs text-muted-foreground">{chain.name}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => disconnect()}
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Disconnect
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Sign a message to verify wallet ownership. No transaction, no gas.
              </p>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button onClick={handleSignIn} disabled={isSigning} className="w-full">
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Waiting for signature…
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Praxis Events Dashboard is an internal tool.
          <br />
          Access is restricted to authorized wallets.
        </p>
      </div>
    </div>
  )
}
