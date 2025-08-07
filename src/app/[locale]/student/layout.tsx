import { NextIntlClientProvider } from 'next-intl';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface StudentLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function StudentLayout({
  children,
  params
}: StudentLayoutProps) {
  const { locale } = await params;
  
  // Load messages for the current locale
  const messages = await import(`../../../messages/${locale}.json`).then(m => m.default);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ProtectedRoute userType="student">
        {children}
      </ProtectedRoute>
    </NextIntlClientProvider>
  );
}
