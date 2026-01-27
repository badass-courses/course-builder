# PRD: Unified Pricing Widget Architecture (Monorepo-Wide)

**Version:** 1.0
**Date:** 2026-01-22
**Status:** Draft
**Owner:** Course Builder Team
**Scope:** Monorepo-wide (10 applications)

---

## 1. Executive Summary

### Problem Statement

The Course Builder monorepo contains **10 applications** with pricing functionality, each implementing pricing widgets independently. This has led to:

**Critical P0 Bugs:**
- **commerce-next package**: `isSoldOut` check only evaluates `product.type === 'live'`, completely missing `'cohort'` type - affects ALL apps
- **ai-hero Cohort**: Missing sold-out check entirely in enrollment state logic
- **ai-hero Event**: Uses raw `totalQuantity` vs calculated `quantityAvailable` (incorrect seat counts)

**Architectural Issues:**
- **~797 LOC duplication** across ai-hero's 3 pricing containers alone (43.7% duplication rate)
- **Inconsistent patterns**: 6 different implementations of quantity calculation logic
- **No mid-level abstractions**: Apps must compose from raw `Pricing.*` components
- **Server orchestration duplication**: epicdev-ai and code-with-antonio have nearly identical complex server logic (cohort/workshop/event orchestration)
- **Stale data risk**: Only 2 apps implement polling (ai-hero Workshop, astro-party Workshop)

**Per-App Inconsistencies:**
| App | Containers | autoApplyPPP | propsForCommerce Source | Polling | Sold-Out Bugs |
|-----|-----------|--------------|------------------------|---------|---------------|
| ai-hero | 3 (Workshop/Event/Cohort) | true | @coursebuilder/core | Workshop only | Cohort missing, commerce-next bug |
| epicdev-ai | 3 (complex server orchestration) | true | @coursebuilder/core | Unknown | commerce-next bug |
| code-with-antonio | 3 (nearly identical to epicdev-ai) | true | @coursebuilder/core | Unknown | commerce-next bug |
| astro-party | 2 (Workshop/Event) | Unknown | @coursebuilder/core | Workshop only | commerce-next bug |
| epic-web | Standard | false | @coursebuilder/core | No | commerce-next bug |
| course-builder-web | Standard | Unknown | **Local copy** (not package) | No | commerce-next bug |
| craft-of-ui | Standard | Unknown | @coursebuilder/core | No | commerce-next bug |
| go-local-first | 1 (Event) | Unknown | @coursebuilder/core | No | commerce-next bug |
| dev-build | Resource landing | true | @coursebuilder/core | No | commerce-next bug |
| just-react | Resource landing | true | @coursebuilder/core | No | commerce-next bug |

### Proposed Solution

Create a **unified pricing widget abstraction** in the `commerce-next` package that:
- Provides **shared hooks**: `useEnrollmentState`, `useSeatAvailability`, `useWaitlist`
- Exports **mid-level container**: `UnifiedPricingWidget` with composition slots
- Fixes **all P0 bugs** in the shared package (benefits all 10 apps immediately)
- Establishes **monorepo-wide conventions** for pricing patterns

**Migration Strategy:**
1. **Phase 1 (Immediate)**: Fix P0 bugs in commerce-next (affects all 10 apps)
2. **Phase 2 (Foundation)**: Extract shared hooks in commerce-next
3. **Phase 3 (Container)**: Build UnifiedPricingWidget with slots pattern
4. **Phase 4 (Per-App)**: Incremental migration starting with ai-hero → epicdev-ai → others

### Expected Outcomes

**Monorepo-Wide:**
- **70% reduction** in pricing-related LOC across all 10 apps
- **Zero P0 bugs** related to sold-out state (fixed in shared package)
- **Consistent UX** for enrollment states across all products
- **Faster feature development** (implement once, deploy to 10 apps)

**Per-App Benefits:**
- **ai-hero**: ~400 LOC → ~120 LOC (70% reduction), 3 P0 bugs → 0
- **epicdev-ai/code-with-antonio**: Eliminate duplicate server orchestration (~300 LOC saved each)
- **course-builder-web**: Migrate from local propsForCommerce to shared package
- **All apps**: Automatic polling for limited-seat products, consistent quantity calculations

---

## 2. Current State Analysis

### 2.1 Per-App Pricing Implementations

#### Tier 1: Complex Multi-Container Apps (High Duplication)

**ai-hero** - Full implementation with 3 containers
- **Containers**: Workshop, Event, Cohort
- **LOC**: ~797 (43.7% duplication rate)
- **Patterns**:
  - Workshop: Reference implementation (4-state enrollment, polling, correct quantity calc)
  - Event: Missing polling, uses raw totalQuantity ❌
  - Cohort: Missing sold-out check entirely ❌
- **Unique Features**: None (all patterns should be standard)
- **Migration Priority**: P0 (highest ROI, reference for others)

**epicdev-ai** - Complex server orchestration
- **Containers**: 3 (cohort/workshop/event)
- **LOC**: ~300-400 (estimated)
- **Patterns**: Nearly identical to code-with-antonio (duplication across apps!)
- **Server Logic**: Complex orchestration in server components
- **Migration Priority**: P1 (high duplication, affects code-with-antonio)

**code-with-antonio** - Duplicate of epicdev-ai
- **Containers**: 3 (cohort/workshop/event)
- **LOC**: ~300-400 (estimated)
- **Patterns**: Nearly identical to epicdev-ai
- **Migration Priority**: P1 (migrate alongside epicdev-ai)

