# Shortlinks System - Continuation Prompt

## Current State

Branch: `feat/aih-shortlinks-system`
PR: https://github.com/badass-courses/course-builder/pull/654

### What's Implemented

**Core System (merged to branch)**:
- Database schema: `shortlink` and `shortlinkClick` tables in `src/db/schema.ts`
- Service layer: `src/lib/shortlinks-query.ts` - CRUD, Redis caching, analytics
- Redirect handler: `src/app/s/[slug]/route.ts` - tracks clicks with referrer/device/country
- API routes: `src/app/api/shortlinks/route.ts` - GET/POST/PATCH/DELETE
- Admin UI: `src/app/admin/shortlinks/` - table view, CRUD dialogs, search
- Analytics: `src/app/admin/shortlinks/[id]/analytics/` - clicks over time, referrers, devices

**UI Improvements (uncommitted)**:
- ✅ Page title: "Shortlinks | AI Hero by Matt Pocock"
- ✅ Truncate aihero.dev URLs to show only path (e.g., `/posts/foo` instead of `https://aihero.dev/posts/foo`)
- ✅ Copy button for destination URL
- ✅ Stats cards at top: clicks in last 60 min and 24 hours
- ✅ Pre-fill slug with random 6-char string when creating new shortlink

### Remaining UI Tasks

1. **Add "Create Shortlink" button to post pages**
   - Location: `/posts/[slug]` (public view) and `/posts/[slug]/edit` (admin)
   - Should open dialog pre-filled with post URL
   - Edit form uses `withResourceForm` HOC pattern in `src/app/(content)/posts/_components/edit-post-form.tsx`

### Attribution System (Needs Planning)

Matt wants a "Signups" column showing which shortlinks led to mailing list signups. This requires:

**Problem**: Track which shortlink a user clicked → then attribute when they sign up for mailing list or make a purchase.

**Available infrastructure**:
- Redis (Upstash)
- MySQL (PlanetScale via Drizzle)
- ConvertKit integration exists
- Inngest for background jobs

**Proposed approach** (needs validation):
1. On shortlink redirect, set a cookie with the shortlink slug (e.g., `sl_ref={slug}`)
2. On mailing list signup (ConvertKit), read cookie and store attribution in new `shortlinkAttribution` table
3. On purchase, same pattern - read cookie, store attribution
4. Add `signups` column to shortlinks table or query attribution table for counts

**Questions to resolve**:
- Cookie duration? (30 days typical)
- Store attribution on user record or separate table?
- ConvertKit webhook integration needed?
- Purchase flow modification needed in `src/inngest/` or checkout?

### Files Modified (uncommitted)

```
src/app/admin/shortlinks/page.tsx - added metadata, recentStats prop
src/app/admin/shortlinks/shortlinks-client-page.tsx - stats cards, formatDestination, copy buttons
src/app/admin/shortlinks/shortlink-crud-dialog.tsx - pre-fill slug on open
src/lib/shortlinks-query.ts - added getRecentClickStats()
```

### To Continue

```bash
cd /Users/joel/Code/badass-courses/course-builder
git status  # see uncommitted changes
git diff    # review changes
```

Then:
1. Commit the UI improvements
2. Add shortlink button to post pages
3. Plan and implement attribution system
