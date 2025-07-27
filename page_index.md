# Inteliexamen Platform - Page Index

This document provides a comprehensive overview of all pages in the `src/app/[locale]` folder, their purposes, and their relationships to other pages in the application.

## Application Overview

**Inteliexamen Platform** is an AI-powered educational assessment platform with three main user roles:

- **Admin**: System-wide management of institutions, users, groups, domains, skills, assessments, and analytics
- **Teacher**: Institution-specific management of students, groups, domains, skills, assessments, attempts, and disputes
- **Student**: Assessment participation including viewing available assessments, taking assessments, viewing results, and disputing results

## Page Structure and Relationships

### Root Level Pages

#### `layout.tsx`
- **Purpose**: Internationalization layout wrapper for all pages
- **Connections**: Wraps all pages with NextIntlClientProvider for translation support
- **Key Features**: Loads locale-specific messages and provides translation context

#### `page.tsx` (Landing Page)
- **Purpose**: Main landing page with role-based login options
- **Connections**: 
  - Links to `/admin/login`, `/teacher/login`, `/student/login`
  - Language switcher for internationalization
- **Key Features**: 
  - Platform introduction and features showcase
  - Role-based login buttons (Admin, Teacher, Student)
  - Language selection (English/Spanish)

#### `reset-password/page.tsx`
- **Purpose**: Password reset functionality for all user types
- **Connections**: 
  - Accessed via email reset links
  - Redirects to main landing page after successful reset
- **Key Features**: 
  - Token-based password reset
  - Form validation and error handling
  - Success feedback and automatic redirect

### Admin Section (`/admin/`)

#### `admin/layout.tsx`
- **Purpose**: Admin-specific layout with internationalization
- **Connections**: Wraps all admin pages with translation support

#### `admin/login/page.tsx`
- **Purpose**: Admin authentication page
- **Connections**: 
  - Redirects to `/admin/dashboard` on successful login
  - Uses shared LoginFormWrapper component
- **Key Features**: Admin-specific login form

#### `admin/dashboard/page.tsx`
- **Purpose**: Admin main dashboard with system management functions
- **Connections**: 
  - **Global Functions**: Links to `/admin/institutions`, `/admin/users`, `/admin/groups`
  - **Academic Functions**: Links to `/admin/domains`, `/admin/skills`
  - **Assessment Functions**: Links to `/admin/assessments`, `/admin/attempts`
  - **System Functions**: Links to `/admin/analytics`, `/admin/settings`
- **Key Features**: 
  - User information display
  - Categorized function cards for system management
  - Navigation to all admin functions

#### `admin/analytics/page.tsx`
- **Purpose**: System-wide analytics and reporting
- **Connections**: Accessible from `/admin/dashboard`
- **Key Features**: Platform-wide statistics and insights

#### `admin/assessments/page.tsx`
- **Purpose**: System-wide assessment management
- **Connections**: 
  - Links to `/admin/assessments/create` for new assessments
  - Links to `/admin/assessments/[id]` for viewing specific assessments
  - Accessible from `/admin/dashboard`
- **Key Features**: 
  - Assessment listing and management
  - Create, view, edit, and delete assessments
  - Assessment group assignment

#### `admin/assessments/create/page.tsx`
- **Purpose**: Create new assessments system-wide
- **Connections**: 
  - Accessible from `/admin/assessments`
  - Redirects to `/admin/assessments` after creation
- **Key Features**: Assessment creation form with all configuration options

#### `admin/assessments/[id]/page.tsx`
- **Purpose**: View and manage specific assessment details
- **Connections**: 
  - Accessible from `/admin/assessments`
  - Links to `/admin/assessments/[id]/groups` for group management
- **Key Features**: 
  - Assessment details display
  - Edit and delete functionality
  - Group assignment management

#### `admin/assessments/[id]/groups/page.tsx`
- **Purpose**: Manage groups assigned to specific assessment
- **Connections**: Accessible from `/admin/assessments/[id]`
- **Key Features**: Group assignment and removal for assessments

#### `admin/attempts/page.tsx`
- **Purpose**: System-wide attempt monitoring and management
- **Connections**: 
  - Accessible from `/admin/dashboard`
  - Links to `/admin/attempts/[id]/results` for detailed results
- **Key Features**: 
  - All assessment attempts across the platform
  - Filtering and search capabilities
  - Attempt status monitoring

#### `admin/attempts/[id]/results/page.tsx`
- **Purpose**: View detailed results for specific attempt
- **Connections**: Accessible from `/admin/attempts`
- **Key Features**: 
  - Skill-level assessments
  - AI feedback and evaluation
  - Student performance analysis

