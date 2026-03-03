import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getUserRoleFromMetadata } from '@/lib/auth/user';

const PUBLIC_PATHS = ['/login'];
const ADMIN_PATHS = ['/anagrafiche'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  type CookieToSet = {
    name: string;
    value: string;
    options: Parameters<typeof supabaseResponse.cookies.set>[2];
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookieList: CookieToSet[]) => {
          cookieList.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (user && ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    const role = getUserRoleFromMetadata(user);

    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
