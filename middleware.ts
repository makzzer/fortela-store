// middleware.ts en la raíz del proyecto
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth")?.value
  const isAuth = !!token
  const pathname = request.nextUrl.pathname

  const isAdmin = pathname.startsWith("/admin")
  const isLogin = pathname === "/login"
  const isShop = pathname.startsWith("/shop")
  const isHome = pathname === "/home"

  // 🔒 Proteger admin
  if (isAdmin && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 🔒 Bloquear shop/home → mandamos a admin o login
  if ((isShop || isHome) && !isAuth) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if ((isShop || isHome) && isAuth) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // 🔒 Si ya está logueado y va a /login → lo mandamos a admin
  if (isLogin && isAuth) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/shop/:path*", "/home"],
}
