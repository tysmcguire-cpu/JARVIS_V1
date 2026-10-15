import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig } from "@/lib/env";
import { demoEnabled, isOwner } from "@/features/auth/policy";
import { findModule } from "@/features/shell/navigation";
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    const segments = pathname.split("/").filter(Boolean).slice(1);
    // Reject before streaming begins, preserving an actual HTTP 404 status.
    if (!demoEnabled(process.env) || segments.length > 1 || !findModule(segments[0] ?? "dashboard")) {
      return new NextResponse("Page not available", { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
    }
    return NextResponse.next();
  }
  const config = getAuthConfig();
  const privateRoute = pathname !== "/login";
  if (!config) {
    const response = privateRoute ? NextResponse.redirect(new URL("/login?status=configuration", request.url)) : NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  let response = NextResponse.next({ request });
  const client = createServerClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" }));
      }
    }
  });
  const { data, error } = await client.auth.getUser();
  if (privateRoute && (error || !isOwner(data.user?.id, config.JARVIS_OWNER_ID))) {
    const denied = NextResponse.redirect(new URL("/login?status=unauthorized", request.url));
    response.cookies.getAll().forEach(cookie => denied.cookies.set(cookie));
    denied.headers.set("Cache-Control", "private, no-store");
    return denied;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