**astro-party** - Workshop + Event
- **Containers**: 2 (Workshop, Event)
- **LOC**: Unknown
- **Patterns**: Workshop polling implemented
- **Migration Priority**: P2 (fewer containers, polling already working)

#### Tier 2: Standard Implementations (Lower Complexity)

**epic-web** - Standard implementation
- **Containers**: 1 (standard pricing)
- **LOC**: ~150 (estimated)
- **Config**: `autoApplyPPP: false` (unique setting)
- **Migration Priority**: P3 (working well, migrate when hooks stabilize)

**course-builder-web** - LOCAL propsForCommerce copy ⚠️
- **Containers**: 1 (standard)
- **LOC**: Unknown
- **Issue**: Uses LOCAL copy of propsForCommerce instead of @coursebuilder/core
- **Risk**: Out of sync with package updates
- **Migration Priority**: P2 (consolidate to package first, then migrate)

**craft-of-ui** - Standard with PriceCheckProvider
- **Containers**: 1 (standard)
- **LOC**: ~150 (estimated)
- **Patterns**: Uses PriceCheckProvider (good composition)
- **Migration Priority**: P3 (working well)

**go-local-first** - Event pricing only
- **Containers**: 1 (Event)
- **LOC**: ~120 (estimated)
- **Patterns**: Event pricing container
- **Migration Priority**: P4 (single container, low complexity)

#### Tier 3: Resource Landing Patterns (Unique Use Case)

**dev-build** - Resource landing
- **Containers**: 1 (resource landing pattern)
- **LOC**: ~100 (estimated)
- **Config**: `autoApplyPPP: true`
- **Migration Priority**: P4 (specialized use case, evaluate if UnifiedPricingWidget fits)

**just-react** - Resource landing (similar to dev-build)
- **Containers**: 1 (resource landing pattern)
- **LOC**: ~100 (estimated)
- **Config**: `autoApplyPPP: true`
- **Migration Priority**: P4 (specialized use case)

---

### 2.2 Critical Bugs (Monorepo-Wide Impact)

#### Bug 1: commerce-next isSoldOut Type Check (P0 - Affects ALL 10 Apps)
**File:** `packages/commerce-next/src/pricing/pricing-context.tsx`
**Lines:** 70-75

```typescript
const isSoldOut =
  (product.type === 'live' && // ❌ BUG: only checks 'live'
    Boolean(product.fields.availability) &&
    product.fields.availability.quantityAvailable < 1) ||
  Boolean(product.fields.availability?.isSoldOut)
```

**Impact:**
- Cohort products are **never marked as sold-out** via this logic path
- Affects **all 10 apps** using commerce-next package
- Users can attempt checkout for sold-out cohorts, leading to payment failures

**Fix Required:**
```typescript
const isSoldOut =
  ((product.type === 'live' || product.type === 'cohort') && // ✅ Add cohort
    Boolean(product.fields.availability) &&
    product.fields.availability.quantityAvailable < 1) ||
  Boolean(product.fields.availability?.isSoldOut)
```

**Apps Benefiting from Fix:** All 10 apps (immediate benefit)

---

#### Bug 2: ai-hero Cohort Missing Sold-Out Check (P0)
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

**Impact:** ai-hero specific, but pattern risk exists in epicdev-ai/code-with-antonio

**Fix Required:**
```typescript
// Add after bypass coupon check, before date checks
if (isSoldOut && !coupon?.fields?.bypassSoldOut) {
  return 'sold-out'
}
```

---

#### Bug 3: ai-hero Event Uses Raw vs Calculated Quantity (P0)
**File:** `apps/ai-hero/src/app/(commerce)/events/[slug]/event-pricing-widget-container.tsx`
**Line:** 138

```typescript
// Event implementation
const hasLimitedSeats = totalQuantity > 0 // ❌ Uses raw DB value

// Workshop implementation (correct)
const hasLimitedSeats = initialQuantityAvailable !== -1 // ✅ Uses calculated value
```

