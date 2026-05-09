import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getLocaleName } from '@/lib/i18n-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Star, TrendingUp, ArrowRight, Lock, Clock } from 'lucide-react';
import type { Locale } from '@/i18n/routing';

export default async function DashboardPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  // Fetch profile (points + rank)
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points, display_name')
    .eq('id', user.id)
    .single()
    .returns<{ total_points: number; display_name: string | null }>();

  // Fetch rank from leaderboard view
  const { data: rankRow } = await supabase
    .from('leaderboard')
    .select('rank, prediction_count, correct_count')
    .eq('id', user.id)
    .maybeSingle()
    .returns<{ rank: number; prediction_count: number; correct_count: number } | null>();

  // Fetch champion pick + team info
  const { data: pick } = await supabase
    .from('champion_picks')
    .select('team_id, picked_at')
    .eq('user_id', user.id)
    .maybeSingle()
    .returns<{ team_id: string; picked_at: string } | null>();

  type ChampionTeam = { id: string; name_th: string; name_en: string; flag_url: string | null };
  const { data: championTeamRaw } = pick
    ? await supabase
        .from('teams')
        .select('id, name_th, name_en, flag_url')
        .eq('id', pick.team_id)
        .single()
    : { data: null };
  const championTeam = championTeamRaw as ChampionTeam | null;

  // Upcoming matches (next 3)
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select(`
      id, stage_key, kick_off,
      home_team:teams!matches_home_team_id_fkey(id, name_th, name_en, flag_url),
      away_team:teams!matches_away_team_id_fkey(id, name_th, name_en, flag_url)
    `)
    .eq('status', 'scheduled')
    .gt('kick_off', new Date().toISOString())
    .order('kick_off', { ascending: true })
    .limit(3)
    .returns<any[]>();

  const totalPoints   = (profile as any)?.total_points ?? 0;
  const rank          = rankRow?.rank ?? '—';
  const totalPreds    = rankRow?.prediction_count ?? 0;
  const correctPreds  = rankRow?.correct_count ?? 0;

  const stats = [
    { title: t('dashboard.myPoints'),          value: totalPoints,  icon: <TrendingUp className="h-5 w-5 text-blue-500" />,   color: 'text-blue-600' },
    { title: t('dashboard.myRank'),            value: rank,         icon: <Trophy className="h-5 w-5 text-yellow-500" />,    color: 'text-yellow-600' },
    { title: t('dashboard.totalPredictions'),  value: totalPreds,   icon: <Target className="h-5 w-5 text-green-500" />,     color: 'text-green-600' },
    { title: t('dashboard.correctPredictions'),value: correctPreds, icon: <Star className="h-5 w-5 text-purple-500" />,      color: 'text-purple-600' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <Badge variant="outline">
          {locale === 'th' ? 'เวิลด์คัพ 2026' : 'World Cup 2026'}
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Champion pick card */}
        <Card className={`lg:col-span-1 ${championTeam ? 'border-yellow-300' : 'border-yellow-200'} bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {t('dashboard.championPick')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {championTeam ? (
              <div className="flex flex-col items-center py-2 gap-3">
                {championTeam.flag_url && (
                  <Image
                    src={championTeam.flag_url}
                    alt={getLocaleName(championTeam, locale as Locale)}
                    width={64}
                    height={44}
                    className="rounded border-2 border-yellow-400 shadow object-cover"
                    unoptimized
                  />
                )}
                <div className="text-center">
                  <p className="font-black text-lg">{getLocaleName(championTeam, locale as Locale)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {locale === 'th' ? 'เลือกเมื่อ' : 'Picked'}{' '}
                    {new Date(pick!.picked_at).toLocaleDateString(
                      locale === 'th' ? 'th-TH' : 'en-US',
                      { day: 'numeric', month: 'short' }
                    )}
                  </p>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-400">
                  +50 {locale === 'th' ? 'คะแนนโบนัส' : 'bonus pts if correct'}
                </Badge>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/${locale}/champion`}>
                    {t('champion.changePick')}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t('dashboard.noChampionPick')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.deadline')}</p>
              </div>
            )}
            {!championTeam && (
              <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold">
                <Link href={`/${locale}/champion`}>
                  <Star className="h-4 w-4 mr-2" />
                  {t('dashboard.pickChampionBtn')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Upcoming matches */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('dashboard.upcomingMatches')}
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/predictions`}>
                {t('dashboard.viewAll')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(!upcomingMatches || upcomingMatches.length === 0) ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {locale === 'th' ? 'ไม่มีแมตช์ที่กำลังจะมาถึง' : 'No upcoming matches'}
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingMatches.map((match: any) => {
                  const homeName = getLocaleName(match.home_team, locale as Locale);
                  const awayName = getLocaleName(match.away_team, locale as Locale);
                  const kickoff  = new Date(match.kick_off);
                  return (
                    <Link
                      key={match.id}
                      href={`/${locale}/predictions`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {(match.home_team as any)?.flag_url && (
                          <Image src={(match.home_team as any).flag_url} alt={homeName} width={24} height={17}
                            className="rounded object-cover border flex-shrink-0" unoptimized />
                        )}
                        <span className="text-sm font-medium truncate">{homeName}</span>
                      </div>

                      <div className="flex flex-col items-center mx-3 flex-shrink-0 text-center">
                        <span className="text-xs font-bold text-muted-foreground">VS</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {kickoff.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium truncate">{awayName}</span>
                        {(match.away_team as any)?.flag_url && (
                          <Image src={(match.away_team as any).flag_url} alt={awayName} width={24} height={17}
                            className="rounded object-cover border flex-shrink-0" unoptimized />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Points guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {locale === 'th' ? 'คู่มือคะแนน' : 'Points Guide'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="font-black text-xl text-blue-600">+1</p>
              <p className="text-xs text-muted-foreground">{t('points.correctResult')}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <p className="font-black text-xl text-green-600">+3</p>
              <p className="text-xs text-muted-foreground">{t('points.correctScore')}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <p className="font-black text-xl text-yellow-600">+50</p>
              <p className="text-xs text-muted-foreground">{t('champion.bonusPoints')}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <Lock className="h-4 w-4 text-purple-500 mx-auto mb-1" />
              <p className="font-black text-xl text-purple-600">×1–×6</p>
              <p className="text-xs text-muted-foreground">{t('points.multiplier')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
