import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  console.log('Layout - extracted locale from params:', locale);
  
  // Manually load messages for the extracted locale
  const messages = await import(`../../messages/${locale}.json`).then(m => m.default);
  
  console.log('Layout - loaded messages for locale:', locale);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
} 