#### `admin/domains/page.tsx`
- **Purpose**: System-wide domain management
- **Connections**: Accessible from `/admin/dashboard`
- **Key Features**: 
  - Create, edit, and delete educational domains
  - Domain-skill relationships
  - System-wide domain organization

#### `admin/groups/page.tsx`
- **Purpose**: System-wide group management
- **Connections**: 
  - Accessible from `/admin/dashboard`
  - Links to `/admin/groups/[id]/members` for member management
- **Key Features**: 
  - Create and manage student groups
  - Group assignment to institutions
  - Member management

#### `admin/groups/[id]/members/page.tsx`
- **Purpose**: Manage members of specific group
- **Connections**: Accessible from `/admin/groups`
- **Key Features**: 
  - Add/remove students from groups
  - Member listing and management

#### `admin/institutions/page.tsx`
- **Purpose**: System-wide institution management
- **Connections**: 
  - Accessible from `/admin/dashboard`
  - Links to `/admin/institutions/[id]` for institution details
- **Key Features**: 
  - Create, edit, and delete educational institutions
  - Institution-user relationships
  - System organization

#### `admin/institutions/[id]/page.tsx`
- **Purpose**: View and manage specific institution details
- **Connections**: Accessible from `/admin/institutions`
- **Key Features**: 
  - Institution information display
  - Edit and delete functionality
  - Associated users and groups

#### `admin/skills/page.tsx`
- **Purpose**: System-wide skill management
- **Connections**: 
  - Accessible from `/admin/dashboard`
  - Links to `/admin/skills/[id]/levels` for skill level management
- **Key Features**: 
  - Create, edit, and delete skills
  - Skill-domain relationships
  - Skill level configuration

#### `admin/skills/[id]/levels/page.tsx`
- **Purpose**: Manage skill levels for specific skill
- **Connections**: Accessible from `/admin/skills`
- **Key Features**: 
  - Create and manage skill levels
  - Level ordering and descriptions
  - Assessment criteria

#### `admin/users/page.tsx`
- **Purpose**: System-wide user management
- **Connections**: 
  - Accessible from `/admin/dashboard`
  - Links to `/admin/users/[id]` for user details
  - Links to `/admin/users/[id]/groups` for user group management
- **Key Features**: 
  - Create, edit, and delete users
  - Role assignment (Admin, Teacher, Student)
  - Institution assignment

#### `admin/users/[id]/page.tsx`
- **Purpose**: View and manage specific user details
- **Connections**: Accessible from `/admin/users`
- **Key Features**: 
  - User information display
  - Edit and delete functionality
  - Role and institution management

#### `admin/users/[id]/groups/page.tsx`
- **Purpose**: Manage groups for specific user
- **Connections**: Accessible from `/admin/users/[id]`
- **Key Features**: 
  - Add/remove user from groups
  - Group membership management

#### `admin/settings/page.tsx`
- **Purpose**: System-wide settings and configuration
- **Connections**: Accessible from `/admin/dashboard`
- **Key Features**: 
  - Platform configuration
  - System preferences
  - Administrative settings

### Teacher Section (`/teacher/`)

#### `teacher/dashboard/page.tsx`
- **Purpose**: Teacher main dashboard with institution-specific functions
- **Connections**: 
  - **Assessment Management**: Links to `/teacher/assessments`, `/teacher/attempts`
  - **Student Management**: Links to `/teacher/groups`, `/teacher/users`
  - **Academic Management**: Links to `/teacher/domains`, `/teacher/skills`
- **Key Features**: 
  - Teacher-specific statistics
  - Recent activity overview
  - Quick access to main functions

#### `teacher/login/page.tsx`
- **Purpose**: Teacher authentication page
- **Connections**: 
  - Redirects to `/teacher/dashboard` on successful login
  - Uses shared LoginFormWrapper component
- **Key Features**: Teacher-specific login form

#### `teacher/assessments/page.tsx`
- **Purpose**: Teacher's assessment management for their institution
- **Connections**: 
  - Links to `/teacher/assessments/create` for new assessments
  - Links to `/teacher/assessments/[id]` for assessment details
  - Links to `/teacher/assessments/[id]/groups` for group assignment
  - Accessible from `/teacher/dashboard`
- **Key Features**: 
  - Create and manage assessments
  - Assessment status tracking
  - Group assignment

