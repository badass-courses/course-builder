# Code Review: Team Subscriptions Feature

**Branch:** `vh/feat/cwa/subscriptions`
**Base:** `main`
**Review Date:** January 15, 2026
**Files Changed:** 55 files (+4,195 lines / -432 lines)

---

## Summary

This PR implements a comprehensive team subscription system for Code With
Antonio, enabling multi-seat subscription purchases and management. The feature
includes:

1. **Single-seat subscriptions** - Automatic entitlement creation for solo
   subscribers
2. **Team subscriptions** (seats > 1) - Owner-managed seat allocation with
   invite system
3. **Subscription lifecycle management** - Handling renewals, cancellations, and
   reactivations via Stripe webhooks
4. **Entitlement-based access control** - Subscription entitlements grant
   content access

---

## Architecture Overview

### Key Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Stripe Webhooks                              │
│  checkout.session.completed │ customer.subscription.updated      │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│ event-subscription-       │   │ handle-subscription-updated   │
│ checkout-session-completed│   │ (renewal/cancel/reactivate)   │
└───────────────┬───────────┘   └───────────────┬───────────────┘
                │                               │
                ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Entitlements Table                             │
│  sourceType: 'SUBSCRIPTION' │ userId │ expiresAt │ metadata     │
└─────────────────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Ability System                                │
│  defineRulesForPurchases() → checks subscription entitlements    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Review by Area

### 1. Core Package Changes (`packages/core`)

#### New Schema Fields

**File:** `packages/core/src/schemas/product-schema.ts`

- ✅ Added `SubscriptionTierSchema` ('standard' | 'pro')
- ✅ Added `BillingIntervalSchema` ('month' | 'year')
- ✅ Extended product fields with `tier` and `billingInterval`

**File:** `packages/core/src/schemas/stripe/subscription.ts`

- ✅ Added missing status: `'paused'`
- ✅ Added `current_period_end`, `cancel_at`, `cancel_at_period_end`

#### Adapter Interface

**File:** `packages/core/src/adapters.ts`

- ✅ Added `updateSubscriptionStatus(subscriptionId, status)` to interface
- ✅ Added mock implementation

#### Stripe Provider

**File:** `packages/core/src/providers/stripe.ts`

- ✅ Added `updateSubscriptionItemQuantity()` for seat management
- ⚠️ **Note:** Returns `Promise<Stripe.SubscriptionItem>` - type added to
  `PaymentsAdapter`

#### Webhook Processing

**File:** `packages/core/src/lib/pricing/process-stripe-webhook.ts`

- ✅ Now dispatches `customer.subscription.updated` events to Inngest
- Previously just logged, now triggers lifecycle handling

### 2. Drizzle Adapter Changes (`packages/adapter-drizzle`)

**File:** `packages/adapter-drizzle/src/lib/mysql/index.ts`

#### Price Recreation Logic (Lines ~1604-1680)

- ✅ Handles type transitions (one-time ↔ membership)
- ✅ Handles billing interval changes
- ✅ Detects Stripe price mismatch (membership product with one-time price)
- ✅ Creates recurring prices for membership products

```typescript
// Good: Comprehensive price update triggers
const needsPriceRecreation =
	priceChanged ||
	becameMembership ||
	wasMemership ||
	billingIntervalChanged ||
	stripePriceMismatch
```

#### New Adapter Method

```typescript
updateSubscriptionStatus: async (subscriptionId, status) => {
	await client
		.update(subscriptionTable)
		.set({ status })
		.where(eq(subscriptionTable.id, subscriptionId))
}
```

✅ Simple, correct implementation

### 3. Commerce-Next Package Changes

#### SubscriptionWelcomePage (`packages/commerce-next/src/post-purchase/subscription-welcome-page.tsx`)

**Breaking Change:** Props interface changed significantly

Before:

```typescript
stripeSubscription: Stripe.Subscription // Full Stripe object
billingPortalUrl: string // Required
```

After:

```typescript
stripeSubscription: StripeSubscriptionData  // Serializable subset
billingPortalUrl: string | null             // Optional (null for claimed seats)
teamSection?: React.ReactNode               // New slot for team widget
```

✅ Good: Now uses serializable data type for RSC compatibility
✅ Good: `billingPortalUrl` nullable for non-owners
✅ Good: Added `teamSection` slot for composition

