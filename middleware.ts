import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req: NextRequest & { auth: unknown }) => {
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  // Protect every route except:
  //  • /login
  //  • NextAuth API routes
  //  • Cron API routes (protected by CRON_SECRET inside the route handler)
  //  • Next.js internals (_next/*)
  //  • Static assets (icons, images)
  matcher: [
    '/((?!login|api/auth|api/cron|_next/static|_next/image|favicon\\.ico|icon|apple-icon|.*\\.png|.*\\.svg|.*\\.ico).*)',
  ],
}