#### `teacher/assessments/create/page.tsx`
- **Purpose**: Create new assessments for teacher's institution
- **Connections**: 
  - Accessible from `/teacher/assessments`
  - Redirects to `/teacher/assessments` after creation
- **Key Features**: Assessment creation form with teacher-specific options

#### `teacher/assessments/[id]/page.tsx`
- **Purpose**: View and manage specific assessment details
- **Connections**: 
  - Accessible from `/teacher/assessments`
  - Links to `/teacher/assessments/[id]/edit` for editing
  - Links to `/teacher/assessments/[id]/groups` for group management
- **Key Features**: 
  - Assessment details display
  - Edit and delete functionality
  - Group assignment management

#### `teacher/assessments/[id]/edit/page.tsx`
- **Purpose**: Edit existing assessment
- **Connections**: 
  - Accessible from `/teacher/assessments/[id]`
  - Redirects to `/teacher/assessments/[id]` after editing
- **Key Features**: Assessment editing form

#### `teacher/assessments/[id]/groups/page.tsx`
- **Purpose**: Manage groups assigned to specific assessment
- **Connections**: Accessible from `/teacher/assessments/[id]`
- **Key Features**: Group assignment and removal for assessments

#### `teacher/attempts/page.tsx`
- **Purpose**: Monitor and manage assessment attempts for teacher's assessments
- **Connections**: 
  - Accessible from `/teacher/dashboard`
  - Links to `/teacher/attempts/[id]/results` for detailed results
  - Links to `/teacher/attempts/[id]/disputes` for dispute management
- **Key Features**: 
  - Attempt monitoring and filtering
  - Results viewing
  - Dispute management
  - Attempt deletion

#### `teacher/attempts/[id]/results/page.tsx`
- **Purpose**: View detailed results for specific attempt
- **Connections**: Accessible from `/teacher/attempts`
- **Key Features**: 
  - Skill-level assessments
  - AI feedback and evaluation
  - Student performance analysis

#### `teacher/attempts/[id]/disputes/page.tsx`
- **Purpose**: Manage disputes for specific attempt
- **Connections**: Accessible from `/teacher/attempts`
- **Key Features**: 
  - View and respond to student disputes
  - Dispute resolution workflow
  - Grade adjustment capabilities

#### `teacher/domains/page.tsx`
- **Purpose**: Manage educational domains for teacher's institution
- **Connections**: 
  - Accessible from `/teacher/dashboard`
  - Links to `/teacher/domains/[id]` for domain details
  - Links to `/teacher/domains/[id]/skills` for domain skills
- **Key Features**: 
  - Create, edit, and delete domains
  - Domain-skill relationships
  - AI-powered skill suggestions

#### `teacher/domains/[id]/page.tsx`
- **Purpose**: View and manage specific domain details
- **Connections**: 
  - Accessible from `/teacher/domains`
  - Links to `/teacher/domains/[id]/skills` for skill management
- **Key Features**: 
  - Domain information display
  - Edit and delete functionality
  - Associated skills management

#### `teacher/domains/[id]/skills/page.tsx`
- **Purpose**: Manage skills associated with specific domain
- **Connections**: Accessible from `/teacher/domains/[id]`
- **Key Features**: 
  - Add/remove skills from domains
  - Skill-domain relationship management

#### `teacher/groups/page.tsx`
- **Purpose**: Manage student groups for teacher's institution
- **Connections**: 
  - Accessible from `/teacher/dashboard`
  - Links to `/teacher/groups/[id]/members` for member management
- **Key Features**: 
  - Create and manage student groups
  - Group assignment to assessments
  - Member management

#### `teacher/groups/[id]/members/page.tsx`
- **Purpose**: Manage members of specific group
- **Connections**: Accessible from `/teacher/groups`
- **Key Features**: 
  - Add/remove students from groups
  - Member listing and management

#### `teacher/skills/page.tsx`
- **Purpose**: Manage skills for teacher's institution
- **Connections**: 
  - Accessible from `/teacher/dashboard`
  - Links to `/teacher/skills/[id]/levels` for skill level management
- **Key Features**: 
  - Create, edit, and delete skills
  - Skill-domain relationships
  - Skill level configuration

#### `teacher/skills/[id]/levels/page.tsx`
- **Purpose**: Manage skill levels for specific skill
- **Connections**: Accessible from `/teacher/skills`
- **Key Features**: 
  - Create and manage skill levels
  - Level ordering and descriptions
  - Assessment criteria

