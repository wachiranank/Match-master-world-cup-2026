'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? '')) throw new Error('not_admin');

  return { supabase, user };
}

export async function createMatch(formData: FormData) {
  const { supabase } = await assertAdmin();

  const payload = {
    home_team_id: formData.get('home_team_id') as string,
    away_team_id: formData.get('away_team_id') as string,
    stage_key: formData.get('stage_key') as string,
    kick_off: new Date(formData.get('kick_off') as string).toISOString(),
    venue_en: formData.get('venue_en') as string,
    venue_th: formData.get('venue_th') as string,
    status: 'scheduled',
  };

  const { error } = await (supabase as any).from('matches').insert(payload);
  if (error) return { error: error.message };

  revalidatePath('/th/admin/matches');
  revalidatePath('/en/admin/matches');
  revalidatePath('/th/predictions');
  revalidatePath('/en/predictions');
  return { success: true };
}

export async function updateMatchTeams(matchId: string, homeTeamId: string, awayTeamId: string) {
  const { supabase } = await assertAdmin();

  const { error } = await (supabase as any)
    .from('matches')
    .update({ home_team_id: homeTeamId, away_team_id: awayTeamId })
    .eq('id', matchId);

  if (error) return { error: error.message };

  revalidatePath('/th/admin/matches');
  revalidatePath('/en/admin/matches');
  revalidatePath('/th/predictions');
  revalidatePath('/en/predictions');
  return { success: true };
}

export async function updateMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status: string
) {
  const { supabase } = await assertAdmin();

  const { error } = await (supabase as any)
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore, status })
    .eq('id', matchId);

  if (error) return { error: error.message };

  revalidatePath('/th/admin/matches');
  revalidatePath('/en/admin/matches');
  revalidatePath('/th/predictions');
  revalidatePath('/en/predictions');
  revalidatePath('/th/dashboard');
  revalidatePath('/en/dashboard');
  return { success: true };
}

export async function triggerScoring() {
  const { supabase } = await assertAdmin();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const secret = process.env.SCORING_SECRET ?? '';

  const res = await fetch(`${appUrl}/api/score-matches`, {
    method: 'POST',
    headers: { 'x-scoring-secret': secret, 'Content-Type': 'application/json' },
    body: '{}',
    cache: 'no-store',
  });

  if (!res.ok) return { error: `API returned ${res.status}` };
  const data = await res.json();

  revalidatePath('/th/leaderboard');
  revalidatePath('/en/leaderboard');
  return { success: true, data };
}
