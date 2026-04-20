# Smart Trader Insight Lab - Complete Product Requirements Document

## 1. Product Overview

### Product Vision
The Smart Trader Insight Lab is an AI-powered trading psychology coaching platform designed to help traders overcome emotional barriers, develop psychological resilience, and optimize their trading performance through personalized assessments and educational content.

### Core Value Proposition
- **Personalized Psychology Assessments**: AI-driven 8-question assessment modules targeting specific trading psychology challenges
- **Trader Archetype System**: Scientific categorization of traders into 6 distinct psychological profiles with tailored content
- **Continuous Learning**: Micro-lessons integrated into conversations for just-in-time education
- **Progress Tracking**: Weekly automated reports and insights based on user interactions

### Target Audience
- **Primary**: Beginner to intermediate retail traders (0-3 years experience)
- **Secondary**: Advanced traders seeking psychological optimization
- **Admin Users**: Trading educators, coaches, and platform administrators

## 2. Technical Architecture

### Technology Stack
- **Frontend**: React 18.3.1 + TypeScript
- **UI Framework**: Tailwind CSS + Shadcn/ui components
- **Build Tool**: Vite
- **State Management**: React hooks + local storage for caching
- **Routing**: React Router DOM v6
- **Backend**: Supabase (PostgreSQL database + Edge Functions)
- **AI Integration**: OpenAI GPT-4 via Supabase Edge Functions
- **Authentication**: Supabase Auth with Row Level Security
- **Analytics**: Built-in engagement tracking and progress reporting

### Database Schema
```sql
-- User Profiles Table
trader_profiles (
  id: uuid (primary key, references auth.users)
  experience_level: text
  success_definition: text
  primary_market: text
  trade_style: text
  capital_type: text
  common_mistakes: text
  stress_baseline: integer
  review_habit: text
  learning_style: text
  habit_loss_raw: text
  weekly_opt_in: boolean
  archetype: text
  created_at: timestamp
)

-- Chat Sessions Table
chat_sessions (
  id: uuid (primary key)
  user_id: uuid (foreign key)
  messages: jsonb
  created_at: timestamp
  updated_at: timestamp
  assessment_handle: text
  chat_type: text
  session_title: text
)

-- Assessment Catalog
prompt_catalog (
  id: uuid (primary key)
  handle: text (unique identifier)
  title: text
  tooltip: text
  mission: text
  prompt_body: text (AI system prompt)
  archetypes: text[] (target trader types)
  feature_mode: text (assessment, psychology_pdf, etc.)
  created_at: timestamp
  updated_at: timestamp
)

-- Educational Content
micro_lessons (
  id: uuid (primary key)
  archetype: text
  lesson_text: text
  citation: text
  source_url: text
  created_at: timestamp
  updated_at: timestamp
)

-- Weekly Reports
weekly_reports (
  id: uuid (primary key)
  user_id: uuid (foreign key)
  week_start_date: date
  report_content: text
  insights: jsonb
  created_at: timestamp
)

-- User Roles
user_roles (
  id: uuid (primary key)
  user_id: uuid (foreign key)
  role: app_role (admin, mega_admin, operations)
  created_at: timestamp
)
```

## 3. Core Features & Functionality

### 3.1 Authentication & Onboarding System

#### User Registration & Authentication
- **Supabase Auth Integration**: Email/password authentication with secure session management
- **Row Level Security**: Database-level security ensuring users only access their own data
- **Role-Based Access**: Three-tier admin system (admin, mega_admin, operations)

#### Onboarding Flow
- **11-Step Profile Builder**: Comprehensive trader psychology assessment
- **Archetype Classification**: Automatic categorization into one of 6 trader types:
  - Emotional Trader
  - Gambler
  - Strategy Hopper
  - Unstructured Trader
  - Fearful Hesitator
  - Reckless Trader
- **Data Collection Points**:
  - Experience level (beginner, intermediate, advanced)
  - Success definition (open text)
  - Primary trading market (stocks, options, forex, crypto, futures)
  - Trading style (day, swing, position, scalping)
  - Capital type (personal, prop firm, both)
  - Common mistakes (multi-select checkboxes)
  - Stress baseline (1-10 slider)
  - Review habits (never, rarely, weekly, daily)
  - Learning style (visual, auditory, hands-on, reading)
  - Most costly habit (open text)
  - Weekly report opt-in preference

### 3.2 Smart Trader Insight Lab (Primary Feature)

#### Assessment Engine
- **20+ Curated Assessments**: Database-driven assessment library targeting specific psychology challenges
- **Archetype-Based Recommendations**: Personalized assessment suggestions based on user's trader type
- **AI-Powered Conversations**: GPT-4 driven 8-question assessments with adaptive follow-up questions
- **Real-Time Learning**: Micro-lessons automatically integrated into conversations based on user responses

