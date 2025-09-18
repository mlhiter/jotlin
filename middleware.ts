import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicRoutes = ['/login', '/api/auth']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For client-side routes, we'll let the client handle authentication
  // The middleware will only protect API routes that need server-side auth
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    // API routes will handle their own authentication via Authorization header
    return NextResponse.next()
  }

  // For client-side pages, let them through - auth will be handled by useAuth hook
  // The client will redirect to login if no valid token is found in localStorage
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
     * Apply to main app routes: /, /chat, /dashboard, /settings
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
