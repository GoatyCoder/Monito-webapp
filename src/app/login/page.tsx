'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { APP_PATHS } from '@/lib/config/paths';
import { createSupabaseClient } from '@/lib/db/supabase-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(APP_PATHS.dashboard);
      router.refresh();
    } catch {
      setError('Errore imprevisto durante il login. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
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
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded border border-secondary px-3 py-2"
              placeholder="nome@azienda.it"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded border border-secondary px-3 py-2"
              onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={isSubmitting}
            className="w-full rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}
