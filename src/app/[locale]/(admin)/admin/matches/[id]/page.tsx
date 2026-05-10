import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { updateMatchResult, updateMatchTeams } from '@/app/actions/admin';

const STAGE_LABELS: Record<string, string> = {
  group_stage: 'Group Stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-finals',
  sf: 'Semi-finals',
  third_place: 'Third Place',
  final: 'Final',
};

const TBD_ID = '00000000-0000-0000-0000-000000000099';

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = await getLocale();

  const [matchRes, teamsRes, predCountRes] = await Promise.all([
    (supabase as any)
      .from('matches')
      .select(`
        id, stage_key, kick_off, status, home_score, away_score, venue_en, venue_th,
        home_team:teams!matches_home_team_id_fkey(id, name_en, flag_url),
        away_team:teams!matches_away_team_id_fkey(id, name_en, flag_url)
      `)
      .eq('id', id)
      .single(),
    (supabase as any)
      .from('teams')
      .select('id, name_en, flag')
      .neq('id', TBD_ID)
      .order('name_en', { ascending: true }),
    (supabase as any)
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', id),
  ]);

  const match = matchRes.data as any;
  if (!match) notFound();

  const teams = (teamsRes.data ?? []) as any[];

  async function handleUpdate(formData: FormData) {
    'use server';
    const homeScore = parseInt(formData.get('home_score') as string, 10);
    const awayScore = parseInt(formData.get('away_score') as string, 10);
    const status = formData.get('status') as string;
    const result = await updateMatchResult(id, homeScore, awayScore, status);
    if (result.success) redirect(`/${locale}/admin/matches`);
  }

  async function handleTeamUpdate(formData: FormData) {
    'use server';
    const homeTeamId = formData.get('home_team_id') as string;
    const awayTeamId = formData.get('away_team_id') as string;
    const result = await updateMatchTeams(id, homeTeamId, awayTeamId);
    if (result.success) redirect(`/${locale}/admin/matches/${id}`);
  }

  const isTBD = match.home_team?.id === TBD_ID || match.away_team?.id === TBD_ID;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Edit Match</h1>
        <p className="text-muted-foreground text-sm">
          {STAGE_LABELS[match.stage_key] ?? match.stage_key} ·{' '}
          {new Date(match.kick_off).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} UTC
        </p>
      </div>

      {/* Team Assignment (shown when TBD) */}
      <div className="bg-background border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Teams</h2>
          {isTBD && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
              TBD — assign teams below
            </span>
          )}
        </div>

        <div className="text-center text-lg font-bold py-3 bg-muted/50 rounded-lg">
          {match.home_team?.flag} {match.home_team?.name_en}
          <span className="mx-3 text-muted-foreground font-normal text-base">vs</span>
          {match.away_team?.name_en} {match.away_team?.flag}
        </div>

        <form action={handleTeamUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Home Team</label>
              <select name="home_team_id" defaultValue={match.home_team?.id ?? ''}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.flag} {t.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Away Team</label>
              <select name="away_team_id" defaultValue={match.away_team?.id ?? ''}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.flag} {t.name_en}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit"
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">
            Update Teams
          </button>
        </form>
      </div>

      {/* Score & Status */}
      <div className="bg-background border rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Result</h2>
          <span className="text-xs text-muted-foreground">{predCountRes?.count ?? 0} predictions</span>
        </div>

        <form action={handleUpdate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-3">Score</label>
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  {match.home_team?.flag} {match.home_team?.name_en}
                </div>
                <input type="number" name="home_score" min="0" max="99"
                  defaultValue={match.home_score ?? 0}
                  className="w-full border rounded-md px-3 py-2 text-center text-xl font-mono bg-background" />
              </div>
              <div className="text-center text-2xl font-bold text-muted-foreground">—</div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  {match.away_team?.name_en} {match.away_team?.flag}
                </div>
                <input type="number" name="away_score" min="0" max="99"
                  defaultValue={match.away_score ?? 0}
                  className="w-full border rounded-md px-3 py-2 text-center text-xl font-mono bg-background" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Match Status</label>
            <select name="status" defaultValue={match.status}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              <option value="scheduled">Scheduled (not started)</option>
              <option value="live">Live (in progress)</option>
              <option value="completed">Completed (final score)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Set to <strong>Completed</strong> to trigger score calculation on next cron run (or use Trigger Scoring on dashboard).
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Save Result
            </button>
            <a href={`/${locale}/admin/matches`}
              className="px-6 py-2 rounded-md text-sm font-medium border hover:bg-muted transition-colors">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