#### Assessment Categories
1. **Risk Management**: Position sizing, stop-loss strategies, portfolio management
2. **Emotional Control**: Fear, greed, FOMO, revenge trading
3. **Strategy Development**: System building, backtesting, optimization
4. **Market Psychology**: Understanding market sentiment, crowd behavior
5. **Performance Analysis**: Trade review, pattern recognition, improvement planning
6. **Mindset & Discipline**: Routine building, habit formation, consistency

#### Assessment Flow
1. **Selection Phase**: Grid view of available assessments with archetype-based badges
2. **Transition Animation**: Smooth loading sequence with trading-themed animations
3. **Conversation Phase**: AI-driven Q&A session with typing indicators and smooth message flow
4. **Integration Phase**: Micro-lessons automatically inserted based on responses
5. **Completion Phase**: Actionable 3-5 step improvement plan generated
6. **History Tracking**: Last 10 conversations saved with quick restart capability

### 3.3 Chart Review (AI-Powered Analysis)

#### Core Functionality
- **Chart Upload**: Support for common image formats (PNG, JPG, GIF, WebP)
- **AI Analysis**: GPT-4 Vision integration for comprehensive chart interpretation
- **Technical Analysis**: Support for multiple analysis types:
  - Technical patterns (head & shoulders, triangles, flags, etc.)
  - Support/resistance levels
  - Trend analysis
  - Volume analysis
  - Risk/reward assessment
  - Entry/exit point identification

#### Analysis Features
- **Multi-Chart Support**: Upload and analyze multiple charts in sequence
- **Analysis Persistence**: Chart analysis saved to user's session history
- **Educational Integration**: Micro-lessons triggered based on chart patterns identified
- **Archetype-Specific Insights**: Analysis tailored to user's trader psychology profile

### 3.4 Trading Psychologist (Dedicated Counseling)

#### Conversation Features
- **Specialized AI Persona**: Dedicated psychological counseling chatbot
- **Session Continuity**: Conversations saved and resumable
- **Psychology-Focused Content**: Emphasis on emotional regulation, trading mindset, and psychological barriers
- **Crisis Support**: Gentle guidance for traders experiencing significant losses or emotional distress

#### Integration with User Profile
- **Archetype Awareness**: Conversations reference user's trader type for personalized advice
- **Progress Tracking**: Psychological insights contribute to weekly reports
- **Habit Formation**: Specific guidance for building better trading routines

### 3.5 Weekly Reports (Automated Progress Tracking)

#### Report Generation
- **AI-Powered Insights**: Automated analysis of user engagement and progress
- **Weekly Frequency**: Reports generated every Sunday for the previous week
- **Comprehensive Coverage**: Includes activity summary, psychology observations, strengths, areas for improvement, and actionable recommendations

#### Report Components
1. **Activity Summary**: Number of sessions, topics explored, assessment completions
2. **Psychology Observations**: Emotional patterns, behavioral insights, growth areas
3. **Strengths Identification**: Positive traits and successful strategies
4. **Improvement Areas**: Specific challenges and development opportunities
5. **Recommended Actions**: Concrete next steps for continued growth
6. **Progress Indicators**: Engagement level and momentum tracking

#### Report Features
- **Visual Formatting**: Rich markdown formatting with headings, lists, and separators
- **Downloadable**: PDF export capability for offline reference
- **Historical Archive**: Complete history of all generated reports
- **Insight Tracking**: JSON metadata for programmatic analysis

### 3.6 Coming Soon Features

#### Psychology Profile
- **Comprehensive Assessment**: 50+ question deep-dive into trading psychology
- **Detailed Report Generation**: Multi-page psychological profile with personalized recommendations
- **Archetype Deep-Dive**: Extensive analysis of trader type with strengths, weaknesses, and optimization strategies

#### Strategy Optimizer
- **Strategy Analysis**: Upload and analyze trading strategies for optimization
- **Backtesting Integration**: Historical performance analysis and optimization recommendations
- **Risk Assessment**: Comprehensive risk analysis and management recommendations

#### Trader Dashboard
- **Performance Metrics**: Visual dashboard with key trading psychology and performance indicators
- **Progress Tracking**: Visual representation of improvement over time
- **Goal Setting**: Personal trading goals with progress tracking

## 4. Design System & User Experience

### 4.1 Visual Design Language

