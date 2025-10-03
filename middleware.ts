import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseCredentials } from "@/lib/supabase/env";

const AUTH_ROUTES = new Set(["/login", "/reset-password"]);
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/promos",
  "/rcs",
  "/analytics",
  "/clients",
  "/users",
  "/settings",
  "/blasts",
  "/reviews",
  "/social",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { url, anonKey } = getSupabaseCredentials();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set({ name, value, ...(options ?? {}) });
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set({ name, value: "", ...(options ?? {}) });
      },
    },
  });

  await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!user && isProtected) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/promos/:path*",
    "/rcs/:path*",
    "/analytics",
    "/analytics/:path*",
    "/clients/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/blasts/:path*",
    "/reviews/:path*",
    "/social/:path*",
    "/login",
    "/reset-password",
  ],
};
