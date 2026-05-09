'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { FilterKey } from './PredictionsClient';

interface Props {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
  counts: Record<FilterKey, number>;
}

const TABS: FilterKey[] = ['all', 'upcoming', 'predicted', 'completed'];

export function FilterTabs({ active, onChange, counts }: Props) {
  const t = useTranslations('predictions.filters');

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg w-full sm:w-auto">
      {TABS.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'flex-1 sm:flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            active === key
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t(key)}
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none min-w-[1.2rem]',
              active === key ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
            )}
          >
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  );
}