#### Color Palette
- **Primary**: Professional Trading Blue (HSL: 213, 94%, 68%)
- **Background**: Dark Theme (HSL: 240, 10%, 3.9%)
- **Foreground**: Light Text (HSL: 0, 0%, 98%)
- **Success/Accent**: Trading Green (HSL: 142, 76%, 36%)
- **Warning**: Alert Orange (HSL: 38, 92%, 50%)
- **Destructive**: Error Red (HSL: 0, 84.2%, 60.2%)

#### Typography
- **System Fonts**: Inter, system-ui fallbacks
- **Hierarchical Scale**: H1 (3xl) → H6 (sm) with consistent spacing
- **Reading Experience**: Optimized line-height and letter-spacing for extended reading

#### Component Library
- **Shadcn/ui Foundation**: Complete component system with trading-specific customizations
- **Custom Components**: Specialized trading chatbot, assessment cards, progress indicators
- **Responsive Design**: Mobile-first approach with consistent breakpoints

### 4.2 Navigation & Layout

#### Sidebar Navigation
- **Collapsible Design**: Expands to 280px, collapses to 16px on desktop
- **Mobile Optimization**: Hidden on mobile with overlay access
- **Active State Management**: Clear indication of current page with React Router integration
- **Feature Status**: Visual indicators for "Coming Soon" features

#### Page Layouts
- **Chat-Focused**: Full-screen chat interface for assessments and psychology sessions
- **Dashboard Style**: Card-based layouts for reports and admin functions
- **Split View**: Sidebar + main content for chart analysis and reports

#### Responsive Behavior
- **Mobile-First**: Optimized for mobile trading apps and responsive web access
- **Tablet Support**: Appropriate layouts for tablet devices
- **Desktop Enhancement**: Full feature set with multi-column layouts

### 4.3 Interaction Design

#### Animation System
- **Smooth Transitions**: 300ms cubic-bezier transitions for UI state changes
- **Loading States**: Custom Lottie animations for trading-themed loading indicators
- **Page Transitions**: Fade and slide animations between assessment phases
- **Micro-Interactions**: Hover states, button feedback, and form validation animations

#### Feedback Systems
- **Toast Notifications**: Success, error, and informational messages using Sonner
- **Progress Indicators**: Visual progress bars for multi-step processes
- **Loading States**: Skeleton screens and spinner animations during data loading
- **Form Validation**: Real-time validation with clear error messaging

## 5. AI & Content Management System

### 5.1 AI Integration Architecture

#### OpenAI GPT-4 Integration
- **Model**: GPT-4.1-2025-04-14 for optimal performance and reliability
- **Edge Function Deployment**: Supabase Edge Functions for secure API key management
- **Error Handling**: Comprehensive error handling with fallback responses
- **Rate Limiting**: Built-in request throttling to manage API costs

#### System Prompt Engineering
- **Modular Prompts**: Database-stored system prompts for each assessment type
- **Dynamic Context**: User archetype and profile data injected into conversations
- **Educational Integration**: Automatic micro-lesson insertion based on conversation context
- **Guardrails**: Built-in safety measures for financial advice and psychological support

### 5.2 Content Management

#### Assessment Library
- **Database-Driven**: All assessments stored in prompt_catalog table
- **Version Control**: Timestamp tracking for content updates
- **A/B Testing**: Support for multiple versions of assessments
- **Archetype Targeting**: Each assessment tagged with relevant trader types

#### Micro-Lessons System
- **Contextual Delivery**: Lessons automatically selected based on conversation context
- **Archetype Specific**: Content tailored to user's trader psychology profile
- **Citation Tracking**: Proper attribution and source linking
- **Usage Analytics**: Tracking of lesson effectiveness and engagement

#### Content Workflow
1. **Content Creation**: Admin interface for creating new assessments and lessons
2. **Review Process**: Built-in approval workflow for content quality control
3. **Deployment**: Instant activation of new content without code changes
4. **Analytics**: Engagement tracking and effectiveness measurement

## 6. Admin & Management Features

### 6.1 Admin Dashboard

#### User Management
- **User Creation**: Secure user account creation with automatic credential generation
- **Password Reset**: Administrative password reset functionality
- **User Analytics**: Engagement metrics, session tracking, completion rates
- **Search & Filter**: Comprehensive user search and filtering capabilities

#### Role Management
- **Three-Tier System**: admin, mega_admin, operations roles
- **Permission Control**: Granular permissions for different admin functions
- **Audit Trail**: Complete logging of admin actions and changes

### 6.2 Content Management Interface

#### Assessment Management
- **CRUD Operations**: Create, read, update, delete assessments
- **Preview System**: Live preview of assessments before publication
- **Archetype Assignment**: Easy tagging of assessments to trader types
- **Performance Analytics**: Completion rates and user feedback

