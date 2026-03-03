import { User } from '@supabase/supabase-js';

import { UserRole } from '@/types/domain';

const ALLOWED_ROLES: readonly UserRole[] = ['admin', 'operatore', 'viewer'] as const;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export function getUserRoleFromMetadata(user: User | null): UserRole {
  const roleFromMetadata = user?.user_metadata?.role;

  if (typeof roleFromMetadata !== 'string') {
    return 'viewer';
  }

  const normalizedRole = roleFromMetadata.toLowerCase();

  if (ALLOWED_ROLES.includes(normalizedRole as UserRole)) {
    return normalizedRole as UserRole;
  }

  return 'viewer';
}

export function getUserDisplayName(user: User | null): string {
  if (!user) {
    return 'Utente';
  }

  const nameFromMetadata = user.user_metadata?.full_name;
  if (typeof nameFromMetadata === 'string' && nameFromMetadata.trim().length > 0) {
    return nameFromMetadata.trim();
  }

  if (user.email) {
    return user.email;
  }

  return 'Utente';
}

export function mapAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: getUserDisplayName(user),
    role: getUserRoleFromMetadata(user)
  };
}

export function canManageProduction(role: UserRole): boolean {
  return role === 'admin' || role === 'operatore';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}
