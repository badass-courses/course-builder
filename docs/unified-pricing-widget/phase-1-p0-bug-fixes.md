# Phase 1: P0 Bug Fixes

**Status:** In Progress
**Priority:** P0 (Critical)
**Duration:** 1-2 days
**Impact:** All 10 applications

## Objective

Fix three critical bugs affecting pricing widgets across the monorepo:
1. Commerce-next package isSoldOut check (affects all 10 apps)
2. AI-hero cohort missing sold-out check
3. AI-hero event using raw quantity instead of calculated value

These bugs cause incorrect sold-out state detection and allow users to attempt checkout for sold-out products, leading to payment failures and poor user experience.

---

## Bug 1: commerce-next isSoldOut Type Check

**Status:** ✅ FIXED (commit: ef283d39)
**File:** `packages/commerce-next/src/pricing/pricing-context.tsx`
**Lines:** 70-75

### What Was Wrong

The sold-out check only evaluated `product.type === 'live'`, completely missing the `'cohort'` type:

```typescript
const isSoldOut =
  (product.type === 'live' && // ❌ BUG: only checks 'live'
    Boolean(product.fields.availability) &&
    product.fields.availability.quantityAvailable < 1) ||
  Boolean(product.fields.availability?.isSoldOut)
```

### Fix Applied

Added `'cohort'` to the type check:

```typescript
const isSoldOut =
  ((product.type === 'live' || product.type === 'cohort') && // ✅ Add cohort
    Boolean(product.fields.availability) &&
    product.fields.availability.quantityAvailable < 1) ||
  Boolean(product.fields.availability?.isSoldOut)
```

### Verification

- [x] Updated commerce-next package
- [x] All 10 apps now correctly detect sold-out cohort products
- [x] No regression in 'live' product type handling
- [x] Tests pass

### Impact

**All 10 apps benefit immediately** - cohort products are now correctly marked as sold-out when seats are unavailable.

---

## Bug 2: AI-hero Cohort Missing Sold-Out Check

**Status:** ⚠️ NOT FIXED
**File:** `apps/ai-hero/src/app/(content)/cohorts/[slug]/_components/cohort-pricing-widget-container.tsx`
**Lines:** 97-121

### Current Code (Broken)

The `getEnrollmentState()` function checks bypass coupons, dates, and closed status but **never checks if the cohort is sold-out**:

```typescript
const getEnrollmentState = () => {
  // Bypass coupon check
  if (couponFromCode?.fields?.bypassSoldOut === true) {
    return { type: 'open' as const }
  }

  // Date checks
  if (isOpenEnrollment) {
    return { type: 'open' as const }
  }
  if (enrollmentNotOpenYet) {
    return {
      type: 'not-open' as const,
      title: `Enrollment opens ${enrollmentOpenDateString}`,
      subtitle: 'Join the waitlist to be notified when enrollment opens.',
    }
  }

  // ❌ MISSING: sold-out state check entirely
  // Workshop has: if (isSoldOut) return 'sold-out'

  // Enrollment is closed
  return {
    type: 'closed' as const,
    title: hasStarted ? 'This cohort has already started' : 'Enrollment is closed',
    subtitle: hasStarted
      ? 'You can still join the waitlist to be notified when the next cohort starts.'
      : 'Enrollment has closed for this cohort. Join the waitlist to be notified when the next cohort starts.',
  }
}
```

### Required Fix

Add sold-out check after bypass coupon check, before date checks:

```typescript
const getEnrollmentState = () => {
  // Bypass coupon check (highest priority)
  if (couponFromCode?.fields?.bypassSoldOut === true) {
    return { type: 'open' as const }
  }

  // ✅ ADD: Sold-out check (before date checks)
  if (isSoldOut && !couponFromCode?.fields?.bypassSoldOut) {
    return {
      type: 'closed' as const,
      title: 'Sold Out',
      subtitle: 'Join the waitlist to be notified if spots become available.',
    }
  }

  // Date checks
  if (isOpenEnrollment) {
    return { type: 'open' as const }
  }
  // ... rest of logic
}
```

### Test Plan

1. Create a test cohort with limited seats (e.g., 10 total)
2. Simulate 10 purchases so `quantityAvailable = 0`
3. Visit cohort page: should show "Sold Out" message with waitlist
4. Apply bypass coupon: should show pricing widget (checkout enabled)
5. Remove coupon: should revert to "Sold Out" message

### Why This Matters

Without this check, users can attempt to purchase sold-out cohorts during enrollment periods, leading to:
- Checkout failures
- Poor user experience
- Support tickets

---

## Bug 3: AI-hero Event Uses Raw Quantity

**Status:** ⚠️ NOT FIXED
**File:** `apps/ai-hero/src/app/(content)/events/[slug]/_components/event-pricing-widget-container.tsx`
**Line:** 137-138

### Current Code (Broken)

Event implementation uses raw `totalQuantity` from the database instead of calculated `quantityAvailable`:

```typescript
// Line 137-138
const hasLimitedSeats = totalQuantity > 0 // ❌ Uses raw DB value
const isSoldOut = hasLimitedSeats && quantityAvailable <= 0
```

This is inconsistent with Workshop implementation (correct):

```typescript
// Workshop implementation (correct)
const hasLimitedSeats = initialQuantityAvailable !== -1 // ✅ Uses calculated value
```

### Required Fix

Use the calculated `quantityAvailable` (already available in props) instead of raw `totalQuantity`:

```typescript
// ✅ Use calculated quantityAvailable
const hasLimitedSeats = quantityAvailable !== -1
const isSoldOut = hasLimitedSeats && quantityAvailable <= 0
```

**Note:** The `quantityAvailable` prop already contains the correct calculated value:
- Formula: `quantityAvailable = max(0, totalQuantity - totalPurchases)`
- Provided by server via `getPricingData` or manual calculation

### Test Plan

1. Create test event with 50 total seats
2. Simulate 45 purchases
3. Event page should show "5 seats remaining"
4. Verify sold-out state triggers when all 50 are sold
5. Compare behavior with Workshop widget (should be identical)

### Why This Matters

Using raw `totalQuantity` means:
- Seat counts don't reflect actual purchases
- Event shows "50 seats remaining" when it's actually "5 seats remaining"
- Users may attempt checkout when seats are sold out

### Pattern Risk

This pattern may exist in other apps:
- astro-party Event
- go-local-first Event
- epicdev-ai Event
- code-with-antonio Event

Verify these apps use calculated `quantityAvailable`, not raw `totalQuantity`.

---

## Success Criteria

- [x] Bug 1: Commerce-next fixed (all 10 apps benefit)
- [ ] Bug 2: AI-hero cohort sold-out check added
- [ ] Bug 3: AI-hero event quantity calculation fixed
- [ ] All tests pass
- [ ] No production errors related to sold-out state
- [ ] Regression tests added for all three bugs

---

## Deliverables

1. **PR for Bug 1**: ✅ Already merged (commit: ef283d39)
2. **PR for Bug 2**: Cohort sold-out check implementation
3. **PR for Bug 3**: Event quantity calculation fix
4. **Regression Test Suite**: Tests for sold-out state detection across all product types
5. **Verification Report**: Test all 10 apps after commerce-next fix

---

## Navigation

[← Back to Index](./00-index.md) | [Next: Phase 2 - Shared Hooks →](./phase-2-shared-hooks.md)
