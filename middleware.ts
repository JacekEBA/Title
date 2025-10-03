import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";


export async function middleware(req: NextRequest) {
const res = NextResponse.next();
const supabase = createMiddlewareClient({ req, res });
await supabase.auth.getSession(); // refresh if needed


const { data: { user } } = await supabase.auth.getUser();
const url = new URL(req.url);
const isAuthRoute = url.pathname.startsWith("/login");
const isProtected = url.pathname.startsWith("/admin") || url.pathname.startsWith("/app");


console.info('[middleware]', { path: url.pathname, isAuthRoute, isProtected, user: !!user });


if (!user && isProtected) return NextResponse.redirect(new URL("/login", req.url));
if (user && isAuthRoute) return NextResponse.redirect(new URL("/app", req.url));
return res;
}


export const config = {
matcher: ["/app/:path*", "/admin/:path*", "/login"],
};
