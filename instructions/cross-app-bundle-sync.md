# Cross-App Bundle Sync System

## Overview

Enable product bundling across apps (e.g., Total TypeScript + AI Hero bundles) using Inngest as an event-driven sync engine. Each app maintains its own database, tech stack, and codebase while Inngest coordinates entitlement grants.

**Key Point:** This is NOT a migration. TT stays on products-2 repo, AI Hero stays on course-builder. Inngest bridges them.

---

## Architecture

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       Total TypeScript          │       │           AI Hero               │
│       (products-2 repo)         │       │      (course-builder repo)      │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ • Prisma + MySQL                │       │ • Drizzle + MySQL               │
│ • @skillrecordings/*            │       │ • @coursebuilder/*              │
│ • Pages Router (Next 14)        │       │ • App Router (Next 16)          │
│ • NextAuth v4                   │       │ • NextAuth v5                   │
│ • Purchase-based access         │       │ • Entitlement-based access      │
│ • TT Stripe account (primary)   │       │ • AH Stripe account             │
│ • TT Inngest (own event key)    │       │ • AH Inngest (own event key)    │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 │  ┌─────────────────────────────────┐    │
                 │  │   HTTP Bridge (inn.gs/e/{key})  │    │
                 │  │                                 │    │
                 │  │  TT ──bundle/purchased────▶ AH  │    │
                 │  │  TT ◀──entitlement/granted── AH │    │
                 │  │  TT ──entitlement/revoke──▶ AH  │    │
                 │  │  TT ◀──entitlement/revoked── AH │    │
                 │  │  ◀────account/linked─────▶      │    │
                 │  └─────────────────────────────────┘    │
                 │                                         │
        ┌────────┴────────┐                     ┌──────────┴────────┐
        │   TT Inngest    │                     │    AH Inngest     │
        │   Environment   │                     │   Environment     │
        └─────────────────┘                     └───────────────────┘

Cross-App Events (via HTTP bridge):
  → bundle/purchased     (TT → AI Hero)
  ← entitlement/granted  (AI Hero → TT)
  → entitlement/revoke   (TT → AI Hero)
  ← entitlement/revoked  (AI Hero → TT)
  ↔ account/linked       (bidirectional)
  ↔ user/oauth-login     (bidirectional)
```

---

## Inngest Setup (Separate Environments + HTTP Bridge)

Each app keeps its own Inngest environment. Cross-app events are sent via HTTP to the other app's Inngest.

**Why not shared event key?**
- Both apps already have Inngest with their own event keys
- Merging could cause event name collisions (e.g., both have `purchase/created`)
- HTTP bridge is safer - zero changes to existing functions

### Configuration

```bash
# Total TypeScript .env
INNGEST_EVENT_KEY=tt-event-key          # TT's own key
INNGEST_SIGNING_KEY=tt-signing-key
AI_HERO_INNGEST_EVENT_KEY=ah-event-key  # For sending to AI Hero

# AI Hero .env
INNGEST_EVENT_KEY=ah-event-key          # AI Hero's own key
INNGEST_SIGNING_KEY=ah-signing-key
TT_INNGEST_EVENT_KEY=tt-event-key       # For sending to TT
```

### Cross-App Event Utility

```typescript
// products-2/apps/total-typescript/src/lib/cross-app-events.ts

const CROSS_APP_INNGEST_KEYS: Record<string, string> = {
  'ai-hero': process.env.AI_HERO_INNGEST_EVENT_KEY!,
}

export async function sendCrossAppEvent(
  targetApp: 'ai-hero',
  event: { name: string; data: Record<string, unknown> }
) {
  const eventKey = CROSS_APP_INNGEST_KEYS[targetApp]

  if (!eventKey) {
    throw new Error(`No Inngest event key configured for ${targetApp}`)
  }

  const response = await fetch(`https://inn.gs/e/${eventKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })

  if (!response.ok) {
    throw new Error(`Failed to send cross-app event: ${response.statusText}`)
  }

  return response.json()
}
```

```typescript
// course-builder/apps/ai-hero/src/lib/cross-app-events.ts

const CROSS_APP_INNGEST_KEYS: Record<string, string> = {
  'total-typescript': process.env.TT_INNGEST_EVENT_KEY!,
}

export async function sendCrossAppEvent(
  targetApp: 'total-typescript',
  event: { name: string; data: Record<string, unknown> }
) {
  const eventKey = CROSS_APP_INNGEST_KEYS[targetApp]

  if (!eventKey) {
    throw new Error(`No Inngest event key configured for ${targetApp}`)
  }

  const response = await fetch(`https://inn.gs/e/${eventKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })

  if (!response.ok) {
    throw new Error(`Failed to send cross-app event: ${response.statusText}`)
  }

  return response.json()
}
```

### Usage

```typescript
// TT: Send event to AI Hero's Inngest
import { sendCrossAppEvent } from '@/lib/cross-app-events'

await sendCrossAppEvent('ai-hero', {
  name: 'bundle/purchased',
  data: {
    purchaseId: purchase.id,
    buyerEmail: user.email,
    // ...
  }
})

// AI Hero: Send event to TT's Inngest
import { sendCrossAppEvent } from '@/lib/cross-app-events'

await sendCrossAppEvent('total-typescript', {
  name: 'entitlement/granted',
  data: {
    sourcePurchaseId: purchaseId,
    entitlementId: entitlement.id,
    // ...
  }
})
```

---

## Stripe Setup

TT Stripe account is primary for bundle sales. Each app keeps its own Stripe for single-product purchases.

```
TT Stripe Account (Primary for bundles)
├── TT-only products
└── Bundle products (TT + AI Hero)
    └── metadata.bundleProducts = [{ app: 'ai-hero', productId: '...' }]

AI Hero Stripe Account
└── AI Hero-only products
```

---

## User Identity Linking

Users must explicitly link their accounts across apps (with OAuth auto-link when possible).

### Linking Methods

#### 1. OAuth-Based Auto-Link (Preferred)

Same GitHub/Discord on both apps = automatic link:

```
User logs into TT with GitHub (providerAccountId: "gh_12345")
User logs into AI Hero with GitHub (providerAccountId: "gh_12345")
    ↓
Same providerAccountId = Auto-linked
```

#### 2. Explicit Link Flow (Fallback)

```
TT: "Link your AI Hero account" → Redirect with signed JWT
    ↓
AI Hero: User logs in + confirms
    ↓
Link stored in both DBs
```

---

## Database Changes

### Total TypeScript (Prisma)

```prisma
// Add to products-2/packages/database/prisma/schema.prisma

model AccountLink {
  id            String    @id @default(uuid())
  userId        String
  linkedApp     String    // 'ai-hero'
  linkedUserId  String
  linkedEmail   String?
  linkMethod    String    // 'oauth-github' | 'oauth-discord' | 'explicit'
  linkedAt      DateTime  @default(now())
  unlinkedAt    DateTime?

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([linkedApp, linkedUserId])
}

model CrossAppSync {
  id                  String    @id @default(uuid())
  purchaseId          String
  targetApp           String    // 'ai-hero'
  targetProductId     String
  status              String    @default("pending") // 'pending' | 'synced' | 'failed' | 'revoked'
  targetEntitlementId String?
  targetUserId        String?
  errorMessage        String?
  retryCount          Int       @default(0)
  createdAt           DateTime  @default(now())
  syncedAt            DateTime?
  revokedAt           DateTime?

  purchase            Purchase  @relation(fields: [purchaseId], references: [id], onDelete: Cascade)

  @@index([purchaseId])
  @@index([status])
}

// Add to existing models:
model Purchase {
  // ... existing fields ...
  crossAppSyncs   CrossAppSync[]
}

model User {
  // ... existing fields ...
  accountLinks    AccountLink[]
}
```

### AI Hero (Drizzle)

```typescript
// Add to course-builder/apps/ai-hero/src/db/schema.ts

export const accountLinks = mysqlTable('AccountLink', {
  id: varchar('id', { length: 191 }).primaryKey(),
  userId: varchar('userId', { length: 191 }).notNull(),
  linkedApp: varchar('linkedApp', { length: 50 }).notNull(),
  linkedUserId: varchar('linkedUserId', { length: 191 }).notNull(),
  linkedEmail: varchar('linkedEmail', { length: 255 }),
  linkMethod: varchar('linkMethod', { length: 50 }),
  linkedAt: timestamp('linkedAt').defaultNow().notNull(),
  unlinkedAt: timestamp('unlinkedAt'),
})

// Extend entitlements table with:
// - status: 'active' | 'pending' | 'revoked'
// - pendingForEmail: string (for unclaimed bundle access)
// - sourceApp: string
// - sourcePurchaseId: string
// - claimedAt: timestamp
```

---

## Event Flow

### Bundle Purchase

```
1. User buys bundle on TT
   ↓
2. TT creates Purchase record
   ↓
3. TT checks: Does user have linked AI Hero account?
   │
   ├─ YES: Include linkedUserId in event
   │
   └─ NO: Include email only → AI Hero creates PENDING entitlement
   ↓
4. TT emits: bundle/purchased
   ↓
5. TT creates CrossAppSync (status: 'pending')
   ↓
6. AI Hero receives event, creates entitlement
   ↓
7. AI Hero emits: entitlement/granted
   ↓
8. TT updates CrossAppSync (status: 'synced')
```

### Account Link → Claim Pending

```
1. User links TT account to AI Hero
   ↓
2. account/linked event emitted
   ↓
3. AI Hero checks for pending entitlements matching TT email
   ↓
4. Pending entitlements activated
   ↓
5. User notified
```

### Refund

```
1. TT processes refund
   ↓
2. TT emits: entitlement/revoke
   ↓
3. AI Hero revokes entitlements
   ↓
4. AI Hero emits: entitlement/revoked
   ↓
5. TT updates CrossAppSync (status: 'revoked')
```

---

## Inngest Functions Summary

### Total TypeScript

| Function | Trigger | Action |
|----------|---------|--------|
| `emit-bundle-purchase` | purchase/created | Emit bundle/purchased if cross-app products |
| `handle-entitlement-granted` | entitlement/granted | Update CrossAppSync status |
| `emit-revocation` | purchase/refunded | Emit entitlement/revoke |
| `handle-account-linked` | account/linked | Create reciprocal AccountLink |
| `emit-oauth-login` | user signs in with OAuth | Emit user/oauth-login |

### AI Hero

| Function | Trigger | Action |
|----------|---------|--------|
| `handle-bundle-purchase` | bundle/purchased | Create entitlement (active or pending) |
| `handle-revocation` | entitlement/revoke | Revoke entitlements |
| `claim-pending-entitlements` | account/linked | Activate pending entitlements |
| `check-oauth-autolink` | user/oauth-login | Auto-link if matching OAuth ID |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] TT: Add AccountLink, CrossAppSync to Prisma schema
- [ ] AH: Add accountLinks table, extend entitlements
- [ ] TT: Add `sendCrossAppEvent` utility + AI_HERO_INNGEST_EVENT_KEY env var
- [ ] AH: Add `sendCrossAppEvent` utility + TT_INNGEST_EVENT_KEY env var
- [ ] Both: Add CROSS_APP_SECRET env var (for JWT signing)

### Phase 2: Account Linking (Week 1-2)
- [ ] TT: POST /api/account-link/initiate
- [ ] AH: /account-link/confirm page
- [ ] TT: Handle account/linked event
- [ ] Both: OAuth auto-link on login

### Phase 3: Bundle Sync (Week 2)
- [ ] TT: Add bundleProducts config to products
- [ ] TT: Emit bundle/purchased on purchase
- [ ] AH: Handle bundle/purchased, create entitlements
- [ ] TT: Handle entitlement/granted confirmation

### Phase 4: Revocation (Week 2-3)
- [ ] TT: Emit entitlement/revoke on refund
- [ ] AH: Handle revocation
- [ ] TT: Handle entitlement/revoked confirmation

### Phase 5: UI & Email (Week 3)
- [ ] TT: Bundle upsell component on checkout
- [ ] AH: Pending access banner
- [ ] AH: Email templates (access granted, pending, claimed)
- [ ] Both: Link management in account settings

### Phase 6: Testing & Launch (Week 3-4)
- [ ] Integration tests
- [ ] Manual QA
- [ ] Monitoring & alerts setup

---

## Timeline: ~4 weeks

| Week | Focus |
|------|-------|
| 1 | Schema + Account linking |
| 2 | Bundle sync + Revocation |
| 3 | UI + Emails |
| 4 | Testing + Launch |
