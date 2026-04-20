# ATP Ultra UI Overhaul -- Session Handoff

## What This Is
ATP Ultra is a student success platform for ATP Wholesale (Amazon FBA education). We did a massive UI overhaul across every page. The app runs locally on Vite + React + TypeScript + Tailwind + Supabase. The dev Supabase instance is mostly empty, so most data flows through localStorage fallbacks and demo data injected at the component level.

## Live URLs
- **Local dev**: `cd tools/atp_ultra && npx vite --port 8081`
- **GitHub Pages**: https://momoroowala.github.io/atp-ultra-ui/
- **Original (comparison)**: `cd tools/ATPDEFAULT_Ultra/abuvthepar-main && npx vite --port 8082` (auth bypassed)

## Key Architecture Decisions
- **No working Supabase on dev**: Tables like `brand_leads`, `support_tickets`, `community_messages`, `sprint_task_notes` don't exist or have mismatched schemas. ALL writes go to **localStorage** with Supabase as a try-first fallback.
- **GitHub Pages deploy**: `GITHUB_PAGES=1 ./node_modules/.bin/vite build` sets `base: /atp-ultra-ui/`. Auth is bypassed via `import.meta.env.BASE_URL !== '/'` checks in `useAuth`, `ProtectedRoute`, `AdminRoute`, `useOnboardingStatus`. Demo data is seeded in `SeedDemoData` component in `App.tsx`.
- **Demo data injection**: CSM Panel injects 50 fake students in `CSMDashboardTab.tsx` and `CSMStudentsTab.tsx` when Supabase returns empty. Brand leads, tickets, DM conversations, community channels, calendar events all have localStorage/demo fallbacks in their respective hooks.

## Files Changed (the big ones)
| File | What changed |
|------|-------------|
| `src/pages/Home.tsx` | Complete dashboard overhaul: badge shelf, tier banner, calendar strip, Amazon revenue chart, daily actions, focus timer, leaderboard slide-out, trophy celebrations |
| `src/pages/MyPlan.tsx` | 4 layout modes (Default/Focus/Kanban/Planner), phase themes, focus timer |
| `src/pages/Support.tsx` | Side-by-side layout: compact form + live ticket tracker with priority colors |
| `src/pages/Community.tsx` | Chat transformed to social media feed with posts/comments |
| `src/pages/CSMPanel.tsx` | Users tab removed, add/upgrade student in Students tab, notification badges on sub-tabs |
| `src/pages/OneOnOnes.tsx` | Error boundary, removed crashing hooks, demo conversations |
| `src/pages/CourseDetail.tsx` | Demo course content, `effectiveIsDemo` fallback for empty courses |
| `src/pages/CourseCatalog.tsx` | Demo courses appended, auto-redirect disabled |
| `src/pages/Calendar.tsx` | Week/month toggle, demo events, RSVP localStorage |
| `src/hooks/useBrandLeads.tsx` | Full localStorage CRUD with column-discovery for Supabase |
| `src/hooks/useCommunityDMs.tsx` | Triple fallback (Supabase -> localStorage -> demo) |
| `src/hooks/useCommunityMessages.tsx` | Demo messages for demo conversations, skip realtime for demo IDs |
| `src/hooks/useCommunityChannels.tsx` | 8 default channels when Supabase empty |
| `src/hooks/useCallRsvp.tsx` | localStorage RSVP for demo events |
| `src/hooks/useSprintTaskNotes.tsx` | localStorage with `saveNow()` for explicit save button |
| `src/services/ticketApi.ts` | All ticket CRUD via localStorage |
| `src/components/brand-leads/LeadTable.tsx` | AG Grid Community replacement |
| `src/components/brand-leads/BulkImportDialog.tsx` | CSV/Excel import with column mapping wizard |
| `src/components/calendar/CalendarCallModal.tsx` | RSVP/Join logic, Q&A section |
| `src/components/calendar/CalendarGrid.tsx` | Week view, demo events |
| `src/components/community/CommunityFeed.tsx` | Social media feed (new) |
| `src/components/community/PostCard.tsx` | Post card with comments (new) |
| `src/components/community/CreatePostCard.tsx` | Post composer with formatting toolbar (new) |
| `src/components/csm/CSMDashboardTab.tsx` | 3 layout concepts, 50 demo students, priority banner replaced with pills then tab badges |
| `src/components/csm/PriorityBanner.tsx` | Compact colored pills (was ugly yellow banner) |

## What Still Needs Work
- **Community posts**: Text formatting toolbar exists but posts don't persist (localStorage for posts not implemented yet)
- **Calendar RSVP**: Works for demo events via localStorage but real Supabase RSVP untested
- **Course content**: Demo courses have placeholder video/reading content -- needs real Supabase data for production
- **CSM Insights tab**: Shows cards but data is mostly zeros -- could use richer demo metrics
- **Brand leads AG Grid**: Works but AG Grid dark mode theme toggling could be smoother
- **Mobile responsiveness**: Desktop-first changes -- mobile layouts need a review pass
- **Production deploy**: Everything is demo/localStorage. To go live, need to: (1) ensure Supabase tables match TypeScript types, (2) remove localStorage fallbacks, (3) remove `BASE_URL` auth bypasses

## Quick Start for Next Session
```
cd c:\Users\moham\Documents\Coretex\tools\atp_ultra
npx vite --port 8081
# Open http://localhost:8081
# Login with existing Supabase credentials
# For GitHub Pages redeploy: GITHUB_PAGES=1 ./node_modules/.bin/vite build && cd dist && cp index.html 404.html && git init && git checkout -b gh-pages && git add -A && git commit -m "update" --no-verify && git remote add origin https://github.com/momoroowala/atp-ultra-ui.git && git push -f origin gh-pages
```
