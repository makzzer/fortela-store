// middleware.ts en la raíz del proyecto
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth")?.value
  const isAuth = !!token
  const pathname = request.nextUrl.pathname

  const isAdmin = pathname.startsWith("/admin")
  const isLogin = pathname === "/login"

  if (isAdmin && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isLogin && isAuth) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
}
