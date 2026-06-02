import { auth } from "@/auth";
import { signinPathFor } from "@/lib/auth-redirect";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const protectedRoutes = ["/dashboard", "/submit", "/admin"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL(signinPathFor(req.nextUrl.href, req.url), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/submit", "/admin/:path*"],
};
