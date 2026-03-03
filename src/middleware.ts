import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { APP_PATHS, AUTH_PATHS } from '@/lib/config/paths';
import { UserRole } from '@/types/domain';

const PUBLIC_PATHS = [AUTH_PATHS.login];
const ADMIN_PATHS = [APP_PATHS.anagrafiche];
const ALLOWED_ROLES: readonly UserRole[] = ['admin', 'operatore', 'viewer'] as const;

function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedRole = value.trim().toLowerCase();

  if (ALLOWED_ROLES.includes(normalizedRole as UserRole)) {
    return normalizedRole as UserRole;
  }

  return null;
}

function getRoleFromClaims(claims: Record<string, unknown> | null): UserRole {
  if (!claims) {
    return 'viewer';
  }

  const appMetadata = claims.app_metadata;
  if (typeof appMetadata !== 'object' || appMetadata === null) {
    return 'viewer';
  }

  const roleValue = (appMetadata as Record<string, unknown>).role;
  return normalizeRole(roleValue) ?? 'viewer';
}

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

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isAuthenticated = Boolean(claimsData?.claims?.sub);

  if ((claimsError || !isAuthenticated) && !isPublicPath) {
    return NextResponse.redirect(new URL(AUTH_PATHS.login, request.url));
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL(APP_PATHS.dashboard, request.url));
  }

  if (isAuthenticated && ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    const role = getRoleFromClaims((claimsData?.claims as Record<string, unknown> | undefined) ?? null);

    if (role !== 'admin') {
      return NextResponse.redirect(new URL(APP_PATHS.dashboard, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
