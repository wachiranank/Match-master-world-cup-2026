'use client';

import { useSession } from '@/context/SessionProvider';

export function useUser() {
  const { user, session, loading } = useSession();
  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    displayName: user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '',
    avatarUrl: user?.user_metadata?.avatar_url as string | undefined,
  };
}
