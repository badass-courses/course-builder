# Architectural Review: Team Subscriptions Feature

**Branch:** `vh/feat/cwa/subscriptions` **Date:** January 15, 2026
**Perspective:** System Architecture & Pattern Consistency

---

## Executive Summary

This review examines how the subscription feature fits into the existing
architecture, compares patterns with existing flows (cohort/workshop purchases,
bulk purchases), and identifies systemic concerns that go beyond line-by-line
code review.

---

## 1. Access Control Model Comparison

### Existing Model (Purchase-based)

```
User → Purchase → Product → ContentResource
                       ↓
                  Entitlement
                       ↓
                  (contentIds in metadata)
```

- Purchase is the source of truth
- Entitlements store `contentIds` array pointing to specific resources
- Ability system checks entitlements for matching `contentIds`

### New Model (Subscription-based)

```
User → Subscription → Product → [multiple ContentResources]
                          ↓
                     Entitlement
                          ↓
                     (productId in metadata)
```

- Subscription is the source of truth
- Entitlements store `productId` (not individual content IDs)
- Ability system checks if module's `resourceProducts` contains the
  subscription's product

### Inconsistency Analysis

| Aspect            | Purchase Model      | Subscription Model       | Concern Level  |
| ----------------- | ------------------- | ------------------------ | -------------- |
| Content targeting | Direct (contentIds) | Indirect (via product)   | ⚠️ Medium      |
| Granularity       | Per-resource        | All resources of product | ✅ Intentional |
| Expiration        | None (perpetual)    | Yes (period end)         | ✅ Correct     |
| Soft delete       | On refund           | On cancel                | ✅ Consistent  |

**Key Observation:** The subscription model is fundamentally different - it
grants access to _all content attached to a product_, not specific resources.
This is intentional but creates a different mental model.

---

## 2. Team Access Flow Comparison

### Bulk Purchase Team Flow (Existing)

```
1. Owner buys with quantity > 1
2. System creates Purchase + BulkCoupon
3. Owner shares coupon code URL
4. Team member redeems coupon
5. System creates NEW Purchase for team member
6. System creates Entitlements for team member
7. postPurchaseWorkflow runs for team member
```

**Key characteristic:** Each team member gets their own purchase record.

### Subscription Team Flow (New)

```
1. Owner buys subscription with quantity > 1
2. System creates Subscription with seats=N, ownerId
3. Owner claims seat via server action
4. System creates Entitlement (no Purchase)
5. Owner invites team member via server action
6. System creates Entitlement for team member (no Purchase)
7. Team member has access via entitlement
```

**Key characteristic:** Team members only get entitlements, no purchase record.

### Pattern Divergence Assessment

| Aspect             | Bulk Purchase                 | Subscription Teams          | Risk               |
| ------------------ | ----------------------------- | --------------------------- | ------------------ |
| Team member record | Purchase                      | Entitlement only            | ⚠️ Different       |
| Owner claims seat  | Auto on purchase              | Manual claim required       | ⚠️ UX friction     |
| Invite mechanism   | Coupon code                   | Direct email + entitlement  | ⚠️ Different       |
| Refund handling    | `refundEntitlements` workflow | Webhook → soft delete       | ✅ Both work       |
| Email notification | postPurchaseWorkflow          | inviteToSubscription action | ⚠️ Different paths |

**Critical Observation:** The subscription team model doesn't create Purchase
records for team members. This means:

- Team members won't appear in "purchases" queries
- Analytics tied to purchases won't count subscription team members
- Transfer workflows won't work the same way

---

## 3. Inngest Workflow Pattern Analysis

### Existing Pattern (postPurchaseWorkflow)

```typescript
inngest.createFunction(
	{ id: 'post-purchase-workflow', idempotency: 'event.data.purchaseId' },
	[{ event: NEW_PURCHASE_CREATED_EVENT, if: '...' }],
	async ({ event, step, db }) => {
		// 1. Get purchase
		// 2. Get product
		// 3. Get user
		// 4. Create org membership
		// 5. Create entitlement
		// 6. Send Discord event
		// 7. Send welcome email
	},
)
```

**Characteristics:**

- Single responsibility per product type (handled via config)
- Uses shared `PRODUCT_TYPE_CONFIG` for polymorphism
- Delegates to shared `createResourceEntitlements`

### Subscription Checkout Handler (New)

