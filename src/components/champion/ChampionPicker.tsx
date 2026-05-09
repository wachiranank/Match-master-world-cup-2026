'use client';

import { useState, useMemo, useTransition } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { saveChampionPick } from '@/app/actions/champion';
import { getLocaleName } from '@/lib/i18n-helpers';
import { isChampionPickOpen } from '@/lib/i18n-helpers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CountdownBanner } from './CountdownBanner';
import {
  Search, Star, Trophy, Check, Loader2, RefreshCw, Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

type Team = {
  id: string;
  name_th: string;
  name_en: string;
  flag_url: string | null;
  group_name: string | null;
  confederation: string | null;
};

type CurrentPick = {
  team_id: string;
  picked_at: string;
} | null;

interface Props {
  teams: Team[];
  currentPick: CurrentPick;
  locale: string;
}

const CONF_COLORS: Record<string, string> = {
  UEFA:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  CONMEBOL:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CONCACAF:  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  AFC:       'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  CAF:       'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  OFC:       'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

export function ChampionPicker({ teams, currentPick, locale }: Props) {
  const t = useTranslations('champion');
  const isOpen = isChampionPickOpen();

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(currentPick?.team_id ?? null);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentTeam = teams.find((t) => t.id === currentPick?.team_id) ?? null;
  const selectedTeam = teams.find((t) => t.id === selectedId) ?? null;
  const hasChanged = selectedId !== currentPick?.team_id;

  const filtered = useMemo(() => {
    if (!query.trim()) return teams;
    const q = query.toLowerCase();
    return teams.filter(
      (t) =>
        t.name_en.toLowerCase().includes(q) ||
        t.name_th.includes(q) ||
        (t.group_name ?? '').toLowerCase().includes(q)
    );
  }, [teams, query]);

  // Group by confederation for display
  const grouped = useMemo(() => {
    const groups: Record<string, Team[]> = {};
    for (const team of filtered) {
      const key = team.confederation ?? 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(team);
    }
    return groups;
  }, [filtered]);

  function handleSelect(teamId: string) {
    if (!isOpen) return;
    setSelectedId(teamId);
    setConfirming(true);
  }

  function handleConfirm() {
    if (!selectedId) return;
    startTransition(async () => {
      const result = await saveChampionPick(selectedId, locale);
      if (result.error) {
        const msg =
          result.error === 'deadline_passed'
            ? t('deadlinePassed')
            : result.error === 'not_authenticated'
            ? (locale === 'th' ? 'กรุณาเข้าสู่ระบบ' : 'Please sign in')
            : result.error;
        toast.error(msg);
      } else {
        toast.success(t('pickConfirmed'));
        setConfirming(false);
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
          <Star className="h-7 w-7 text-yellow-500" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      {/* Countdown */}
      <CountdownBanner locale={locale} />

      {/* Bonus callout */}
      <div className="flex items-center gap-3 rounded-xl border border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 px-4 py-3">
        <Trophy className="h-8 w-8 text-yellow-500 flex-shrink-0" />
        <div>
          <p className="font-bold text-yellow-700 dark:text-yellow-400 text-lg">
            {t('bonusPoints')}
          </p>
          <p className="text-xs text-muted-foreground">{t('warning')}</p>
        </div>
      </div>

      {/* Current pick display */}
      {currentTeam && !confirming && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentTeam.flag_url ? (
                <Image
                  src={currentTeam.flag_url}
                  alt={getLocaleName(currentTeam, locale as Locale)}
                  width={48}
                  height={34}
                  className="rounded border shadow-sm object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-8 rounded bg-muted" />
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t('currentPick')}</p>
                <p className="font-bold text-lg">{getLocaleName(currentTeam, locale as Locale)}</p>
                <p className="text-xs text-muted-foreground">
                  {locale === 'th' ? 'กลุ่ม' : 'Group'} {currentTeam.group_name}
                </p>
              </div>
            </div>
            {isOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedId(null); setConfirming(false); }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                {t('changePick')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirm dialog (inline) */}
      {confirming && selectedTeam && (
        <Card className="border-2 border-primary shadow-lg">
          <CardContent className="p-5">
            <p className="font-semibold text-center mb-4">
              {locale === 'th' ? 'ยืนยันการเลือกทีมแชมป์?' : 'Confirm your champion pick?'}
            </p>
            <div className="flex items-center justify-center gap-4 mb-5">
              {selectedTeam.flag_url ? (
                <Image
                  src={selectedTeam.flag_url}
                  alt={getLocaleName(selectedTeam, locale as Locale)}
                  width={64}
                  height={44}
                  className="rounded border-2 border-primary shadow object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-16 h-11 rounded bg-muted" />
              )}
              <div>
                <p className="text-2xl font-black">{getLocaleName(selectedTeam, locale as Locale)}</p>
                <Badge className="mt-1 bg-yellow-100 text-yellow-700 border-yellow-300">
                  {t('bonusPoints')} {locale === 'th' ? 'ถ้าถูก' : 'if correct'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setSelectedId(currentPick?.team_id ?? null); setConfirming(false); }}
                disabled={isPending}
              >
                {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold" onClick={handleConfirm} disabled={isPending}>
                {isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><Check className="h-4 w-4 mr-1.5" />{t('confirmPick')}</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked state */}
      {!isOpen && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span className="text-sm">{t('deadlinePassed')}</span>
        </div>
      )}

      {/* Team grid — hidden while confirming */}
      {(!confirming || !currentPick) && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={locale === 'th' ? 'ค้นหาทีม...' : 'Search teams...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              disabled={!isOpen}
            />
          </div>

          {/* Teams by confederation */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([conf, confTeams]) => (
              <div key={conf}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', CONF_COLORS[conf] ?? 'bg-muted text-muted-foreground')}>
                    {conf}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({confTeams.length} {locale === 'th' ? 'ทีม' : 'teams'})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {confTeams.map((team) => {
                    const name = getLocaleName(team, locale as Locale);
                    const isSelected = selectedId === team.id;
                    const isCurrent = currentPick?.team_id === team.id;
                    return (
                      <button
                        key={team.id}
                        onClick={() => handleSelect(team.id)}
                        disabled={!isOpen}
                        className={cn(
                          'relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all',
                          'hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5',
                          isSelected && 'border-primary bg-primary/5 shadow-md ring-2 ring-primary',
                          isCurrent && !isSelected && 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20',
                          !isOpen && 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-none'
                        )}
                      >
                        {isCurrent && (
                          <Star className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        )}
                        {team.flag_url ? (
                          <Image
                            src={team.flag_url}
                            alt={name}
                            width={48}
                            height={34}
                            className="rounded object-cover border shadow-sm"
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-8 rounded bg-muted" />
                        )}
                        <span className="text-xs font-semibold leading-tight line-clamp-2">{name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {locale === 'th' ? 'กลุ่ม' : 'Grp'} {team.group_name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
