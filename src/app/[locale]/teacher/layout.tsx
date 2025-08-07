import { NextIntlClientProvider } from 'next-intl';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface TeacherLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function TeacherLayout({
  children,
  params
}: TeacherLayoutProps) {
  const { locale } = await params;
  
  // Load messages for the current locale
  const messages = await import(`../../../messages/${locale}.json`).then(m => m.default);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ProtectedRoute userType="teacher">
        {children}
      </ProtectedRoute>
    </NextIntlClientProvider>
  );
}