```typescript
inngest.createFunction(
	{ id: 'stripe-subscription-checkout-session-completed' },
	[{ event: STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT, if: '...' }],
	async ({ event, step, db }) => {
		// 1. Parse subscription info
		// 2. Get/create user
		// 3. Get merchant product
		// 4. Create subscription record
		// 5. Store fields (seats, ownerId)
		// 6. Create org membership
		// 7. Create entitlement (only for single-seat)
	},
)
```

**Divergence:**

- Does NOT use `PRODUCT_TYPE_CONFIG`
- Does NOT send Discord role event
- Does NOT send welcome email (for team subscriptions)
- Manual field management instead of letting adapter handle it

### Missing in Subscription Flow

1. **Discord role assignment** - Existing purchases trigger
   `USER_ADDED_TO_WORKSHOP_EVENT`. Subscriptions don't.
2. **Welcome email** - Individual purchases send emails. Subscription checkout
   doesn't.
3. **Product type config integration** - Not added to `PRODUCT_TYPE_CONFIG`

---

## 4. Configuration Gap: PRODUCT_TYPE_CONFIG

The existing system uses a centralized config for product behavior:

```typescript
// Current config (missing membership)
export const PRODUCT_TYPE_CONFIG = {
  cohort: { ... },
  'self-paced': { ... },
  // membership: { ??? }  // NOT DEFINED
}
```

The subscription code checks for membership separately:

```typescript
if (!config.queryFn) {
	return null // Membership products don't have resources
}
```

**Recommendation:** Add membership to `PRODUCT_TYPE_CONFIG`:

```typescript
membership: {
  resourceType: null,  // No direct resource
  queryFn: null,       // No query (access via product)
  contentAccess: 'subscription_access',
  discordRole: 'subscription_discord_role',
  createEntitlement: createSubscriptionEntitlement,
  discordEvent: USER_ADDED_TO_SUBSCRIPTION_EVENT,  // NEW
  logPrefix: 'subscription',
  getDiscordRoleId: (product) => product?.fields?.discordRoleId || env.DISCORD_SUBSCRIBER_ROLE_ID,
}
```

---

## 5. Data Model Inconsistencies

### Subscription Fields Storage

Subscriptions store team info in `fields` JSON column:

```typescript
subscription.fields = {
	seats: number,
	ownerId: string,
}
```

**Concerns:**

1. No schema validation at DB level (only Zod at runtime)
2. Webhook handler must preserve existing fields when updating
3. If fields are corrupted, seat management breaks

### Entitlement Expiration

Purchase entitlements: No expiration (perpetual access) Subscription
entitlements: Expires at `current_period_end`

The ability system must handle both:

```typescript
// Must check: (!expires || expires > new Date())
```

This is implemented correctly, but it's a new pattern that wasn't needed before.

---

## 6. Webhook Reliability Concerns

### Checkout Session Completed

The existing webhook handler was improved to dispatch subscription events to
Inngest:

```typescript
case 'checkout.session.completed':
  // Dispatches to Inngest (existing behavior)
```

### Subscription Updated

New: `customer.subscription.updated` now dispatched to Inngest:

```typescript
case 'customer.subscription.updated':
  await options.inngest.send({
    name: STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT,
    ...
  })
```

**Reliability Concern:** What if Inngest handler fails?

- Stripe won't retry (webhook returned 2xx)
- Entitlements could get out of sync with Stripe

**Recommendation:** Add reconciliation mechanism:

1. Periodic sync job comparing Stripe subscriptions to local state
2. Or return 5xx from webhook if Inngest send fails

---

## 7. Access Control Edge Cases

### Module Without Product

The ability check for subscription access requires:

```typescript
const moduleInSubscription = module.resourceProducts?.some(
	(rp) => rp.productId === subscriptionProductId,
)
```

If a workshop has NO `resourceProducts`, the subscription won't grant access.
This is probably correct, but worth noting.

### Commented Out Free Content Logic

```typescript
// if (isWorkshopFreelyWatchable(viewerAbilityInput)) {
//   can('read', 'Content', {...})
// }
```

This breaks a fundamental assumption: workshops without products are free. The
comment suggests this is intentional, but it's a significant behavior change.

### Subscription Tier System

New tier system (`standard`, `pro`) is added but not fully integrated:

