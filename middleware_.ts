import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // refresh session if needed
  await supabase.auth.getSession();

  const { data: { user } } = await supabase.auth.getUser();
  const url = new URL(req.url);

  const isAuthRoute = url.pathname.startsWith("/login");
  const isProtected =
    url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/admin");

  console.info("[middleware]", {
    path: url.pathname,
    isAuthRoute,
    isProtected,
    user: !!user,
  });

  // If not logged in, redirect protected routes to /login
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If logged in, prevent visiting /login
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
};
