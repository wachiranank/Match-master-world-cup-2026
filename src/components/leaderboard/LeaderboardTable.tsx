'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getLocaleName } from '@/lib/i18n-helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

type Row = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  rank: number;
  prediction_count: number;
  correct_count: number;
  champion_team_id: string | null;
};

type Team = { id: string; name_th: string; name_en: string; flag_url: string | null };

interface Props {
  rows: Row[];
  teamMap: Record<string, Team>;
  currentUserId: string | null;
  locale: string;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
}

function AccuracyBar({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

export function LeaderboardTable({ rows, teamMap, currentUserId, locale }: Props) {
  const t = useTranslations('leaderboard');

  if (rows.length === 0) {
    return (
      <Card className="py-20 text-center text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>{locale === 'th' ? 'ยังไม่มีผู้เล่น' : 'No players yet'}</p>
      </Card>
    );
  }

  // Find current user's row for sticky banner
  const myRow = rows.find((r) => r.id === currentUserId);

  return (
    <div className="space-y-3">
      {/* My position sticky banner (shown if not in visible top 100 or just highlight) */}
      {myRow && myRow.rank > 10 && (
        <Card className="border-primary/40 bg-primary/5 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('myPosition')}</span>
            <div className="flex items-center gap-3">
              <span className="font-bold">#{myRow.rank}</span>
              <span className="font-black text-primary text-lg">{myRow.total_points}</span>
              <span className="text-muted-foreground text-xs">{t('points')}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Header row */}
      <div className="hidden sm:grid grid-cols-[2rem_1fr_6rem_6rem_5rem] gap-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span className="text-center">{t('rank')}</span>
        <span>{t('player')}</span>
        <span className="text-center">{t('champion')}</span>
        <span className="text-right">{t('accuracy')}</span>
        <span className="text-right">{t('points')}</span>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {rows.map((row, i) => {
          const isMe = row.id === currentUserId;
          const isTop3 = row.rank <= 3;
          const championTeam = row.champion_team_id ? teamMap[row.champion_team_id] : null;
          const initials = (row.display_name ?? '?').slice(0, 2).toUpperCase();

          return (
            <Card
              key={row.id}
              className={cn(
                'transition-all',
                isMe && 'border-primary ring-2 ring-primary/30 bg-primary/5',
                isTop3 && !isMe && 'border-yellow-200 dark:border-yellow-800',
                row.rank === 1 && 'bg-gradient-to-r from-yellow-50/80 to-transparent dark:from-yellow-950/20'
              )}
            >
              <div className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_6rem_6rem_5rem] items-center gap-3 sm:gap-4 px-4 py-3">
                {/* Rank */}
                <div className="flex justify-center">
                  <RankIcon rank={row.rank} />
                </div>

                {/* Player */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={row.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-sm font-semibold truncate', isMe && 'text-primary')}>
                        {row.display_name ?? (locale === 'th' ? 'ผู้เล่น' : 'Player')}
                      </span>
                      {isMe && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">
                          {locale === 'th' ? 'ฉัน' : 'You'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {row.prediction_count} {locale === 'th' ? 'ทำนาย' : 'predictions'}
                    </p>
                  </div>
                </div>

                {/* Champion pick — hidden on mobile */}
                <div className="hidden sm:flex justify-center">
                  {championTeam ? (
                    <div className="flex items-center gap-1.5">
                      {championTeam.flag_url && (
                        <Image
                          src={championTeam.flag_url}
                          alt={getLocaleName(championTeam, locale as Locale)}
                          width={24}
                          height={17}
                          className="rounded object-cover border"
                          unoptimized
                        />
                      )}
                      <span className="text-xs truncate max-w-[60px]">
                        {getLocaleName(championTeam, locale as Locale)}
                      </span>
                    </div>
                  ) : (
                    <Star className="h-4 w-4 text-muted-foreground/30" />
                  )}
                </div>

                {/* Accuracy — hidden on mobile */}
                <div className="hidden sm:flex justify-end">
                  <AccuracyBar correct={row.correct_count} total={row.prediction_count} />
                </div>

                {/* Points */}
                <div className="flex items-baseline justify-end gap-1">
                  <span className={cn(
                    'font-black tabular-nums',
                    row.rank === 1 ? 'text-2xl text-yellow-600 dark:text-yellow-400'
                    : row.rank <= 3 ? 'text-xl text-slate-700 dark:text-slate-300'
                    : 'text-lg text-foreground'
                  )}>
                    {row.total_points}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{t('points')}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-2">
        {locale === 'th'
          ? `แสดง ${rows.length} อันดับแรก · อัปเดตทุกครั้งที่มีผลการแข่งขัน`
          : `Showing top ${rows.length} · Updated after each match result`}
      </p>
    </div>
  );
}
