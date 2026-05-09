import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { updateMatchResult } from '@/app/actions/admin';

const STAGE_LABELS: Record<string, string> = {
  group_stage: 'Group Stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-finals',
  sf: 'Semi-finals',
  third_place: 'Third Place',
  final: 'Final',
};

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = await getLocale();

  const matchRes = await (supabase as any)
    .from('matches')
    .select(`
      id, stage_key, kick_off, status, home_score, away_score, venue_en, venue_th,
      home_team:teams!matches_home_team_id_fkey(id, name_en, flag),
      away_team:teams!matches_away_team_id_fkey(id, name_en, flag)
    `)
    .eq('id', id)
    .single();

  const match = matchRes.data as any;
  if (!match) notFound();

  const predCountRes = await (supabase as any)
    .from('predictions')
    .select('*', { count: 'exact', head: true })
    .eq('match_id', id);
  const predCount = predCountRes;

  async function handleUpdate(formData: FormData) {
    'use server';
    const homeScore = parseInt(formData.get('home_score') as string, 10);
    const awayScore = parseInt(formData.get('away_score') as string, 10);
    const status = formData.get('status') as string;
    const result = await updateMatchResult(id, homeScore, awayScore, status);
    if (result.success) redirect(`/${locale}/admin/matches`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Edit Match</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {STAGE_LABELS[match.stage_key] ?? match.stage_key} ·{' '}
        {new Date(match.kick_off).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} UTC
      </p>

      <div className="bg-background border rounded-lg p-6 space-y-6">
        <div className="text-center text-xl font-bold py-4 bg-muted/50 rounded-lg">
          {match.home_team?.flag} {match.home_team?.name_en}
          <span className="mx-4 text-muted-foreground font-normal">vs</span>
          {match.away_team?.name_en} {match.away_team?.flag}
        </div>

        <div className="text-sm text-muted-foreground text-center">
          {predCount?.count ?? 0} predictions made for this match
        </div>

        <form action={handleUpdate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-3">Match Result</label>
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">{match.home_team?.flag} {match.home_team?.name_en}</div>
                <input type="number" name="home_score" min="0" max="99"
                  defaultValue={match.home_score ?? 0}
                  className="w-full border rounded-md px-3 py-2 text-center text-xl font-mono bg-background" />
              </div>
              <div className="text-center text-2xl font-bold text-muted-foreground">—</div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">{match.away_team?.name_en} {match.away_team?.flag}</div>
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
