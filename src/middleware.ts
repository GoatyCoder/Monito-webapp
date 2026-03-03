import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getUserRoleFromMetadata } from '@/lib/auth/user';
import { APP_PATHS, AUTH_PATHS } from '@/lib/config/paths';

const PUBLIC_PATHS = [AUTH_PATHS.login];
const ADMIN_PATHS = [APP_PATHS.anagrafiche];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  type CookieToSet = {
    name: string;
    value: string;
    options: Parameters<typeof supabaseResponse.cookies.set>[2];
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookieList: CookieToSet[]) => {
          cookieList.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });
          cookieList.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isAuthenticated = Boolean(user);

  if ((authError || !isAuthenticated) && !isPublicPath) {
    return NextResponse.redirect(new URL(AUTH_PATHS.login, request.url));
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL(APP_PATHS.dashboard, request.url));
  }

  if (user && ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    const role = getUserRoleFromMetadata(user);

    if (role !== 'admin') {
      return NextResponse.redirect(new URL(APP_PATHS.dashboard, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
