import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { passesSiteLock } from "@/lib/site-lock";

/**
 * 1 · Private-preview gate (SITE_ACCESS_PASSWORD): the whole site asks for the team password.
 * 2 · Refreshes the Supabase auth session cookie on admin routes.
 */
export async function middleware(request: NextRequest) {
  const password = process.env.SITE_ACCESS_PASSWORD;
  if (!passesSiteLock(request.nextUrl.pathname, request.headers.get("authorization"), password, process.env.SITE_ACCESS_QA_PASSWORD)) {
    return new NextResponse("This FIRST FOR ALL preview is private. Sign in with the team password.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="FIRST FOR ALL preview", charset="UTF-8"', "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  let response = NextResponse.next({ request });
  if (password) response.headers.set("X-Robots-Tag", "noindex, nofollow"); // never index a private preview
  const path = request.nextUrl.pathname;
  if (!(path === "/login" || path.startsWith("/admin"))) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        if (password) response.headers.set("X-Robots-Tag", "noindex, nofollow");
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

// Everything except Next's static build files (the gate covers pages, images, data and API routes).
export const config = { matcher: ["/((?!_next/static|favicon.ico).*)"] };