**Impact:**
- Event widgets show incorrect seat counts (doesn't subtract purchases)
- Pattern may exist in other apps (astro-party, go-local-first)

**Fix Required:** Use unified `getPricingData` for all product types

---

### 2.3 Code Duplication Analysis

#### Within ai-hero (Baseline)
| Pattern | Files | LOC per File | Total Duplication |
|---------|-------|--------------|-------------------|
| Quantity calculation | 3 | ~20 | ~60 LOC |
| Purchased banner | 3 | ~15 | ~45 LOC |
| Coupon ID resolution | 3 | ~10 | ~30 LOC |
| Enrollment state logic | 3 | ~30 | ~90 LOC |
| **Subtotal** | | | **~225 LOC** |

#### Across Apps (Monorepo-Wide)
| Pattern | Apps | Estimated Total LOC |
|---------|------|---------------------|
| Server orchestration (cohort/workshop/event) | epicdev-ai, code-with-antonio | ~600 LOC (300 each) |
| Pricing-query.ts | All 10 apps | ~2000 LOC (200 each) |
| propsForCommerce local copy | course-builder-web | ~150 LOC |
| Workshop container logic | ai-hero, astro-party, epicdev-ai, code-with-antonio | ~800 LOC |
| Event container logic | ai-hero, astro-party, go-local-first, epicdev-ai, code-with-antonio | ~600 LOC |
| Cohort container logic | ai-hero, epicdev-ai, code-with-antonio | ~450 LOC |
| **Total Duplication** | | **~4600 LOC** |

**Target Reduction:** ~4600 LOC → ~1200 LOC (74% reduction via shared hooks + container)

---

### 2.4 Shared Patterns to Consolidate

#### Pattern 1: pricing-query.ts (All 10 Apps)
**Current State:** Every app has its own `pricing-query.ts` file
**Duplication:** ~2000 LOC across 10 apps
**Solution:** Consolidate to `@coursebuilder/commerce-next/pricing-query`
**Exceptions:** Allow app-specific overrides for custom product types

#### Pattern 2: propsForCommerce Source
**Current State:**
- 9 apps use `@coursebuilder/core` (correct)
- 1 app (course-builder-web) uses local copy (out of sync risk)

**Solution:**
- Ensure all apps use `@coursebuilder/core`
- Migrate course-builder-web to package version
- Add type safety to catch local copies in CI

#### Pattern 3: autoApplyPPP Defaults
**Current State:** Inconsistent across apps
- `true`: ai-hero, epicdev-ai, code-with-antonio, dev-build, just-react
- `false`: epic-web
- Unknown: astro-party, course-builder-web, craft-of-ui, go-local-first

**Solution:**
- Document recommended default (`true` for most apps)
- Make explicit in UnifiedPricingWidget config
- Add app-level environment variable override

#### Pattern 4: quantityAvailable Calculation
**Current State:** 6 different implementations
1. `getPricingData` unified (ai-hero Workshop, epic-web, craft-of-ui)
2. Manual 2-query (ai-hero Event/Cohort)
3. Raw `totalQuantity` (ai-hero Event - incorrect)
4. Unknown (epicdev-ai, code-with-antonio, astro-party, go-local-first, dev-build, just-react)

**Solution:**
- Standardize on `getPricingData` in shared hooks
- Calculation: `quantityAvailable = max(0, totalQuantity - totalPurchases)`
- Deprecate manual queries

#### Pattern 5: Server Component Orchestration
**Current State:** epicdev-ai and code-with-antonio have nearly identical complex server logic
**Duplication:** ~600 LOC total
**Solution:**
- Extract to shared `ServerPricingOrchestrator` component
- Support cohort/workshop/event routing
- Maintain app-specific customization via slots

---

### 2.5 commerce-next Package Current State

**Strengths:**
- ✅ Solid composition pattern (`Pricing.*` components)
- ✅ XState machine for pricing state
- ✅ Contexts: `usePricing()`, `PricingProvider`, `PriceCheckProvider`
- ✅ TypeScript inference works well

**Gaps:**
- ❌ No mid-level abstractions (apps compose from raw components)
- ❌ Missing shared hooks (`useEnrollmentState`, `useSeatAvailability`, `useWaitlist`)
- ❌ No unified container (apps build their own)
- ❌ P0 bug: `isSoldOut` only checks 'live' type (not 'cohort')
- ❌ No polling support built-in (apps implement separately)

**Proposed Additions:**
1. Shared hooks package: `@coursebuilder/commerce-next/hooks`
2. Unified container: `@coursebuilder/commerce-next/containers/unified-pricing-widget`
3. Bug fixes in pricing-context.tsx
4. Documentation for migration patterns

---

## 3. Proposed Architecture

### 3.1 Unified Container Design

```typescript
/**
 * Unified pricing widget that handles all product types
 * (workshop, event, cohort) with consistent behavior.
 *
 * Used across all 10 Course Builder apps.
 */
export function UnifiedPricingWidget({
  product,
  purchaseToUpgrade,
  options = {},
  slots = {},
}: UnifiedPricingWidgetProps) {
  // Shared hooks (benefits all apps immediately)
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

### 3.2 Shared Hooks (Monorepo-Wide Benefits)

All hooks will be exported from `@coursebuilder/commerce-next/hooks` and immediately available to all 10 apps.

#### 1. useEnrollmentState

```typescript
/**
 * Determines enrollment state with consistent logic across all product types.
 *
 * Used by: All 10 apps (fixes ai-hero cohort bug, standardizes logic)
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

**Apps Benefiting:** All 10 apps
**Bugs Fixed:** 3 (commerce-next, ai-hero cohort, ai-hero event)

---

#### 2. useSeatAvailability

```typescript
/**
 * Real-time seat availability with polling for limited-seat products.
 *
 * Used by: All 10 apps (brings polling to 8 apps that don't have it)
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

**Apps Benefiting:** 8 apps (all except ai-hero Workshop, astro-party Workshop which already have polling)
**New Capability:** Real-time seat updates (prevents stale data, race conditions)

---

#### 3. useWaitlist

```typescript
/**
 * ConvertKit waitlist integration for sold-out products.
 *
 * Used by: All 10 apps (standardizes waitlist pattern)
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

**Apps Benefiting:** All 10 apps (consistent waitlist UX)

---

### 3.3 Composition Pattern (Slots/Render Props)

The unified widget uses **slots** for maximum customization without forking logic. This allows each of the 10 apps to customize UI while sharing core logic.

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
    autoApplyPPP?: boolean // App-specific PPP behavior
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
```

**Per-App Customization Examples:**

```typescript
// ai-hero: Custom cohort tier selection
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

// epicdev-ai: Custom server orchestration (if needed)
<UnifiedPricingWidget
  product={product}
  slots={{
    checkoutForm: ({ product }) => (
      <ServerOrchestrationCheckout product={product} />
    )
  }}
/>

// epic-web: Disable PPP auto-apply
<UnifiedPricingWidget
  product={product}
  options={{
    autoApplyPPP: false, // epic-web specific
  }}
/>
```

---

## 4. Migration Plan (Monorepo-Wide)

### Phase 1: Fix Critical Bugs (P0) — **1-2 days**

**Priority:** Immediate production fixes affecting all 10 apps

**Tasks:**
1. Fix commerce-next isSoldOut type check
   - File: `packages/commerce-next/src/pricing/pricing-context.tsx`
   - Change: `product.type === 'live'` → `(product.type === 'live' || product.type === 'cohort')`
   - Test: Sold-out cohort should trigger isSoldOut flag
   - **Impact**: All 10 apps benefit immediately

2. Fix ai-hero cohort sold-out check
   - File: `apps/ai-hero/src/app/(commerce)/events/[slug]/cohort-pricing-widget-container.tsx`
   - Add sold-out state in `getEnrollmentState()`
   - Test: Create sold-out cohort, verify waitlist shows
   - **Impact**: ai-hero only (but prevents pattern from spreading)

3. Fix ai-hero Event quantity calculation
   - File: `apps/ai-hero/src/app/(commerce)/events/[slug]/event-pricing-widget-container.tsx`
   - Replace raw `totalQuantity` with `getPricingData` call
   - Test: Event with 50 total / 45 sold should show 5 remaining
   - **Impact**: ai-hero only (but establishes correct pattern)

**Deliverables:**
- 3 PRs (one per bug)
- Updated tests for each fix
- Regression test suite for sold-out states
- Monorepo-wide verification (test all 10 apps after commerce-next fix)

**Success Metrics:**
- Zero sold-out state bugs in production across all apps
- All 10 apps show correct seat counts for cohort products

---

### Phase 2: Extract Shared Hooks — **3-4 days**

**Priority:** Foundation for unified widget (benefits all 10 apps)

**Tasks:**
1. Create `packages/commerce-next/src/hooks/use-enrollment-state.ts`
   - Extract 4-state logic from ai-hero Workshop (reference implementation)
   - Add comprehensive tests (8 states × 3 product types = 24 tests)
   - Document with TSDoc
   - **Apps benefiting**: All 10 (standardized enrollment logic)

2. Create `packages/commerce-next/src/hooks/use-seat-availability.ts`
   - Extract polling logic from ai-hero Workshop
   - Add optimistic updates
   - Add tab visibility handling
   - Test: Mock polling, verify interval/pause behavior
   - **Apps benefiting**: 8 apps without polling (astro-party Event, epic-web, course-builder-web, craft-of-ui, go-local-first, dev-build, just-react, epicdev-ai, code-with-antonio)

3. Create `packages/commerce-next/src/hooks/use-waitlist.ts`
   - Extract ConvertKit integration pattern
   - Add analytics
   - Test: Mock API, verify tag format
   - **Apps benefiting**: All 10 (consistent waitlist UX)

**Deliverables:**
- 3 new hooks in `commerce-next` package
- 100% test coverage
- Storybook stories for each hook (with mock data)
- Migration guide for apps to adopt hooks immediately (optional, pre-unified-widget)

**Success Metrics:**
- Hooks work with all 3 product types (workshop, event, cohort)
- No regressions in existing widgets
- Tests pass in CI
- At least 2 apps adopt hooks before Phase 3 (validation)

---

### Phase 3: Unified Container — **5-7 days**

**Priority:** Single implementation point for all 10 apps

**Tasks:**
1. Create `UnifiedPricingWidget` component
   - Use Phase 2 hooks
   - Implement XState machine
   - Support all slots/render props
   - **Target**: Works for 90% of use cases across 10 apps

2. Create default slot implementations
   - `DefaultHeader`, `DefaultFooter`
   - `DefaultCheckoutForm`, `DefaultWaitlistForm`
   - `DefaultPurchasedBanner`
   - Design for maximum reusability across apps

3. Create product-specific variants (thin wrappers)
   - `WorkshopPricingWidget` (uses unified, passes workshop-specific slots)
   - `EventPricingWidget` (uses unified, passes event-specific slots)
   - `CohortPricingWidget` (uses unified, passes cohort-specific slots)

4. Create server orchestration helper (for epicdev-ai, code-with-antonio)
   - `ServerPricingOrchestrator` component
   - Handles cohort/workshop/event routing
   - Reduces ~600 LOC duplication between those 2 apps

**Deliverables:**
- `UnifiedPricingWidget` component
- 5 default slot components
- 3 product-specific wrapper components
- `ServerPricingOrchestrator` helper
- Storybook stories for all variants
- Migration guide for each app tier (complex multi-container, standard, resource landing)

**Success Metrics:**
- Single source of truth for enrollment logic
- All product types (workshop, event, cohort) supported
- Visual parity with existing widgets
- Customization possible for all app-specific needs

---

### Phase 4: Per-App Migration — **2-3 days per app**

**Priority:** Incremental rollout, highest ROI first

**Migration Order (by priority):**

1. **ai-hero** (P0 - highest ROI)
   - Current: 3 containers, ~797 LOC, 43.7% duplication
   - Target: UnifiedPricingWidget with 3 thin wrappers, ~240 LOC
   - Savings: ~557 LOC (70% reduction)
   - Risk: Medium (production app, but comprehensive tests)

2. **epicdev-ai + code-with-antonio** (P1 - cross-app duplication)
   - Current: ~600 LOC duplication between apps
   - Target: Shared ServerPricingOrchestrator
   - Savings: ~600 LOC (migrate together to validate pattern)
   - Risk: High (2 production apps, complex server logic)

3. **course-builder-web** (P2 - local propsForCommerce migration)
   - Current: Local copy of propsForCommerce
   - Target: Use @coursebuilder/core + UnifiedPricingWidget
   - Savings: ~150 LOC + eliminates sync risk
   - Risk: Medium (ensure no breaking changes from package migration)

4. **astro-party** (P2 - 2 containers)
   - Current: Workshop + Event containers
   - Target: UnifiedPricingWidget with 2 wrappers
   - Savings: ~200 LOC
   - Risk: Low (already has polling)

5. **epic-web** (P3 - working well, validate stability)
   - Current: Standard implementation
   - Target: UnifiedPricingWidget (validate autoApplyPPP: false works)
   - Savings: ~80 LOC
   - Risk: Low (simple implementation)

6. **craft-of-ui** (P3 - PriceCheckProvider integration)
   - Current: Standard with PriceCheckProvider
   - Target: UnifiedPricingWidget (ensure PriceCheckProvider compatibility)
   - Savings: ~80 LOC
   - Risk: Low

7. **go-local-first** (P4 - single container)
   - Current: Event container
   - Target: EventPricingWidget wrapper
   - Savings: ~70 LOC
   - Risk: Low

8. **dev-build + just-react** (P4 - evaluate fit)
   - Current: Resource landing pattern (unique use case)
   - Target: Evaluate if UnifiedPricingWidget fits or needs separate abstraction
   - Savings: TBD (may require custom pattern)
   - Risk: Low (specialized use case)

**Per-App Migration Checklist:**
- [ ] Review app-specific pricing patterns
- [ ] Identify required slots/customizations
- [ ] Replace container with unified variant
- [ ] Pass app-specific slots (if any)
- [ ] Remove old container file(s)
- [ ] Update tests (unit + integration)
- [ ] Verify in staging
- [ ] Deploy to production with feature flag
- [ ] Monitor errors for 48h
- [ ] Document app-specific patterns for future reference

**Rollback Plan (Per-App):**
- Keep old containers in Git history
- Feature flag: `useUnifiedPricingWidget` (default: true)
- If errors spike, toggle flag to false (instant rollback)
- Monorepo-wide rollback only if commerce-next bug discovered

**Deliverables:**
- 10 migration PRs (or grouped by tier: 3 PRs)
- Updated integration tests for each app
- Monitoring dashboards (unified across apps)
- Migration retrospective (learnings for future monorepo-wide changes)

**Success Metrics (Monorepo-Wide):**
- Zero production errors post-migration across all 10 apps
- ~4600 LOC → ~1200 LOC (74% reduction)
- 50% reduction in Sentry issues for pricing across all apps
- Consistent UX for enrollment states in all apps

---

## 5. Per-App Migration Guide

### 5.1 ai-hero (Tier 1: Complex Multi-Container)

**Current State:**
- 3 containers: Workshop, Event, Cohort
- ~797 LOC total
- 43.7% duplication rate
- 3 P0 bugs (cohort sold-out, event quantity, commerce-next type check)

**Migration Steps:**
1. Replace `workshop-pricing-widget-container.tsx` with `WorkshopPricingWidget`
2. Replace `event-pricing-widget-container.tsx` with `EventPricingWidget`
3. Replace `cohort-pricing-widget-container.tsx` with `CohortPricingWidget`
4. Cohort tier selection: Use `pricingDetails` slot for tier selector
5. Remove old containers (~797 LOC deleted)

**Custom Slots Required:**
```typescript
// Cohort tier selection
<CohortPricingWidget
  product={cohort}
  slots={{
    pricingDetails: ({ product }) => (
      <CohortTierSelector tiers={product.fields.tiers} />
    )
  }}
/>
```

**Expected Outcome:**
- ~797 LOC → ~240 LOC (70% reduction)
- 3 P0 bugs → 0 bugs
- Polling added to Event and Cohort (previously only Workshop)

---

### 5.2 epicdev-ai + code-with-antonio (Tier 1: Server Orchestration)

**Current State:**
- Nearly identical complex server orchestration
- ~600 LOC duplication between apps
- 3 containers each (cohort/workshop/event)

**Migration Steps:**
1. Extract shared `ServerPricingOrchestrator` to commerce-next
2. Both apps use orchestrator with app-specific config
3. Replace individual containers with orchestrator calls
4. Validate both apps work identically

**Shared Orchestrator Pattern:**
```typescript
// In commerce-next package
export function ServerPricingOrchestrator({
  product,
  purchaseToUpgrade,
  appConfig,
}: ServerOrchestratorProps) {
  // Complex server logic (cohort/workshop/event routing)
  // Shared between epicdev-ai and code-with-antonio

  return <UnifiedPricingWidget product={product} {...resolvedProps} />
}

// In epicdev-ai
<ServerPricingOrchestrator
  product={product}
  appConfig={epicdevConfig}
/>

// In code-with-antonio (identical usage)
<ServerPricingOrchestrator
  product={product}
  appConfig={antonioConfig}
/>
```

**Expected Outcome:**
- ~600 LOC duplication → 0 (single shared implementation)
- Both apps maintain app-specific branding/config
- Pattern established for future apps with complex orchestration

---

### 5.3 course-builder-web (Tier 2: Local Copy Migration)

**Current State:**
- Uses LOCAL copy of propsForCommerce (not @coursebuilder/core)
- Out of sync risk with package updates
- Standard pricing implementation

**Migration Steps:**
1. **First**: Migrate from local propsForCommerce to @coursebuilder/core
2. Verify no breaking changes (comprehensive testing)
3. **Then**: Migrate to UnifiedPricingWidget
4. Remove local copy (~150 LOC)

**Risk Mitigation:**
- Compare local copy vs package version (identify diffs)
- Test thoroughly before UnifiedPricingWidget migration
- Two-phase migration (package first, then widget)

**Expected Outcome:**
- Eliminates sync risk with core package
- ~150 LOC reduction
- Consistent with other 9 apps

---

### 5.4 astro-party (Tier 2: 2 Containers)

**Current State:**
- 2 containers: Workshop, Event
- Workshop has polling (Event likely doesn't)

**Migration Steps:**
1. Replace Workshop container with `WorkshopPricingWidget`
2. Replace Event container with `EventPricingWidget`
3. Verify polling works for both (Event gains polling)

**Expected Outcome:**
- ~200 LOC reduction
- Polling added to Event container
- Consistent with ai-hero Workshop/Event

---

### 5.5 epic-web (Tier 2: autoApplyPPP: false)

**Current State:**
- Standard implementation
- `autoApplyPPP: false` (unique setting)

**Migration Steps:**
1. Replace standard container with `UnifiedPricingWidget`
2. Pass `options.autoApplyPPP: false`
3. Verify PPP behavior unchanged

**Config:**
```typescript
<UnifiedPricingWidget
  product={product}
  options={{
    autoApplyPPP: false, // Epic-web specific
  }}
/>
```

**Expected Outcome:**
- ~80 LOC reduction
- Validates autoApplyPPP config works correctly
- Reference for other apps with custom PPP behavior

---

### 5.6 craft-of-ui (Tier 2: PriceCheckProvider)

**Current State:**
- Standard implementation
- Uses PriceCheckProvider (good composition pattern)

**Migration Steps:**
1. Replace container with `UnifiedPricingWidget`
2. Ensure PriceCheckProvider wraps UnifiedPricingWidget
3. Verify price check logic unchanged

**Expected Outcome:**
- ~80 LOC reduction
- PriceCheckProvider compatibility validated

---

### 5.7 go-local-first (Tier 3: Single Event Container)

**Current State:**
- 1 container: Event pricing
- Simplest migration (single container)

**Migration Steps:**
1. Replace Event container with `EventPricingWidget`
2. Test event-specific features

**Expected Outcome:**
- ~70 LOC reduction
- Polling added to Event (previously missing)

---

### 5.8 dev-build + just-react (Tier 3: Resource Landing)

**Current State:**
- Resource landing pattern (unique use case)
- May not fit standard UnifiedPricingWidget model

**Migration Steps:**
1. **Evaluate**: Does UnifiedPricingWidget fit resource landing pattern?
2. **Option A**: Use UnifiedPricingWidget with heavy customization (slots)
3. **Option B**: Create separate ResourceLandingPricingWidget abstraction
4. Document decision for future resource landing apps

**Expected Outcome:**
- TBD (depends on evaluation)
- Pattern established for resource landing pricing

---

## 6. Success Metrics (Monorepo-Wide)

### Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Total LOC (pricing)** | ~4600 | ~1200 | 74% reduction |
| **Apps with P0 bugs** | 10 (commerce-next bug) | 0 | 100% resolution |
| **Apps with polling** | 2 | 10 | 400% increase |
| **Quantity calc duplication** | 6 implementations | 1 | 100% elimination |
| **Test coverage (pricing)** | ~60% avg | 90%+ | +30% increase |
| **Sentry errors (pricing)** | ~50/week (all apps) | <15/week | 70% reduction |
| **Time to add new product type** | ~2 days | <4 hours | 75% reduction |
| **Apps using local copies** | 1 (course-builder-web) | 0 | 100% elimination |

---

### Per-App ROI

| App | Current LOC | Target LOC | Savings | Bugs Fixed |
|-----|-------------|------------|---------|------------|
| ai-hero | ~797 | ~240 | ~557 (70%) | 3 P0 bugs |
| epicdev-ai | ~300 | ~100 | ~200 (67%) + shared orchestrator | 1 (commerce-next) |
| code-with-antonio | ~300 | ~100 | ~200 (67%) + shared orchestrator | 1 (commerce-next) |
| astro-party | ~250 | ~100 | ~150 (60%) | 1 (commerce-next) |
| epic-web | ~150 | ~70 | ~80 (53%) | 1 (commerce-next) |
| course-builder-web | ~200 | ~70 | ~130 (65%) + eliminates sync risk | 1 (commerce-next) |
| craft-of-ui | ~150 | ~70 | ~80 (53%) | 1 (commerce-next) |
| go-local-first | ~120 | ~50 | ~70 (58%) | 1 (commerce-next) |
| dev-build | ~100 | TBD | TBD | 1 (commerce-next) |
| just-react | ~100 | TBD | TBD | 1 (commerce-next) |
| **Total** | **~4600** | **~1200** | **~3400 (74%)** | **All 10 apps** |

**Additional Benefits (Not Quantified in LOC):**
- Shared orchestrator eliminates ~600 LOC duplication between epicdev-ai and code-with-antonio
- Polling added to 8 apps (prevents stale data, race conditions)
- Consistent UX across all 10 apps
- Faster feature development (implement once, deploy to 10 apps)

---

### Qualitative Metrics

**Developer Experience (DX):**
- [ ] New developers understand pricing flow across ALL apps in <30 min (vs 2+ hours per app)
- [ ] Adding product-specific UI requires <20 LOC across any app
- [ ] Zero "which pricing container?" questions in Slack
- [ ] TypeScript inference guides customization (no guessing)
- [ ] Monorepo-wide pricing changes require single PR (not 10)

**User Experience (UX):**
- [ ] Consistent sold-out messaging across all 10 apps
- [ ] Real-time seat updates in all apps (no stale data)
- [ ] Waitlist works on first try across all apps (no "try again" errors)
- [ ] Countdown timers show correct time zones

**Operational Metrics:**
- [ ] Zero production incidents related to pricing bugs across all 10 apps
- [ ] Monitoring dashboards show <1% error rate (monorepo-wide)
- [ ] Feature flags allow instant rollback per app
- [ ] A/B tests can toggle unified vs legacy widgets

---

### Rollback Criteria (Monorepo-Wide)

**Trigger rollback if:**
- Error rate increases >5% across any app in 48h window
- Customer reports spike (>10 tickets/day for any app)
- Checkout conversion rate drops >10% in any app
- Sentry alerts fire for pricing errors in multiple apps

**Rollback Process:**
1. **Per-app rollback**: Toggle feature flag for affected app only
2. **Monorepo-wide rollback**: If commerce-next bug discovered
   - Revert commerce-next package changes
   - All 10 apps fall back to old commerce-next automatically
3. Post mortem: Analyze logs, identify root cause
4. Fix in unified widget or commerce-next, re-test in staging
5. Re-enable with phased rollout (1 app → 3 apps → all 10 apps)

---

## 7. API Design (Monorepo-Wide)

### TypeScript Interfaces

```typescript
// ============================================================================
// Core Types (Shared Across All 10 Apps)
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

    // Cohort specific (ai-hero, epicdev-ai, code-with-antonio)
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
// Hook Return Types (Available to All 10 Apps)
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
// Component Props (Unified Across All 10 Apps)
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
    autoApplyPPP?: boolean // App-specific (epic-web: false, others: true)
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

// Slot prop interfaces
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
// Configuration Schema (Monorepo-Wide)
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

  /** Auto-apply PPP (default: true, epic-web: false) */
  autoApplyPPP?: boolean

  /** Feature flags */
  features?: {
    waitlist?: boolean // Enable waitlist (default: true)
    analytics?: boolean // Track events (default: true)
    optimisticUpdates?: boolean // Update UI before API confirms (default: true)
  }
}

