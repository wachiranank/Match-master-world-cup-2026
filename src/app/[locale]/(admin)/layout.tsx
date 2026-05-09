import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const locale = await getLocale();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? '')) redirect(`/${locale}/dashboard`);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">⚽ Admin</span>
          <nav className="flex gap-4 text-sm">
            <Link href={`/${locale}/admin`} className="hover:text-primary transition-colors">Dashboard</Link>
            <Link href={`/${locale}/admin/matches`} className="hover:text-primary transition-colors">Matches</Link>
            <Link href={`/${locale}/admin/matches/new`} className="hover:text-primary transition-colors">+ Add Match</Link>
          </nav>
        </div>
        <Link href={`/${locale}/dashboard`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
          ← Back to App
        </Link>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
