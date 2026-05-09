'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CHAMPION_DEADLINE } from '@/lib/i18n-helpers';
import { Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

function getTimeLeft() {
  const diff = CHAMPION_DEADLINE.getTime() - Date.now();
  if (diff <= 0) return null;
  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return { days, hours, minutes, seconds, urgent: days < 3 };
}

export function CountdownBanner({ locale }: { locale: string }) {
  const t = useTranslations('champion');
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
        <Lock className="h-4 w-4 flex-shrink-0" />
        <span className="font-semibold text-sm">{t('deadlinePassed')}</span>
      </div>
    );
  }

  const { days, hours, minutes, seconds, urgent } = timeLeft;

  const units = [
    { value: days,    label: locale === 'th' ? 'วัน'     : 'Days' },
    { value: hours,   label: locale === 'th' ? 'ชั่วโมง' : 'Hrs' },
    { value: minutes, label: locale === 'th' ? 'นาที'    : 'Min' },
    { value: seconds, label: locale === 'th' ? 'วินาที'  : 'Sec' },
  ];

  return (
    <div className={cn(
      'rounded-xl border px-4 py-3',
      urgent
        ? 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/30'
        : 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/20'
    )}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className={cn(
          'flex items-center gap-2 text-sm font-medium',
          urgent ? 'text-orange-700 dark:text-orange-400' : 'text-yellow-700 dark:text-yellow-400'
        )}>
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>
            {locale === 'th'
              ? 'หมดเขตทายแชมป์ 11 มิ.ย. 2026'
              : 'Champion pick deadline: Jun 11, 2026'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {units.map(({ value, label }, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className={cn(
                  'text-2xl font-black tabular-nums leading-none',
                  urgent ? 'text-orange-700 dark:text-orange-300' : 'text-yellow-700 dark:text-yellow-300'
                )}>
                  {String(value).padStart(2, '0')}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
              </div>
              {i < units.length - 1 && (
                <span className={cn(
                  'text-xl font-black mb-3',
                  urgent ? 'text-orange-400' : 'text-yellow-400'
                )}>:</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
