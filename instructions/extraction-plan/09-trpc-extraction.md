# TRPC Routers Extraction Plan

## Scope

**Active Apps Only**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Overview

Extract shared TRPC routers to `@coursebuilder/next/trpc`.

**Target**: `@coursebuilder/next/trpc`

---

## Analysis Results

### 100% Identical (7 routers - Extract immediately)

| Router | MD5 Hash | Purpose |
|--------|----------|---------|
| `progress.ts` | f05b9d4ac9f003ce83fe55881a1bd7a0 | Learning progress tracking |
| `lessons.ts` | 7fd9d4598ac53bffebc54d2e098b851d | Lesson CRUD operations |
| `tags.ts` | e804b852d2691442f83d5f4e5f7556a3 | Tag management |
| `users.ts` | 567cd983cef1c9a23c3e98cf0ddeb72a | User profile operations |
| `imageResource.ts` | 187c9f7bb777ae42697c6c15e01db70d | Image resource management |
| `emails.ts` | 892a50b167e37649ea309bf44a14d3b7 | Email operations |
| `certificate.ts` | 2fcb6eb5499d7c25f431bf14a8e80fa4 | Certificate generation |

### Multiple Variants (6 routers - ANALYZED)

| Router | Variants | Outlier | Canonical | Notes |
|--------|----------|---------|-----------|-------|
| `ability.ts` | 3 variants | - | ai-hero | Most complete rules |
| `pricing.ts` | 3 variants | - | ai-hero | Most features |
| `videoResource.ts` | 2 variants | - | 4-app majority | ai-hero differs |
| `solutions.ts` | 2 variants | ai-hero | 4-app majority | ai-hero has extra `getAllSolutionsForLesson` |
| `contentResources.ts` | 2 variants | ai-hero | ai-hero | Has cohorts/workshops queries |
| `events.ts` | 2 variants | ai-hero (96 lines) | dev-build (224 lines) | Full version has email reminders |

### Unique Routers (App-specific)

| Router | App | Purpose |
|--------|-----|---------|
| `convertkit.ts` | ai-hero only | ConvertKit email integration |
| `exercises.ts` | epicdev-ai only | Exercise functionality |
| `feature-flags.ts` | epicdev-ai only | Feature flag management |

### Events Router Deep Analysis

**Variant A: Minimal (96 lines)** - ai-hero
- Only `get` procedure
- Lists active live events with purchase info

**Variant B: Complete (224 lines)** - dev-build, epicdev-ai, just-react, code-with-antonio
- 8 procedures total including email reminder workflows:
  - `get`, `getActiveEvents`
  - `attachReminderEmailToEvent`, `detachReminderEmailFromEvent`
  - `getEventReminderEmail`, `getEventReminderEmails`, `getAllReminderEmails`
  - `createAndAttachReminderEmailToEvent`, `updateReminderEmailHours`, `updateReminderEmail`

**Recommendation**: Use Variant B (complete version) as canonical

---

## Key Finding: Heavy App Dependencies

TRPC routers have `@/` dependencies similar to query files:
- `@/db` - Database connection
- `@/server/auth` - Auth session
- `@/ability` - Authorization rules

**Strategy**: Similar to inngest - keep in apps for now, track canonical versions.

For future extraction, use factory pattern:

```typescript
// packages/next/src/trpc/progress.ts
export function createProgressRouter(deps: {
  db: Database
  ctx: Context
}) {
  return router({
    get: publicProcedure
      .input(z.object({ resourceId: z.string() }))
      .query(async ({ input }) => {
        // Implementation using deps
      }),
  })
}

// apps/ai-hero/src/trpc/routers/progress.ts
import { createProgressRouter } from '@coursebuilder/next/trpc'
import { db } from '@/db'
export const progressRouter = createProgressRouter({ db })
```

---

## Current Recommendation

**Keep TRPC routers in apps** - Track canonical versions for manual sync.

| Router | Canonical App | Notes |
|--------|---------------|-------|
| `progress.ts` | Any | All identical |
| `lessons.ts` | Any | All identical |
| `tags.ts` | Any | All identical |
| `users.ts` | Any | All identical |
| `imageResource.ts` | Any | All identical |
| `emails.ts` | Any | All identical |
| `certificate.ts` | Any | All identical |
| `pricing.ts` | ai-hero | Most features |
| `events.ts` | epicdev-ai | Live events |

---

## Manual Sync Process

When updating a TRPC router:

1. Make changes in canonical app
2. Verify with `pnpm --filter="<app>" build`
3. Copy to other apps
4. Verify all apps build: `pnpm build:all`

---

## Verification

```bash
# Compare router hashes
md5 apps/*/src/trpc/routers/progress.ts

# Build all apps
pnpm build:all

# Type check
pnpm typecheck
```

---

## Success Criteria

- [ ] Canonical versions documented
- [ ] All 5 active apps have consistent routers
- [ ] All apps build successfully