// ============================================================================
// Server Orchestration (epicdev-ai, code-with-antonio)
// ============================================================================

interface ServerOrchestratorProps {
  product: Product
  purchaseToUpgrade?: Purchase
  appConfig: {
    appName: string // 'epicdev-ai' | 'code-with-antonio'
    branding: BrandingConfig
    customSlots?: PricingWidgetSlots
  }
}

interface BrandingConfig {
  primaryColor: string
  logoUrl: string
  customCSS?: string
}
```

---

### Configuration Examples (Per-App)

**Default (ai-hero, astro-party, most apps):**
```typescript
<UnifiedPricingWidget
  product={workshopProduct}
  // All defaults work out-of-box
/>
```

**epic-web (autoApplyPPP: false):**
```typescript
<UnifiedPricingWidget
  product={product}
  options={{
    autoApplyPPP: false, // Epic-web specific
  }}
/>
```

**ai-hero Cohort (tier selection):**
```typescript
<UnifiedPricingWidget
  product={cohortProduct}
  slots={{
    pricingDetails: ({ product }) => (
      <CohortTierSelector tiers={product.fields.tiers} />
    )
  }}
/>
```

**epicdev-ai (server orchestration):**
```typescript
<ServerPricingOrchestrator
  product={product}
  appConfig={{
    appName: 'epicdev-ai',
    branding: {
      primaryColor: '#ff6b6b',
      logoUrl: '/logo.png',
    },
    customSlots: {
      header: EpicDevHeader, // App-specific branding
    }
  }}
