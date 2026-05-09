import { getLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations('leaderboard');

  const { data: { user } } = await supabase.auth.getUser();

  // Leaderboard view is public — no auth required to view
  const { data: rows } = await supabase
    .from('leaderboard')
    .select('id, display_name, avatar_url, total_points, rank, prediction_count, correct_count, champion_team_id')
    .order('rank', { ascending: true })
    .limit(100)
    .returns<Array<{
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      total_points: number;
      rank: number;
      prediction_count: number;
      correct_count: number;
      champion_team_id: string | null;
    }>>();

  // Fetch champion team names for all unique champion picks
  const championIds = [...new Set((rows ?? []).map((r) => r.champion_team_id).filter(Boolean))] as string[];
  const { data: championTeams } = championIds.length
    ? await supabase
        .from('teams')
        .select('id, name_th, name_en, flag_url')
        .in('id', championIds)
        .returns<Array<{ id: string; name_th: string; name_en: string; flag_url: string | null }>>()
    : { data: [] };

  const teamMap = Object.fromEntries((championTeams ?? []).map((t) => [t.id, t]));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">
          {locale === 'th'
            ? `อัปเดตแบบเรียลไทม์ · แสดง ${rows?.length ?? 0} อันดับแรก`
            : `Live rankings · Showing top ${rows?.length ?? 0} players`}
        </p>
      </div>

      <LeaderboardTable
        rows={rows ?? []}
        teamMap={teamMap}
        currentUserId={user?.id ?? null}
        locale={locale}
      />
    </div>
  );
}
