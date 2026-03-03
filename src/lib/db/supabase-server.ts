import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  type CookieToSet = {
    name: string;
    value: string;
    options: Parameters<typeof cookieStore.set>[2];
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookieList: CookieToSet[]) => {
          try {
            cookieList.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Nei Server Components setAll può essere invocato durante refresh sessione ma i cookie non sono scrivibili.
          }
        }
      }
    }
  );
}
