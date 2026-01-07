# Total TypeScript Migration Plan

## Strategy: Fork ai-hero → total-typescript

Copy ai-hero as the starting point, remove what's not needed, add total-typescript specific features.

---

## Phase 0: Initial Setup (Day 1)

### 0.1 Copy ai-hero to total-typescript

```bash
# From course-builder root
cp -r apps/ai-hero apps/total-typescript

# Update package.json
# - Change name to "total-typescript"
# - Update dev port to 3016 (matching current)
```

### 0.2 Basic Configuration

| File | Action |
|------|--------|
| `package.json` | Update name, port, scripts |
| `src/config.ts` | Update site config (title, description, URLs) |
| `src/env.mjs` | Update env validation for TT-specific vars |
| `.env.example` | Create with TT environment variables |
| `tailwind.config.ts` | Update brand colors |

### 0.3 Database Setup

```bash
# Create new PlanetScale database or branch
# Update DATABASE_URL in .env
# Run drizzle push
pnpm --filter="total-typescript" db:push
```

---

## Phase 1: Remove ai-hero Specific Features (Days 2-3)

### 1.1 Routes to REMOVE

| Route | Reason |
|-------|--------|
| `app/(content)/cohorts/` | TT doesn't have cohorts |
| `app/(content)/lists/` | TT doesn't have playlists |
| `app/(content)/prompts/` | AI prompt library not needed |
| `app/(content)/events/` | Live events not used |
| `app/(content)/survey-configs/` | Not used |
| `app/discord/` | Keep but simplify |

### 1.2 lib/ Files to REMOVE

| File | Reason |
|------|--------|
| `lib/ai-chat-query.ts` | AI chat not used |
| `lib/ai-chat.ts` | AI chat not used |
| `lib/cohort*.ts` (5 files) | Cohorts not used |
| `lib/lists*.ts` (2 files) | Lists not used |
| `lib/events-query.ts` | Events not used |

### 1.3 Inngest Functions to REMOVE

| Function | Reason |
|----------|--------|
| `cohort-entitlement-sync-*.ts` | Cohorts not used |
| `send-workshop-access-emails.ts` | Review - may need adaptation |
| `discord/` folder | Keep but review |

### 1.4 Components to REMOVE

| Component | Reason |
|-----------|--------|
| `src/components/list-*` | Lists not used |
| `src/components/cohort-*` | Cohorts not used |
| AI chat related components | AI chat not used |

---

## Phase 2: Adapt Core Features (Days 4-7)

### 2.1 Content Routes to ADAPT

| ai-hero Route | total-typescript Route | Notes |
|---------------|------------------------|-------|
| `app/(content)/workshops/` | `app/(content)/workshops/` | Keep, adapt templates |
| `app/(content)/tutorials/` | `app/(content)/tutorials/` | Keep, adapt templates |
| `app/(content)/posts/` | `app/(content)/articles/` | Rename route |
| `app/(content)/[post]/` | `app/[article]/` | For root-level articles |

### 2.2 Commerce Routes to KEEP

| Route | Status |
|-------|--------|
| `app/(commerce)/buy/` | Keep as-is |
| `app/(commerce)/thanks/` | Keep as-is |
| `app/(commerce)/invoices/` | Keep as-is |
| `app/(user)/purchases/` | Keep as-is |
| `app/(user)/team/` | Keep as-is |

### 2.3 API Routes to KEEP

| Route | Status |
|-------|--------|
| `api/auth/` | Keep |
| `api/trpc/` | Keep |
| `api/inngest/` | Keep |
| `api/mux/` | Keep |
| `api/stripe/` | Keep |
| `api/uploadthing/` | Keep |

---

## Phase 3: Add total-typescript Specific Features (Days 8-14)

### 3.1 Exercise System (HIGH PRIORITY)

Create new components from existing TT code:

