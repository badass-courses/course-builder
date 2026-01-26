# PRD: Unified Pricing Widget Architecture

**Version:** 1.0
**Date:** 2026-01-22
**Status:** Draft
**Owner:** Course Builder Team

---

## 1. Executive Summary

### Problem Statement

The ai-hero codebase currently maintains **three separate pricing widget implementations** (Workshop, Event, Cohort) with significant code duplication, critical bugs, and inconsistent behavior:

- **~20 LOC duplicated** across 4+ files for quantity calculation
- **Critical P0 bug**: Cohort enrollment state missing sold-out check entirely
- **Critical P0 bug**: `commerce-next` package's `isSoldOut` check only evaluates `product.type === 'live'`, completely missing `'cohort'` type
- **Inconsistent seat tracking**: Event uses raw `totalQuantity` vs Workshop's calculated `quantityAvailable`
- **No polling** for Event/Cohort (stale data risk in race conditions)
- **Duplicated patterns**: Purchased banner, coupon resolution, enrollment logic repeated across containers

### Proposed Solution

Create a **unified pricing widget container** with:
- Shared hooks: `useEnrollmentState`, `useSeatAvailability`, `useWaitlist`
- 4-state enrollment model (open, sold-out, not-open, closed)
- Real-time polling for all limited-seat products
- Composition-based customization (slots/render props pattern)
- Single source of truth for quantity calculations

### Expected Outcomes

- **70% reduction** in pricing-related LOC (~400 LOC → ~120 LOC)
- **Zero P0 bugs** related to sold-out state
- **Consistent UX** across all product types
- **Faster feature development** (single implementation point)
- **Better DX** (declarative configuration vs imperative logic)

---

## 2. Current State Analysis

### Feature Matrix

| Feature | Workshop | Event | Cohort | Notes |
|---------|----------|-------|--------|-------|
| **Enrollment States** | 4 (open, sold-out, not-open, closed) | 3 (open, not-open, closed) | 3 (open, not-open, closed) | Workshop is reference impl |
| **Sold-Out Check** | ✅ Yes | ⚠️ Implicit only | ❌ **Missing** | **P0 bug in cohort** |
| **Polling** | ✅ 5s interval | ❌ No | ❌ No | Stale data risk for Event/Cohort |
| **hasLimitedSeats** | `quantityAvailable !== -1` | `totalQuantity > 0` | Missing | Inconsistent logic |
| **Timezone** | Hardcoded PT | Configurable | Unknown | Should be configurable |
| **quantityAvailable** | `getPricingData` unified | Manual 2-query | Manual | Duplication |
| **Bypass Coupon** | ✅ `bypassSoldOut` | ✅ `bypassSoldOut` | ✅ `bypassSoldOut` | Consistent |
| **Waitlist** | ConvertKit tags | ConvertKit tags | ConvertKit tags | Consistent |
| **Analytics** | `track('waitlist_joined')` | Unknown | Unknown | Needs standardization |
| **Render Overrides** | Limited | `renderWaitlistForm`, `renderImage`, `renderEventDate` | Limited | Event has most flexibility |
| **Tier System** | N/A | N/A | standard/premium/vip | Cohort-specific |

### Critical Bugs (P0)

#### Bug 1: Cohort Missing Sold-Out Check
**File:** `apps/ai-hero/src/app/(commerce)/events/[slug]/cohort-pricing-widget-container.tsx`
**Lines:** 97-121

```typescript
// Current getEnrollmentState() implementation
if (coupon?.restrictedToProductId) {
  if (coupon.restrictedToProductId === productId) {
    return 'open'
  } else {
    return 'closed'
  }
}

// Checks dates and closed status
if (new Date(currentProduct.fields.openEnrollment) > new Date()) {
  return 'not-open'
}
if (currentProduct.fields.closed) {
  return 'closed'
}

// ❌ MISSING: sold-out state check entirely
// Workshop has: if (isSoldOut) return 'sold-out'

return 'open'
```

**Impact:** Users can attempt checkout for sold-out cohorts, leading to payment failures or overselling.

**Fix Required:**
```typescript
// Add after bypass coupon check, before date checks
if (isSoldOut && !coupon?.fields?.bypassSoldOut) {
  return 'sold-out'
}
```

---

#### Bug 2: commerce-next isSoldOut Type Check
**File:** `packages/commerce-next/src/pricing/pricing-context.tsx`
**Lines:** 70-75

```typescript
const isSoldOut =
  (product.type === 'live' && // ❌ BUG: only checks 'live'
    Boolean(product.fields.availability) &&
    product.fields.availability.quantityAvailable < 1) ||
  Boolean(product.fields.availability?.isSoldOut)
```

**Impact:** Cohort products are **never marked as sold-out** via this logic path, bypassing the entire sold-out state machine.

**Fix Required:**
```typescript
const isSoldOut =
  ((product.type === 'live' || product.type === 'cohort') && // ✅ Add cohort
    Boolean(product.fields.availability) &&
    product.fields.availability.quantityAvailable < 1) ||
  Boolean(product.fields.availability?.isSoldOut)
```

---

