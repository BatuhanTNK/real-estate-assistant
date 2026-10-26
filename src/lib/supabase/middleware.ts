import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Skip if Supabase env vars are not set (e.g., during build)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

  // If not protected or auth route, pass through quickly
  if (!isProtectedRoute && !isAuthRoute) {
    return supabaseResponse;
  }

  try {
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 2500)
    );

    const {
      data: { user },
    } = await Promise.race([getUserPromise, timeoutPromise]);

    // Protected routes - redirect to auth if not logged in
    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      if (url.hostname === "localhost") {
        url.protocol = "http:";
      }
      return NextResponse.redirect(url);
    }

    // If logged in user tries to access auth page, redirect to dashboard
    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      if (url.hostname === "localhost") {
        url.protocol = "http:";
      }
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.warn("Middleware Supabase auth error:", err);
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      if (url.hostname === "localhost") {
        url.protocol = "http:";
      }
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