```
src/
├── exercise/
│   ├── exercise-overlay.tsx       # From TT components/exercise-overlay.tsx
│   ├── stackblitz-iframe.tsx      # From TT exercise/stackblitz-iframe.tsx
│   ├── get-exercise-github-url.ts # From TT exercise/
│   └── local-dev-prefs/           # From TT exercise/local-dev-prefs/
├── components/
│   ├── code-editor/               # From TT components/code-editor/
│   └── blocked-overlay.tsx        # From TT components/blocked-overlay.tsx
```

### 3.2 Book/Chapter System (MEDIUM PRIORITY)

New routes and components:

```
src/app/(content)/
├── books/
│   ├── page.tsx                   # Book listing
│   └── [book]/
│       ├── page.tsx               # Book detail
│       └── [chapter]/
│           └── page.tsx           # Chapter content
```

Components from TT:
- `src/components/book/` - Book components
- `src/templates/book-chapter-template.tsx` - Adapt to App Router

### 3.3 Tips System (MEDIUM PRIORITY)

```
src/app/(content)/
├── tips/
│   ├── page.tsx                   # Tips listing
│   └── [tip]/
│       └── page.tsx               # Tip detail
```

### 3.4 TypeScript Learning Path (MEDIUM PRIORITY)

```
src/app/
├── typescript-learning-path/
│   └── page.tsx                   # Learning path visualization
```

Migrate from: `pages/typescript-learning-path.tsx`

### 3.5 Wizard Quiz (LOW PRIORITY)

```
src/app/
├── wizard-quiz/
│   └── page.tsx
```

### 3.6 ts-reset Documentation (LOW PRIORITY)

```
src/app/
├── ts-reset/
│   └── [...slug]/
│       └── page.tsx
```

### 3.7 VSCode Extension Page (LOW PRIORITY)

```
src/app/
├── vscode-extension/
│   └── page.tsx
```

---

## Phase 4: Templates & Page Components (Days 10-14)

### 4.1 Page Templates to Create/Adapt

| Template | Source | Target |
|----------|--------|--------|
| Exercise | `templates/exercise-template.tsx` | `app/(content)/workshops/[module]/[lesson]/page.tsx` |
| Workshop | `templates/workshop-template.tsx` | `app/(content)/workshops/[module]/page.tsx` |
| Tutorial | `templates/tutorial-template.tsx` | `app/(content)/tutorials/[module]/page.tsx` |
| Article | `templates/article-template.tsx` | `app/(content)/articles/[slug]/page.tsx` |
| Tip | `templates/tip-template.tsx` | `app/(content)/tips/[tip]/page.tsx` |
| Book Chapter | `templates/book-chapter-template.tsx` | `app/(content)/books/[book]/[chapter]/page.tsx` |
| Product | `templates/product-template.tsx` | `app/(commerce)/products/[slug]/page.tsx` |
| Home | `templates/home-template.tsx` | `app/page.tsx` |

### 4.2 Shared Components to Migrate

From `total-typescript/src/components/`:

| Component | Priority | Notes |
|-----------|----------|-------|
| `app/navigation.tsx` | HIGH | Main navigation |
| `app/layout.tsx` | HIGH | Page layout wrapper |
| `book/` | MEDIUM | Book-specific components |
| `home/` | HIGH | Homepage components |
| `articles/` | HIGH | Article components |
| `code-editor/` | HIGH | Monaco/CodeMirror |
| `contact/` | LOW | Contact form |
| `companies.tsx` | LOW | Social proof |

---

## Phase 5: Styling & Branding (Days 12-14)