#### Bug 3: Event Uses Raw vs Calculated Quantity
**File:** `apps/ai-hero/src/app/(commerce)/events/[slug]/event-pricing-widget-container.tsx`
**Line:** 138

```typescript
// Event implementation
const hasLimitedSeats = totalQuantity > 0 // ❌ Uses raw DB value

// Workshop implementation (correct)
const hasLimitedSeats = initialQuantityAvailable !== -1 // ✅ Uses calculated value
```

**Impact:** Event widgets show incorrect seat counts because they don't subtract purchases. Workshop uses `getPricingData` which returns calculated `quantityAvailable = max(0, totalQuantity - totalPurchases)`.

**Data Flow Issue:**
```
Database (totalQuantity: 50, purchases: 45)
  ↓
Event: hasLimitedSeats = true (50 > 0) ❌ WRONG
  ↓
Workshop: quantityAvailable = 5 (50 - 45) ✅ CORRECT
```

**Fix Required:** Use unified `getPricingData` for all product types.

---

### Code Duplication Metrics

| Pattern | Files | LOC per File | Total Duplication |
|---------|-------|--------------|-------------------|
| Quantity calculation | 4+ | ~20 | ~80 LOC |
| Purchased banner | 3 | ~15 | ~45 LOC |
| Coupon ID resolution | 3 | ~10 | ~30 LOC |
| Enrollment state logic | 3 | ~30 | ~90 LOC |
| **Total** | | | **~245 LOC** |

---

### Data Flow Diagram (Current State)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────▼─────┐ ┌──▼──────┐ ┌──▼───────┐
              │ Workshop  │ │  Event  │ │  Cohort  │
              │ Container │ │Container│ │Container │
              └─────┬─────┘ └──┬──────┘ └──┬───────┘
                    │           │           │
          ┌─────────┼───────────┼───────────┤
          │         │           │           │
  ┌───────▼──────┐  │   ┌──────▼──────┐    │
  │getPricingData│  │   │Manual Query │    │
  │(unified calc)│  │   │(2 queries)  │    │
  └───────┬──────┘  │   └──────┬──────┘    │
          │         │          │            │
          │    ┌────▼──────────▼────────────▼─────┐
          │    │     Database (Drizzle ORM)       │
          │    └─────────────┬────────────────────┘
          │                  │
          │         ┌────────▼─────────┐
          │         │ products table   │
          │         │ purchases table  │
          │         │ coupons table    │
          │         └──────────────────┘
          │
  ┌───────▼────────┐
  │ Polling (5s)   │ ← Only Workshop
  │ /api/products/ │
  │ {id}/          │
  │ availability   │
  └────────────────┘

ISSUES:
- 3 separate container implementations
- 2 different quantity calculation paths
- Only 1 has polling (data staleness for others)
- Cohort missing sold-out check entirely
```

---

## 3. Proposed Architecture

### Unified Container Design

```typescript
/**
 * Unified pricing widget that handles all product types
 * (workshop, event, cohort) with consistent behavior
 */
export function UnifiedPricingWidget({
  product,
  purchaseToUpgrade,
  options = {},
  slots = {},
}: UnifiedPricingWidgetProps) {
  // Shared hooks (see next section)
  const enrollmentState = useEnrollmentState(product, options)
  const availability = useSeatAvailability(product, options)
  const waitlist = useWaitlist(product)

  // State machine for enrollment
  const { state, context } = useEnrollmentStateMachine({
    product,
    enrollmentState,
    availability,
    purchaseToUpgrade,
  })

  // Render based on state
  return (
    <PricingWidgetProvider value={{ state, context, availability }}>
      {slots.header?.({ product, enrollmentState }) ?? (
        <DefaultHeader product={product} />
      )}

      {state.matches('purchased') ? (
        slots.purchasedBanner?.({ product }) ?? <PurchasedBanner />
      ) : state.matches('soldOut') ? (
        slots.waitlistForm?.({ onSubmit: waitlist.submit }) ?? (
          <DefaultWaitlistForm onSubmit={waitlist.submit} />
        )
      ) : (
        slots.checkoutForm?.({ product, onSubmit }) ?? (
          <DefaultCheckoutForm product={product} />
        )
      )}

      {slots.footer?.({ product, availability }) ?? (
        <DefaultFooter product={product} availability={availability} />
      )}
    </PricingWidgetProvider>
  )
}
```

---

### Shared Hooks

#### 1. useEnrollmentState

```typescript
/**
 * Determines enrollment state with consistent logic across all product types
 *
 * Returns one of 4 states:
 * - 'open': Currently accepting enrollments
 * - 'sold-out': No seats available (with bypass coupon support)
 * - 'not-open': Enrollment opens in the future
 * - 'closed': Enrollment permanently closed
 */
