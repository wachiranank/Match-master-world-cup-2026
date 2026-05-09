'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MatchCard } from './MatchCard';
import { FilterTabs } from './FilterTabs';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';

type Team = { id: string; name_th: string; name_en: string; flag_url: string | null; group_name: string | null };
type Match = {
  id: string;
  stage_key: string;
  kick_off: string;
  venue_th: string | null;
  venue_en: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team: Team;
  away_team: Team;
};
type Prediction = { predicted_home: number; predicted_away: number; total_points: number };

interface Props {
  matches: Match[];
  predictionMap: Record<string, Prediction>;
  locale: string;
}

export type FilterKey = 'all' | 'upcoming' | 'predicted' | 'completed';

const STAGE_LABELS: Record<string, { th: string; en: string }> = {
  group_stage: { th: 'รอบแบ่งกลุ่ม',          en: 'Group Stage' },
  r32:         { th: 'รอบ 32 ทีม',             en: 'Round of 32' },
  r16:         { th: 'รอบ 16 ทีม',             en: 'Round of 16' },
  qf:          { th: 'รอบก่อนรองชนะเลิศ',      en: 'Quarter-Final' },
  sf:          { th: 'รอบรองชนะเลิศ',          en: 'Semi-Final' },
  third_place: { th: 'อันดับที่ 3',            en: 'Third Place' },
  final:       { th: 'รอบชิงชนะเลิศ',          en: 'Final' },
};

const MULTIPLIERS: Record<string, number> = {
  group_stage: 1, r32: 2, r16: 3, qf: 4, sf: 5, third_place: 5, final: 6,
};

export function PredictionsClient({ matches, predictionMap, locale }: Props) {
  const t = useTranslations('predictions');
  const [filter, setFilter] = useState<FilterKey>('upcoming');
  const now = new Date();

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const isLocked = new Date(m.kick_off) <= now;
      const hasPrediction = !!predictionMap[m.id];
      const isCompleted = m.status === 'completed';
      switch (filter) {
        case 'upcoming':  return !isLocked;
        case 'predicted': return hasPrediction;
        case 'completed': return isCompleted;
        default:          return true;
      }
    });
  }, [matches, predictionMap, filter]);

  const counts = useMemo(() => ({
    all:       matches.length,
    upcoming:  matches.filter((m) => new Date(m.kick_off) > now).length,
    predicted: matches.filter((m) => !!predictionMap[m.id]).length,
    completed: matches.filter((m) => m.status === 'completed').length,
  }), [matches, predictionMap]);

  const grouped = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    for (const m of filtered) {
      if (!groups[m.stage_key]) groups[m.stage_key] = [];
      groups[m.stage_key].push(m);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="h-7 w-7" />
          {t('title')}
        </h1>
        <Badge variant="outline">
          {counts.predicted}/{counts.all} {locale === 'th' ? 'ทำนายแล้ว' : 'predicted'}
        </Badge>
      </div>

      <FilterTabs active={filter} onChange={setFilter} counts={counts} />

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t('noPredictions')}</p>
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          {Object.entries(grouped).map(([stage, stageMatches]) => {
            const label = STAGE_LABELS[stage]?.[locale as 'th' | 'en'] ?? stage;
            const multiplier = MULTIPLIERS[stage];
            return (
              <section key={stage}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                  </h2>
                  {multiplier && (
                    <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                      ×{multiplier}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  {stageMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predictionMap[match.id] ?? null}
                      locale={locale}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