### 5.1 Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Total TypeScript brand colors
        brand: {
          primary: '#3178C6',    // TypeScript blue
          // ... TT color palette
        }
      },
      fontFamily: {
        // TT fonts
      }
    }
  }
}
```

### 5.2 Global Styles

Migrate from `total-typescript/src/styles/`:
- `globals.css`
- Component-specific styles

### 5.3 Assets

| Asset Type | Source | Target |
|------------|--------|--------|
| Logo | `public/` | `public/` |
| OG Images | `public/` | `public/` |
| Fonts | Local/CDN | Configure |

---

## Phase 6: Data Migration (Days 15-21)

### 6.1 User Data Migration

```sql
-- Users: Prisma → Drizzle
-- Map fields: id, email, name, image, etc.
-- Handle: accounts, sessions
```

### 6.2 Purchase Data Migration

```sql
-- Purchases: Maintain purchase history
-- Coupons: Migrate coupon codes
-- Merchant data: Stripe IDs
```

### 6.3 Progress Data Migration

```sql
-- LessonProgress (Prisma) → resourceProgress (Drizzle)
-- Map: lessonId → resourceId
-- Preserve: completedAt timestamps
```

### 6.4 Content Migration (Sanity → ContentResource)

**Sanity Content Types:**
- `workshop` → ContentResource (type: 'workshop')
- `tutorial` → ContentResource (type: 'tutorial')
- `article` → ContentResource (type: 'post')
- `tip` → ContentResource (type: 'tip')
- `exercise` → ContentResource (type: 'exercise')
- `book` → ContentResource (type: 'book')
- `chapter` → ContentResource (type: 'chapter')

**Migration Script Outline:**
```typescript
// scripts/migrate-sanity-content.ts
import { sanityClient } from './sanity-client'
import { db } from '@/db'
import { contentResource } from '@/db/schema'

async function migrateWorkshops() {
  const workshops = await sanityClient.fetch('*[_type == "module"]')

  for (const workshop of workshops) {
    await db.insert(contentResource).values({
      id: workshop._id,
      type: 'workshop',
      fields: {
        title: workshop.title,
        slug: workshop.slug.current,
        description: workshop.description,
        body: workshop.body,
        image: workshop.image,
        // ... map all fields
      },
      createdAt: new Date(workshop._createdAt),
    })
  }
}
```

### 6.5 Content Relationships

```typescript
// Migrate workshop → lesson relationships
// Use contentResourceResource junction table
// Preserve position/ordering
```

---

## Phase 7: tRPC Router Migration (Days 14-17)

### 7.1 Routers to Adapt

| TT Router | Action |
|-----------|--------|
| `routers/abilities.ts` | Adapt to course-builder abilities |
| `routers/articles.ts` | Merge with posts router |
| `routers/bookmarks.ts` | New - add to CB |
| `routers/certificate.ts` | Use existing CB certificates |
| `routers/cta.ts` | Adapt for TT CTAs |
| `routers/exercises.ts` | Adapt for exercise system |
| `routers/search.ts` | Use existing CB search |
| `routers/solutions.ts` | Adapt for exercises |
| `routers/stackblitz-resources.ts` | New - add for exercise system |
| `routers/user-prefs.ts` | Use existing CB userPrefs |
| `routers/workshop.ts` | Use existing CB workshops |

### 7.2 New tRPC Procedures Needed

```typescript
// For exercise system
stackblitz: {
  byExerciseSlug: // Get StackBlitz config for exercise
}

