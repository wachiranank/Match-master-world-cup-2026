import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createMatch } from '@/app/actions/admin';

const KNOCKOUT_STAGES = [
  { key: 'r32', label: 'Round of 32' },
  { key: 'r16', label: 'Round of 16' },
  { key: 'qf', label: 'Quarter-finals' },
  { key: 'sf', label: 'Semi-finals' },
  { key: 'third_place', label: 'Third Place Playoff' },
  { key: 'final', label: 'Final' },
];

export default async function NewMatchPage() {
  const supabase = await createClient();
  const locale = await getLocale();

  const teamsRes = await (supabase as any)
    .from('teams')
    .select('id, name_en, name_th, flag_url')
    .order('name_en');
  const teams = teamsRes.data as any[];

  async function handleCreate(formData: FormData) {
    'use server';
    const result = await createMatch(formData);
    if (result.success) redirect(`/${locale}/admin/matches`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Match</h1>

      <form action={handleCreate} className="bg-background border rounded-lg p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Home Team</label>
            <select name="home_team_id" required
              className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              <option value="">Select team...</option>
              {(teams ?? []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Away Team</label>
            <select name="away_team_id" required
              className="w-full border rounded-md px-3 py-2 text-sm bg-background">
              <option value="">Select team...</option>
              {(teams ?? []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name_en}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stage</label>
          <select name="stage_key" required
            className="w-full border rounded-md px-3 py-2 text-sm bg-background">
            {KNOCKOUT_STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kick-off Date &amp; Time (UTC)</label>
          <input type="datetime-local" name="kick_off" required
            className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Venue (English)</label>
            <input type="text" name="venue_en" placeholder="e.g. MetLife Stadium, New York"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Venue (Thai)</label>
            <input type="text" name="venue_th" placeholder="เช่น เมตไลฟ์ สเตเดียม, นิวยอร์ก"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            Create Match
          </button>
          <a href={`/${locale}/admin/matches`}
            className="px-6 py-2 rounded-md text-sm font-medium border hover:bg-muted transition-colors">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