#### Micro-Lesson Management
- **Content Library**: Centralized repository of educational content
- **Usage Tracking**: Analytics on lesson delivery and effectiveness
- **Content Optimization**: Data-driven recommendations for content improvements

### 6.3 Analytics & Reporting

#### Platform Analytics
- **User Engagement**: Session duration, return rates, feature usage
- **Assessment Performance**: Completion rates, user satisfaction, topic popularity
- **Content Effectiveness**: Micro-lesson engagement and impact measurement
- **Growth Metrics**: User acquisition, retention, and platform growth

#### Business Intelligence
- **Dashboard Views**: Executive-level analytics and KPI tracking
- **Export Functionality**: CSV/PDF export for external analysis
- **Custom Reports**: Configurable reporting for specific business needs

## 7. Security & Compliance

### 7.1 Data Security

#### Authentication Security
- **Supabase Auth**: Enterprise-grade authentication with secure session management
- **Row Level Security**: Database-level security ensuring data isolation
- **JWT Tokens**: Secure token-based authentication with automatic refresh

#### Data Protection
- **Encryption**: All data encrypted in transit and at rest
- **Access Controls**: Strict database permissions and API security
- **Audit Logging**: Complete audit trail of data access and modifications

### 7.2 Privacy & Compliance

#### Data Handling
- **GDPR Compliance**: User consent management and data portability
- **Data Minimization**: Collection of only necessary user data
- **Right to Deletion**: Complete user data removal capabilities

#### Financial Regulations
- **Educational Disclaimer**: Clear disclaimers about educational nature of content
- **No Investment Advice**: Strict policies against providing specific investment advice
- **Risk Warnings**: Appropriate risk warnings for trading-related content

## 8. Performance & Scalability

### 8.1 Performance Optimization

#### Frontend Performance
- **Code Splitting**: Lazy loading of routes and components
- **Asset Optimization**: Optimized images and font loading
- **Caching Strategy**: Intelligent caching of user data and content
- **Bundle Size**: Optimized webpack bundles for fast loading

#### Backend Performance
- **Database Optimization**: Proper indexing and query optimization
- **Edge Functions**: Globally distributed serverless functions
- **CDN Integration**: Asset delivery via global content delivery network
- **Monitoring**: Real-time performance monitoring and alerting

### 8.2 Scalability Architecture

#### Database Scalability
- **PostgreSQL**: Enterprise-grade database with horizontal scaling capabilities
- **Connection Pooling**: Efficient database connection management
- **Read Replicas**: Potential for read-only replicas for scaling
- **Partitioning**: Table partitioning strategies for large datasets

#### API Scalability
- **Serverless Architecture**: Auto-scaling edge functions
- **Rate Limiting**: Protection against abuse and overuse
- **Caching Layers**: Multiple levels of caching for optimal performance
- **Load Balancing**: Automatic load distribution

## 9. Integration & Extensibility

### 9.1 Third-Party Integrations

#### Marketing & Analytics
- **Zapier Integration**: Automated data flow to external marketing tools
- **Email Marketing**: Integration capabilities for user communication
- **Analytics Platforms**: Google Analytics and custom analytics integration

#### Trading Platforms
- **Future Integrations**: Planned connections to major trading platforms
- **Data Import**: Capability to import trading data for analysis
- **Broker Integration**: Potential for broker API connections

### 9.2 API & Extensibility

#### Public API
- **RESTful Design**: Well-structured API endpoints for external integrations
- **Authentication**: Secure API access with proper authentication
- **Documentation**: Comprehensive API documentation for developers
- **Rate Limiting**: Appropriate rate limits for different access levels

#### Plugin Architecture
- **Modular Design**: Support for custom assessment modules
- **Custom Content**: Ability to add custom educational content
- **White Label**: Potential for white-label deployments
- **Custom Branding**: Configurable branding and styling options

## 10. User Flows & Journey Mapping

### 10.1 New User Journey

#### First Visit Experience
1. **Landing**: User arrives at authentication page
2. **Registration**: Account creation with email verification
3. **Onboarding**: 11-step profile builder with progress indication
4. **Archetype Assignment**: Automatic psychological profile classification
5. **First Assessment**: Guided selection of recommended first assessment
6. **Insight Lab Introduction**: Tour of main features and capabilities

#### Learning Journey
1. **Assessment Selection**: Browse and select relevant assessments
2. **Conversation Engagement**: AI-powered assessment conversation
3. **Educational Integration**: Micro-lessons delivered during conversation
4. **Action Plan Creation**: Personalized improvement recommendations
5. **Progress Tracking**: Weekly reports showing growth and insights
6. **Advanced Features**: Graduation to Chart Review and Psychology sessions