export function useEnrollmentState(
  product: Product,
  options: EnrollmentOptions = {}
): EnrollmentState {
  const { coupon, bypassChecks = false } = options

  return useMemo(() => {
    // Priority 1: Bypass coupon (if restricted to this product)
    if (coupon?.restrictedToProductId === product.id) {
      return 'open'
    }
    if (coupon?.restrictedToProductId && coupon.restrictedToProductId !== product.id) {
      return 'closed'
    }

    // Priority 2: Sold-out check (with bypass)
    const isSoldOut = calculateSoldOut(product)
    if (isSoldOut && !coupon?.fields?.bypassSoldOut && !bypassChecks) {
      return 'sold-out'
    }

    // Priority 3: Date-based checks
    const now = new Date()
    const openDate = new Date(product.fields.openEnrollment)
    const closeDate = product.fields.closeEnrollment
      ? new Date(product.fields.closeEnrollment)
      : null

    if (openDate > now) {
      return 'not-open'
    }

    if (closeDate && closeDate < now) {
      return 'closed'
    }

    // Priority 4: Manual closed flag
    if (product.fields.closed) {
      return 'closed'
    }

    return 'open'
  }, [product, coupon, bypassChecks])
}

/**
 * Helper: Calculate sold-out status for any product type
 */
function calculateSoldOut(product: Product): boolean {
  // Type-safe check for all limited-seat product types
  if (product.type === 'live' || product.type === 'cohort' || product.type === 'event') {
    const availability = product.fields.availability
    if (!availability) return false

    // Explicit sold-out flag takes precedence
    if (availability.isSoldOut) return true

    // Check calculated quantity (not raw totalQuantity)
    if (availability.quantityAvailable < 1) return true
  }

  return false
}
```

---

#### 2. useSeatAvailability

```typescript
/**
 * Real-time seat availability with polling for limited-seat products
 *
 * Features:
 * - Auto-detects limited vs unlimited seats
 * - 5-second polling for limited-seat products
 * - Optimistic updates on successful checkout
 * - Suspends polling when tab is hidden (performance)
 */
export function useSeatAvailability(
  product: Product,
  options: AvailabilityOptions = {}
) {
  const { pollingInterval = 5000, enabled = true } = options

  // Initial availability from server data
  const [availability, setAvailability] = useState<Availability>(() =>
    getInitialAvailability(product)
  )

  // Auto-detect if product has limited seats
  const hasLimitedSeats = useMemo(() => {
    if (product.type === 'self-paced') return false
    return availability.quantityAvailable !== -1
  }, [product.type, availability.quantityAvailable])

  // Polling effect (only for limited seats)
  useEffect(() => {
    if (!enabled || !hasLimitedSeats) return

    const interval = setInterval(async () => {
      if (document.hidden) return // Pause when tab hidden

      const updated = await fetchAvailability(product.id)
      setAvailability(updated)
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [product.id, enabled, hasLimitedSeats, pollingInterval])

  return {
    quantityAvailable: availability.quantityAvailable,
    initialQuantityAvailable: availability.initialQuantityAvailable,
    hasLimitedSeats,
    isSoldOut: availability.quantityAvailable < 1 && hasLimitedSeats,
    unlimited: !hasLimitedSeats,

    // Optimistic update (call after successful checkout)
    decrementLocally: () => {
      if (hasLimitedSeats) {
        setAvailability(prev => ({
          ...prev,
          quantityAvailable: Math.max(0, prev.quantityAvailable - 1)
        }))
      }
    }
  }
}

function getInitialAvailability(product: Product): Availability {
  const fields = product.fields.availability

  return {
    quantityAvailable: fields?.quantityAvailable ?? -1,
    initialQuantityAvailable: fields?.initialQuantityAvailable ?? -1,
  }
}
```

---

#### 3. useWaitlist

```typescript
/**
 * ConvertKit waitlist integration for sold-out products
 *
 * Pattern:
 * - Tag format: `waitlist_<product-slug>: "<ISO-date>"`
 * - Analytics event: `track('waitlist_joined', { product: slug })`
 * - Shows confirmation message after successful submission
 */
export function useWaitlist(product: Product) {
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const submit = async (email: string) => {
    setState('submitting')
    setErrorMessage(null)

    try {
      // ConvertKit API call
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tag: `waitlist_${product.fields.slug}`,
          tagValue: new Date().toISOString(),
        })
      })

      // Analytics
      track('waitlist_joined', {
        product: product.fields.slug,
        productId: product.id,
        productType: product.type,
      })

      setState('success')
    } catch (error) {
      setState('error')
      setErrorMessage(error.message || 'Failed to join waitlist')
    }
  }

  return {
    state,
    errorMessage,
    submit,
    isSubmitting: state === 'submitting',
    isSuccess: state === 'success',
    isError: state === 'error',
  }
}
```

---

### State Machine for Enrollment

```typescript
import { createMachine, assign } from 'xstate'

/**
 * XState machine for enrollment flow
 *
 * States: idle, checking, purchased, soldOut, notOpen, closed, checkingOut
 */
