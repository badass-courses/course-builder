# Inngest Functions Extraction Plan

## Scope

**Active Apps Only**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Strategy: Extract Utilities, Not Functions

Inngest functions themselves stay in apps because they're tightly coupled to:
- `@/inngest/inngest.server` - App-specific inngest client
- `@/inngest/events/*` - App-specific event definitions
- `@/db` - App-specific database connection

**Instead, extract the reusable utilities USED BY inngest functions.**

---

## Extractable Utilities

### 1. `sendAnEmail()` - Email Sending Utility

**Source**: `apps/*/src/inngest/functions/email-send-broadcast.ts` (lines 13-44)
**Target**: `@coursebuilder/utils-email/send-email`

```typescript
// packages/utils-email/src/send-email.ts
import { Resend } from 'resend'

export interface SendEmailOptions<T = any> {
  Component: (props: T) => React.JSX.Element
  componentProps: T
  Subject: string
  To: string
  From: string
  type?: 'transactional' | 'broadcast'
  unsubscribeLinkUrl?: string
  resendApiKey: string
}

export async function sendAnEmail<T = any>(options: SendEmailOptions<T>) {
  const resend = new Resend(options.resendApiKey)
  return resend.emails.send({
    from: options.From,
    to: [options.To],
    subject: options.Subject,
    react: options.Component(options.componentProps),
    headers: options.type === 'broadcast' && options.unsubscribeLinkUrl
      ? { 'List-Unsubscribe': `<${options.unsubscribeLinkUrl}>` }
      : {},
  })
}
```

### 2. Personal Organization Service

**Source**: `apps/*/src/lib/personal-organization-service.ts`
**Target**: `@coursebuilder/adapter-drizzle` or `@coursebuilder/core`

Functions to extract:
- `ensurePersonalOrganizationWithLearnerRole(user, adapter)`
- `getPersonalOrganization(user, adapter)`

### 3. Cohort Entitlement Sync Utilities

**Source**: `apps/*/src/lib/cohort-entitlements.ts` (if exists)
**Target**: `@coursebuilder/core/cohorts`

---

## Inngest Functions Stay in Apps

Keep these in apps but track canonical versions for manual sync:

| Function | Canonical App | Uses Utilities |
|----------|---------------|----------------|
| `email-send-broadcast.ts` | Any | `sendAnEmail()` |
| `ensure-personal-organization.ts` | Any | personal-org-service |
| `create-user-organization.ts` | epicdev-ai | - |
| `cohort-entitlement-sync-workflow.ts` | ai-hero | cohort utilities |

---

## Key Finding: Heavy App Dependencies (Why Functions Stay)

Inngest functions have these app-specific dependencies that can't be extracted:
- `@/inngest/inngest.server` - App-specific inngest client with app ID
- `@/inngest/events/*` - App-specific event definitions
- `@/emails/*` - App-specific email templates
- `@/env.mjs` - App-specific environment variables

**Strategy**: Extract utilities → Apps import utilities → Inngest functions use imported utilities

---

## Analysis Results

### 100% Identical (2 functions verified)

| Function | MD5 Hash |
|----------|----------|
| `email-send-broadcast.ts` | 28bc363e176c44285609f1e876d16b7a |
| `ensure-personal-organization.ts` | aef8b7f7c3f819835ac00af9ae7ff380 |

### 4/5 Identical (2 functions - ANALYZED)

| Function | Outlier | Majority Hash | Recommendation |
|----------|---------|---------------|----------------|
| `create-user-organization.ts` | epicdev-ai (event delegation) | 58d86cededc2835329f9f0276a1c4c42 | Use epicdev-ai (cleaner architecture) |
| `cohort-entitlement-sync-workflow.ts` | ai-hero (fan-out pattern) | bcb6b8e7fd0ae2300a406341b0063243 | Use ai-hero (more scalable) |

#### create-user-organization.ts Analysis

**4-app version (61 lines)**: Direct inline creation
```typescript
for (const user of users) {
  await step.run('create user organization', async () => {
    await courseBuilderAdapter.createOrganization({...})
  })
}
```

