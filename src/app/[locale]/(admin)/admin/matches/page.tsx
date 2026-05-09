import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { STAGE_MULTIPLIERS } from '@/lib/i18n-helpers';

const STAGE_LABELS: Record<string, string> = {
  group_stage: 'Group Stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-finals',
  sf: 'Semi-finals',
  third_place: 'Third Place',
  final: 'Final',
};

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-yellow-100 text-yellow-800',
  live: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-700',
};

export default async function AdminMatchesPage() {
  const supabase = await createClient();
  const locale = await getLocale();

  const matchesRes = await (supabase as any)
    .from('matches')
    .select(`
      id, stage_key, kick_off, status, home_score, away_score, venue_en,
      home_team:teams!matches_home_team_id_fkey(name_en, flag),
      away_team:teams!matches_away_team_id_fkey(name_en, flag)
    `)
    .order('kick_off', { ascending: true });
  const matches = matchesRes.data as any[];

  const grouped = (matches ?? []).reduce<Record<string, any[]>>((acc, m) => {
    const key = m.stage_key ?? 'group_stage';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const stageOrder = Object.keys(STAGE_MULTIPLIERS);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Matches</h1>
        <Link href={`/${locale}/admin/matches/new`}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          + Add Match
        </Link>
      </div>

      {stageOrder.map((stage) => {
        const list = grouped[stage];
        if (!list?.length) return null;
        return (
          <div key={stage} className="bg-background border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 flex items-center justify-between">
              <h2 className="font-semibold">{STAGE_LABELS[stage] ?? stage}</h2>
              <span className="text-xs text-muted-foreground">{list.length} matches</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left px-4 py-2">Match</th>
                  <th className="text-center px-4 py-2">Score</th>
                  <th className="text-center px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Kick-off (UTC)</th>
                  <th className="text-right px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m: any) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {m.home_team?.flag} {m.home_team?.name_en ?? '—'} vs {m.away_team?.name_en ?? '—'} {m.away_team?.flag}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {m.status === 'scheduled' ? '– : –' : `${m.home_score ?? 0} : ${m.away_score ?? 0}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[m.status] ?? ''}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(m.kick_off).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/${locale}/admin/matches/${m.id}`}
                        className="text-primary hover:underline text-xs font-medium">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