export const enrollmentMachine = createMachine({
  id: 'enrollment',
  initial: 'idle',
  context: {
    product: null,
    enrollmentState: null,
    availability: null,
    purchaseToUpgrade: null,
  },
  states: {
    idle: {
      always: [
        { target: 'purchased', cond: 'hasPurchase' },
        { target: 'soldOut', cond: 'isSoldOut' },
        { target: 'notOpen', cond: 'isNotOpen' },
        { target: 'closed', cond: 'isClosed' },
        { target: 'open' },
      ]
    },
    purchased: {
      on: {
        UPGRADE: 'checkingOut',
      }
    },
    soldOut: {
      on: {
        JOIN_WAITLIST: 'joiningWaitlist',
        BYPASS_WITH_COUPON: 'open',
      }
    },
    joiningWaitlist: {
      invoke: {
        src: 'submitWaitlist',
        onDone: 'waitlistSuccess',
        onError: 'soldOut',
      }
    },
    waitlistSuccess: {},
    notOpen: {},
    closed: {},
    open: {
      on: {
        CHECKOUT: 'checkingOut',
      }
    },
    checkingOut: {
      invoke: {
        src: 'processCheckout',
        onDone: 'purchased',
        onError: 'open',
      }
    },
  }
}, {
  guards: {
    hasPurchase: (ctx) => Boolean(ctx.purchaseToUpgrade),
    isSoldOut: (ctx) => ctx.enrollmentState === 'sold-out',
    isNotOpen: (ctx) => ctx.enrollmentState === 'not-open',
    isClosed: (ctx) => ctx.enrollmentState === 'closed',
  }
})
```

---

### Composition Pattern (Slots/Render Props)

The unified widget uses **slots** for maximum customization without forking logic:

```typescript
interface UnifiedPricingWidgetProps {
  product: Product
  purchaseToUpgrade?: Purchase
  options?: {
    coupon?: Coupon
    bypassChecks?: boolean
    pollingEnabled?: boolean
    pollingInterval?: number
    timezone?: string // For date formatting
  }
  slots?: {
    // Replace entire sections
    header?: (props: HeaderProps) => ReactNode
    purchasedBanner?: (props: PurchasedProps) => ReactNode
    waitlistForm?: (props: WaitlistProps) => ReactNode
    checkoutForm?: (props: CheckoutProps) => ReactNode
    footer?: (props: FooterProps) => ReactNode

    // Granular overrides
    dateDisplay?: (props: DateDisplayProps) => ReactNode
    seatCounter?: (props: SeatCounterProps) => ReactNode
    pricingDetails?: (props: PricingProps) => ReactNode
  }
}

// Example: Custom event date display
<UnifiedPricingWidget
  product={event}
  slots={{
    dateDisplay: ({ product }) => (
      <EventDateRange
        startDate={product.fields.startDate}
        endDate={product.fields.endDate}
        timezone="America/Los_Angeles"
      />
    )
  }}
/>

// Example: Custom cohort tier selection
<UnifiedPricingWidget
  product={cohort}
  slots={{
    pricingDetails: ({ product }) => (
      <CohortTierSelector
        tiers={[
          { id: 'standard', name: 'Standard', price: 999 },
          { id: 'premium', name: 'Premium', price: 1499 },
          { id: 'vip', name: 'VIP', price: 2499 },
        ]}
      />
    )
  }}
/>
```

---

## 4. Feature Specification

### 4.1 Enrollment States (4-State Model)

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| **open** | Within enrollment dates, seats available | Show checkout form |
| **sold-out** | No seats remaining (and no bypass coupon) | Show waitlist form |
| **not-open** | Before `openEnrollment` date | Show countdown timer + "Opens on..." |
| **closed** | After `closeEnrollment` or `closed=true` | Show "Enrollment closed" message |

**Priority Order (highest → lowest):**
1. Bypass coupon (if restricted to product → open; if restricted elsewhere → closed)
2. Sold-out check (with bypass coupon exception)
3. Date-based checks (not-open, closed)
4. Manual closed flag

---

### 4.2 Waitlist Integration

**ConvertKit Tag Pattern:**
```
waitlist_<product-slug>: "<ISO-date>"
```

**Example:**
```
waitlist_nextjs-workshop-2024-q2: "2024-06-15T18:32:10.000Z"
```

**API Endpoint:** `/api/waitlist`

**Request:**
```json
{
  "email": "user@example.com",
  "tag": "waitlist_nextjs-workshop-2024-q2",
  "tagValue": "2024-06-15T18:32:10.000Z"
}
```

**Analytics Event:**
```typescript
track('waitlist_joined', {
  product: 'nextjs-workshop-2024-q2',
  productId: 'prod_abc123',
  productType: 'live'
})
```

**UI Flow:**
1. User enters email
2. Submit button shows loading state
3. On success: "You're on the list! We'll email you when spots open up."
4. On error: "Something went wrong. Please try again."

---

### 4.3 Quantity Tracking

**Three Quantity Values:**

| Value | Definition | Source | Use Case |
|-------|------------|--------|----------|
| `initialQuantityAvailable` | Total seats created | `getPricingData` | Display "X of Y seats remaining" |
| `quantityAvailable` | Seats remaining | `getPricingData` or polling | Real-time availability check |
| `totalQuantity` | Raw database value | Database | Internal calculations only |

**Calculation:**
```typescript
quantityAvailable = max(0, totalQuantity - totalPurchases)
initialQuantityAvailable = totalQuantity // Never changes
```

**Polling Endpoint:** `/api/products/{id}/availability`

**Response:**
```json
{
  "quantityAvailable": 5,
  "unlimited": false
}
```

**Polling Behavior:**
- **Interval:** 5 seconds (configurable)
- **Pause when:** Tab hidden (via `document.hidden`)
- **Stop when:** Unlimited seats OR product type is self-paced
- **Error handling:** Log error, continue polling (don't crash UI)

---

### 4.4 Bypass Mechanisms

**Coupon Bypass:**
```typescript
interface Coupon {
  id: string
  code: string
  restrictedToProductId?: string | null
  fields?: {
    bypassSoldOut?: boolean
  }
}
```

**Bypass Logic:**
```typescript
// If coupon is restricted to THIS product, always show open
if (coupon?.restrictedToProductId === product.id) {
  return 'open'
}

