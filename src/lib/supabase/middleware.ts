import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith('/auth');
  const isApi = path.startsWith('/api');
  // redesign/v2 preview lives at /v2 and is publicly viewable (additive — existing routes unchanged)
  const isV2Preview = path === '/v2' || path.startsWith('/v2/');
  // redesign/v3 preview lives at /v3 — same additive public exception as /v2
  const isV3Preview = path === '/v3' || path.startsWith('/v3/');
  const isPublic = path === '/' || isV2Preview || isV3Preview;

  // Public surfaces never need a session — skip the auth roundtrip entirely so
  // they stay up even when Supabase is slow, paused, or unreachable.
  if (isPublic) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Hard bound on the auth roundtrip: a hanging Supabase call must fail
        // fast and degrade to "no session" instead of a 504 middleware timeout.
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(5000) }),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    user = (await supabase.auth.getUser()).data.user;
  } catch {
    // Supabase unreachable → treat as signed out; protected routes fall
    // through to the login redirect below rather than timing out.
    user = null;
  }

  if (!user && !isAuthPage && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/today';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
