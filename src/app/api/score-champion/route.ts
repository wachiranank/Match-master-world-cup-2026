import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Called once after the tournament final to award champion bonus points.
// POST /api/score-champion
// Header: x-scoring-secret: <SCORING_SECRET>
// Body: { winnerTeamId: string }

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CHAMPION_BONUS = 50;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scoring-secret');
  if (!secret || secret !== process.env.SCORING_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { winnerTeamId } = await req.json();
  if (!winnerTeamId) {
    return NextResponse.json({ error: 'winnerTeamId is required' }, { status: 400 });
  }

  const supabase = adminClient();

  // Mark all correct picks
  const { error: markErr } = await supabase
    .from('champion_picks')
    .update({ is_correct: true })
    .eq('team_id', winnerTeamId)
    .is('is_correct', null);   // only update once

  if (markErr) return NextResponse.json({ error: markErr.message }, { status: 500 });

  // Mark all wrong picks
  await supabase
    .from('champion_picks')
    .update({ is_correct: false })
    .neq('team_id', winnerTeamId)
    .is('is_correct', null);

  // Fetch correct pickers
  const { data: winners, error: winnersErr } = await supabase
    .from('champion_picks')
    .select('user_id')
    .eq('team_id', winnerTeamId)
    .eq('is_correct', true);

  if (winnersErr) return NextResponse.json({ error: winnersErr.message }, { status: 500 });

  // Award +50 to each correct picker
  let awarded = 0;
  for (const { user_id } of winners ?? []) {
    const { error } = await supabase.rpc('increment_profile_points', {
      p_user_id: user_id,
      p_delta:   CHAMPION_BONUS,
    });
    if (!error) awarded++;
  }

  return NextResponse.json({
    message: `Champion bonus awarded to ${awarded} player(s)`,
    winnerTeamId,
    awarded,
    bonus: CHAMPION_BONUS,
  });
}
