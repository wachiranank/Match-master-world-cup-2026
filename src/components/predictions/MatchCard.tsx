'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { savePrediction } from '@/app/actions/predictions';
import { getLocaleName } from '@/lib/i18n-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Check, Pencil, Loader2, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

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
type Prediction = { predicted_home: number; predicted_away: number; total_points: number } | null;

interface Props {
  match: Match;
  prediction: Prediction;
  locale: string;
}

const MULTIPLIERS: Record<string, number> = {
  group_stage: 1, r32: 2, r16: 3, qf: 4, sf: 5, third_place: 5, final: 6,
};

export function MatchCard({ match, prediction, locale }: Props) {
  const t = useTranslations('predictions');
  const isLocked = new Date(match.kick_off) <= new Date();
  const isCompleted = match.status === 'completed';
  const multiplier = MULTIPLIERS[match.stage_key] ?? 1;

  const [editing, setEditing] = useState(!prediction && !isLocked);
  const [homeScore, setHomeScore] = useState(prediction?.predicted_home ?? 0);
  const [awayScore, setAwayScore] = useState(prediction?.predicted_away ?? 0);
  const [isPending, startTransition] = useTransition();

  const kickoffDate = new Date(match.kick_off);
  const dateStr = kickoffDate.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
    day: 'numeric', month: 'short', weekday: 'short',
  });
  const timeStr = kickoffDate.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const homeName = getLocaleName(match.home_team, locale as Locale);
  const awayName = getLocaleName(match.away_team, locale as Locale);
  const venueName = getLocaleName(match as any, locale as Locale, 'venue');

  function handleSave() {
    startTransition(async () => {
      const result = await savePrediction(
        match.id, homeScore, awayScore, match.stage_key, locale
      );
      if (result.error) {
        toast.error(result.error === 'not_authenticated'
          ? (locale === 'th' ? 'กรุณาเข้าสู่ระบบ' : 'Please sign in')
          : result.error);
      } else {
        toast.success(t('predictionSaved'));
        setEditing(false);
      }
    });
  }

  // Outcome badge for completed matches
  function getOutcomeBadge() {
    if (!isCompleted || !prediction) return null;
    const pts = prediction.total_points;
    if (pts >= 3 * multiplier) return <Badge className="bg-green-500 text-white">+{pts} pts ⭐</Badge>;
    if (pts > 0)               return <Badge className="bg-blue-500 text-white">+{pts} pts</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">0 pts</Badge>;
  }

  return (
    <Card className={cn(
      'transition-all',
      isLocked && 'opacity-90',
      editing && 'ring-2 ring-primary shadow-md'
    )}>
      <CardContent className="p-4">
        {/* Top row: date + stage + lock */}
        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{dateStr} · {timeStr}</span>
          </div>
          <div className="flex items-center gap-2">
            {getOutcomeBadge()}
            {isLocked && !isCompleted && (
              <div className="flex items-center gap-1 text-orange-500">
                <Lock className="h-3.5 w-3.5" />
                <span>{t('matchLocked')}</span>
              </div>
            )}
            {!isLocked && (
              <Badge variant="outline" className="text-xs">
                ×{multiplier}
              </Badge>
            )}
          </div>
        </div>

        {/* Match row */}
        <div className="flex items-center gap-3">
          {/* Home team */}
          <TeamDisplay team={match.home_team} name={homeName} align="right" />

          {/* Score area */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[120px]">
            {isCompleted && match.home_score != null ? (
              /* Actual result */
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">{match.home_score}</span>
                <span className="text-muted-foreground">–</span>
                <span className="text-2xl font-black">{match.away_score}</span>
              </div>
            ) : editing ? (
              /* Editable score inputs */
              <div className="flex items-center gap-2">
                <ScoreInput
                  value={homeScore}
                  onChange={setHomeScore}
                  disabled={isPending}
                />
                <span className="text-muted-foreground font-bold">–</span>
                <ScoreInput
                  value={awayScore}
                  onChange={setAwayScore}
                  disabled={isPending}
                />
              </div>
            ) : prediction ? (
              /* Saved prediction */
              <div className="flex items-center gap-2 text-primary">
                <span className="text-2xl font-black">{prediction.predicted_home}</span>
                <span className="text-muted-foreground">–</span>
                <span className="text-2xl font-black">{prediction.predicted_away}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">{t('vs')}</span>
            )}

            {/* Action buttons */}
            {!isLocked && !isCompleted && (
              editing ? (
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={handleSave} disabled={isPending} className="h-7 text-xs px-3">
                    {isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <><Check className="h-3.5 w-3.5 mr-1" />{t('savePrediction')}</>
                    }
                  </Button>
                  {prediction && (
                    <Button size="sm" variant="ghost" onClick={() => {
                      setHomeScore(prediction.predicted_home);
                      setAwayScore(prediction.predicted_away);
                      setEditing(false);
                    }} className="h-7 text-xs px-2">
                      {t('cancel')}
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  variant={prediction ? 'ghost' : 'default'}
                  onClick={() => setEditing(true)}
                  className="h-7 text-xs px-3"
                >
                  {prediction
                    ? <><Pencil className="h-3.5 w-3.5 mr-1" />{t('editPrediction')}</>
                    : t('predict')}
                </Button>
              )
            )}
          </div>

          {/* Away team */}
          <TeamDisplay team={match.away_team} name={awayName} align="left" />
        </div>

        {/* Venue */}
        {venueName && (
          <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-xs">{venueName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamDisplay({
  team, name, align,
}: {
  team: Team; name: string; align: 'left' | 'right';
}) {
  return (
    <div className={cn(
      'flex-1 flex flex-col items-center gap-1.5',
      align === 'right' ? 'sm:flex-row-reverse' : 'sm:flex-row'
    )}>
      {team.flag_url ? (
        <Image
          src={team.flag_url}
          alt={name}
          width={40}
          height={28}
          className="rounded object-cover border border-border shadow-sm flex-shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-10 h-7 rounded bg-muted flex-shrink-0" />
      )}
      <span className={cn(
        'text-sm font-semibold text-center sm:text-start leading-tight',
        align === 'right' && 'sm:text-end'
      )}>
        {name}
      </span>
    </div>
  );
}

function ScoreInput({
  value, onChange, disabled,
}: {
  value: number; onChange: (v: number) => void; disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => onChange(Math.min(99, value + 1))}
        disabled={disabled}
        className="w-8 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors text-lg font-bold leading-none"
      >
        ▴
      </button>
      <input
        type="number"
        min={0}
        max={99}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v) && v >= 0 && v <= 99) onChange(v);
        }}
        disabled={disabled}
        className="w-12 h-10 text-center text-2xl font-black border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled}
        className="w-8 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors text-lg font-bold leading-none"
      >
        ▾
      </button>
    </div>
  );
}
