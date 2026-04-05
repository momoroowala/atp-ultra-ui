# ATP Ultra - File Structure

> Customer success + student platform ecosystem for ATP Wholesale
> Stack: React 18 + TypeScript + Vite + Tailwind + Shadcn/ui + Supabase

## Root
```
.env                          # Environment variables
.gitignore
.lovable/plan.md              # Lovable AI plan
components.json               # Shadcn/ui config
eslint.config.js
index.html                    # SPA entry
package.json
postcss.config.js
tailwind.config.ts
tsconfig.json / tsconfig.app.json / tsconfig.node.json
vite.config.ts
supabase_schema.sql           # Full DB schema dump
PRODUCT_REQUIREMENTS_DOCUMENT.md
```

## /src/pages/ (20 routes)
```
Auth.tsx / AuthCallback.tsx / ResetPassword.tsx / CreateNewPassword.tsx / ChangePassword.tsx / ChangeEmail.tsx
Home.tsx / Index.tsx
CourseCatalog.tsx / CourseDetail.tsx / ModuleLesson.tsx
LearningJourney.tsx / MyPlan.tsx / MyTasks.tsx
Calendar.tsx / GoogleCalendarCallback.tsx
Community.tsx / OneOnOnes.tsx
BrandLeads.tsx
CSMPanel.tsx                  # Customer Success Manager dashboard
MyNotes.tsx / MyProfile.tsx
SettingsNew.tsx               # Admin settings
Support.tsx / SupportTickets.tsx
TermsOfService.tsx / NotFound.tsx
```

## /src/components/ (major domains)
```
auth/           # AuthHeroSection, PasswordStrength
brand-leads/    # AddLeadDialog, BulkImport, LeadCard, LeadFilters, LeadDetailSheet
calendar/       # CalendarGrid, CalendarView, CallCard, RecordingCard, TierBadge
community/      # ChannelSidebar, MessageInput/Item/List, EmojiPicker, ThreadDrawer, DMs, Reactions
course/         # InlineLessonContent, LessonNavigation, PhaseAccordionSidebar, VideoRenderer, VimeoPlayer
csm/            # CSMDashboardTab, CSMTicketInbox, InterventionCards, StudentHoverCard, FollowUpQueue, PriorityBanner
home/           # Leaderboard, StreakTracker, BadgesShowcase, CourseProgressCard, MilestonesChecklist, WelcomeVideo
learning/       # PhaseCard, TaskItem, TaskSubmissionForm, SecureYouTubePlayer, VidalyticsPlayer
my-plan/        # HeroProgressBar, StageBlock, PlanTaskRow
my-tasks/       # TaskCard, TaskDetailModal, TaskFilters, PhasesSidebar
onboarding/     # GuidedTour, TourOverlay, TourTooltip
one-on-ones/    # DMSidebar, MobileDMTabs
quiz/           # QuizTakingView, QuizResultModal, QuizNotificationModal
settings/       # AdminSettingsTab, PlanTab, QuizzesTab, StatisticsTab, CustomerSuccessDashboard, TierManagement, SprintManagement, BadgesManagement, MilestonesManagement, Integrations (Fathom, Google Calendar)
sprint/         # ChecklistTask, SprintTaskDetailDrawer, PhaseCompletionBanner
support/        # NewTicketForm, TicketConversation, TicketList
ui/             # Shadcn/ui primitives (accordion, dialog, drawer, button, card, etc.)
```

