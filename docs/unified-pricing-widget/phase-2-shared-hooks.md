# Phase 2: Extract Shared Hooks

**Status:** Not Started
**Depends On:** [Phase 1: P0 Bug Fixes](./phase-1-p0-bug-fixes.md)
**Estimated Duration:** 3-4 days

---

## Objective

Extract and consolidate enrollment logic into three reusable hooks in the `commerce-next` package. These hooks will provide the foundation for the unified pricing widget and immediately benefit all 10 apps in the monorepo.

**Why This Matters:**
- **Eliminates duplication**: 6 different implementations of quantity calculation → 1 shared implementation
- **Fixes architectural gaps**: No apps currently have standardized enrollment state logic
- **Enables polling**: 8 apps without real-time seat updates gain this capability
- **Establishes patterns**: Creates the building blocks for Phase 3's unified widget

---

## Hook 1: useEnrollmentState

### Purpose

Determines enrollment state with consistent 4-state logic across all product types (workshop, event, cohort). Replaces inconsistent implementations in ai-hero's three containers and establishes the standard for all 10 apps.

### API Design

```typescript
/**
 * Determines enrollment state with consistent logic across all product types.
 *
 * Returns one of 4 states:
 * - 'open': Currently accepting enrollments
 * - 'sold-out': No seats available (with bypass coupon support)
 * - 'not-open': Enrollment opens in the future
 * - 'closed': Enrollment permanently closed
 *
 * @param product - The product to check enrollment state for
 * @param options - Optional configuration including coupon and bypass flags
 * @returns The current enrollment state
 *
 * @example
 * ```ts
 * const enrollmentState = useEnrollmentState(workshopProduct, {
 *   coupon: activeCoupon,
 *   bypassChecks: false
 * })
 *
 * if (enrollmentState === 'sold-out') {
 *   return <WaitlistForm />
 * }
 * ```
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
    // ✅ FIXES Bug 1 (commerce-next) and Bug 2 (ai-hero cohort)
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
 * ✅ FIXES Bug 1 (commerce-next isSoldOut type check)
 */
function calculateSoldOut(product: Product): boolean {
  // Type-safe check for all limited-seat product types
  if (product.type === 'live' || product.type === 'cohort' || product.type === 'event') {
    const availability = product.fields.availability
    if (!availability) return false

    // Explicit sold-out flag takes precedence
    if (availability.isSoldOut) return true

    // Check calculated quantity (not raw totalQuantity)
    // ✅ FIXES Bug 3 (ai-hero event raw quantity)
    if (availability.quantityAvailable < 1) return true
  }

  return false
}
```

### Implementation Notes

**Location:** `packages/commerce-next/src/hooks/use-enrollment-state.ts`

**Dependencies:**
- Relies on `Product` type from commerce-next
- Uses `EnrollmentOptions` and `EnrollmentState` types (to be defined)
- Requires `calculateSoldOut` helper function

**Priority Logic:**
1. **Bypass coupon** (highest priority) - overrides all other checks
2. **Sold-out state** - checks all product types correctly (fixes Bug 1 & Bug 2)
3. **Date-based checks** - openEnrollment and closeEnrollment dates
4. **Manual closed flag** - product.fields.closed

**Key Fixes:**
- **Bug 1 (commerce-next):** `calculateSoldOut` checks ALL limited-seat types (`live`, `cohort`, `event`)
- **Bug 2 (ai-hero cohort):** Sold-out check is now included in state priority
- **Bug 3 (ai-hero event):** Uses `quantityAvailable` (calculated) instead of raw `totalQuantity`

### Test Requirements

**File:** `packages/commerce-next/src/hooks/use-enrollment-state.test.ts`

**Coverage Matrix:** 8 states × 3 product types = 24 tests

| Scenario | Product Type | Expected State | Test |
|----------|--------------|----------------|------|
| Bypass coupon (restricted to product) | workshop | open | ✅ |
| Bypass coupon (different product) | workshop | closed | ✅ |
| Sold-out (no bypass) | workshop | sold-out | ✅ |
| Sold-out with bypass coupon | workshop | open | ✅ |
| Not yet open (future date) | workshop | not-open | ✅ |
| Enrollment closed (past date) | workshop | closed | ✅ |
| Manual closed flag | workshop | closed | ✅ |
| Normal open enrollment | workshop | open | ✅ |
| (Repeat for event) | event | ... | ✅ |
| (Repeat for cohort) | cohort | ... | ✅ |

