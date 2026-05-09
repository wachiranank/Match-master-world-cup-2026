import { getLocale } from 'next-intl/server';
import { AuthForm } from '@/components/auth/AuthForm';

export default async function SignUpPage() {
  const locale = await getLocale();
  return <AuthForm mode="sign-up" locale={locale} />;
}