// If coupon has bypassSoldOut flag, ignore sold-out state
if (coupon?.fields?.bypassSoldOut && enrollmentState === 'sold-out') {
  return 'open'
}
```

**Use Case:** VIP coupons for sold-out events, affiliate codes for closed cohorts.

---

### 4.5 Date/Timezone Handling

**Product Date Fields:**
- `openEnrollment: Date`
- `closeEnrollment?: Date | null`
- `startDate: Date` (for events/cohorts)
- `endDate?: Date | null` (for multi-day events/cohorts)

**Formatting Functions:**

```typescript
/**
 * Format event date range with timezone
 *
 * Examples:
 * - Single day: "June 15, 2024 @ 10:00 AM PT"
 * - Multi-day: "June 15-17, 2024"
 * - With end time: "June 15, 2024 @ 10:00 AM - 12:00 PM PT"
 */
export function formatEventDateRange(
  startDate: Date,
  endDate: Date | null,
  timezone: string = 'America/Los_Angeles'
): string

/**
 * Format cohort date range (handles multi-week cohorts)
 *
 * Examples:
 * - "Starting June 15, 2024"
 * - "June 15 - August 10, 2024"
 */
export function formatCohortDateRange(
  startDate: Date,
  endDate: Date | null
): string

/**
 * Format countdown to enrollment opening
 *
 * Example: "Enrollment opens in 3 days, 4 hours"
 */
export function formatCountdown(
  targetDate: Date
): string
```

**Timezone Configuration:**
- **Default:** `America/Los_Angeles` (PT)
- **Override:** Pass `options.timezone` to `UnifiedPricingWidget`
- **Display:** Always show timezone abbreviation (PT, ET, etc.)

---

## 5. Migration Plan

### Phase 1: Fix Critical Bugs (P0) — **1-2 days**

**Priority:** Immediate production fixes

**Tasks:**
1. Fix cohort sold-out check
   - File: `cohort-pricing-widget-container.tsx`
   - Add sold-out state in `getEnrollmentState()`
   - Test: Create sold-out cohort, verify waitlist shows

2. Fix `commerce-next` isSoldOut type check
   - File: `packages/commerce-next/src/pricing/pricing-context.tsx`
   - Change: `product.type === 'live'` → `(product.type === 'live' || product.type === 'cohort')`
   - Test: Sold-out cohort should trigger isSoldOut flag

3. Fix Event quantity calculation
   - File: `event-pricing-widget-container.tsx`
   - Replace raw `totalQuantity` with `getPricingData` call
   - Test: Event with 50 total / 45 sold should show 5 remaining

**Deliverables:**
- 3 PRs (one per bug)
- Updated tests for each fix
- Regression test suite for sold-out states

**Success Metrics:**
- Zero sold-out state bugs in production
- All 3 product types show correct seat counts

---

### Phase 2: Extract Shared Hooks — **3-4 days**

**Priority:** Foundation for unified widget

**Tasks:**
1. Create `packages/commerce-next/src/hooks/use-enrollment-state.ts`
   - Extract 4-state logic from Workshop
   - Add comprehensive tests (8 states × 3 product types = 24 tests)
   - Document with TSDoc

2. Create `packages/commerce-next/src/hooks/use-seat-availability.ts`
   - Extract polling logic from Workshop
   - Add optimistic updates
   - Add tab visibility handling
   - Test: Mock polling, verify interval/pause behavior

3. Create `packages/commerce-next/src/hooks/use-waitlist.ts`
   - Extract ConvertKit integration
   - Add analytics
   - Test: Mock API, verify tag format

**Deliverables:**
- 3 new hooks in `commerce-next` package
- 100% test coverage
- Storybook stories for each hook (with mock data)

**Success Metrics:**
- Hooks work with all 3 product types
- No regressions in existing widgets
- Tests pass in CI

---

### Phase 3: Unified Container — **5-7 days**

**Priority:** Single implementation point

**Tasks:**
1. Create `UnifiedPricingWidget` component
   - Use Phase 2 hooks
   - Implement XState machine
   - Support all slots/render props

2. Create default slot implementations
   - `DefaultHeader`, `DefaultFooter`
   - `DefaultCheckoutForm`, `DefaultWaitlistForm`
   - `DefaultPurchasedBanner`

3. Create product-specific variants (thin wrappers)
   - `WorkshopPricingWidget` (uses unified, passes workshop-specific slots)
   - `EventPricingWidget` (uses unified, passes event-specific slots)
   - `CohortPricingWidget` (uses unified, passes cohort-specific slots)

**Deliverables:**
- `UnifiedPricingWidget` component
- 5 default slot components
- 3 product-specific wrapper components
- Storybook stories for all variants

**Success Metrics:**
- Single source of truth for enrollment logic
- All product types use unified container
- Visual parity with existing widgets

---

### Phase 4: Migrate Existing Implementations — **2-3 days per product type**

**Priority:** Remove duplication

**Migration Order:**
1. **Workshop** (lowest risk, already reference impl)
2. **Event** (medium risk, needs timezone config)
3. **Cohort** (highest risk, has tier system)

**Per-Product Checklist:**
- [ ] Replace container with unified variant
- [ ] Pass product-specific slots (if any)
- [ ] Remove old container file
- [ ] Update tests
- [ ] Verify in staging
- [ ] Deploy to production
- [ ] Monitor errors for 48h

**Rollback Plan:**
- Keep old containers in Git history
- Feature flag: `useUnifiedPricingWidget` (default: true)
- If errors spike, toggle flag to false (instant rollback)

**Deliverables:**
- 3 PRs (one per product type)
- Updated integration tests
- Monitoring dashboards

**Success Metrics:**
- Zero production errors post-migration
- 70% reduction in pricing-related LOC
- 50% reduction in Sentry issues for pricing

---

## 6. API Design

### TypeScript Interfaces

```typescript
// ============================================================================
// Core Types
// ============================================================================

