import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

let serverOfflineUntil = 0;

function createServerSafeFetch(): typeof fetch {
  return async (input, init) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const isBackgroundSessionCheck =
      urlStr.includes("grant_type=refresh_token") ||
      (urlStr.includes("/auth/v1/user") && (!init?.method || init.method === "GET"));

    const offlineSessionResponse = () =>
      new Response(
        JSON.stringify({
          code: "session_not_found",
          message: "Supabase sunucusu şu anda çevrimdışı.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "X-Supabase-Api-Version": "2024-01-01",
          },
        }
      );

    if (isBackgroundSessionCheck && Date.now() < serverOfflineUntil) {
      return offlineSessionResponse();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(input, {
        ...init,
        signal: init?.signal ?? controller.signal,
      });
      if (res.status >= 500) {
        serverOfflineUntil = Date.now() + 15_000;
        if (isBackgroundSessionCheck) {
          return offlineSessionResponse();
        }
      }
      return res;
    } catch (err) {
      serverOfflineUntil = Date.now() + 15_000;
      if (isBackgroundSessionCheck) {
        return offlineSessionResponse();
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (url.hostname === "localhost") {
    url.protocol = "http:";
  }
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  // Skip if Supabase env vars are not set (e.g., during build)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth") && !isAuthCallback;

  // OAuth / E-posta doğrulama callback rotasında PKCE code-verifier çerezine dokunma;
  // oturum takası doğrudan /auth/callback route handler içinde yapılır.
  if (isAuthCallback) {
    return NextResponse.next({ request });
  }

  const sbCookies = request.cookies
    .getAll()
    .filter((c) => c.name.startsWith("sb-") && !c.name.includes("-code-verifier"));

  // Eğer tarayıcıda hiç Supabase oturum çerezi yoksa ağ isteği yapmadan hızlıca geç
  if (sbCookies.length === 0) {
    if (isProtectedRoute) {
      return redirectTo(request, "/auth");
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: createServerSafeFetch(),
      },
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

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Geçersiz/süresi dolmuş veya sunucu kapalıyken kalan eski çerezleri temizle
      // Böylece tarayıcıda sürekli refresh_token CORS/521 hatası tetiklenmez.
      sbCookies.forEach(({ name }) => {
        request.cookies.delete(name);
        supabaseResponse.cookies.delete(name);
      });
    }

    // Protected routes - redirect to auth if not logged in
    if (!user && isProtectedRoute) {
      const redirectRes = redirectTo(request, "/auth");
      sbCookies.forEach(({ name }) => redirectRes.cookies.delete(name));
      return redirectRes;
    }

    // If logged in user tries to access auth page, redirect to dashboard
    if (user && isAuthRoute) {
      return redirectTo(request, "/dashboard");
    }
  } catch {
    sbCookies.forEach(({ name }) => {
      request.cookies.delete(name);
      supabaseResponse.cookies.delete(name);
    });
    if (isProtectedRoute) {
      const redirectRes = redirectTo(request, "/auth");
      sbCookies.forEach(({ name }) => redirectRes.cookies.delete(name));
      return redirectRes;
    }
  }

  return supabaseResponse;
}
