import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/teacher',
  '/admin', 
  '/student'
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/teacher/login',
  '/admin/login',
  '/student/login',
  '/privacy',
  '/reset-password',
  '/forgot-password'
];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route));
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Handle internationalization first
  const intlMiddleware = createMiddleware({
    locales: ['en', 'es'],
    defaultLocale: 'en',
    localePrefix: 'always'
  });
  
  const intlResponse = intlMiddleware(request);
  
  // If it's a public route, allow access
  if (isPublicRoute(pathname)) {
    return intlResponse;
  }
  
  // If it's a protected route, check for authentication
  if (isProtectedRoute(pathname)) {
    // Check for authentication token or session
    // For now, we'll redirect to login if accessing protected routes directly
    // In a production environment, you should implement proper session validation
    
    // Check if user is trying to access teacher area
    if (pathname.startsWith('/teacher') && !pathname.includes('/login')) {
      // Redirect to teacher login if accessing teacher area without authentication
      const loginUrl = new URL('/teacher/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if user is trying to access admin area
    if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
      // Redirect to admin login if accessing admin area without authentication
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if user is trying to access student area
    if (pathname.startsWith('/student') && !pathname.includes('/login')) {
      // Redirect to student login if accessing student area without authentication
      const loginUrl = new URL('/student/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|static|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)']
}; 