import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ChampionPicker } from '@/components/champion/ChampionPicker';

export default async function ChampionPage() {
  const supabase = await createClient();
  const locale = await getLocale();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  // Fetch all 48 teams ordered by confederation then group
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name_th, name_en, flag_url, group_name, confederation')
    .order('confederation', { ascending: true })
    .order('group_name', { ascending: true })
    .order('name_en', { ascending: true })
    .returns<Array<{
      id: string;
      name_th: string;
      name_en: string;
      flag_url: string | null;
      group_name: string | null;
      confederation: string | null;
    }>>();

  // Fetch this user's current champion pick (if any)
  const { data: pick } = await supabase
    .from('champion_picks')
    .select('team_id, picked_at')
    .eq('user_id', user.id)
    .maybeSingle()
    .returns<{ team_id: string; picked_at: string } | null>();

  return (
    <ChampionPicker
      teams={teams ?? []}
      currentPick={pick ?? null}
      locale={locale}
    />
  );
}
