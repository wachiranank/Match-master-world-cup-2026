'use server';

import { createClient } from '@/lib/supabase/server';
import { STAGE_MULTIPLIERS } from '@/lib/i18n-helpers';
import { revalidatePath } from 'next/cache';

export async function savePrediction(
  matchId: string,
  predictedHome: number,
  predictedAway: number,
  stageKey: string,
  locale: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'not_authenticated' };

  const multiplier = STAGE_MULTIPLIERS[stageKey] ?? 1;

  const { error } = await (supabase as any)
    .from('predictions')
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_home: predictedHome,
        predicted_away: predictedAway,
        multiplier,
      },
      { onConflict: 'user_id,match_id' }
    );

  if (error) return { error: error.message };

  revalidatePath(`/${locale}/predictions`);
  revalidatePath(`/${locale}/dashboard`);
  return { success: true };
}
