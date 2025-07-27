/**
 * INTERNATIONALIZATION LAYOUT WRAPPER
 * 
 * PURPOSE: Provides internationalization context for all pages in the application
 * 
 * CONNECTIONS:
 * - Wraps all pages with NextIntlClientProvider for translation support
 * - Loads locale-specific messages from src/messages/[locale].json
 * - Supports dynamic locale routing via [locale] parameter
 * 
 * KEY FEATURES:
 * - Automatic locale detection from URL path
 * - Message loading for current locale (English/Spanish)
 * - Translation context provision for all child components
 * 
 * NAVIGATION FLOW:
 * - Entry point for all localized routes
 * - Enables language switching without page reload
 * - Maintains translation context across page navigation
 */

import { NextIntlClientProvider } from 'next-intl';

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