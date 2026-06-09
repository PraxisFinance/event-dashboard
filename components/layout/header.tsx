'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RefreshCw, Link2, LogOut, Copy, Check, Vault, X } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlays/dropdown-menu'
import { cn } from '@/lib/utils'
import { useVaultStore } from '@/lib/stores/vault-store'

const NAV_LINKS = [
  { href: '/', label: 'Our Events' },
  { href: '/source', label: 'Source Events' },
  { href: '/vaults', label: 'Vaults' },
  { href: '/ryd', label: 'RYD' },
  { href: '/twopool', label: 'Two-Pool' },
  { href: '/subscriptions', label: 'Subscriptions' },
]

function WalletButton() {
  const { data: session } = useSession()
  const [copied, setCopied] = useState(false)

  const address = session?.address
  if (!address) return null

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`

  const copy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border text-xs font-mono cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
          </span>
          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          {short}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground mb-0.5">Signed in as</p>
          <p className="text-xs font-mono text-foreground truncate">{address}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={copy} className="gap-2 cursor-pointer">
          {copied ? (
            <Check className="h-3.5 w-3.5 text-brand-green" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copied!' : 'Copy address'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut({ redirectTo: '/login' })}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function VaultIndicator() {
  const { selectedVault, setSelectedVault } = useVaultStore()
  if (!selectedVault) return null

  const short = `${selectedVault.id.slice(0, 6)}…${selectedVault.id.slice(-4)}`

  return (
    <div className="flex items-center gap-1.5 rounded border border-brand-green/30 bg-brand-green/5 px-2 py-1">
      <Vault className="h-3 w-3 text-brand-green shrink-0" />
      <Link
        href="/vaults"
        className="font-mono text-xs text-brand-green hover:text-brand-green/80 transition-colors"
      >
        {short}
      </Link>
      <button
        onClick={() => setSelectedVault(null)}
        className="text-brand-green/50 hover:text-brand-green transition-colors ml-0.5"
        aria-label="Clear selected vault"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function Header() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card flex items-center px-4 gap-4">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono font-bold text-sm tracking-widest text-foreground bg-secondary px-2 py-0.5 rounded">
          PRAXIS
        </span>
      </div>

      {/* Center: Nav */}
      <nav className="flex items-center gap-1" aria-label="Main navigation">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded text-sm transition-colors',
                active
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sync status */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
          </span>
          <span className="text-xs text-muted-foreground">
            Last synced: <span className="text-foreground">3 min ago</span>
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <VaultIndicator />

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Now
        </Button>

        <WalletButton />
      </div>
    </header>
  )
}