- Products can have `tier` field
- Entitlements store `tier` in metadata
- `subscription-tier-access.ts` has helpers

But the ability system doesn't enforce tier restrictions yet. Resources would
need `tier` metadata to restrict access.

---

## 8. Commerce-Next Package Impact

The `subscription-welcome-page.tsx` changes are breaking:

**Before:**

```typescript
stripeSubscription: Stripe.Subscription
billingPortalUrl: string
```

**After:**

```typescript
stripeSubscription: StripeSubscriptionData  // Serializable subset
billingPortalUrl: string | null
teamSection?: React.ReactNode
```

Other apps using this component will need updates:

- `apps/ai-hero`
- `apps/dev-build`
- `apps/epicdev-ai`
- `apps/craft` (based on changeset)

The branch includes fixes for these, but if any were missed, builds will fail.

---

## 9. Comparison: Refund vs Cancellation

### Purchase Refund (Existing)

```
REFUND_PROCESSED_EVENT
       ↓
refundEntitlements (Inngest function)
       ↓
softDeleteEntitlementsForPurchase()
       ↓
Optionally: Remove Discord role (separate workflow)
```

### Subscription Cancellation (New)

```
customer.subscription.updated (webhook)
       ↓
handleSubscriptionUpdated (Inngest function)
       ↓
softDeleteEntitlementsForSubscription()
       ↓
??? Discord role removal ???
```

**Gap:** Subscription cancellation doesn't remove Discord roles. Existing
`remove-purchase-role-discord.ts` only handles purchases.

---

## 10. Testing Strategy Gaps

### What's Tested

- ✅ Ability rule logic (purchase-validators.test.ts)
- ✅ Subscription entitlement rules (subscription-entitlements.test.ts)
- ✅ Tier access logic (subscription-tier-access.test.ts)

### What's Missing

- ❌ Inngest function integration tests
- ❌ Webhook → Inngest → DB flow tests
- ❌ Concurrent seat claim race conditions
- ❌ Subscription status transition tests (active → canceled → active)

---

## 11. Recommendations Summary

### Critical (Should Fix Before Merge)

1. **Add Discord role handling for subscriptions**
   - Trigger role assignment on subscription creation
   - Trigger role removal on subscription cancellation

DONE

2. **Add welcome email for subscription purchases**
   - Parity with purchase flow
   - Or document intentional omission

DONE

3. **Re-evaluate commented `isWorkshopFreelyWatchable`**
   - Could break free content access
   - Need explicit decision documented

DONE

### Important (Should Address Soon)

4. **Add membership to `PRODUCT_TYPE_CONFIG`**

   - Enables code reuse with existing patterns
   - Reduces special-casing

5. **Add Stripe subscription reconciliation job**

   - Periodic sync to catch webhook failures
   - Prevents subscription state drift

6. **Document subscription vs purchase mental model differences**
   - Team members = entitlements only (no purchase record)
   - Analytics implications

### Nice to Have

7. **Unify team invite flows**

   - Both bulk and subscription could use similar invite mechanism
   - Reduces cognitive load for users

8. **Add subscription events to typing system**
   - `USER_ADDED_TO_SUBSCRIPTION_EVENT` for consistency

---

## 12. Architecture Decision Record

### ADR: Subscription Team Members Don't Get Purchase Records

**Context:** Bulk purchase teams give each member a Purchase. Subscription teams
only give Entitlements.

**Decision:** Subscription team members are tracked via entitlements with
`sourceType: 'SUBSCRIPTION'`.

**Consequences:**

- ✅ Cleaner model (subscription is the source of truth)
- ✅ Easier seat count (count entitlements, not purchases)
- ⚠️ Purchase-based analytics miss subscription members
- ⚠️ Transfer workflows don't apply to subscription members
- ⚠️ "My Purchases" page won't show subscription access

**Status:** Implemented in this PR. Should be documented.

---

## Conclusion

The subscription feature introduces a parallel access control model that's
conceptually similar but mechanically different from the purchase-based model.
The implementation is solid for the core flows, but several integrations
(Discord roles, welcome emails, product type config) were not carried over from
the existing patterns.

**Architectural Risk Level:** Medium

- Core functionality works
- Edge cases may have gaps
- Some ecosystem integrations missing

**Recommended Action:** Address critical gaps (Discord, emails) before
production deployment, then iterate on the rest.