/>
```

**Admin preview (any app):**
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

## 8. Monitoring & Observability (Monorepo-Wide)

### Datadog Dashboards

**Unified Pricing Widget Health (All 10 Apps):**
- Checkout conversion rate (by app, by product type)
- Error rate (by app, by enrollment state)
- Waitlist submission success rate (by app)
- Polling latency (p50, p95, p99) (by app)
- Quantity calculation accuracy (compare DB vs cache) (by app)

**Per-App Breakdown:**
- ai-hero: Workshop/Event/Cohort conversion rates
- epicdev-ai: Server orchestration performance
- code-with-antonio: Server orchestration performance (compare to epicdev-ai)
- epic-web: autoApplyPPP behavior validation
- All apps: Sold-out state accuracy (should be 100%)

---

### Sentry Alerts

**Critical (Monorepo-Wide):**
- `PricingQuantityMismatch`: Calculated quantity != DB quantity (any app)
- `SoldOutStateMissing`: Product should be sold-out but isn't (any app)
- `PollingFailure`: 3+ consecutive polling failures (any app)
- `CommerceNextBugRecurrence`: isSoldOut check regression (all apps affected)

**Warning (Per-App):**
- `WaitlistSubmissionFailed`: ConvertKit API error (by app)
- `CouponBypassIgnored`: Bypass coupon didn't work (by app)
- `DateParsingError`: Invalid enrollment date format (by app)

---

### Log Aggregation (Axiom)

**Monorepo-Wide Queries:**
```
// Checkout attempts for sold-out products (should be zero across all apps)
event_name="checkout_attempted" AND enrollment_state="sold-out" AND app="*"