#### InviteTeam (`packages/commerce-next/src/team/invite-team.tsx`)

Major refactor to support both bulk purchases and subscriptions:

- ✅ Added `TeamSource` union type discriminator
- ✅ New composable API with `Root`, `SeatsAvailable`, `SelfRedeemButton`, etc.
- ✅ Callbacks for `onSelfClaim`, `onInvite`, `onRemove`
- ⚠️ **Note:** Backward compatible - old usage still works

#### New Types (`packages/commerce-next/src/team/types.ts`)

```typescript
export type TeamSource =
  | { type: 'bulk-purchase'; purchase: Purchase; ... }
  | { type: 'subscription'; subscription: Subscription; ... }
```

✅ Clean discriminated union for polymorphic behavior

### 4. Inngest Functions (Code-With-Antonio)

#### Subscription Checkout Handler

**File:**
`src/inngest/functions/membership/event-subscription-checkout-session-completed.ts`

Key behavior change:

- **Single seat (qty=1):** Auto-creates entitlement for purchaser
- **Team (qty>1):** No auto-entitlement; owner must claim via /team page

```typescript
// Store seat count and owner for all subscriptions
await step.run('store subscription fields', async () => {
	await drizzleDb
		.update(subscriptionTable)
		.set({
			fields: {
				seats: subscriptionInfo.quantity,
				ownerId: user.id,
			},
		})
		.where(eq(subscriptionTable.id, subscription.id))
})
```

✅ Good: Consistent with bulk purchase behavior
⚠️ **Note:** Relies on `subscription.fields` JSON column

#### Subscription Update Handler

**File:** `src/inngest/functions/membership/handle-subscription-updated.ts`

Handles Stripe lifecycle events:

- `cancel_at_period_end` change → Update entitlement expiration
- Status change to `canceled`/`unpaid` → Soft delete entitlements
- Reactivation → Restore entitlements
- Period end change (renewal) → Extend expiration
- Quantity change → Sync seat count

```typescript
// Good: Defensive check for missing ownerId
if (!currentFields.ownerId) {
	console.warn(
		`Webhook: Subscription ${subscription.id} missing ownerId, skipping seat sync to avoid data loss`,
	)
	return { action: 'skipped_missing_ownerId' }
}
```

### 5. Server Actions

**File:** `src/lib/actions/team-subscription-actions.ts`

Four actions implemented:

1. `claimSubscriptionSeat()` - Owner claims their seat
2. `inviteToSubscription()` - Invite by email (creates user + entitlement)
3. `removeFromSubscription()` - Soft delete entitlement
4. `addSeatsToSubscription()` - Update Stripe quantity

✅ All use `revalidatePath('/team')` for cache invalidation
✅ Email sending for invites (with fallback if email fails)
⚠️ **Note:** `inviteToSubscription` creates entitlement immediately (no pending
state)

### 6. Entitlements System

#### New Functions (`src/lib/entitlements.ts`)

```typescript
createSubscriptionEntitlement()
softDeleteEntitlementsForSubscription()
restoreEntitlementsForSubscription()
updateEntitlementExpirationForSubscription()
```

✅ All use `sourceType: 'SUBSCRIPTION'` and `sourceId: subscriptionId`
✅ Soft delete preserves history

#### Team Subscription Queries (`src/lib/team-subscriptions.ts`)

- `getTeamSubscriptionsForUser()` - Gets owned team subscriptions
- `getTeamSubscription()` - Single subscription with members
- `hasUserClaimedSeat()` - Check if user has active entitlement
- `getSubscriptionFields()` - Parse/validate `subscription.fields`

✅ Good: Zod validation with `TeamSubscriptionFieldsSchema`
✅ Good: `z.coerce.number()` handles JSON serialization quirks

### 7. Ability System Changes

**File:** `src/ability/index.ts`

New rules added:

```typescript
// Team access - bulk purchases or team subscriptions
if (hasBulkPurchase(purchases) || hasTeamSubscription(teamSubscriptions)) {
	can('read', 'Team')
}

// Subscription entitlements grant Discord access
if (hasActiveSubscription) {
	can('read', 'Discord')
}

// Grant Content access for modules attached to subscription product
if (moduleInSubscription) {
	can('read', 'Content', { id: module.id })
	can('read', 'Content', { id: { $in: allModuleResourceIds } })
}
```

