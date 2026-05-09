import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { PredictionsClient } from '@/components/predictions/PredictionsClient';

export default async function PredictionsPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  // Use RPC or raw query via supabase-js; cast to any to bypass complex join typing
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id, stage_key, kick_off, venue_th, venue_en, status, home_score, away_score,
      home_team:teams!matches_home_team_id_fkey(id, name_th, name_en, flag_url, group_name),
      away_team:teams!matches_away_team_id_fkey(id, name_th, name_en, flag_url, group_name)
    `)
    .order('kick_off', { ascending: true })
    .returns<any[]>();

  const { data: predictions } = await supabase
    .from('predictions')
    .select('match_id, predicted_home, predicted_away, total_points')
    .eq('user_id', user!.id)
    .returns<Array<{ match_id: string; predicted_home: number; predicted_away: number; total_points: number }>>();

  const predictionMap = Object.fromEntries(
    (predictions ?? []).map((p) => [p.match_id, p])
  );

  if (error || !matches) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        {t('common.error')}
      </div>
    );
  }

  return (
    <PredictionsClient
      matches={matches}
      predictionMap={predictionMap}
      locale={locale}
    />
  );
}
