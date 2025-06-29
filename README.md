# Next.js Project Structure

This is a modern Next.js project using the App Router, TypeScript, and Tailwind CSS.

## Project Structure

```
├── src/
│   ├── app/                 # App Router directory
│   │   ├── layout.tsx      # Root layout component
│   │   ├── page.tsx        # Home page component
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable components
│   ├── lib/               # Utility functions and shared logic
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── .env                   # Environment variables
├── .gitignore            # Git ignore file
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # Project documentation
├── CHANGELOG.md          # Change history and updates
├── TODO.md               # Development roadmap and planned features
└── LESSONS_LEARNED.md    # Lessons learned from development
```

## Key Directories and Files

- `src/app/`: Contains all the routes and pages using the App Router
- `src/components/`: Reusable React components
- `src/lib/`: Utility functions, hooks, and shared logic
- `src/types/`: TypeScript type definitions
- `public/`: Static assets like images, fonts, etc.
- `README.md`: Comprehensive project documentation
- `CHANGELOG.md`: Detailed change history and feature updates
- `TODO.md`: Development roadmap with planned features and improvements
- `LESSONS_LEARNED.md`: Lessons learned from development challenges and solutions

## Internationalization (i18n) Setup

The project uses **next-intl** for internationalization with a custom implementation approach that avoids common middleware conflicts.

### Architecture Overview

The translation system uses a **manual locale extraction approach** rather than relying on next-intl's middleware system, which can cause conflicts with existing routing and authentication middleware.

### File Structure

```
src/
├── i18n/
│   └── request.ts          # i18n configuration and message loading
├── messages/
│   ├── en.json            # English translations
│   └── es.json            # Spanish translations
└── app/
    ├── [locale]/
    │   ├── layout.tsx     # Locale-specific layout with translation provider
    │   ├── page.tsx       # Home page with locale redirect
    │   ├── demo/
    │   │   └── page.tsx   # Demo page with translation example
    │   └── test-translation/
    │       └── page.tsx   # Test page for translation functionality
    └── layout.tsx         # Root layout (redirects to default locale)
```

### Key Components

#### 1. i18n Configuration (`src/i18n/request.ts`)
```typescript
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!['en', 'es'].includes(locale as any)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

#### 2. Locale-Specific Layout (`src/app/[locale]/layout.tsx`)
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
```

#### 3. Translation Files (`src/messages/en.json`, `src/messages/es.json`)
Structured JSON files with nested translation keys:
```json
{
  "common": {
    "welcome": "Welcome",
    "loading": "Loading..."
  },
  "navigation": {
    "home": "Home",
    "demo": "Demo"
  }
}
```

### Configuration Files

#### Next.js Config (`next.config.ts`)
```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // ... other config
};

export default withNextIntl(nextConfig);
```

#### Middleware (`src/middleware.ts`)
```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es'],
  
  // Used when no locale matches
  defaultLocale: 'en'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(es|en)/:path*']
};
```

### Usage in Components

#### Using Translations
```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('loading')}</p>
    </div>
  );
}
```

#### Language Switcher Component
```typescript
'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const switchLanguage = (newLocale: string) => {
    // Replace current locale in URL
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div>
      <button onClick={() => switchLanguage('en')}>English</button>
      <button onClick={() => switchLanguage('es')}>Español</button>
    </div>
  );
}
```

### Common Problems and Solutions

