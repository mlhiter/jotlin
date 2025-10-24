import { NextResponse } from 'next/server'

export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     * - webcontainer routes (for WebContainer internal communication)
     * Apply to main app routes: /, /chat, /dashboard, /settings
     */
    '/((?!_next/static|_next/image|favicon.ico|api|webcontainer|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