type ProductType = 'workshop' | 'event' | 'cohort' | 'self-paced'

type EnrollmentState = 'open' | 'sold-out' | 'not-open' | 'closed'

interface Product {
  id: string
  type: ProductType
  fields: {
    slug: string
    name: string
    openEnrollment: Date
    closeEnrollment?: Date | null
    closed?: boolean

    // Limited-seat products
    availability?: {
      quantityAvailable: number
      initialQuantityAvailable: number
      isSoldOut?: boolean
    }

    // Event/Cohort specific
    startDate?: Date
    endDate?: Date | null

    // Cohort specific
    tiers?: CohortTier[]
  }
}

interface Purchase {
  id: string
  userId: string
  productId: string
  status: 'Valid' | 'Refunded' | 'Disputed'
  createdAt: Date
}

interface Coupon {
  id: string
  code: string
  restrictedToProductId?: string | null
  fields?: {
    bypassSoldOut?: boolean
  }
}

interface CohortTier {
  id: string
  name: string
  price: number
  features: string[]
}

// ============================================================================
// Hook Return Types
// ============================================================================

interface EnrollmentStateResult {
  state: EnrollmentState
  canCheckout: boolean
  reason?: string // Why checkout is disabled
}

interface SeatAvailabilityResult {
  quantityAvailable: number
  initialQuantityAvailable: number
  hasLimitedSeats: boolean
  isSoldOut: boolean
  unlimited: boolean
  decrementLocally: () => void
}

interface WaitlistResult {
  state: 'idle' | 'submitting' | 'success' | 'error'
  errorMessage: string | null
  submit: (email: string) => Promise<void>
  isSubmitting: boolean
  isSuccess: boolean
  isError: boolean
}

// ============================================================================
// Component Props
// ============================================================================

interface UnifiedPricingWidgetProps {
  product: Product
  purchaseToUpgrade?: Purchase
  options?: {
    coupon?: Coupon
    bypassChecks?: boolean
    pollingEnabled?: boolean
    pollingInterval?: number
    timezone?: string
  }
  slots?: PricingWidgetSlots
}

interface PricingWidgetSlots {
  header?: (props: HeaderSlotProps) => ReactNode
  purchasedBanner?: (props: PurchasedSlotProps) => ReactNode
  waitlistForm?: (props: WaitlistSlotProps) => ReactNode
  checkoutForm?: (props: CheckoutSlotProps) => ReactNode
  footer?: (props: FooterSlotProps) => ReactNode
  dateDisplay?: (props: DateDisplaySlotProps) => ReactNode
  seatCounter?: (props: SeatCounterSlotProps) => ReactNode
  pricingDetails?: (props: PricingSlotProps) => ReactNode
}

interface HeaderSlotProps {
  product: Product
  enrollmentState: EnrollmentState
}

interface PurchasedSlotProps {
  product: Product
  purchase: Purchase
}

interface WaitlistSlotProps {
  product: Product
  onSubmit: (email: string) => Promise<void>
  state: WaitlistResult['state']
  errorMessage: string | null
}

interface CheckoutSlotProps {
  product: Product
  coupon?: Coupon
  onSubmit: (data: CheckoutData) => Promise<void>
  availability: SeatAvailabilityResult
}

interface FooterSlotProps {
  product: Product
  availability: SeatAvailabilityResult
}

interface DateDisplaySlotProps {
  product: Product
  timezone: string
}

interface SeatCounterSlotProps {
  quantityAvailable: number
  initialQuantityAvailable: number
  hasLimitedSeats: boolean
}

interface PricingSlotProps {
  product: Product
  coupon?: Coupon
}

// ============================================================================
// Configuration Schema
// ============================================================================

interface PricingWidgetConfig {
  /** Enable real-time seat polling (default: true for limited-seat products) */
  pollingEnabled?: boolean

  /** Polling interval in milliseconds (default: 5000) */
  pollingInterval?: number

