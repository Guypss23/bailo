import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE_NAME = "bailo_session"

const PROTECTED_PREFIXES = [
  "/tableau-de-bord",
  "/loyers",
  "/biens",
  "/locataires",
  "/baux",
  "/parametres",
  "/dev",
]

const AUTH_ROUTES = ["/connexion", "/inscription"]

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Protect app routes: redirect to /connexion if no session cookie exists
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isProtected && !sessionCookie) {
    const nextPath = encodeURIComponent(`${pathname}${search}`)
    const loginUrl = new URL(`/connexion?next=${nextPath}`, request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