⚠️ **Note:** Commented out `isWorkshopFreelyWatchable` check - may affect free
content

### 8. UI Components

#### Welcome Page Team Widget

**File:** `src/app/(commerce)/welcome/welcome-team-widget.tsx`

- Client component using InviteTeam composables
- Shows seat availability, invite link, member list
- Handles claim/invite/remove actions with toasts

#### Team Page Updates

**File:** `src/app/(user)/team/page_client.tsx`

- New `SubscriptionTeamCard` component
- Email invite form (direct invite, not link-based)
- Add seats UI with proration notice
- Member list with remove buttons

#### Profile Page Subscription Section

**File:** `src/app/(user)/profile/page.tsx`

- Shows subscription status, billing, next payment
- Manage Billing button (links to Stripe portal)
- Only visible to billing managers

---

## Potential Issues & Concerns

### 1. **Data Migration**

Existing subscriptions won't have `fields.seats` or `fields.ownerId`. The
webhook handler has defensive checks, but initial data population may be needed.

### 2. **Entitlement Type Prerequisite**

```typescript
const subscriptionEntitlementType = await db.getEntitlementTypeByName(
	'subscription_access',
)
if (!subscriptionEntitlementType) {
	throw new Error('subscription_access entitlement type not found')
}
```

**Requires:** `subscription_access` entry in `entitlementTypes` table

### 3. **Immediate Invite Creation**

`inviteToSubscription()` creates entitlement immediately rather than pending
state. User receives access before clicking email link.

### 4. **Free Content Access**

The `isWorkshopFreelyWatchable` check is commented out:

```typescript
// if (isWorkshopFreelyWatchable(viewerAbilityInput)) {
//   can('read', 'Content', {...})
// }
```

This may block access to truly free workshops.

### 5. **Date Handling**

Entitlement expiration uses Stripe timestamps (Unix seconds):

```typescript
const newExpiration =
	typeof periodEnd === 'number'
		? new Date(periodEnd * 1000)
		: new Date(periodEnd)
```

⚠️ Handles both number and string, but watch for timezone issues.

### 6. **Homepage Query Optimization**

`getAllWorkshops()` now fetches shallower resource tree:

```typescript
// Only fetch one level of resources for homepage listing
// Deep nesting can cause stack overflow during RSC serialization
```

✅ This is a good performance fix

---

## Test Coverage

### Unit Tests Added

1. `src/ability/purchase-validators.test.ts` - Team subscription validators
2. `src/lib/__tests__/subscription-entitlements.test.ts` - Entitlement rules
3. `src/utils/__tests__/subscription-tier-access.test.ts` - Tier access logic

### Missing Tests

- Integration tests for Inngest handlers
- E2E tests for full purchase → access flow
- Edge cases: concurrent seat claims, race conditions

---

## Security Considerations

1. ✅ Owner verification in all team actions
2. ✅ Billing portal access restricted by ability check
3. ✅ Entitlement soft delete (not hard delete)
4. ⚠️ No rate limiting on invite action
5. ⚠️ Email invites create access immediately

---

## Recommendations

### Must Fix Before Merge

1. Ensure `subscription_access` entitlement type exists in database
2. Consider adding pending invite state vs immediate entitlement
3. Re-evaluate commented `isWorkshopFreelyWatchable` logic

### Should Consider

1. Add rate limiting to invite actions
2. Add E2E tests for critical flows
3. Consider webhook retry handling for failed entitlement creation
4. Add admin UI for subscription management

### Nice to Have

1. Invite expiration/revocation
2. Seat transfer between users
3. Audit log for team changes

---

## Files to Pay Special Attention To

| File                                                              | Reason                                           |
| ----------------------------------------------------------------- | ------------------------------------------------ |
| `src/inngest/functions/membership/handle-subscription-updated.ts` | Complex state machine for subscription lifecycle |
| `src/lib/actions/team-subscription-actions.ts`                    | All server actions, security boundary            |
| `src/ability/index.ts`                                            | Access control rules, security critical          |
| `packages/adapter-drizzle/src/lib/mysql/index.ts`                 | Price recreation logic for Stripe                |

---

## Verdict

**Recommendation:** ✅ Approve with minor fixes

The implementation is well-structured with good separation of concerns. The
entitlement-based system is flexible and the webhook handling is comprehensive.
A few edge cases and the commented-out free content logic should be addressed
before production deployment.