  /** Timezone for date display (default: 'America/Los_Angeles') */
  timezone?: string

  /** Bypass enrollment checks (for admin previews) */
  bypassChecks?: boolean

  /** Custom coupon to apply */
  coupon?: Coupon

  /** Feature flags */
  features?: {
    waitlist?: boolean // Enable waitlist (default: true)
    analytics?: boolean // Track events (default: true)
    optimisticUpdates?: boolean // Update UI before API confirms (default: true)
  }
}
```

---

### Configuration Object Schema

**Example: Workshop with defaults**
```typescript
<UnifiedPricingWidget
  product={workshopProduct}
  // All defaults work out-of-box
/>
```

**Example: Event with custom timezone**
```typescript
<UnifiedPricingWidget
  product={eventProduct}
  options={{
    timezone: 'America/New_York', // Override default PT
    pollingInterval: 10000, // Poll every 10s instead of 5s
  }}
/>
```

**Example: Cohort with bypass coupon**
```typescript
<UnifiedPricingWidget
  product={cohortProduct}
  options={{
    coupon: vipCoupon, // Bypass sold-out state
    features: {
      waitlist: false, // Disable waitlist form
    }
  }}
/>
```

**Example: Admin preview mode**
```typescript
<UnifiedPricingWidget
  product={previewProduct}
  options={{
    bypassChecks: true, // Ignore all enrollment restrictions
    pollingEnabled: false, // Don't poll in preview
    features: {
      analytics: false, // Don't track events
    }
  }}
/>
```

---

### Props for Customization

**Minimal Customization (keep defaults):**
```typescript
<UnifiedPricingWidget product={product} />
```

**Partial Customization (override one slot):**
```typescript
<UnifiedPricingWidget
  product={product}
  slots={{
    dateDisplay: ({ product, timezone }) => (
      <MyCustomDateDisplay product={product} tz={timezone} />
    )
  }}
/>
```

**Full Customization (all slots):**
```typescript
<UnifiedPricingWidget
  product={product}
  slots={{
    header: MyHeader,
    purchasedBanner: MyPurchasedBanner,
    waitlistForm: MyWaitlistForm,
    checkoutForm: MyCheckoutForm,
    footer: MyFooter,
  }}
/>
```

**Render Props Pattern (for more control):**
```typescript
<UnifiedPricingWidget product={product}>
  {({ state, availability, enrollmentState }) => (
    <>
      {state === 'purchased' ? (
        <MyPurchasedView />
      ) : state === 'soldOut' ? (
        <MyWaitlistView onSubmit={handleWaitlist} />
      ) : (
        <MyCheckoutView
          available={availability.quantityAvailable}
          onCheckout={handleCheckout}
        />
      )}
    </>
  )}