#### `teacher/users/page.tsx`
- **Purpose**: Manage students for teacher's institution
- **Connections**: Accessible from `/teacher/dashboard`
- **Key Features**: 
  - View student information
  - Student group assignment
  - Student performance tracking

### Student Section (`/student/`)

#### `student/dashboard/page.tsx`
- **Purpose**: Student main dashboard showing available and completed assessments
- **Connections**: 
  - Links to `/student/assessments/[id]/attempt` for taking assessments
  - Links to `/student/assessments/[id]/results` for viewing results
  - Links to `/student/disputes` for dispute management
- **Key Features**: 
  - Active and completed assessments display
  - Assessment status tracking
  - Quick access to assessment attempts and results

#### `student/login/page.tsx`
- **Purpose**: Student authentication page
- **Connections**: 
  - Redirects to `/student/dashboard` on successful login
  - Uses shared LoginFormWrapper component
- **Key Features**: Student-specific login form

#### `student/assessments/page.tsx`
- **Purpose**: List all available assessments for the student
- **Connections**: 
  - Links to `/student/assessments/[id]` for assessment details
  - Accessible from `/student/dashboard`
- **Key Features**: 
  - Assessment listing with status
  - Assessment details and requirements
  - Access to attempt and results

#### `student/assessments/[id]/page.tsx`
- **Purpose**: View specific assessment details and options
- **Connections**: 
  - Links to `/student/assessments/[id]/attempt` for taking assessment
  - Links to `/student/assessments/[id]/results` for viewing results
  - Accessible from `/student/assessments`
- **Key Features**: 
  - Assessment information display
  - Start assessment or view results options
  - Assessment requirements and instructions

#### `student/assessments/[id]/attempt/page.tsx`
- **Purpose**: Take an assessment with AI-powered conversation interface
- **Connections**: 
  - Accessible from `/student/assessments/[id]`
  - Redirects to `/student/assessments/[id]/results` upon completion
- **Key Features**: 
  - AI conversation interface
  - Real-time evaluation feedback
  - Three-tier evaluation system (Incomplete, Improvable, Final)
  - Skill-level assessment
  - Turn-based conversation limits

#### `student/assessments/[id]/results/page.tsx`
- **Purpose**: View assessment results and skill evaluations
- **Connections**: 
  - Accessible from `/student/assessments/[id]`
  - Links to `/student/disputes` for disputing results
- **Key Features**: 
  - Skill-level evaluations
  - AI feedback and comments
  - Dispute initiation options
  - Performance analysis

#### `student/disputes/page.tsx`
- **Purpose**: Manage disputes for assessment results
- **Connections**: 
  - Accessible from `/student/dashboard`
  - Links to `/student/disputes/[resultId]` for specific disputes
- **Key Features**: 
  - Dispute listing and status
  - Create new disputes
  - Track dispute resolution

#### `student/disputes/[resultId]/page.tsx`
- **Purpose**: View and manage specific dispute details
- **Connections**: Accessible from `/student/disputes`
- **Key Features**: 
  - Dispute details and conversation
  - Teacher responses
  - Dispute resolution tracking

## Navigation Flow

### Admin Flow
1. **Login** → **Dashboard** → **System Management Functions**
2. **Institutions** → **Users** → **Groups** → **Domains** → **Skills** → **Assessments** → **Attempts**

### Teacher Flow
1. **Login** → **Dashboard** → **Institution-Specific Functions**
2. **Groups** → **Users** → **Domains** → **Skills** → **Assessments** → **Attempts** → **Disputes**

### Student Flow
1. **Login** → **Dashboard** → **Assessment Participation**
2. **Assessments** → **Attempt** → **Results** → **Disputes** (if needed)

## Key Relationships

### Assessment Lifecycle
1. **Admin/Teacher** creates assessment
2. **Admin/Teacher** assigns groups to assessment
3. **Student** takes assessment via AI conversation
4. **Student** views results and can dispute
5. **Teacher** manages disputes and finalizes grades

### User Hierarchy
- **Admin**: System-wide access to all institutions and users
- **Teacher**: Institution-specific access to students and assessments
- **Student**: Access to assigned assessments and personal results

### Data Relationships
- **Institutions** contain **Users** and **Groups**
- **Domains** contain **Skills** with **Skill Levels**
- **Assessments** are assigned to **Groups** and evaluate **Skills**
- **Attempts** track student performance on **Assessments**
- **Disputes** allow students to challenge **Results**

## Internationalization

All pages support English and Spanish through the `[locale]` dynamic route parameter and NextIntl integration. Translation files are located in `src/messages/` with separate files for each language.
