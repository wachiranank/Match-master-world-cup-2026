import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication
const PROTECTED = ['/dashboard', '/predictions', '/champion', '/profile'];

export async function proxy(request: NextRequest) {
  // Run i18n middleware first to get the locale-prefixed path
  const intlResponse = intlMiddleware(request);

  const pathname = request.nextUrl.pathname;
  // Strip locale prefix to check if protected
  const pathWithoutLocale = pathname.replace(/^\/(th|en)/, '') || '/';

  const isProtected = PROTECTED.some((p) => pathWithoutLocale.startsWith(p));
  if (!isProtected) return intlResponse;

  // Check Supabase session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},  // read-only in middleware
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Detect locale from path
    const locale = pathname.startsWith('/en') ? 'en' : 'th';
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    return NextResponse.redirect(signInUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)', '/'],
};