</UnifiedPricingWidget>
```

---

## 7. Success Metrics

### Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **LOC in pricing widgets** | ~400 | ~120 | 70% reduction |
| **Quantity calc duplication** | 4 files | 1 file | 100% elimination |
| **Enrollment logic duplication** | 3 files | 1 file | 100% elimination |
| **P0 bugs** | 3 active | 0 | 100% resolution |
| **P1 inconsistencies** | 5 documented | 0 | 100% resolution |
| **Test coverage (pricing)** | ~60% | 90%+ | +30% increase |
| **Sentry errors (pricing)** | ~15/week | <5/week | 67% reduction |
| **Time to add new product type** | ~2 days | <4 hours | 75% reduction |

---

### Qualitative Metrics

**Developer Experience (DX):**
- [ ] New developers can understand pricing flow in <30 min (vs 2+ hours)
- [ ] Adding product-specific UI requires <20 LOC (vs 100+ LOC)
- [ ] Zero "which pricing container?" questions in Slack
- [ ] TypeScript inference guides customization (no guessing)

**User Experience (UX):**
- [ ] Consistent sold-out messaging across all product types
- [ ] Real-time seat updates (no stale data)
- [ ] Waitlist works on first try (no "try again" errors)
- [ ] Countdown timers show correct time zones

**Operational Metrics:**
- [ ] Zero production incidents related to pricing bugs
- [ ] Monitoring dashboards show <1% error rate
- [ ] Feature flags allow instant rollback if needed
- [ ] A/B tests can toggle unified vs legacy widgets

---

### Rollback Criteria

**Trigger rollback if:**
- Error rate increases >5% in 48h window
- Customer reports spike (>10 tickets/day)
- Checkout conversion rate drops >10%
- Sentry alerts fire for pricing errors

**Rollback Process:**
1. Toggle feature flag: `useUnifiedPricingWidget = false`
2. Verify legacy widgets still work
3. Post mortem: Analyze logs, identify root cause
4. Fix in unified widget, re-test in staging
5. Re-enable with phased rollout (10% → 50% → 100%)

---

## Appendix A: Current Implementation Line References

### Workshop Container
**File:** `apps/ai-hero/src/app/(commerce)/events/[slug]/workshop-pricing-widget-container.tsx`

**Key Patterns:**
- Line 97-121: `getEnrollmentState()` (4-state logic) ✅ Reference
- Line 138: Polling setup with `AVAILABILITY_POLL_INTERVAL = 5000`
- Line 155: `hasLimitedSeats = initialQuantityAvailable !== -1`
- Line 203: ConvertKit waitlist tag format
- Line 245: Analytics `track('waitlist_joined')`

---

### Event Container
**File:** `apps/ai-hero/src/app/(commerce)/events/[slug]/event-pricing-widget-container.tsx`

**Key Issues:**
- Line 138: ❌ `hasLimitedSeats = totalQuantity > 0` (should use calculated)
- Line 87-109: 3-state enrollment (missing sold-out)
- Line 187: `renderWaitlistForm` slot (good pattern)
- Line 212: `formatEventDateRange` with timezone

---

### Cohort Container
**File:** `apps/ai-hero/src/app/(commerce)/events/[slug]/cohort-pricing-widget-container.tsx`

**Key Issues:**
- Line 97-121: ❌ `getEnrollmentState()` missing sold-out check entirely
- Line 156: Tier system (`standard`, `premium`, `vip`)
- Line 203: `formatCohortDateRange` (sophisticated multi-day)

---

### commerce-next Package
**File:** `packages/commerce-next/src/pricing/pricing-context.tsx`

**Key Issues:**
- Line 70-75: ❌ `isSoldOut` only checks `product.type === 'live'`
- Line 88: XState machine definition
- Line 120: PricingContext provider

---

### Data Layer
**File:** `packages/commerce-next/src/pricing/pricing-query-server.ts`

**Key Patterns:**
- Line 45: `getPricingData` unified calculation
- Line 67: `quantityAvailable = max(0, totalQuantity - totalPurchases)`
- Line 89: API endpoint `/api/products/{id}/availability`

---

## Appendix B: Test Coverage Requirements

### Unit Tests (Hooks)

**useEnrollmentState:**
- [ ] Returns 'open' for valid dates + seats available
- [ ] Returns 'sold-out' when quantityAvailable < 1
- [ ] Returns 'not-open' before openEnrollment
- [ ] Returns 'closed' after closeEnrollment
- [ ] Returns 'closed' when manual closed flag is true
- [ ] Returns 'open' with bypass coupon (even if sold-out)
- [ ] Returns 'closed' with mismatched restricted coupon
- [ ] Handles null closeEnrollment (never closes)

**useSeatAvailability:**
- [ ] Detects limited seats correctly
- [ ] Polls every 5s when enabled
- [ ] Pauses polling when tab hidden
- [ ] Updates availability on successful poll
- [ ] Handles API errors gracefully (logs, continues polling)
- [ ] Decrements locally on checkout
- [ ] Doesn't poll for unlimited products

**useWaitlist:**
- [ ] Submits email to ConvertKit
- [ ] Formats tag as `waitlist_<slug>`
- [ ] Tracks analytics event
- [ ] Shows success message
- [ ] Shows error message on failure
- [ ] Disables submit during loading

---

### Integration Tests (Component)

**UnifiedPricingWidget:**
- [ ] Renders checkout form when open
- [ ] Renders waitlist form when sold-out
- [ ] Renders countdown when not-open
- [ ] Renders closed message when closed
- [ ] Renders purchased banner when user owns product
- [ ] Respects custom slots
- [ ] Polls availability in background
- [ ] Bypasses with coupon

---

### E2E Tests (Playwright)

**Enrollment Flow:**
- [ ] User can checkout when seats available
- [ ] User sees waitlist when sold-out
- [ ] User sees countdown before enrollment opens
- [ ] User can't checkout when closed
- [ ] Seat count updates in real-time (race condition test)
- [ ] Waitlist submission works end-to-end

---

## Appendix C: Monitoring & Observability

### Datadog Dashboards

**Pricing Widget Health:**
- Checkout conversion rate (by product type)
- Error rate (by enrollment state)
- Waitlist submission success rate
- Polling latency (p50, p95, p99)
- Quantity calculation accuracy (compare DB vs cache)

---

### Sentry Alerts

**Critical:**
- `PricingQuantityMismatch`: Calculated quantity != DB quantity
- `SoldOutStateMissing`: Product should be sold-out but isn't
- `PollingFailure`: 3+ consecutive polling failures

**Warning:**
- `WaitlistSubmissionFailed`: ConvertKit API error
- `CouponBypassIgnored`: Bypass coupon didn't work
- `DateParsingError`: Invalid enrollment date format

---

### Log Aggregation (Axiom)

**Query Examples:**
```
// Checkout attempts for sold-out products (should be zero)
event_name="checkout_attempted" AND enrollment_state="sold-out"

// Polling errors
event_name="polling_error" AND product_type="*"

// Waitlist conversions
event_name="waitlist_joined" AND product_slug="*"
```

---

## Appendix D: Glossary

- **Enrollment State**: Current status of a product's enrollment period (open, sold-out, not-open, closed)
- **Quantity Available**: Calculated number of seats remaining (total - purchases)
- **Bypass Coupon**: Special coupon that overrides sold-out or closed states
- **Polling**: Real-time fetching of seat availability every N seconds
- **Waitlist**: ConvertKit-based list for users wanting sold-out products
- **Slots**: React render props pattern for customizing UI sections
- **XState Machine**: State machine for managing enrollment flow transitions

---

**End of PRD**
