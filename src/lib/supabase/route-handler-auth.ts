import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-domain";

/** Supabase client for Route Handlers that mutate auth cookies on the response. */
export function createRouteHandlerAuthClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const storedCookies = new Map<string, { value: string; options: Record<string, unknown> }>();
  const host = request.headers.get("host");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          storedCookies.set(name, {
            value,
            options: supabaseCookieOptions(options, host),
          });
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, supabaseCookieOptions(options, host))
        );
      },
    },
  });

  function applyAuthCookiesTo(response: NextResponse): NextResponse {
    storedCookies.forEach(({ value, options }, name) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  return { supabase, applyAuthCookiesTo };
}