// Polling errors (by app)
event_name="polling_error" AND app="*"

// Waitlist conversions (by app)
event_name="waitlist_joined" AND app="*"

// Per-app comparison
event_name="*" AND app IN ["ai-hero", "epicdev-ai", "epic-web"]
```

---

## Appendix A: Glossary (Monorepo Context)

- **Enrollment State**: Current status of a product's enrollment period (open, sold-out, not-open, closed) - consistent across all 10 apps
- **Quantity Available**: Calculated number of seats remaining (total - purchases) - unified calculation in commerce-next
- **Bypass Coupon**: Special coupon that overrides sold-out or closed states - works across all apps
- **Polling**: Real-time fetching of seat availability every N seconds - now available to all 10 apps
- **Waitlist**: ConvertKit-based list for users wanting sold-out products - standardized across all apps
- **Slots**: React render props pattern for customizing UI sections - allows per-app customization
- **XState Machine**: State machine for managing enrollment flow transitions - shared across all apps
- **UnifiedPricingWidget**: Monorepo-wide pricing container - single implementation for all 10 apps
- **ServerPricingOrchestrator**: Shared server orchestration component - used by epicdev-ai and code-with-antonio
- **autoApplyPPP**: App-specific PPP (Purchasing Power Parity) behavior - configurable per app
- **propsForCommerce**: Shared pricing props utility - should use @coursebuilder/core (not local copy)

---

## Appendix B: Migration Checklist (Monorepo-Wide)

### Pre-Migration (Commerce-Next Package)
- [ ] Fix commerce-next isSoldOut type check (P0 - affects all 10 apps)
- [ ] Add comprehensive tests for sold-out state (all product types)
- [ ] Verify all 10 apps work after commerce-next fix
- [ ] Document breaking changes (if any)

### Phase 1: Hooks Extraction
- [ ] Extract useEnrollmentState hook
- [ ] Extract useSeatAvailability hook
- [ ] Extract useWaitlist hook
- [ ] 100% test coverage for all hooks
- [ ] Storybook stories for all hooks
- [ ] Migration guide for apps to adopt hooks early (optional)
- [ ] Validate hooks in 2+ apps before Phase 2

### Phase 2: Unified Container
- [ ] Build UnifiedPricingWidget component
- [ ] Build default slot implementations (5 components)
- [ ] Build product-specific wrappers (Workshop/Event/Cohort)
- [ ] Build ServerPricingOrchestrator for epicdev-ai/code-with-antonio
- [ ] Storybook stories for all variants
- [ ] Integration tests (all product types)
- [ ] Migration guide for each app tier

### Phase 3: Per-App Migration (10 Apps)

**ai-hero (P0):**
- [ ] Replace Workshop container
- [ ] Replace Event container
- [ ] Replace Cohort container (with tier selector slot)
- [ ] Remove old containers (~797 LOC)
- [ ] Update tests
- [ ] Staging verification
- [ ] Production deployment with feature flag
- [ ] Monitor for 48h
- [ ] Document ai-hero-specific patterns

**epicdev-ai + code-with-antonio (P1):**
- [ ] Extract shared ServerPricingOrchestrator
- [ ] Migrate epicdev-ai to orchestrator
- [ ] Migrate code-with-antonio to orchestrator
- [ ] Verify both apps work identically
- [ ] Remove duplicated orchestration code (~600 LOC)
- [ ] Update tests for both apps
- [ ] Staging verification (both apps)
- [ ] Production deployment (both apps)
- [ ] Monitor for 48h
- [ ] Document orchestrator pattern

**course-builder-web (P2):**
- [ ] Migrate from local propsForCommerce to @coursebuilder/core
- [ ] Test thoroughly (ensure no breaking changes)
- [ ] Migrate to UnifiedPricingWidget
- [ ] Remove local copy (~150 LOC)
- [ ] Update tests
- [ ] Staging verification
- [ ] Production deployment
- [ ] Monitor for 48h

**astro-party (P2):**
- [ ] Replace Workshop container
- [ ] Replace Event container
- [ ] Verify polling works for both
- [ ] Remove old containers (~250 LOC)
- [ ] Update tests
- [ ] Staging verification
- [ ] Production deployment
- [ ] Monitor for 48h

**epic-web (P3):**
- [ ] Replace standard container
- [ ] Configure autoApplyPPP: false
- [ ] Verify PPP behavior unchanged
- [ ] Update tests
- [ ] Staging verification
- [ ] Production deployment
- [ ] Monitor for 48h

**craft-of-ui (P3):**
- [ ] Replace container (ensure PriceCheckProvider compatibility)
- [ ] Update tests
- [ ] Staging verification
- [ ] Production deployment
- [ ] Monitor for 48h

**go-local-first (P4):**
- [ ] Replace Event container
- [ ] Update tests
- [ ] Staging verification
- [ ] Production deployment
- [ ] Monitor for 48h

**dev-build + just-react (P4):**
- [ ] Evaluate UnifiedPricingWidget fit for resource landing
- [ ] Option A: Use UnifiedPricingWidget with slots
- [ ] Option B: Create ResourceLandingPricingWidget
- [ ] Document decision
- [ ] Migrate both apps (consistent pattern)
- [ ] Update tests
- [ ] Staging verification
- [ ] Production deployment
- [ ] Monitor for 48h

### Post-Migration
- [ ] Verify all 10 apps running on UnifiedPricingWidget
- [ ] Remove all old container files (monorepo-wide cleanup)
- [ ] Update documentation (monorepo-wide pricing guide)
- [ ] Migration retrospective (learnings, metrics, next steps)
- [ ] Celebrate! (~3400 LOC reduction, 0 P0 bugs)

---

**End of PRD**