// For bookmarks (if keeping)
bookmarks: {
  list: // List user bookmarks
  add: // Add bookmark
  remove: // Remove bookmark
}
```

---

## Phase 8: Inngest Functions (Days 17-19)

### 8.1 Keep from ai-hero

| Function | Notes |
|----------|-------|
| `post-purchase-workflow.ts` | Core commerce |
| `product-transfer-workflow.ts` | Team licenses |
| `email-send-broadcast.ts` | Email campaigns |
| `user-created.ts` | User onboarding |
| `sync-purchase-tags.ts` | ConvertKit sync |
| `video-resource-attached.ts` | Video processing |

### 8.2 Adapt from total-typescript

| Function | Source | Notes |
|----------|--------|-------|
| `activate-normal-price.ts` | TT | Sale pricing |
| `sync-convertkit-purchases.ts` | TT | ConvertKit sync |
| Sanity webhooks | TT | Remove (no longer using Sanity) |

---

## Phase 9: Testing & QA (Days 20-25)

### 9.1 Feature Checklist

- [ ] User authentication (login/logout)
- [ ] Purchase flow (single, team, PPP)
- [ ] Video playback
- [ ] Progress tracking
- [ ] Exercise system with StackBlitz
- [ ] Book chapter navigation
- [ ] Tips display
- [ ] Search functionality
- [ ] Email delivery
- [ ] Certificate generation

### 9.2 Data Verification

- [ ] All users migrated
- [ ] All purchases preserved
- [ ] All progress maintained
- [ ] All content accessible

### 9.3 SEO Verification

- [ ] Sitemap generation
- [ ] Meta tags
- [ ] OG images
- [ ] Redirects from old URLs

---

## Phase 10: Deployment (Days 26-28)

### 10.1 Vercel Setup

```bash
# New Vercel project: total-typescript
# Environment variables
# Domain configuration
```

### 10.2 DNS Migration

1. Deploy to Vercel with temp domain
2. Test thoroughly
3. Update DNS for totaltypescript.com
4. Verify SSL

### 10.3 Redirects

```typescript
// next.config.ts redirects
// Old URL patterns → New patterns
// Preserve SEO equity
```

---

## File Structure Comparison

### ai-hero (source)
```
src/
├── app/
│   ├── (commerce)/
│   ├── (content)/
│   │   ├── cohorts/        # REMOVE
│   │   ├── events/         # REMOVE
│   │   ├── lists/          # REMOVE
│   │   ├── posts/          # KEEP → articles
│   │   ├── workshops/      # KEEP
│   │   └── tutorials/      # KEEP
│   ├── (user)/
│   ├── admin/
│   └── api/
├── components/
├── db/
├── hooks/
├── inngest/
├── lib/
└── trpc/
```

### total-typescript (target)
```
src/
├── app/
│   ├── (commerce)/
│   ├── (content)/
│   │   ├── articles/       # From posts
│   │   ├── books/          # NEW
│   │   ├── tips/           # NEW
│   │   ├── tutorials/      # KEEP
│   │   └── workshops/      # KEEP
│   ├── (user)/
│   ├── admin/
│   ├── api/
│   ├── typescript-learning-path/  # NEW
│   ├── wizard-quiz/        # NEW
│   ├── ts-reset/           # NEW
│   └── vscode-extension/   # NEW
├── components/
│   ├── book/               # NEW
│   ├── code-editor/        # NEW
│   └── exercise/           # NEW
├── db/
├── exercise/               # NEW
├── hooks/
├── inngest/
├── lib/
└── trpc/
```

---

## Timeline Summary

| Phase | Duration | Description |
|-------|----------|-------------|
| 0 | Day 1 | Initial setup |
| 1 | Days 2-3 | Remove ai-hero features |
| 2 | Days 4-7 | Adapt core features |
| 3 | Days 8-14 | Add TT features |
| 4 | Days 10-14 | Templates & components |
| 5 | Days 12-14 | Styling & branding |
| 6 | Days 15-21 | Data migration |
| 7 | Days 14-17 | tRPC routers |
| 8 | Days 17-19 | Inngest functions |
| 9 | Days 20-25 | Testing & QA |
| 10 | Days 26-28 | Deployment |

**Total: ~4 weeks** (with parallel work on some phases)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss | Multiple backups, staged migration, rollback plan |
| Auth disruption | Users may need to re-login; communicate in advance |
| SEO impact | Comprehensive redirects, preserve URL patterns where possible |
| Exercise system breakage | Thorough testing, preserve StackBlitz integration |
| Progress loss | Careful progress table migration, verification |

---

## Success Criteria

1. All users can log in
2. All purchases are preserved
3. All progress is maintained
4. All content is accessible
5. Exercise system works with StackBlitz
6. Video playback works
7. Commerce flows work
8. No 404s for existing content URLs
