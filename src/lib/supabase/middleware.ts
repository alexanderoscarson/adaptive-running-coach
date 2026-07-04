import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith('/auth');
  const isOnboarding = path.startsWith('/onboarding');
  const isApi = path.startsWith('/api');
  // redesign/v2 preview lives at /v2 and is publicly viewable (additive — existing routes unchanged)
  const isV2Preview = path === '/v2' || path.startsWith('/v2/');
  // redesign/v3 preview lives at /v3 — same additive public exception as /v2
  const isV3Preview = path === '/v3' || path.startsWith('/v3/');
  const isPublic = path === '/' || isV2Preview || isV3Preview;

  if (!user && !isAuthPage && !isPublic && !isApi) {
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
