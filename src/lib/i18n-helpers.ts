import type { Locale } from '@/i18n/routing';

/**
 * Returns the localized name from a bilingual record.
 * Falls back to the other locale if the preferred one is missing.
 *
 * Usage:
 *   getLocaleName(team, locale)            // team.name_th or team.name_en
 *   getLocaleName(match, locale, 'venue')  // match.venue_th or match.venue_en
 */
export function getLocaleName<T extends Record<string, unknown>>(
  record: T,
  locale: Locale,
  field: string = 'name'
): string {
  const preferred = record[`${field}_${locale}`] as string | undefined;
  if (preferred) return preferred;

  // Fallback to the other locale
  const other = locale === 'th' ? 'en' : 'th';
  return (record[`${field}_${other}`] as string) ?? '';
}

/** Stage multipliers (mirrors DB stage_multipliers table). */
export const STAGE_MULTIPLIERS: Record<string, number> = {
  group_stage: 1,
  r32: 2,
  r16: 3,
  qf: 4,
  sf: 5,
  third_place: 5,
  final: 6,
};

/**
 * Calculates prediction points.
 * @returns { resultPts, scorePts, total }
 */
export function calcPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  stageKey: string
): { resultPts: number; scorePts: number; total: number } {
  const multiplier = STAGE_MULTIPLIERS[stageKey] ?? 1;

  const exactScore = predictedHome === actualHome && predictedAway === actualAway;
  if (exactScore) {
    return { resultPts: 1, scorePts: 3, total: (1 + 3) * multiplier };
  }

  const predictedResult = Math.sign(predictedHome - predictedAway);
  const actualResult    = Math.sign(actualHome - actualAway);
  const correctResult   = predictedResult === actualResult;

  if (correctResult) {
    return { resultPts: 1, scorePts: 0, total: 1 * multiplier };
  }

  return { resultPts: 0, scorePts: 0, total: 0 };
}

/** Champion pick deadline — June 11 2026 00:00 UTC+7 */
export const CHAMPION_DEADLINE = new Date('2026-06-11T00:00:00+07:00');

export function isChampionPickOpen(): boolean {
  return new Date() < CHAMPION_DEADLINE;
}
