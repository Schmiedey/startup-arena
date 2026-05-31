import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const protectedRoutes = ["/dashboard", "/submit", "/admin"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/submit", "/admin/:path*"],
};
