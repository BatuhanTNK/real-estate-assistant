import { createBrowserClient } from "@supabase/ssr";

let browserOfflineUntil = 0;

function createBrowserSafeFetch(): typeof fetch {
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

    if (isBackgroundSessionCheck && Date.now() < browserOfflineUntil) {
      return offlineSessionResponse();
    }

    try {
      const res = await fetch(input, init);
      if (res.status >= 500) {
        browserOfflineUntil = Date.now() + 15_000;
        if (isBackgroundSessionCheck) {
          return offlineSessionResponse();
        }
      }
      return res;
    } catch (err) {
      browserOfflineUntil = Date.now() + 15_000;
      if (isBackgroundSessionCheck) {
        return offlineSessionResponse();
      }
      throw err;
    }
  };
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("placeholder.supabase.co")
  ) {
    // Return dummy client to prevent unhandled rejection/fetch crashes when credentials are not configured yet
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithPassword: async () => ({
          data: null,
          error: new Error("Lütfen gerçek Supabase bilgilerinizi .env.local dosyasına ekleyin."),
        }),
        signUp: async () => ({
          data: null,
          error: new Error("Lütfen gerçek Supabase bilgilerinizi .env.local dosyasına ekleyin."),
        }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            order: () => ({ limit: async () => ({ data: [], error: null }) }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        update: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: createBrowserSafeFetch(),
    },
  });
}
