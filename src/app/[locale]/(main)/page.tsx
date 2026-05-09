import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Star, BarChart3 } from 'lucide-react';

export default async function HomePage() {
  const locale = await getLocale();

  return <HomeContent locale={locale} />;
}

function HomeContent({ locale }: { locale: string }) {
  const t = useTranslations();

  const features = [
    {
      key: 'predict',
      icon: <Target className="h-8 w-8 text-blue-500" />,
      title: t('home.features.predict.title'),
      description: t('home.features.predict.description'),
    },
    {
      key: 'champion',
      icon: <Star className="h-8 w-8 text-yellow-500" />,
      title: t('home.features.champion.title'),
      description: t('home.features.champion.description'),
    },
    {
      key: 'compete',
      icon: <BarChart3 className="h-8 w-8 text-green-500" />,
      title: t('home.features.compete.title'),
      description: t('home.features.compete.description'),
    },
  ];

  const stageMultipliers = [
    { key: 'group_stage', multiplier: 'x1' },
    { key: 'r32', multiplier: 'x2' },
    { key: 'r16', multiplier: 'x3' },
    { key: 'qf', multiplier: 'x4' },
    { key: 'sf', multiplier: 'x5' },
    { key: 'final', multiplier: 'x6' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 px-4">
        <div className="absolute inset-0 bg-[url('/world-cup-bg.svg')] bg-center bg-no-repeat opacity-5" />
        <div className="container mx-auto text-center relative z-10 max-w-3xl">
          <div className="flex justify-center mb-6">
            <Trophy className="h-20 w-20 text-yellow-400 drop-shadow-lg" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-3 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-yellow-300 font-semibold mb-4">
            {t('home.hero.subtitle')}
          </p>
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
            {t('home.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg px-8">
              <Link href={`/${locale}/sign-in`}>{t('home.hero.ctaPlay')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8">
              <Link href={`/${locale}/dashboard`}>{t('home.hero.ctaLearn')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.key} className="text-center hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-2">{f.icon}</div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Points system */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-10">
            {locale === 'th' ? 'ระบบคะแนน' : 'Points System'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-black text-blue-600">+1</p>
                <p className="font-semibold mt-1">{t('points.correctResult')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === 'th' ? 'ทายผลแพ้ชนะถูกต้อง' : 'Correct win/draw/loss'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-black text-green-600">+3</p>
                <p className="font-semibold mt-1">{t('points.correctScore')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === 'th' ? 'ทายสกอร์แน่นอนถูกต้อง' : 'Exact scoreline correct'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 mb-6">
            <CardContent className="pt-6 text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-4xl font-black text-yellow-600">+50</p>
              <p className="font-semibold mt-1">{t('champion.bonusPoints')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('champion.warning')}</p>
            </CardContent>
          </Card>

          <h3 className="text-xl font-bold text-center mb-4">
            {locale === 'th' ? 'ตัวคูณคะแนนตามรอบ' : 'Stage Multipliers'}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {stageMultipliers.map(({ key, multiplier }) => (
              <Card key={key} className="text-center p-3">
                <p className="text-2xl font-black text-primary">{multiplier}</p>
                <p className="text-xs text-muted-foreground mt-1">{t(`stages.${key}` as any)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
