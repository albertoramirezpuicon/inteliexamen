/**
 * ADMIN LAYOUT WRAPPER
 * 
 * PURPOSE: Admin-specific layout with internationalization support
 * 
 * CONNECTIONS:
 * - Wraps all admin pages with NextIntlClientProvider for translation support
 * - Loads locale-specific messages for admin interface
 * - Provides consistent admin layout across all admin pages
 * 
 * KEY FEATURES:
 * - Admin-specific translation context
 * - Consistent layout structure for admin section
 * - Locale-aware message loading
 * 
 * NAVIGATION FLOW:
 * - Entry point for all admin pages
 * - Maintains translation context across admin navigation
 * - Supports admin-specific internationalization
 */

import { NextIntlClientProvider } from 'next-intl';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({
  children,
  params
}: AdminLayoutProps) {
  const { locale } = await params;
  
  // Load messages for the current locale
  const messages = await import(`../../../messages/${locale}.json`).then(m => m.default);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ProtectedRoute userType="admin">
        {children}
      </ProtectedRoute>
    </NextIntlClientProvider>
  );
} 