#### 1. "No locale was returned from getRequestConfig"
**Problem**: The i18n configuration doesn't return a locale.
**Solution**: Ensure your `getRequestConfig` function properly handles the locale parameter:
```typescript
export default getRequestConfig(async ({ locale }) => {
  // Always return the locale parameter
  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

#### 2. Locale Undefined in Components
**Problem**: `useLocale()` returns undefined in components.
**Solution**: Ensure components are wrapped in `NextIntlClientProvider` and the locale is properly passed through the layout.

#### 3. Middleware Conflicts
**Problem**: next-intl middleware conflicts with authentication or other middleware.
**Solution**: Use the manual locale extraction approach instead of relying on middleware for locale detection.

#### 4. Redirect Loops
**Problem**: Infinite redirects between `/demo` and `/es/demo`.
**Solution**: 
- Ensure proper matcher configuration in middleware
- Use client-side navigation for language switching
- Avoid server-side redirects in layout components

#### 5. 404 Errors on Routes
**Problem**: Routes return 404 when accessed directly.
**Solution**: 
- Verify middleware matcher includes all necessary paths
- Ensure locale validation in i18n config
- Check that all locale-specific routes exist

#### 6. Translation Keys Not Found
**Problem**: Some translations show as keys instead of translated text.
**Solution**: 
- Verify translation keys exist in JSON files
- Check for typos in translation keys
- Ensure proper nesting structure in JSON files

### Best Practices

#### 1. Translation Key Organization
- Use nested structures for better organization
- Group related translations (e.g., `common`, `navigation`, `forms`)
- Use descriptive, hierarchical keys

#### 2. Fallback Handling
- Always provide fallback translations
- Use the same key structure across all language files
- Test with missing translations

#### 3. Performance Optimization
- Load translations only for the current locale
- Use dynamic imports for message loading
- Consider code splitting for large translation files

#### 4. Testing
- Test all supported locales
- Verify language switching works correctly
- Test direct URL access for all routes
- Check that translations load properly

### Adding New Languages

1. **Add locale to configuration**:
   ```typescript
   // middleware.ts
   locales: ['en', 'es', 'fr']
   
   // i18n/request.ts
   if (!['en', 'es', 'fr'].includes(locale as any)) notFound();
   ```

2. **Create translation file**: `src/messages/fr.json`

3. **Update type definitions** (if using TypeScript):
   ```typescript
   type Locale = 'en' | 'es' | 'fr';
   ```

### Migration from Hardcoded Strings

1. **Identify hardcoded strings** in components
2. **Create translation keys** in JSON files
3. **Replace strings** with `useTranslations()` calls
4. **Test thoroughly** in all supported locales

### Debugging Tips

1. **Check browser console** for translation-related errors
2. **Verify middleware matcher** includes all necessary paths
3. **Test direct URL access** for all locale routes
4. **Check network tab** for translation file loading
5. **Verify locale parameter** is properly passed through layouts

This translation system provides a robust foundation for multilingual support while avoiding common pitfalls with middleware conflicts and routing issues.

## Development Documentation

The project maintains comprehensive documentation to ensure consistency and knowledge sharing:

### README.md
- Complete project overview and architecture
- Installation and setup instructions
- Feature documentation and business rules
- Technical implementation details
- Configuration guides

### CHANGELOG.md
- Detailed change history for all updates
- Feature additions and improvements
- Bug fixes and technical debt resolution
- API changes and database modifications
- Version tracking and release notes

### TODO.md
- Comprehensive development roadmap
- Planned features and enhancements
- Technical improvements and optimizations
- UI/UX improvements and accessibility
- Infrastructure and DevOps tasks
- Priority levels and success metrics

### LESSONS_LEARNED.md
- Solutions to development challenges
- Best practices and architectural decisions
- Error resolution and troubleshooting
- Performance optimization insights
- Security considerations and fixes

## Student Assessment Attempt System

The project features a comprehensive AI-powered student assessment system that evaluates skill competency through conversational interactions:

### Key Features:
- **Interactive Assessment Interface**: Chat-like interface for student-AI conversations
- **Real-time AI Evaluation**: OpenAI-powered skill level determination
- **Multi-Skill Assessment**: Support for assessments with multiple skills
- **Conversation Management**: Complete conversation history tracking
- **Security Measures**: Copy/paste prevention and assessment integrity protection
- **Bilingual Support**: Full Spanish and English support for AI interactions

### Assessment Workflow:
1. **Access Control**: Students can only access assessments assigned to their groups
2. **Attempt Creation**: Automatic attempt creation when student enters assessment page
3. **Case Presentation**: Display of assessment case text with copy protection
4. **Student Response**: Secure textarea for student responses with copy/paste prevention
5. **AI Evaluation**: Real-time AI analysis of student responses
6. **Conversation Flow**: Interactive dialogue until skill level determination
7. **Result Storage**: Automatic saving of conversations and skill level results
8. **Completion**: Assessment marked as completed with final results display

### Technical Implementation:
- **REST API**: Complete API for assessment attempts, conversations, and results
  - `/api/student/assessments/[id]`: Load assessment details with skills and levels
  - `/api/student/assessments/[id]/attempt`: Create or retrieve assessment attempts
  - `/api/student/attempts/[id]/conversation`: Manage conversation messages and AI evaluation
  - `/api/student/attempts/[id]/results`: Load completed assessment results
- **AI Integration**: OpenAI gpt-4o model for skill level evaluation
- **Database Integration**: Full integration with assessment-related tables
- **Security**: Multiple layers of copy/paste prevention (CSS, JavaScript, event handlers)
- **UI Components**: Chat-like interface with message bubbles and real-time updates

### Business Rules:
- **Access Control**: Students can only access assessments from their assigned groups
- **Attempt Limits**: Maximum conversation turns = number of skills × questions per skill
- **Assessment Integrity**: Copy/paste prevention on case text and response textarea
- **Completion Logic**: Assessment completes when AI can determine skill levels with confidence
- **Data Persistence**: All conversations and results are permanently stored

### Database Schema:
- `inteli_assessments_attempts`: Student assessment attempts
- `inteli_assessments_conversations`: Conversation messages between student and AI
- `inteli_assessments_results`: Final skill level results for completed attempts
- Foreign key relationships ensure data integrity and proper tracking

## AI Implementation Approach

### Dynamic Skill Levels AI System

The project features a sophisticated AI system for generating contextual skill level descriptions:

#### Key Features:
- **Dynamic Data Integration**: All AI responses are generated using real data from the database (skill names, descriptions, institution level settings)
- **Contextual Analysis**: The system extracts key action verbs and concepts from skill descriptions to create highly specific behavioral descriptions
- **Mastery Level Detection**: Automatically analyzes institution level settings to determine appropriate mastery levels (beginner, intermediate, advanced, expert)
- **Bilingual Support**: Full support for Spanish and English with contextual keyword extraction in both languages
- **Prompt Engineering**: Uses sophisticated prompts that incorporate all dynamic data for realistic AI integration

#### Architectural Decision - All Levels at Once:
- **Problem**: Previous approach generated each skill level independently, causing overlaps, gaps, and inconsistent terminology
- **Solution**: Generate all skill levels simultaneously in a single AI call with complete progression context
- **Benefits**:
  - Explicit references between levels (e.g., "Building on the previous level...", "Preparing for the next level...")
  - Consistent terminology across all levels
  - No repetitions or overlaps between levels
  - Logical skill development pathway with building-block progression
  - Better educational outcomes with coherent skill progression

#### Technical Implementation:
- **OpenAI Integration**: Uses gpt-4o model for real AI generation
- **Comprehensive Prompts**: Includes critical instructions for progression and consistency
- **Response Validation**: Ensures exact number of generated levels matches input requirements
- **Retry Mechanism**: Automatically retries if incorrect number of levels is generated
- **Structured Output**: Uses "---NIVEL---" separators for reliable parsing
- **Keyword Extraction**: Dynamically identifies action verbs and concepts from skill descriptions
- **Level Analysis**: Analyzes institution level settings to determine mastery requirements
- **Contextual Generation**: Creates responses that incorporate specific skill keywords and mastery levels

#### Database Integration:
- Uses skill data from `inteli_skills` table
- Incorporates institution level settings from `inteli_skills_levels_settings`
- Generates skill-specific level descriptions for `inteli_skills_levels`

### Assessment Management AI System

The project includes a comprehensive AI-powered assessment creation system:

#### Key Features:
- **AI Case Generation**: OpenAI-powered creation of realistic assessment scenarios
- **Contextual Scenarios**: Cases tailored to educational level and cultural context
- **Reflective Questions**: AI generates embedded questions that assess skill development
- **Bilingual Support**: Full Spanish and English case generation
- **Rich Formatting**: Support for bold, italics, and emojis in case text

#### Assessment Creation Workflow:
- **Multi-step Process**: 5-step wizard for comprehensive assessment creation
- **Cascading Selection**: Institution → Domain → Skill selection with real-time filtering
- **AI Integration**: One-click case generation with regeneration capability
- **Preview System**: Complete assessment preview before activation
- **Draft Support**: Save as draft or activate immediately

#### Business Rules:
- **Access Control**: Teachers see only their institution's assessments, admins see all
- **Protection Rules**: Assessments with attempts cannot be edited or deleted
- **Date Validation**: Comprehensive date range and availability validation
- **Data Integrity**: Transaction-based operations with rollback capability

#### Technical Implementation:
- **REST API**: Complete CRUD operations with filtering and pagination
- **Database Integration**: Full integration with `inteli_assessments` and `inteli_assessments_skills`
- **Form Validation**: Real-time validation with comprehensive error handling
- **UI Components**: Reusable components for management, creation, and editing
- **Navigation**: Breadcrumb navigation and consistent user experience

### Assessment-Group Association System

The project implements a flexible assessment-group association system for controlled access management:

#### Key Features:
- **Multi-Group Support**: One assessment can be associated with multiple groups from the same institution
- **Institution Isolation**: Groups can only be associated with assessments from the same institution
- **Additive Operations**: Group associations are additive - adding new groups doesn't remove existing ones
- **Permission-Based Access**: Only admins and responsible teachers can manage group associations
- **Real-time Updates**: Group associations are immediately reflected in the assessment list

#### Business Rules:
- **Institution Matching**: Groups must belong to the same institution as the assessment
- **Permission Control**: Only admins and the teacher responsible for the assessment can modify associations
- **No Limits**: No restrictions on the number of groups that can be associated with an assessment
- **Additive Behavior**: Adding groups is additive - existing associations are preserved unless explicitly removed

#### UI Implementation:
- **Modal Interface**: Clean modal dialog for managing group associations
- **Checkbox Selection**: Intuitive checkbox interface for selecting/deselecting groups
- **Visual Feedback**: Clear display of currently associated groups in the assessment list
- **Compact Display**: Associated groups shown in small font, one per line in the table
- **Manage Button**: Direct access to group management for authorized users

#### Technical Implementation:
- **REST API**: Complete CRUD operations for assessment-group associations (`/api/admin/assessments/[id]/groups`)
- **Database Integration**: Uses `inteli_assessments_groups` junction table
- **Permission Validation**: Server-side validation of user permissions
- **Real-time Updates**: Automatic refresh of assessment list after group changes
- **Error Handling**: Comprehensive error handling with user-friendly messages

#### Database Schema:
- `inteli_assessments_groups`: Junction table linking assessments to groups
- `inteli_groups`: Groups table with institution relationship
- Foreign key constraints ensure data integrity and institution isolation

### Teacher Skills Management System

The project implements a comprehensive skills and skill levels management system for teachers:

#### Key Features:
- **Institution-Scoped Management**: Teachers can only manage skills from their own institution
- **Assessment Protection**: Skills used in assessments cannot be edited or deleted
- **Template-Based Levels**: Skill levels follow institution-defined templates
- **Real-time Validation**: Comprehensive validation with immediate feedback
- **Assessment Count Display**: Visual indicators showing skills used in assessments

#### Skills Management:
- **CRUD Operations**: Complete create, read, update, delete functionality
- **Domain Filtering**: Skills organized by educational domains
- **Search Capabilities**: Search across skill names, descriptions, and domains
- **Sorting Options**: Sort by name, description, domain, or assessment count
- **Pagination**: Efficient handling of large skill sets

#### Skill Levels Management:
- **Template Integration**: Levels automatically follow institution's level settings
- **Individual Descriptions**: Each skill can have customized level descriptions
- **Validation System**: Ensures all levels are properly described
- **Save/Update Workflow**: Comprehensive save functionality with error handling

#### Business Rules:
- **Institution Isolation**: Teachers can only access skills from their institution
- **Assessment Protection**: Skills used in assessments (inteli_assessments_skills) cannot be modified
- **Level Protection**: Skills with associated skill levels cannot be deleted
- **Domain Validation**: Skills must be created in valid domains from teacher's institution
- **Duplicate Prevention**: No duplicate skill names within the same domain

#### UI Implementation:
- **Skills Table**: Sortable columns with assessment count indicators
- **Add/Edit Dialog**: Comprehensive form with domain selection
- **Delete Confirmation**: Clear warnings about assessment usage
- **Levels Management**: Template-based level configuration interface
- **Breadcrumb Navigation**: Consistent navigation throughout the system

#### Technical Implementation:
- **REST API**: Complete API for skills and skill levels management
  - `/api/teacher/skills`: Main skills CRUD operations
  - `/api/teacher/skills/[id]`: Individual skill operations
  - `/api/teacher/skills/[id]/levels`: Skill levels management
- **Database Integration**: Full integration with inteli_skills, inteli_skills_levels, and inteli_assessments_skills tables
- **Permission Validation**: Server-side validation of teacher permissions and institution access
- **Real-time Updates**: Automatic refresh of data after operations
- **Error Handling**: Comprehensive error handling with user-friendly messages

#### Database Schema:
- `inteli_skills`: Main skills table with institution and domain relationships
- `inteli_skills_levels`: Skill-specific level descriptions
- `inteli_assessments_skills`: Junction table for assessment-skill associations
- `inteli_skills_levels_settings`: Institution-level templates for skill levels
- Foreign key constraints ensure data integrity and proper relationships

## Email Configuration

The application uses Resend for sending email notifications. To configure email functionality:

### 1. Resend Setup
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add your domain or use the sandbox domain for testing

### 2. Environment Variables
Add the following to your `.env` file:

```env
# Email Configuration
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3. Domain Configuration (Optional)
For production, add your domain to Resend:
- Go to Resend Dashboard → Domains
- Add `web.inteliexamen.com`
- Follow DNS configuration instructions
- The from address is already set to `disputes@web.inteliexamen.com` in `src/lib/email.ts`
- You can change the from address to any verified address like `noreply@web.inteliexamen.com` or `support@web.inteliexamen.com`

### 4. Teacher Email Setup
- The system automatically uses the teacher's email from the database as the reply-to address
- No additional setup required - replies go directly to the teacher who reviewed the dispute

## Installation and Setup

1. Install dependencies:
   ```