### 10.2 Returning User Experience

#### Regular Usage Pattern
1. **Quick Entry**: Direct access to Insight Lab or last assessment
2. **Progress Review**: Check previous conversations and reports
3. **New Assessment**: Select and complete new assessment modules
4. **Chart Analysis**: Upload and analyze trading charts
5. **Psychology Session**: Engage with dedicated trading psychologist
6. **Report Review**: Read and analyze weekly progress reports

#### Long-Term Engagement
1. **Habit Formation**: Regular assessment completion becomes routine
2. **Skill Development**: Progressive improvement in trading psychology
3. **Advanced Usage**: Utilize all platform features including Chart Review
4. **Community Aspect**: Potential for community features and peer interaction

## 11. Success Metrics & KPIs

### 11.1 User Engagement Metrics

#### Primary Metrics
- **Daily Active Users (DAU)**: Users completing at least one assessment per day
- **Weekly Active Users (WAU)**: Users engaging with platform weekly
- **Assessment Completion Rate**: Percentage of started assessments completed
- **Session Duration**: Average time spent in assessment conversations
- **Return Rate**: Percentage of users returning within 7/30 days

#### Secondary Metrics
- **Feature Adoption**: Usage rates for Chart Review, Psychology sessions
- **Content Engagement**: Micro-lesson read rates and interaction
- **Report Generation**: Weekly report creation and viewing rates
- **Mobile vs Desktop**: Platform usage distribution

### 11.2 Learning & Growth Metrics

#### Educational Effectiveness
- **Knowledge Retention**: Improvement in assessment responses over time
- **Skill Development**: Progress in trader psychology profiles
- **Behavior Change**: Evidence of improved trading habits
- **Goal Achievement**: Success in meeting personal trading objectives

#### Platform Growth
- **User Acquisition**: New user registration rates
- **Organic Growth**: Referral and word-of-mouth acquisition
- **Retention Rates**: 1-week, 1-month, 3-month retention
- **Feature Expansion**: Adoption of new features and assessments

## 12. Technical Implementation Notes

### 12.1 Development Best Practices

#### Code Quality
- **TypeScript**: Full TypeScript implementation for type safety
- **ESLint Configuration**: Strict linting rules for code consistency
- **Component Architecture**: Reusable, modular component design
- **Testing Strategy**: Unit tests for critical business logic

#### Database Design
- **Normalization**: Properly normalized database schema
- **Indexing**: Strategic indexing for query performance
- **Constraints**: Data integrity through database constraints
- **Migrations**: Version-controlled database schema changes

### 12.2 Deployment & Operations

#### Infrastructure
- **Supabase Hosting**: Managed hosting with automatic scaling
- **Edge Functions**: Globally distributed serverless compute
- **CDN Integration**: Fast global asset delivery
- **SSL/TLS**: End-to-end encryption for all communications

#### Monitoring & Maintenance
- **Error Tracking**: Comprehensive error monitoring and alerting
- **Performance Monitoring**: Real-time performance metrics
- **User Analytics**: Detailed user behavior analysis
- **Health Checks**: Automated system health monitoring

## 13. Future Roadmap & Expansion

### 13.1 Short-Term Enhancements (3-6 months)

#### Feature Completions
- **Psychology Profile**: Complete implementation of deep psychology assessment
- **Strategy Optimizer**: Launch strategy analysis and optimization tools
- **Trader Dashboard**: Visual dashboard with performance metrics
- **Mobile App**: Native mobile application development

#### Content Expansion
- **Advanced Assessments**: 50+ total assessment modules
- **Video Integration**: Video micro-lessons and educational content
- **Interactive Exercises**: Hands-on trading psychology exercises
- **Personalization Engine**: Advanced AI-driven content personalization

### 13.2 Long-Term Vision (6-18 months)

#### Platform Evolution
- **Community Features**: User forums and peer interaction
- **Live Coaching**: Real-time coaching sessions with AI or human coaches
- **Trading Integration**: Direct integration with trading platforms
- **Performance Analytics**: Comprehensive trading performance analysis

#### Market Expansion
- **White Label Solutions**: Platform licensing for other trading educators
- **International Markets**: Multi-language and region-specific content
- **Institutional Sales**: B2B sales to trading firms and educational institutions
- **Certification Programs**: Formal trading psychology certification courses

---

*This document represents the complete functional specification for the Smart Trader Insight Lab platform as of December 2024. It serves as the definitive guide for understanding all aspects of the platform's functionality, architecture, and user experience.*