**epicdev-ai version (94 lines)**: Event-driven fan-out
```typescript
for (const user of users) {
  await step.sendEvent(ENSURE_PERSONAL_ORGANIZATION_EVENT, {...})
}
```
**Winner**: epicdev-ai - cleaner event-driven architecture

#### cohort-entitlement-sync-workflow.ts Analysis

**4-app version (145 lines)**: Inline processing with try-catch
- Processes all users inline within workflow
- Detailed error handling per user

**ai-hero version (129 lines)**: Fan-out pattern
- Sends `COHORT_ENTITLEMENT_SYNC_USER_EVENT` per user
- Batches with BATCH_SIZE = 100
- Faster orchestrator completion (~5s)
**Winner**: ai-hero - more scalable fan-out pattern

### Feature Gap Functions (epicdev-ai only)

| Function | Purpose |
|----------|---------|
| `bulk-calendar-invites.ts` | Bulk send calendar invites for events |
| `calendar-sync.ts` | Sync events with Google Calendar |

---

## Canonical Versions Reference

Use this table to track which app has the "best" version of each function:

| Function | Canonical App | Notes |
|----------|---------------|-------|
| `email-send-broadcast.ts` | Any | All identical |
| `ensure-personal-organization.ts` | Any | All identical |
| `create-user-organization.ts` | ai-hero | 4/5 identical |
| `cohort-entitlement-sync-workflow.ts` | dev-build | 4/5 identical, larger |
| `post-purchase-workflow.ts` | ai-hero | Largest (20KB) |
| `product-transfer-workflow.ts` | ai-hero | Largest (21KB) |
| `bulk-calendar-invites.ts` | epicdev-ai | Only exists here |
| `calendar-sync.ts` | epicdev-ai | Only exists here |

---

## Manual Sync Process

When updating an inngest function:

1. Make changes in canonical app
2. Verify with `pnpm --filter="<app>" build`
3. Copy to other apps: `cp apps/ai-hero/src/inngest/functions/X.ts apps/dev-build/src/inngest/functions/`
4. Verify all apps build: `pnpm build:all`

---

## Future Extraction (When Dependencies Move)

When `@coursebuilder/adapter-drizzle` gains query functions:

### Factory Pattern for Extraction

```typescript
// packages/next/src/inngest/email-send-broadcast.ts
export function createEmailBroadcastFunction(deps: {
  inngest: Inngest
  db: Database
  emailComponent: React.ComponentType
  communicationPreferencesTable: Table
  emailSendEvent: string
}) {
  return deps.inngest.createFunction(
    { id: 'email-send-broadcast' },
    { event: deps.emailSendEvent },
    async ({ event }) => {
      // Implementation using deps
    }
  )
}

// apps/ai-hero/src/inngest/functions/email-send-broadcast.ts
import { createEmailBroadcastFunction } from '@coursebuilder/next/inngest'
import { inngest } from '@/inngest/inngest.server'
import { db } from '@/db'
import { communicationPreferences } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'

export const emailSendBroadcast = createEmailBroadcastFunction({
  inngest,
  db,
  emailComponent: BasicEmail,
  communicationPreferencesTable: communicationPreferences,
  emailSendEvent: 'email/send-broadcast',
})
```

---

## Subdirectory Structure (Reference)

Each app has these inngest subdirectories:

| Directory | Purpose | Apps |
|-----------|---------|------|
| `cloudinary/` | Image processing | All 5 |
| `concepts/` | AI concept tagging | All 5 |
| `convertkit/` | Email subscriber sync | All 5 |
| `discord/` | Discord role management | All 5 |
| `coupon/` | Coupon workflows | All 5 |
| `notify/` | Notifications | dev-build, just-react, code-with-antonio |
| `ocr/` | OCR processing | dev-build, just-react, code-with-antonio |

---

## Verification

```bash
# Compare function hashes
md5 apps/*/src/inngest/functions/email-send-broadcast.ts

# Test locally
pnpm --filter="ai-hero" dev
# Trigger events via Inngest dev server

# Build all apps
pnpm build:all
```
