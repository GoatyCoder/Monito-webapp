import { User } from '@supabase/supabase-js';

import { UserRole } from '@/types/domain';

const ALLOWED_ROLES: readonly UserRole[] = ['admin', 'operatore', 'viewer'] as const;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedRole = value.trim().toLowerCase();

  if (ALLOWED_ROLES.includes(normalizedRole as UserRole)) {
    return normalizedRole as UserRole;
  }

  return null;
}

export function getRoleFromMetadataField(value: unknown): UserRole | null {
  const directRole = normalizeRole(value);
  if (directRole) {
    return directRole;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const arrayRole = normalizeRole(item);
      if (arrayRole) {
        return arrayRole;
      }
    }
  }

  return null;
}

export function getUserRoleFromMetadata(user: User | null): UserRole {
  if (!user) {
    return 'viewer';
  }

  const roleCandidates = [user.app_metadata?.role, user.app_metadata?.roles];

  for (const candidate of roleCandidates) {
    const mappedRole = getRoleFromMetadataField(candidate);
    if (mappedRole) {
      return mappedRole;
    }
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