**Additional Tests:**
- Edge case: Product with no availability field (should handle gracefully)
- Edge case: Invalid date formats (should fallback safely)
- Edge case: Null closeEnrollment (unlimited enrollment period)

**Target Coverage:** 100%

---

## Hook 2: useSeatAvailability

### Purpose

Provides real-time seat availability with automatic polling for limited-seat products. Brings polling to 8 apps that don't currently have it, preventing stale data and race conditions.

### API Design

```typescript
/**
 * Real-time seat availability with polling for limited-seat products.
 *
 * Features:
 * - Auto-detects limited vs unlimited seats
 * - 5-second polling for limited-seat products
 * - Optimistic updates on successful checkout
 * - Suspends polling when tab is hidden (performance)
 *
 * @param product - The product to track availability for
 * @param options - Optional configuration for polling behavior
 * @returns Seat availability data with real-time updates
 *
 * @example
 * ```ts
 * const availability = useSeatAvailability(workshopProduct, {
 *   pollingInterval: 5000,
 *   enabled: true
 * })
 *
 * if (availability.isSoldOut) {
 *   return <WaitlistForm />
 * }
 *
 * return <p>{availability.quantityAvailable} seats remaining</p>
 * ```
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

### Implementation Notes

**Location:** `packages/commerce-next/src/hooks/use-seat-availability.ts`

**Dependencies:**
- `fetchAvailability` API function (to be created or imported)
- `Availability` and `AvailabilityOptions` types (to be defined)
- React hooks: `useState`, `useEffect`, `useMemo`

**Polling Behavior:**
- **Interval:** 5 seconds (configurable via options)
- **Auto-pause:** Stops when tab is hidden (`document.hidden`)
- **Conditional:** Only polls for limited-seat products
- **Cleanup:** Clears interval on unmount

**Optimistic Updates:**
- `decrementLocally()` immediately updates UI after checkout
- Prevents flash of incorrect availability before next poll
- Next poll will sync with actual server state

### Test Requirements

**File:** `packages/commerce-next/src/hooks/use-seat-availability.test.ts`

**Test Scenarios:**

1. **Initial State:**
   - Returns correct initial availability from product
   - Detects limited seats correctly (quantityAvailable !== -1)
   - Detects unlimited seats correctly (self-paced or -1)

2. **Polling Behavior:**
   - Starts polling for limited-seat products
   - Does NOT poll for unlimited products
   - Respects custom polling interval
   - Pauses when tab is hidden (`document.hidden = true`)
   - Resumes when tab is visible again
   - Cleans up interval on unmount

3. **Optimistic Updates:**
   - `decrementLocally()` reduces quantity by 1
   - Does NOT go below 0
   - Does NOT affect unlimited products

4. **Edge Cases:**
   - Product with no availability field (should treat as unlimited)
   - Polling disabled via options (should not start interval)
   - fetchAvailability fails (should handle gracefully, not crash)

**Mocking:**
- Use `vi.useFakeTimers()` for interval testing
- Mock `fetchAvailability` API calls
- Mock `document.hidden` for tab visibility tests

**Target Coverage:** 100%

---

## Hook 3: useWaitlist

### Purpose

Standardizes ConvertKit waitlist integration for sold-out products across all 10 apps. Provides consistent UX for waitlist signups, analytics tracking, and error handling.

### API Design

```typescript
/**
 * ConvertKit waitlist integration for sold-out products.
 *
 * Pattern:
 * - Tag format: `waitlist_<product-slug>: "<ISO-date>"`
 * - Analytics event: `track('waitlist_joined', { product: slug })`
 * - Shows confirmation message after successful submission
 *
 * @param product - The sold-out product to create a waitlist for
 * @returns Waitlist state and submission handler
 *
 * @example
 * ```ts
 * const waitlist = useWaitlist(workshopProduct)
 *
 * if (waitlist.isSuccess) {
 *   return <p>You're on the waitlist! We'll notify you when spots open.</p>
 * }
 *
 * return (
 *   <form onSubmit={(e) => {
 *     e.preventDefault()
 *     waitlist.submit(email)
 *   }}>
 *     <input type="email" />
 *     <button disabled={waitlist.isSubmitting}>Join Waitlist</button>
 *     {waitlist.errorMessage && <p>{waitlist.errorMessage}</p>}
 *   </form>
 * )
 * ```
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

### Implementation Notes

**Location:** `packages/commerce-next/src/hooks/use-waitlist.ts`

**Dependencies:**
- `/api/waitlist` endpoint (assumes this exists across apps)
- `track` analytics function (to be imported from utils-analytics or similar)
- `Product` type from commerce-next

**ConvertKit Tag Format:**
- Pattern: `waitlist_<product-slug>`
- Value: ISO date string (when user joined)
- Example: `waitlist_ai-hero-workshop-2024: "2024-06-15T14:30:00.000Z"`

**Analytics Event:**
- Event name: `waitlist_joined`
- Properties:
  - `product`: Product slug (string)
  - `productId`: Product ID (string)
  - `productType`: Product type (workshop, event, cohort)

### Test Requirements

**File:** `packages/commerce-next/src/hooks/use-waitlist.test.ts`

**Test Scenarios:**

1. **Initial State:**
   - Starts in 'idle' state
   - `isSubmitting`, `isSuccess`, `isError` all false
   - `errorMessage` is null

2. **Successful Submission:**
   - Transitions to 'submitting' state
   - Calls `/api/waitlist` with correct payload
   - Calls `track()` with correct event data
   - Transitions to 'success' state
   - `isSuccess` becomes true

3. **Failed Submission:**
   - Transitions to 'error' state on API failure
   - Sets `errorMessage` with error details
   - `isError` becomes true
   - Does NOT call `track()` on failure

4. **Tag Format:**
   - Generates correct tag: `waitlist_<product-slug>`
   - Includes ISO date string in tagValue

5. **Multiple Submissions:**
   - Resets error state on retry
   - Can transition from 'error' → 'submitting' → 'success'

**Mocking:**
- Mock `fetch()` for API calls
- Mock `track()` for analytics
- Verify correct payload structure

**Target Coverage:** 100%

---

## File Locations

All hooks will live in the `commerce-next` package:

```
packages/commerce-next/
├── src/
│   ├── hooks/
│   │   ├── use-enrollment-state.ts       # Hook 1
│   │   ├── use-enrollment-state.test.ts
│   │   ├── use-seat-availability.ts      # Hook 2
│   │   ├── use-seat-availability.test.ts
│   │   ├── use-waitlist.ts               # Hook 3
│   │   ├── use-waitlist.test.ts
│   │   └── index.ts                      # Re-exports all hooks
```

**Package Exports:**

Update `packages/commerce-next/package.json`:

```json
{
  "exports": {
    "./hooks": {
      "types": "./src/hooks/index.ts",
      "default": "./src/hooks/index.ts"
    }
  }
}
```

**Usage in Apps:**

```typescript
import {
  useEnrollmentState,
  useSeatAvailability,
  useWaitlist
} from '@coursebuilder/commerce-next/hooks'
```

---

## Success Criteria

- [ ] All 3 hooks implemented and tested
- [ ] 100% test coverage achieved
- [ ] Hooks work with all product types (workshop, event, cohort, self-paced)
- [ ] At least 2 apps successfully adopt hooks before Phase 3 begins
- [ ] No regressions in existing widgets after hooks adoption
- [ ] TypeScript inference works correctly (no explicit type annotations needed)
- [ ] Documentation and examples provided for each hook
- [ ] Storybook stories created for visual testing (optional but recommended)

---

## Apps Benefiting

**Immediate Benefits (All 10 Apps):**
- Standardized enrollment state logic
- Consistent sold-out detection (fixes Bug 1, Bug 2, Bug 3)
- Real-time seat availability via polling (8 apps gain this)
- Consistent waitlist UX

**Per-App Impact:**

| App | Current Polling | Gains Polling? | Current Enrollment Logic | Gains Standard Logic? |
|-----|-----------------|----------------|--------------------------|----------------------|
| ai-hero | Workshop only | Event, Cohort | Inconsistent 3 implementations | ✅ |
| epicdev-ai | Unknown | Likely yes | Unknown | ✅ |
| code-with-antonio | Unknown | Likely yes | Unknown | ✅ |
| astro-party | Workshop only | Event | 2 implementations | ✅ |
| epic-web | No | ✅ | Standard | ✅ |
| course-builder-web | No | ✅ | Standard | ✅ |
| craft-of-ui | No | ✅ | Standard | ✅ |
| go-local-first | No | ✅ | Event only | ✅ |
| dev-build | No | ✅ | Resource landing | ✅ |
| just-react | No | ✅ | Resource landing | ✅ |

---

## Navigation

- **← Previous:** [Phase 1: P0 Bug Fixes](./phase-1-p0-bug-fixes.md)
- **→ Next:** [Phase 3: Unified Widget](./phase-3-unified-widget.md)
- **↑ Up:** [PRD: Unified Pricing Widget Architecture](../PRD-unified-pricing-widget.md)
