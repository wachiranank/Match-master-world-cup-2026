import { getLocale } from 'next-intl/server';
import { AuthForm } from '@/components/auth/AuthForm';

export default async function SignInPage() {
  const locale = await getLocale();
  return <AuthForm mode="sign-in" locale={locale} />;
}
