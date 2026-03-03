# TODO.md – Roadmap tecnica
**Progetto:** Monito

---

## Foundation

- [x] Struttura progetto Next.js + TypeScript + Tailwind
- [x] Design system e token colori (`tailwind.config.ts`)
- [x] Componenti placeholder: header, card linea, summary bar, FAB, form DOY
- [x] Architettura DB documentata (schemi registry / ops_YYYY / audit)
- [x] Aggiungere `@supabase/supabase-js` e `@supabase/ssr` in `package.json`
- [x] Creare `src/lib/config/db.ts`:
```typescript
  export const OPS_SCHEMA      = 'ops_2025' as const;
  export const REGISTRY_SCHEMA = 'registry' as const;
  export const AUDIT_SCHEMA    = 'audit' as const;
```
- [x] Sostituire `src/lib/db/supabase-client.ts`:
```typescript
  import { createBrowserClient } from '@supabase/ssr';
  export function createSupabaseClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
```
- [x] Creare `src/lib/db/supabase-server.ts`:
```typescript
  import { createServerClient } from '@supabase/ssr';
  import { cookies } from 'next/headers';
  export async function createSupabaseServerClient() {
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (list) => list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
        },
      }
    );
  }
```
- [x] Creare `src/middleware.ts`:
```typescript
  import { createServerClient } from '@supabase/ssr';
  import { NextResponse, type NextRequest } from 'next/server';
  export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (list) => list.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          ),
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return supabaseResponse;
  }
  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
  };
```
- [x] Creare `src/app/login/page.tsx`:
```typescript
  'use client';
  import { useState } from 'react';
  import { useRouter } from 'next/navigation';
  import { createSupabaseClient } from '@/lib/db/supabase-client';
  export default function LoginPage() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const router   = useRouter();
    const supabase = createSupabaseClient();
    const handleLogin = async () => {
      setError('');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); }
      else { router.push('/dashboard'); }
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-secondary bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">MONITO</h1>
            <p className="text-sm text-muted-foreground">Accedi al sistema</p>
          </div>
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm">
              Email
              <input type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded border border-secondary px-3 py-2"
                placeholder="nome@azienda.it" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Password
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded border border-secondary px-3 py-2"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={handleLogin} className="w-full rounded bg-primary px-4 py-2 text-white">
              Accedi
            </button>
          </div>
        </div>
      </div>
    );
  }
```
- [x] Aggiornare `src/types/domain.ts` con i tipi definitivi da `docs/Schema.md §Tipi TypeScript`
- [x] Aggiornare `.env.example`:
```bash
  NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
  NEXT_PUBLIC_ENABLE_OFFLINE="true"
  # Schema operativo: configurato in src/lib/config/db.ts — aggiornare ogni 1 gennaio
```

---

## Auth & Ruoli

- [ ] Login funzionante con Supabase Auth
- [ ] Lettura ruolo da JWT (`user_metadata.role`)
- [ ] Nascondere pulsanti azione al Viewer
- [ ] Proteggere route `/anagrafiche` (solo Admin)
- [ ] Mostrare nome utente e ruolo reali in header

---

## Cruscotto

- [ ] `SummaryBar` collegata ad aggregati realtime (lavorazioni aperte, pedane oggi, colli oggi, scarto oggi)
- [ ] Card linea da dati reali (inactive / active / multi)
- [ ] Subscriptions Supabase Realtime su lavorazioni e pedane
- [ ] Modal apertura lavorazione
- [ ] Dialog conferma multi-lavorazione
- [ ] Modal chiusura lavorazione
- [ ] Modal riapertura lavorazione (con motivo opzionale, audit log)
- [ ] Modal modifica lavorazione (audit log obbligatorio)

---

## Pedane e Scarti

- [ ] Modal registrazione pedana (peso fisso e variabile, avviso peso manuale)
- [ ] Stampa etichetta con `react-to-print`
- [ ] FAB registrazione scarto con anteprima % scarto
- [ ] Audit log su tutte le operazioni

---

## Anagrafiche (Admin)

- [x] CRUD prodotti grezzi e varietà
- [x] CRUD articoli con vincoli
- [x] CRUD imballaggi secondari
- [x] CRUD linee con campo `ordine`
- [x] CRUD sigle lotto
- [x] Soft delete su tutte le anagrafiche

---

## Report

- [ ] Filtri data / intervallo
- [ ] Tab Per Lotto (con % scarto colorata per soglie)
- [ ] Tab Per Linea (con tempo attivo)
- [ ] Tab Per Articolo
- [ ] Export PDF (`@react-pdf/renderer`)
- [ ] Export Excel / CSV (`xlsx`)

---

## Offline & Sync

- [ ] Service Worker con `next-pwa`
- [ ] Schema Dexie per coda offline (lavorazioni, pedane, scarti)
- [ ] Retry automatico al ripristino connessione
- [ ] Indicatore stato connessione funzionante
- [ ] Interfaccia risoluzione conflitti per Admin

---

## Data & Compliance

- [ ] Audit log su ogni operazione (INSERT, UPDATE, soft_delete, restore, open, close, reopen)
- [ ] Validazione `peso_totale = 0` bloccata lato app
- [ ] Validazione "almeno `colli` o `peso_kg`" su scarti
- [ ] Verifica formato `codice_pedana` = `PYY-DOY-NNNN`
