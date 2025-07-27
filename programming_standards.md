# Inteliexamen Platform - Programming Standards

This document outlines the programming standards, conventions, and patterns used throughout the Inteliexamen platform. These standards ensure consistency, maintainability, and scalability across the entire codebase.

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Internationalization (i18n)](#internationalization-i18n)
3. [Visual Design Standards](#visual-design-standards)
4. [Component Patterns](#component-patterns)
5. [API Design Patterns](#api-design-patterns)
6. [Database Patterns](#database-patterns)
7. [Authentication & Authorization](#authentication--authorization)
8. [AI Integration Patterns](#ai-integration-patterns)
9. [Error Handling](#error-handling)
10. [State Management](#state-management)
11. [TypeScript Standards](#typescript-standards)
12. [File Organization](#file-organization)
13. [Naming Conventions](#naming-conventions)
14. [Code Documentation](#code-documentation)

## Project Architecture

### Next.js App Router Structure
The project uses Next.js 14 with the App Router pattern and dynamic locale routing.

```typescript
// Root layout with internationalization
src/app/layout.tsx
src/app/page.tsx (redirects to /en)

// Locale-based routing
src/app/[locale]/
├── layout.tsx (NextIntlClientProvider wrapper)
├── page.tsx (landing page)
├── reset-password/page.tsx
├── admin/
├── teacher/
└── student/
```

### Example: Root Layout
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inteliexamen - Educational Assessment Platform",
  description: "AI-powered educational assessment platform for students, teachers, and administrators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

## Internationalization (i18n)

### Next-intl Integration
The platform uses `next-intl` for internationalization with dynamic locale routing.

### Middleware Configuration
```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|static|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)']
};
```

### Locale Layout Pattern
```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await import(`../../messages/${locale}.json`).then(m => m.default);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
```

### Translation Usage in Components
```typescript
import { useTranslations, useLocale } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  return (
    <div>
      <h1>{t('dashboard')}</h1>
      <p>{tCommon('welcome')}, {userName}</p>
    </div>
  );
}
```

### Translation Programming Practices

The platform follows specific programming practices for handling translations to ensure consistency, maintainability, and proper organization.

#### 1. Namespace Organization Pattern

Use hierarchical namespace structure organized by feature/role:

```typescript
// Main namespaces
const t = useTranslations('teacher');        // Teacher-specific translations
const tCommon = useTranslations('common');   // Common UI elements
const tSkills = useTranslations('teacher.skills'); // Nested feature translations
```

#### 2. Nested Key Structure

Translations follow a nested structure that mirrors the application's organization:

```json
{
  "teacher": {
    "dashboard": "Panel de control",
    "users": {
      "title": "Estudiantes",
      "description": "Gestiona estudiantes...",
      "whatIsStudent": "¿Qué es un Estudiante?"
    },
    "skills": {
      "title": "Habilidades", 
      "manageSources": "Gestionar Fuentes",
      "sourceType": "Tipo de Fuente"
    }
  },
  "common": {
    "cancel": "Cancelar",
    "save": "Guardar",
    "loading": "Cargando..."
  }
}
```

#### 3. Feature-Based Translation Access

Each page/component accesses translations based on its functionality:

```typescript
// Teacher users page
const t = useTranslations('teacher');
t('users.title')           // Access nested keys
t('users.description')
t('users.whatIsStudent')

// Sources modal (sources are part of skills)
const tSkills = useTranslations('teacher.skills');
tSkills('manageSources')   // Direct access to skills namespace
tSkills('sourceType')
```

#### 4. Common UI Elements Pattern

Generic UI elements use the `common` namespace to avoid duplication:

```typescript
const tCommon = useTranslations('common');

// Common actions
tCommon('cancel')
tCommon('save') 
tCommon('loading')
tCommon('saving')
```

#### 5. Consistent Key Naming Convention

Keys follow a consistent naming pattern:
- **Page titles**: `title`
- **Descriptions**: `description` 
- **Info boxes**: `whatIs[Feature]`, `[feature]Explanation`
- **Actions**: `add[Feature]`, `edit[Feature]`, `manage[Feature]`
- **Status**: `loading[Feature]`, `no[Feature]Found`

#### 6. Contextual Information Pattern

Info boxes and help text use descriptive keys:

```typescript
t('users.whatIsStudent')           // "¿Qué es un Estudiante?"
t('users.studentExplanation')      // Detailed explanation
t('users.hideInfo')               // "Ocultar Info"
t('users.showInfo')               // "Mostrar Info"
```

#### 7. Dynamic Content with Parameters

Translations support parameter interpolation:

```typescript
t('users.studentsCount', { count: filteredStudents.length })
t('groups.deleteConfirmation', { name: groupName })
t('domains.deleteWarning', { count: skillsCount })
```

#### 8. Error Handling Pattern

Error messages and loading states are consistently handled:

```typescript
// Loading states
{loading ? t('users.loadingStudents') : null}

// Error states  
{error && <Alert severity="error">{error}</Alert>}

// Empty states
{students.length === 0 && t('users.noStudentsFound')}
```

#### 9. Breadcrumb and Navigation Pattern

Navigation elements use consistent translation keys:

```typescript
t('dashboard')           // For breadcrumb navigation
t('users.title')         // For page titles
t('navigation.logout')   // For menu items
```

#### 10. Form and Input Pattern

Form elements use descriptive labels:

```typescript
t('skills.skillName')        // "Nombre de la Habilidad"
t('skills.description')      // "Descripción"
t('skills.selectDomain')     // "Seleccionar Dominio"
```

#### Key Principles:

1. **Separation of Concerns**: Common UI elements vs. feature-specific content
2. **Hierarchical Organization**: Namespaces mirror application structure
3. **Consistency**: Same patterns across all pages/components
4. **Maintainability**: Clear, descriptive key names
5. **Reusability**: Common translations shared across components
6. **Context Awareness**: Keys provide context about their usage

#### Example Implementation:

```typescript
'use client';

import { useTranslations, useLocale } from 'next-intl';

export default function TeacherUsersPage() {
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="teacher" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('users.title')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('users.description')}
        </Typography>

        {/* Info Box */}
        <Box sx={{ backgroundColor: '#fff3cd', p: 2, mb: 3 }}>
          <Typography variant="h6">
            {t('users.whatIsStudent')}
          </Typography>
          <Typography variant="body2">
            {t('users.studentExplanation')}
          </Typography>
        </Box>

        {/* Actions */}
        <Button variant="contained" onClick={handleAction}>
          {loading ? tCommon('loading') : t('users.addStudent')}
        </Button>

        <Button onClick={onCancel}>
          {tCommon('cancel')}
        </Button>
      </Box>
    </Box>
  );
}
```

### Translation File Structure
```json
{
  "common": {
    "welcome": "Welcome",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "admin": {
    "dashboard": "Admin Dashboard",
    "userManagement": "User Management"
  },
  "teacher": {
    "dashboard": "Teacher Dashboard"
  },
  "student": {
    "dashboard": "Student Dashboard"
  }
}
```

### Language Switching
```typescript
const handleLanguageChange = async (newLocale: 'en' | 'es') => {
  // Update database
  await fetch('/api/auth/update-language', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, language: newLocale }),
  });

  // Update localStorage
  localStorage.setItem('userLanguage', newLocale);
  
  // Navigate to new locale
  const currentPath = window.location.pathname;
  const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
  router.push(newPath);
};
```

## Visual Design Standards

### CSS Design System
The platform uses a comprehensive CSS design system with CSS custom properties.

```css
/* src/styles/design-system.css */
:root {
  /* Colors */
  --color-primary: #0070f3;
  --color-primary-dark: #0051a2;
  --color-secondary: #7928ca;
  --color-success: #0070f3;
  --color-warning: #f5a623;
  --color-error: #ff0000;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  
  /* Border Radius */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 500ms;
}
```

### Material-UI Integration
The platform uses Material-UI v7 with custom theming and consistent component usage.

```typescript
// Component styling pattern
<Box sx={{ 
  minHeight: '100vh', 
  backgroundColor: 'var(--background)',
  p: 3 
}}>
  <Typography variant="h4" gutterBottom>
    {t('dashboard')}
  </Typography>
  
  <Button
    variant="contained"
    color="primary"
    fullWidth
    disabled={isLoading}
  >
    {isLoading ? t('loading') : t('submit')}
  </Button>
</Box>
```

### Page Layout Pattern
```typescript
export default function StandardPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar userType="admin" userName={getUserDisplayName()} />
      
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component="button" onClick={() => navigateTo('/admin/dashboard')}>
            {t('dashboard')}
          </Link>
          <Typography color="text.primary">{t('currentPage')}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          {t('pageTitle')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('pageDescription')}
        </Typography>
        
        {/* Page content */}
      </Box>
    </Box>
  );
}
```

## Component Patterns

### Client Component Declaration
All interactive components use the `'use client'` directive.

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export default function MyComponent() {
  // Component logic
}
```

### Component Props Interface
```typescript
interface ComponentProps {
  userType: 'admin' | 'teacher' | 'student';
  userName?: string;
  onAction?: (data: any) => void;
}

export default function MyComponent({ userType, userName, onAction }: ComponentProps) {
  // Component implementation
}
```

### Dynamic Import Pattern
```typescript
// src/components/auth/LoginFormWrapper.tsx
import dynamic from 'next/dynamic';

const LoginForm = dynamic(() => import('./LoginForm'), {
  ssr: false,
});

interface LoginFormWrapperProps {
  userType: 'admin' | 'student' | 'teacher';
}

export default function LoginFormWrapper({ userType }: LoginFormWrapperProps) {
  return <LoginForm userType={userType} />;
}
```

### Form Handling Pattern
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || t('errorMessage'));
      return;
    }

    // Handle success
    onSuccess(data);
  } catch (err) {
    console.error('Error:', err);
    setError(t('errorMessage'));
  } finally {
    setIsLoading(false);
  }
};
```

## API Design Patterns

### Route Handler Structure
```typescript
// src/app/api/endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Database query
    const result = await query('SELECT * FROM table WHERE id = ?', [id]);

    // Response
    return NextResponse.json({
      data: result,
      success: true
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Required field is missing' },
        { status: 400 }
      );
    }

    // Database operation
    const result = await insertQuery(
      'INSERT INTO table (field) VALUES (?)',
      [body.requiredField]
    );

    return NextResponse.json({
      id: result.insertId,
      success: true
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Health Check Pattern
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

export async function GET() {
  try {
    const dbConnected = await checkDatabaseConnection();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
```

## Database Patterns

### Connection Pool Configuration
```typescript
// src/lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inteli_exam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});
```

### Query Functions with Retry Logic
```typescript
// Retry function for database operations
async function retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: DatabaseError | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error as DatabaseError;
      
      // Check if it's a connection error that we should retry
      if (lastError.code === 'ECONNRESET' || 
          lastError.code === 'PROTOCOL_CONNECTION_LOST' || 
          lastError.code === 'ER_CON_COUNT_ERROR' ||
          lastError.code === 'ETIMEDOUT') {
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error('Operation failed after all retries');
}

// Export query functions
export async function query<T = any>(sql: string, params: (string | number | boolean | null)[] = []): Promise<QueryResult<T>> {
  return retryOperation(async () => {
    const [rows] = await pool.execute(sql, params);
    return rows as QueryResult<T>;
  });
}

export async function insertQuery(sql: string, params: (string | number | boolean | null)[] = []): Promise<InsertResult> {
  return retryOperation(async () => {
    const [result] = await pool.execute(sql, params);
    return result as InsertResult;
  });
}
```

### Database Usage Pattern
```typescript
// Example usage in API route
const users = await query(
  'SELECT * FROM inteli_users WHERE email = ?',
  [email.toLowerCase().trim()]
);

const result = await insertQuery(
  'INSERT INTO inteli_assessments_conversations (attempt_id, message_type, message_text, created_at) VALUES (?, ?, ?, NOW())',
  [attemptId, 'student', message]
);
```

## Authentication & Authorization

### User Role System
```typescript
// src/lib/auth.ts
export type UserRole = 'admin' | 'student' | 'teacher' | 'clerk';

export interface User {
  id: number;
  institution_id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: UserRole;
  language_preference: string;
}

export function hasAccessToArea(userRole: UserRole, targetArea: 'admin' | 'student' | 'teacher'): boolean {
  // Clerk can access both admin and teacher areas
  if (userRole === 'clerk') {
    return targetArea === 'admin' || targetArea === 'teacher';
  }

  // Other roles can only access their own area
  return userRole === targetArea;
}
```

### Authentication Flow
```typescript
// Login pattern
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || t('loginError'));
      return;
    }

    const user = data.user;

    // Role validation
    if (!hasAccessToArea(user.role as UserRole, userType)) {
      setError(t('accessDenied'));
      return;
    }

    // Store user data
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id.toString());
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userName', `${user.given_name} ${user.family_name}`);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userLanguage', user.language_preference || 'en');

    // Redirect to appropriate dashboard
    const userLanguage = user.language_preference || 'en';
    router.replace(`/${userLanguage}/${user.role}/dashboard`);

  } catch (err) {
    console.error('Login error:', err);
    setError(t('loginError'));
  } finally {
    setIsLoading(false);
  }
};
```

### Session Management
```typescript
// Logout pattern
const handleLogout = () => {
  // Clear all authentication data
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userLanguage');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  
  // Clear cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Redirect to main page
  router.push('/');
};
```

## AI Integration Patterns

### OpenAI API Integration
```typescript
// src/app/api/ai/generate-case/route.ts
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

export async function POST(request: NextRequest) {
  try {
    const { assessmentDescription, difficultyLevel, educationalLevel, outputLanguage, evaluationContext, selectedSkills } = await request.json();

    // Validation
    if (!assessmentDescription || !difficultyLevel || !educationalLevel || !outputLanguage || 
        !evaluationContext || !selectedSkills || selectedSkills.length === 0) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const caseText = await generateCase({
      assessmentDescription,
      difficultyLevel,
      educationalLevel,
      outputLanguage,
      evaluationContext,
      selectedSkills
    });

    return NextResponse.json({ caseText });
  } catch (error) {
    console.error('Error generating case:', error);
    return NextResponse.json(
      { error: 'Failed to generate case' },
      { status: 500 }
    );
  }
}
```

### AI Evaluation Pattern
```typescript
// Three-tier evaluation system
async function evaluateWithAI(params: {
  studentReply: string;
  assessment: { case_text: string; questions_per_skill: number; output_language: string };
  skills: Array<{ skill_id: number; skill_name: string; skill_description: string; levels: Array<{ id: number; label: string; description: string }> }>;
  conversationHistory: Array<{ message_type: string; message_text: string }>;
}) {
  const prompt = createEvaluationPrompt({
    studentReply: params.studentReply,
    assessment: params.assessment,
    skills: params.skills,
    conversationHistory: params.conversationHistory,
    turnCount: Math.ceil(params.conversationHistory.length / 2),
    maxTurns: params.skills.length * params.assessment.questions_per_skill,
    outputLanguage: params.assessment.output_language
  });

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { 
          role: 'system', 
          content: params.assessment.output_language === 'es' 
            ? 'Eres un evaluador educativo experto...'
            : 'You are an expert educational evaluator...'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  return parseAIResponse(data.choices?.[0]?.message?.content || '');
}
```

### AI Response Parsing
```typescript
function parseAIResponse(response: string): {
  evaluationType: 'incomplete' | 'improvable' | 'final';
  message: string;
  canDetermineLevel: boolean;
  skillEvaluations?: Array<{ skillId: number; levelId: number; feedback: string }>;
  missingAspects?: string[];
  improvementSuggestions?: string[];
} {
  // Parse AI response and extract evaluation data
  // Implementation details...
}
```

## Error Handling

### API Error Handling Pattern
```typescript
try {
  // Operation
  const result = await someOperation();
  return NextResponse.json({ data: result, success: true });
} catch (error) {
  console.error('Operation error:', error);
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  );
}
```

### Frontend Error Handling
```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleOperation = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await fetch('/api/endpoint');
    const data = await response.json();
    
    if (!response.ok) {
      setError(data.error || t('errorMessage'));
      return;
    }
    
    // Handle success
  } catch (err) {
    console.error('Error:', err);
    setError(t('errorMessage'));
  } finally {
    setLoading(false);
  }
};
```

### Error Display Pattern
```typescript
{error && (
  <Alert severity="error" sx={{ mb: 3 }}>
    {error}
  </Alert>
)}

{loading && (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
    <CircularProgress />
  </Box>
)}
```

## State Management

### Local State Pattern
```typescript
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [filters, setFilters] = useState({ search: '', status: '' });
const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 20 });
```

### Data Fetching Pattern
```typescript
const loadData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams({
      page: (pagination.page + 1).toString(),
      limit: pagination.rowsPerPage.toString(),
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
    });

    const response = await fetch(`/api/endpoint?${params}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load data');
    }
    
    setData(data.items);
    setTotal(data.pagination.total);
  } catch (err) {
    console.error('Error loading data:', err);
    setError(err instanceof Error ? err.message : 'Failed to load data');
  } finally {
    setLoading(false);
  }
}, [pagination.page, pagination.rowsPerPage, filters.search, filters.status]);

useEffect(() => {
  loadData();
}, [loadData]);
```

### Form State Pattern
```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  role: '',
  institution_id: null as number | null
});

const [formErrors, setFormErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

const handleInputChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear error when user starts typing
  if (formErrors[field]) {
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  }
};
```

## TypeScript Standards

### Type Definitions
```typescript
// Interface naming: PascalCase with descriptive names
interface User {
  id: number;
  email: string;
  given_name: string;
  family_name: string;
  role: UserRole;
  institution_id: number | null;
}

// Type aliases for complex types
type QueryResult<T = any> = T[];
type InsertResult = mysql.ResultSetHeader;
type UserRole = 'admin' | 'student' | 'teacher' | 'clerk';

// Component props interface
interface ComponentProps {
  userType: UserRole;
  userName?: string;
  onAction?: (data: any) => void;
}
```

### Function Type Annotations
```typescript
// Explicit return types for complex functions
async function loadData(): Promise<void> {
  // Implementation
}

// Generic functions
function query<T = any>(sql: string, params: (string | number | boolean | null)[] = []): Promise<QueryResult<T>> {
  // Implementation
}

// Event handlers
const handleSubmit = (e: React.FormEvent): void => {
  e.preventDefault();
  // Implementation
};
```

### API Response Types
```typescript
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## File Organization

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── admin/         # Admin pages
│   │   ├── teacher/       # Teacher pages
│   │   ├── student/       # Student pages
│   │   └── layout.tsx     # Locale layout
│   ├── api/               # API routes
│   │   ├── admin/         # Admin APIs
│   │   ├── teacher/       # Teacher APIs
│   │   ├── student/       # Student APIs
│   │   ├── auth/          # Authentication APIs
│   │   └── ai/            # AI integration APIs
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Root page
├── components/            # Reusable components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── teacher/          # Teacher-specific components
│   └── ui/               # Generic UI components
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Database utilities
│   └── email.ts          # Email utilities
├── messages/             # Translation files
│   ├── en.json           # English translations
│   └── es.json           # Spanish translations
├── styles/               # Style files
│   └── design-system.css # Design system
└── middleware.ts         # Next.js middleware
```

### Component File Organization
```typescript
// 1. Imports (external libraries first, then internal)
import { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

// 2. Type definitions
interface ComponentProps {
  // Props definition
}

// 3. Component implementation
export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 3.1 Hooks
  const t = useTranslations('namespace');
  const [state, setState] = useState();
  
  // 3.2 Event handlers
  const handleAction = () => {
    // Handler implementation
  };
  
  // 3.3 Effects
  useEffect(() => {
    // Effect implementation
  }, []);
  
  // 3.4 Render
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
}
```

## Naming Conventions

### Files and Directories
- **Pages**: `page.tsx` (Next.js App Router convention)
- **Layouts**: `layout.tsx`
- **API Routes**: `route.ts`
- **Components**: PascalCase (e.g., `UserManagement.tsx`)
- **Utilities**: camelCase (e.g., `auth.ts`, `db.ts`)
- **Directories**: kebab-case (e.g., `user-management/`)

### Variables and Functions
```typescript
// Variables: camelCase
const userName = 'John Doe';
const isAuthenticated = true;
const userData = { id: 1, name: 'John' };

// Functions: camelCase
const handleSubmit = () => {};
const loadUserData = async () => {};
const validateForm = () => {};

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
```

### Database and API
```typescript
// Database tables: snake_case with prefix
inteli_users
inteli_assessments
inteli_assessments_attempts

// API endpoints: kebab-case
/api/auth/login
/api/admin/user-management
/api/teacher/assessment-results

// Database columns: snake_case
user_id
created_at
updated_at
```

## Code Documentation

### JSDoc Comments for Pages
```typescript
/**
 * PAGE TITLE - BRIEF DESCRIPTION
 * 
 * PURPOSE: Detailed description of what the page does
 * 
 * CONNECTIONS:
 * - Links to other pages and their purposes
 * - API endpoints used
 * - Components integrated
 * 
 * KEY FEATURES:
 * - List of main functionality
 * - Important capabilities
 * - User interactions
 * 
 * NAVIGATION FLOW:
 * - How users reach this page
 * - Where they can go from here
 * - Breadcrumb navigation
 * 
 * SCOPE:
 * - Role-specific functionality
 * - Data access patterns
 * - System boundaries
 */

export default function PageComponent() {
  // Implementation
}
```

### Function Documentation
```typescript
/**
 * Evaluates student responses using AI with three-tier evaluation system
 * 
 * @param params - Evaluation parameters
 * @param params.studentReply - Student's response text
 * @param params.assessment - Assessment configuration
 * @param params.skills - Skills to evaluate
 * @param params.conversationHistory - Previous conversation messages
 * @returns Promise with evaluation results
 */
async function evaluateWithAI(params: {
  studentReply: string;
  assessment: AssessmentConfig;
  skills: Skill[];
  conversationHistory: ConversationMessage[];
}): Promise<EvaluationResult> {
  // Implementation
}
```

### Component Documentation
```typescript
/**
 * User management component for administrators
 * 
 * @param userType - Type of user accessing the component
 * @param onUserUpdate - Callback when user data is updated
 * @param showAdvanced - Whether to show advanced features
 */
interface UserManagementProps {
  userType: 'admin' | 'teacher';
  onUserUpdate?: (user: User) => void;
  showAdvanced?: boolean;
}

export default function UserManagement({ userType, onUserUpdate, showAdvanced = false }: UserManagementProps) {
  // Implementation
}
```

### Inline Comments
```typescript
// Use inline comments sparingly, only when the code is not self-explanatory
const maxTurns = assessmentResult.length * assessmentResult[0].questions_per_skill; // Calculate max turns based on skills and questions per skill

// Force final evaluation if it's the last turn and AI didn't evaluate as final
if (isLastTurn && aiResponse.evaluationType !== 'final') {
  console.log('Last turn reached, forcing final evaluation');
  aiResponse.evaluationType = 'final';
  aiResponse.canDetermineLevel = true;
}
```

## Summary

These programming standards ensure:

1. **Consistency**: All code follows the same patterns and conventions
2. **Maintainability**: Clear structure and documentation make code easy to understand and modify
3. **Scalability**: Patterns support growth and new features
4. **Internationalization**: Full support for multiple languages
5. **Type Safety**: Comprehensive TypeScript usage
6. **Error Handling**: Robust error handling throughout the application
7. **AI Integration**: Structured patterns for AI-powered features
8. **User Experience**: Consistent UI/UX patterns across all pages

Following these standards ensures that the Inteliexamen platform remains maintainable, scalable, and provides a consistent experience for all users.
