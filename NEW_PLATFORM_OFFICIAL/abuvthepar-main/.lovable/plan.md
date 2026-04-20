

## Plan: Add CSM Assignment and Onboarding Date to Bulk Invite

### What changes

Add two optional columns to the bulk invite CSV template: **CSM Assigned** (by email) and **Onboarding Date**. After each user is successfully invited, the system will assign the CSM and set the onboarding date on their profile. The **offboarding date is automatically calculated as 6 months after the onboarding date** — no CSV column needed.

### Implementation details

#### 1. Update CSV template and parsing (`src/components/settings/BulkInviteDialog.tsx`)

**Template download** — add two new columns:
```
First Name,Last Name,Email,Phone Number,CSM Email,Onboarding Date
John,Doe,john.doe@example.com,+1234567890,csm@company.com,2026-05-01
```

**ParsedUser interface** — add optional fields:
- `csmEmail?: string` — the CSM's email from the CSV
- `csmId?: string` — resolved CSM user ID (looked up on parse)
- `onboardingDate?: string` — ISO date string

**Parsing logic** — extract columns, validate CSM email against `useCSMList()` (soft warning if not found), validate date is parseable.

#### 2. Post-invite: assign CSM and set dates

After each successful `invite-user` call:

- **CSM assignment**: Call `supabase.rpc('assign_csm_to_user', { p_user_id: userId, p_csm_id: csmId })` + trigger `send-assignment-dm`.
- **Onboarding + offboarding dates**: Calculate offboarding as onboarding date + 6 months, then update profile:
  ```ts
  const offboardingDate = new Date(onboardingDate);
  offboardingDate.setMonth(offboardingDate.getMonth() + 6);

  supabase.from('user_profiles').update({
    onboarding_date: onboardingDate,
    onboarding_booking_status: 'scheduled',
    offboarding_date: offboardingDate.toISOString().slice(0, 10)
  }).eq('id', userId)
  ```

This matches the existing pattern used in `onboardingGraduation.ts` and the client profile onboarding card.

#### 3. Update preview table

Add two columns to the preview table: **CSM** (resolved name or warning) and **Onboarding Date** (formatted).

### Files to edit
- **`src/components/settings/BulkInviteDialog.tsx`** — template, parsing, post-invite logic, preview table

### No backend changes needed
All required RPCs, edge functions, and table columns already exist.

