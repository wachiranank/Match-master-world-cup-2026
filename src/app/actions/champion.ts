'use server';

import { createClient } from '@/lib/supabase/server';
import { isChampionPickOpen } from '@/lib/i18n-helpers';
import { revalidatePath } from 'next/cache';

export async function saveChampionPick(teamId: string, locale: string) {
  if (!isChampionPickOpen()) return { error: 'deadline_passed' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  const { error } = await (supabase as any)
    .from('champion_picks')
    .upsert(
      { user_id: user.id, team_id: teamId, picked_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) return { error: error.message };

  revalidatePath(`/${locale}/champion`);
  revalidatePath(`/${locale}/dashboard`);
  return { success: true };
}
