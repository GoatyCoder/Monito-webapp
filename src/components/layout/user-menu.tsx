'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AUTH_PATHS } from '@/lib/config/paths';
import { createSupabaseClient } from '@/lib/db/supabase-client';
import { UserRole } from '@/types/domain';

type UserMenuProps = {
  displayName: string;
  role: UserRole;
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  operatore: 'Operatore',
  viewer: 'Viewer'
};

export function UserMenu({ displayName, role }: UserMenuProps) {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');

  const handleSignOut = async () => {
    setError('');
    setIsSigningOut(true);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(signOutError.message);
        return;
      }

      router.push(AUTH_PATHS.login);
      router.refresh();
    } catch {
      setError('Errore imprevisto durante la disconnessione. Riprova.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <p className="text-xs font-medium text-slate-700">{displayName}</p>
        <p className="text-xs text-secondary">{ROLE_LABELS[role]}</p>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="rounded border border-secondary px-2 py-1 text-xs text-secondary transition hover:border-primary hover:text-primary disabled:opacity-50"
      >
        {isSigningOut ? 'Uscita...' : 'Disconnetti'}
      </button>

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