## /src/hooks/ (85+ hooks)
```
Auth & roles:     useAuth, useAdminCheck, useRoleCheck, useRoles
Users:            useAllUsers, useAllUsersProgress, useUserDetails, useUserTier, useUserCourseAccess
Courses:          useCourses, useCourseDetail, useCourseWithPhases, useCourseTaskProgress
Tasks/phases:     usePhasesWithTasks, usePhaseTasks, useTaskProgress, useTaskDetail, useTaskFilters, useTaskDueDates
Quizzes:          useQuizzes, useQuizQuestions, useQuizStatus, useQuizSubmissions, useUpcomingQuizzes
Calendar:         useCalendarCalls, useCallRecordings, useCallRsvp
Community:        useCommunityChannels, useCommunityMessages, useCommunityDMs, useCommunityReactions, useScheduledMessages
CSM:              useCSMMetrics, useCSMStudents, useCSMTickets, useCSMDelegations, useAssignedCSM
Gamification:     useAchievementBadges, useLoginStreak, useMilestones, useTiers
Brand leads:      useBrandLeads
Sprint:           useSprintData, useSprintAdmin, useSprintModuleLookup, useSprintTaskNotes
Support:          useTickets, useRealtimeTicketResponses, useSupportNotifications
Misc:             usePushNotifications, usePWAInstall, useAppVersionChecker, useBellNotifications, useGuidedTour
```

## /src/utils/
```
adminTaskActions.ts, currency.ts, dateHelpers.ts, importPromptCatalog.ts
messageTimeFormatter.ts, notificationSound.ts, onboardingGraduation.ts
passwordValidation.ts, reviewFileUpload.ts, riskScore.ts, runImport.ts
sanitizeHtml.ts, taskDueDateCalculator.ts, taskFileUpload.ts
taskStatusHelper.ts, taskVisibilityEvaluator.ts, timezoneHelpers.ts, videoEmbedHelpers.ts
```

## /src/integrations/supabase/
```
client.ts         # Supabase client init
types.ts          # Auto-generated DB types
```

## /src/services/
```
ticketApi.ts      # Support ticket API layer
```

## /supabase/functions/ (28 edge functions)
```
User mgmt:        create-user, delete-user, invite-user, list-users, upsert-user, reset-password, update-user-password, update-user-tier, user-sync-api
Auth:             generate-impersonation-link
Content:          get-course-detail, get-user-detail, get-dashboard-metrics
Calendar:         manage-google-calendar, sync-google-calendar
Fathom:           fathom-webhook, manage-fathom
Community:        moderate-message, send-scheduled-messages, send-push-notification
CSM:              check-csm-delegations, generate-weekly-report, missed-onboarding-webhook, sme-ticket-webhook, generate-crisp-token
Video migration:  migrate-google-drive-videos, migrate-video-links, split-multi-video-tasks
```

## /supabase/migrations/
```
170+ SQL migration files (2025-11 through 2026-03)
```

## /public/
```
favicon.ico, favicon.png, manifest.json, robots.txt, placeholder.svg
pwa-192x192.png, pwa-512x512.png, pwa-icon.png
fonts/rebond-grotesque/ (18 font weight files)
lovable-uploads/ (1 uploaded image)
```

## /src/assets/
```
Brand logos:    eec-logo.png, eec-logo-new.png, stbp-logo.png, logo-full.png
Icons:          calendar-icon, chat-icon, coaches-icon, course-icon, facebook-ads-icon, target-icon, ugc-creator-icon, waving-hand
Auth:           auth-hero.png, home-gradient-bg.png
Tour images:    tour/ (8 onboarding tour screenshots)
```

## Key Features (from structure)
- **Course/LMS system** with phases, tasks, quizzes, video lessons (Vimeo + YouTube)
- **Customer Success Manager (CSM) panel** with student tracking, interventions, delegation, tickets
- **Community** with channels, DMs, threads, reactions, scheduled messages, moderation
- **Calendar** with calls, recordings, RSVP, Google Calendar sync, Fathom integration
- **Gamification** via badges, streaks, leaderboards, milestones, tiers
- **Brand leads** tracking (CRM-like)
- **Sprint system** with phases and checklist tasks
- **Support tickets** with conversation threads
- **PWA support** with push notifications, install prompt
- **Admin settings** for courses, quizzes, sprints, badges, milestones, tiers, user management, statistics
