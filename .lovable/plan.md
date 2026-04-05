

## Consistency Audit: User Management vs CSM Students vs CSM Dashboard

### Data Sources (Root of Inconsistencies)

| View | Data Hook | Data Source |
|------|-----------|-------------|
| **User Management** | `useAllUsersProgress` | `list-users` edge function (server-side pagination, filters, sorting) |
| **CSM Students Tab** | `useCSMStudents` | Direct Supabase queries on `user_profiles` + `task_responses` + `list-users` for sign-in data |
| **CSM Dashboard** | `useAllUsersProgress` (same as User Mgmt) + `useCSMMetrics` | `list-users` edge function (fetches up to 200 users) |

### Identified Inconsistencies

**1. Progress Calculation Differs**
- **User Management / Dashboard**: Progress comes from `list-users` edge function (server-side calculation)
- **CSM Students**: Progress is calculated client-side — counts ALL active tasks as denominator and completed `task_responses` as numerator. This ignores tier-specific task visibility, course access, and phase gating, producing different percentages than the edge function

**2. "At Risk" Threshold Differs**
- **User Management**: `daysSince > 14` (more than 14 days inactive)
- **CSM Students Tab**: `daysSince > 14` (same, consistent)
- **CSM Dashboard metrics**: `daysInactive >= 7` (7+ days inactive with progress > 0)
- A user inactive for 10 days shows as "Active" in User Management / Students but as "At Risk" in the Dashboard

**3. Inactive Users Excluded from CSM Students**
- **CSM Students**: Hard-filters `.eq('is_active', true)` — refunded/deactivated users never appear
- **User Management**: Shows inactive users with "Refunded" badge
- **Dashboard**: Uses `useAllUsersProgress` which includes inactive users when `statusFilter = 'all'`

**4. CSM Students Fetches ALL Users from `list-users`**
- `useCSMStudents` calls `list-users` with `perPage: 1000` just to get `last_sign_in_at` timestamps, then discards everything else. This is wasteful and may miss users beyond page 1 if there are >1000 users

**5. Dashboard Caps at 200 Users**
- Dashboard uses `perPage: 200` — if there are more than 200 client users, KPIs and intervention lists will be incomplete

### Fix Plan

**Step 1: Unify CSM Students to use `useAllUsersProgress`** (biggest impact)
- Refactor `useCSMStudents` hook to call `useAllUsersProgress` with CSM-specific filters instead of making its own direct queries
- This ensures progress percentages, status logic, and sign-in data all come from the same edge function
- Keep the `useCSMStudents` interface (returns `CSMStudent[]`) but populate it from the edge function response
- Remove the redundant direct queries to `user_profiles`, `tasks`, `task_responses`, and the extra `list-users` call

**Step 2: Align "At Risk" threshold across all views**
- Standardize to a single threshold. The Dashboard uses 7 days (for intervention purposes) while the table badge uses 14 days. These serve different purposes:
  - Keep the Dashboard intervention cards at 7 days (early warning)
  - Keep the table Status badge at 14 days (confirmed risk)
  - Document this explicitly with a comment in both locations
- No code change needed here — the thresholds are intentionally different for different contexts

**Step 3: Raise Dashboard `perPage` limit**
- Change `perPage: 200` to `perPage: 1000` in `CSMDashboardTab.tsx` so KPIs cover all students
- Consider adding pagination awareness or a warning if `totalCount > perPage`

**Step 4: Show inactive users in CSM Students Tab**
- Remove the `.eq('is_active', true)` hard filter from `useCSMStudents` (or from the refactored version)
- Add "Refunded" as a status option in the Students tab filter, matching User Management

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useCSMStudents.tsx` | Refactor `useCSMStudents` to delegate to `useAllUsersProgress` |
| `src/components/csm/CSMStudentsTab.tsx` | Add "Refunded" status filter; handle inactive users |
| `src/components/csm/CSMDashboardTab.tsx` | Raise `perPage` from 200 to 1000 |

### What Stays the Same
- Status badge styles (already identical across User Management and Students)
- Onboarding/Guarantee badge styles (already identical)
- Revenue inline editing (already consistent)
- The 7-day vs 14-day threshold difference is intentional (intervention vs status badge)

