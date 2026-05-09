import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calcPoints } from '@/lib/i18n-helpers';

// Protected with a secret header — call from cron job or admin panel
// POST /api/score-matches
// Header: x-scoring-secret: <SCORING_SECRET>
// Body: { matchId: string }  — score a single match
//   OR: {}                   — score ALL newly completed matches

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  // Auth guard
  const secret = req.headers.get('x-scoring-secret');
  if (!secret || secret !== process.env.SCORING_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const supabase = adminClient();

  // Find matches to score: status=completed AND have actual scores
  const matchQuery = supabase
    .from('matches')
    .select('id, home_score, away_score, stage_key')
    .eq('status', 'completed')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);

  if (body.matchId) {
    matchQuery.eq('id', body.matchId);
  }

  const { data: matches, error: matchErr } = await matchQuery;
  if (matchErr) return NextResponse.json({ error: matchErr.message }, { status: 500 });
  if (!matches || matches.length === 0) {
    return NextResponse.json({ message: 'No completed matches to score', scored: 0 });
  }

  let totalScored = 0;
  const profileDeltas: Record<string, number> = {};

  for (const match of matches) {
    const { id: matchId, home_score, away_score, stage_key } = match;

    // Fetch all predictions for this match that haven't been scored yet
    const { data: predictions, error: predErr } = await supabase
      .from('predictions')
      .select('id, user_id, predicted_home, predicted_away')
      .eq('match_id', matchId)
      .eq('points_result', 0)   // only unscored rows
      .eq('points_score', 0);

    if (predErr || !predictions?.length) continue;

    // Calculate + batch update
    const updates = predictions.map((pred) => {
      const { resultPts, scorePts, total } = calcPoints(
        pred.predicted_home,
        pred.predicted_away,
        home_score!,
        away_score!,
        stage_key
      );
      // Accumulate delta for profile update
      profileDeltas[pred.user_id] = (profileDeltas[pred.user_id] ?? 0) + total;
      return {
        id: pred.id,
        points_result: resultPts,
        points_score:  scorePts,
        total_points:  total,
        updated_at:    new Date().toISOString(),
      };
    });

    const { error: updateErr } = await supabase
      .from('predictions')
      .upsert(updates, { onConflict: 'id' });

    if (!updateErr) totalScored += updates.length;
  }

  // Update profile totals — increment by delta (not overwrite, to avoid race conditions)
  for (const [userId, delta] of Object.entries(profileDeltas)) {
    if (delta === 0) continue;
    await supabase.rpc('increment_profile_points', {
      p_user_id: userId,
      p_delta:   delta,
    });
  }

  return NextResponse.json({
    message: `Scored ${totalScored} predictions across ${matches.length} match(es)`,
    scored: totalScored,
    profilesUpdated: Object.keys(profileDeltas).length,
  });
}
