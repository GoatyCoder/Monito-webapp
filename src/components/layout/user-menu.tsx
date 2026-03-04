'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
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

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setIsSigningOut(false);
      return;
    }

    router.push(AUTH_PATHS.login);
    router.refresh();
    setIsSigningOut(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Profilo utente compatto con CTA disconnessione più evidente. */}
      <div className="text-right">
        <p className="text-xs font-medium text-slate-700">{displayName}</p>
        <p className="text-xs text-secondary">{ROLE_LABELS[role]}</p>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
        <LogOut className="h-3.5 w-3.5" />
        {isSigningOut ? 'Uscita...' : 'Disconnetti'}
      </Button>

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
