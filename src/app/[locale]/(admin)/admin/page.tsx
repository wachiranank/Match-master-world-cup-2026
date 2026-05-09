import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { triggerScoring } from '@/app/actions/admin';

async function runScoring() {
  'use server';
  await triggerScoring();
}

export default async function AdminPage() {
  const supabase = await createClient();
  const locale = await getLocale();

  const [{ count: total }, { count: completed }, { count: scheduled }] = await Promise.all([
    (supabase as any).from('matches').select('*', { count: 'exact', head: true }),
    (supabase as any).from('matches').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    (supabase as any).from('matches').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
  ]);

  const { count: users } = await (supabase as any).from('profiles').select('*', { count: 'exact', head: true });
  const { count: predictions } = await (supabase as any).from('predictions').select('*', { count: 'exact', head: true });

  const stats = [
    { label: 'Total Matches', value: total ?? 0, color: 'bg-blue-500' },
    { label: 'Completed', value: completed ?? 0, color: 'bg-green-500' },
    { label: 'Scheduled', value: scheduled ?? 0, color: 'bg-yellow-500' },
    { label: 'Total Users', value: users ?? 0, color: 'bg-purple-500' },
    { label: 'Total Predictions', value: predictions ?? 0, color: 'bg-orange-500' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Match Master World Cup 2026</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background rounded-lg border p-4 text-center">
            <div className={`text-3xl font-bold ${s.color.replace('bg-', 'text-')}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href={`/${locale}/admin/matches`}
          className="block bg-background border rounded-lg p-6 hover:border-primary transition-colors">
          <div className="text-xl font-semibold mb-1">📋 Manage Matches</div>
          <p className="text-sm text-muted-foreground">View, edit scores and add knockout round matches</p>
        </Link>

        <Link href={`/${locale}/admin/matches/new`}
          className="block bg-background border rounded-lg p-6 hover:border-primary transition-colors">
          <div className="text-xl font-semibold mb-1">➕ Add Match</div>
          <p className="text-sm text-muted-foreground">Add a new knockout round match after group stage results</p>
        </Link>
      </div>

      <div className="bg-background border rounded-lg p-6">
        <h2 className="font-semibold mb-2">⚡ Trigger Scoring Now</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Scoring runs automatically every 10 minutes. Use this to run it immediately after entering match results.
        </p>
        <form action={runScoring}>
          <button type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            Run Scoring Now
          </button>
        </form>
      </div>
    </div>
  );
}
