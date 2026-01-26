# Appendix: Resource Landing Pricing Pattern

**Status:** Analysis Complete
**Last Updated:** 2026-01-22

---

## Overview

The **resource landing pattern** is a variant pricing architecture used in **dev-build** and **just-react** applications. Unlike the standard container-based approach used in other apps, resource-landing implements a **variant-driven** pricing widget that supports multiple visual presentations through a single component.

This pattern represents an evolution toward the unified architecture goals, with built-in support for compositional variants without needing multiple container files.

---

## Why It Matters

The resource-landing pattern is significant because it:

1. **Already implements variant composition** - The architecture this PRD aims to achieve
2. **Reduces duplication** - Single component with 4 visual variants vs 4 separate files
3. **Demonstrates flexibility** - Shows how a unified widget can adapt to different contexts
4. **Maintains type safety** - Full TypeScript support across all variants
5. **Informs final design** - Validates the slots/variants approach for UnifiedPricingWidget

---

## Pattern Comparison

### Architecture Comparison

| Aspect | dev-build + just-react | ai-hero (Standard) | Recommendation |
|--------|----------------------|-------------------|----------------|
| **Pattern** | Variant-driven single widget | Container-per-product-type | **Variant-driven wins** |
| **LOC per app** | ~235 (single file) | ~797 (3 containers) | **70% reduction** |
| **Visual flexibility** | 4 variants (full/compact/inline/button-only) | 1 layout per container | **4x more flexible** |
| **Composition model** | Props-based variants | Container wrappers | **Props-based cleaner** |
| **Polling support** | Not implemented | Yes (Workshop only) | **Must add to resource-landing** |
| **Waitlist integration** | Not implemented | Yes (all containers) | **Must add to resource-landing** |
| **Sold-out state** | Basic (commerce-next bug) | Advanced (except Cohort) | **Hybrid approach needed** |
| **Type safety** | Full TypeScript with discriminated union | Full TypeScript per container | **Equal** |
| **Code duplication** | ~0% (dev-build ↔ just-react identical) | 43.7% (within ai-hero containers) | **Massive win** |
| **Testability** | Single test suite with variant cases | 3 separate test suites | **Simpler** |

---

## Component Architecture

### Resource Landing Pattern (dev-build/just-react)

```
┌─────────────────────────────────────────────┐
│         PricingWidget Component             │
│                                             │
│  ┌────────────────────────────────────────┐│
│  │  Props:                                ││
│  │  - variant: PricingWidgetVariant      ││
│  │  - options: PricingWidgetOptions      ││
│  │  - product: Product                   ││
│  │  - commerceProps: CommerceProps       ││
│  │  - pricingDataLoader: Promise<Data>   ││
│  └────────────────────────────────────────┘│
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐│
│  │ Variant Logic   │  │  Pricing.* Comp  ││
│  │ - full          │→ │  - Root          ││
│  │ - compact       │→ │  - Product       ││
│  │ - inline        │→ │  - Details       ││
│  │ - button-only   │→ │  - Price         ││
│  └─────────────────┘  │  - BuyButton     ││
│                       │  - LiveQuantity  ││
│                       │  - PPPToggle     ││
│                       └──────────────────┘│
└─────────────────────────────────────────────┘
```

### Standard Container Pattern (ai-hero)

```
┌────────────────────────────────────────────┐
│  WorkshopPricingWidgetContainer (~300 LOC) │
│  - Polling logic (useEffect)               │
│  - Enrollment state calculation            │
│  - Waitlist integration                    │
│  - Sold-out detection                      │
│  - Renders: PricingWidget component        │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  EventPricingWidgetContainer (~250 LOC)    │
│  - No polling (missing feature)            │
│  - Enrollment state calculation            │
│  - Waitlist integration                    │
│  - Sold-out detection (uses raw quantity)  │
│  - Renders: PricingWidget component        │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  CohortPricingWidgetContainer (~247 LOC)   │
│  - No polling (missing feature)            │
│  - Enrollment state calculation            │
│  - Waitlist integration                    │
│  - NO sold-out state (P0 bug)              │
│  - Tier selection logic                    │
│  - Renders: PricingWidget component        │
└────────────────────────────────────────────┘

Total: ~797 LOC with 43.7% duplication
```

---

## Key Differences

### 1. Composition Model

**Resource Landing (Variant-Driven):**
```typescript
// Single component, multiple visual presentations
<PricingWidget
  variant="compact"
  options={{ isPPPEnabled: true, allowTeamPurchase: true }}
  product={product}
  commerceProps={commerceProps}
  pricingDataLoader={pricingDataLoader}
  quantityAvailable={quantityAvailable}
/>
```

**Standard (Container-Driven):**
```typescript
// Separate container files for each product type
<WorkshopPricingWidgetContainer {...props} />
<EventPricingWidgetContainer {...props} />
<CohortPricingWidgetContainer {...props} />
```

### 2. Variant Implementation

**Resource Landing:**
- **4 variants** in a single component:
  - `full`: Complete pricing with all options (~49 lines of JSX)
  - `compact`: Minimal pricing for sidebars (~28 lines of JSX)
  - `inline`: Embedding in content (~33 lines of JSX)
  - `button-only`: Just buy button + price (~18 lines of JSX)
- Switch-case logic for variant rendering
- All variants share props validation and commerce logic

**Standard:**
- **1 layout** per container
- Variant behavior achieved through separate files
- Heavy duplication of enrollment logic

### 3. Missing Features in Resource Landing

**What resource-landing needs to match ai-hero:**

| Feature | dev-build/just-react | ai-hero | Gap |
|---------|---------------------|---------|-----|
| **Seat polling** | ❌ Missing | ✅ Workshop only | Must add polling hook |
| **Waitlist form** | ❌ Missing | ✅ All containers | Must add waitlist slot |
| **Sold-out state** | ⚠️ Basic (commerce-next bug) | ⚠️ Advanced (Cohort missing) | Both need P0 fixes |
| **Enrollment states** | ✅ Basic | ✅ Full (4 states) | Must enhance resource-landing |
| **PPP toggle** | ✅ Yes | ✅ Yes | ✅ Feature parity |
| **Team purchase** | ✅ Yes | ✅ Yes | ✅ Feature parity |

### 4. Code Duplication Analysis

**Resource Landing:**
- **dev-build ↔ just-react**: Nearly identical (~99% code overlap)
- Both apps: ~235 LOC each
- Total duplication: **~235 LOC** (entire file duplicated between apps)
- **Opportunity**: Extract to shared package → eliminate ~235 LOC duplication

**Standard (ai-hero alone):**
- **Workshop ↔ Event ↔ Cohort**: 43.7% duplication within single app
- Enrollment logic duplicated across all 3 containers
- Polling logic only in Workshop (inconsistent)
- Total: ~797 LOC

---

## Recommendations for UnifiedPricingWidget Design

### 1. Adopt Variant Pattern from Resource Landing

**Why:**
- Single component with multiple presentations is cleaner than multiple containers
- Variant switching is explicit and type-safe
- Reduces cognitive overhead (one API to learn)

**How:**
```typescript
// UnifiedPricingWidget should support:
type PricingWidgetVariant =
  | 'full'          // Complete pricing (default)
  | 'compact'       // Sidebar/card view
  | 'inline'        // Embed in content
  | 'button-only'   // Minimal CTA

<UnifiedPricingWidget
  variant="compact"
  product={product}
  slots={{
    waitlist: CustomWaitlistForm,
    tierSelector: CohortTierSelector,
  }}
/>
```

### 2. Add Missing Features to Resource Landing

**Phase 2 (Shared Hooks) should enable:**
- `useSeatAvailability` → Add polling to dev-build/just-react
- `useWaitlist` → Add waitlist form to all variants
- `useEnrollmentState` → Standardize 4-state logic

**Migration path:**
1. Extract shared hooks (Phase 2)
2. Retrofit resource-landing apps with hooks
3. Use retrofitted pattern as template for UnifiedPricingWidget

### 3. Eliminate dev-build ↔ just-react Duplication

**Current:**
- Both apps have identical `pricing-widget.tsx` files (~235 LOC each)
- Total waste: ~235 LOC

**Target:**
- Extract to `@coursebuilder/commerce-next/containers/resource-landing-pricing-widget.tsx`
- Both apps import from shared package
- Zero duplication

**Migration checklist (Phase 4):**
- [ ] Extract shared PricingWidget to commerce-next
- [ ] Update dev-build to import from package
- [ ] Update just-react to import from package
- [ ] Delete local copies (~235 LOC removed each)

### 4. Slots vs Variants: Hybrid Approach

**Observation:**
- Resource landing uses **variants** for visual presentation (layout changes)
- ai-hero containers need **slots** for functional customization (tier selection, custom headers)

**Recommendation:**
```typescript
// UnifiedPricingWidget should support BOTH:

// Variants for visual presentation
variant="compact" | "full" | "inline" | "button-only"

// Slots for functional customization
slots={{
  header: CustomHeader,
  tierSelector: CohortTierSelector,
  waitlist: CustomWaitlistForm,
  footer: CustomFooter,
}}
```

### 5. Product-Specific Wrappers (Optional)

**For developer ergonomics, provide wrappers:**

```typescript
// Wrapper for workshop products (variant="full" by default)
<WorkshopPricingWidget product={workshop} />

// Wrapper for event products (variant="inline" for landing pages)
<EventPricingWidget product={event} variant="inline" />

// Wrapper for cohort products (with tier selector slot pre-configured)
<CohortPricingWidget product={cohort} />

// Wrapper for resource landing use case
<ResourceLandingPricingWidget
  product={resource}
  variant="compact"
/>
```

**Benefit:**
- Apps can use semantic wrappers (clearer intent)
- Wrappers set sensible defaults for product type
- Advanced users can still use UnifiedPricingWidget directly

---

## Migration Strategy for Resource Landing Apps

### Option A: Use UnifiedPricingWidget with Heavy Customization

**Approach:**
```typescript
import { UnifiedPricingWidget } from '@coursebuilder/commerce-next/containers'

<UnifiedPricingWidget
  product={resource}
  variant="compact"
  slots={{
    header: ResourceLandingHeader,
    footer: ResourceLandingFooter,
  }}
/>
```

**Pros:**
- All apps use same component
- Consistent API across monorepo
- Easier to maintain

**Cons:**
- May need many custom slots for resource-landing specifics
- Resource-landing pattern might not fit default UnifiedPricingWidget structure

### Option B: Create ResourceLandingPricingWidget (Recommended)

**Approach:**
```typescript
// In packages/commerce-next/src/containers/resource-landing-pricing-widget.tsx

export function ResourceLandingPricingWidget({
  resource,
  variant = 'full',
  options = {},
}: Props) {
  // Use Phase 2 shared hooks
  const enrollmentState = useEnrollmentState(resource)
  const availability = useSeatAvailability(resource)
  const waitlist = useWaitlist(resource)

  // Resource-specific layout with variant support
  return (
    <div className="resource-landing-pricing">
      {/* Existing resource-landing pattern, enhanced with hooks */}
    </div>
  )
}
```

**Pros:**
- Preserves existing resource-landing pattern (low risk)
- Uses shared hooks from Phase 2 (eliminates duplication)
- Optimized for resource-landing use case
- Still benefits from monorepo-wide improvements

**Cons:**
- One more container variant to maintain
- Slightly less consistency with other apps

**Recommendation:** **Option B** is safer for Phase 4 migration. Resource-landing apps are P4 (lowest priority), so preserving existing UX while gaining shared hook benefits is ideal.

---

## Code Examples

### Current: Resource Landing Pattern (dev-build)

```typescript
// apps/dev-build/src/app/(content)/_components/resource-landing/pricing/pricing-widget.tsx

export type PricingWidgetVariant = 'full' | 'compact' | 'inline' | 'button-only'

export function PricingWidget({
  product,
  variant = 'full',
  options = {},
  // ...
}: PricingWidgetProps) {
  const couponFromCode = commerceProps?.couponFromCode
  const { validCoupon } = useCoupon(couponFromCode)

  // Variant-specific rendering
  if (variant === 'button-only') {
    return (
      <Pricing.Root product={product} /* ... */>
        <Pricing.Product>
          <Pricing.Details>
            <Pricing.Price />
            <Pricing.BuyButton>{buttonLabel}</Pricing.BuyButton>
          </Pricing.Details>
        </Pricing.Product>
      </Pricing.Root>
    )
  }

  if (variant === 'compact') {
    return (
      <Pricing.Root product={product} /* ... */>
        <Pricing.Product>
          <Pricing.Details>
            {withTitle && <Pricing.Name />}
            <Pricing.LiveQuantity />
            <Pricing.Price />
            <Pricing.BuyButton>{buttonLabel}</Pricing.BuyButton>
            {withGuaranteeBadge && <Pricing.GuaranteeBadge />}
          </Pricing.Details>
        </Pricing.Product>
      </Pricing.Root>
    )
  }

  // ... (inline and full variants follow similar pattern)
}
```

### Proposed: UnifiedPricingWidget with Resource Landing Support

```typescript
// packages/commerce-next/src/containers/unified-pricing-widget.tsx

export function UnifiedPricingWidget({
  product,
  variant = 'full',
  slots = {},
  options = {},
  // ...
}: UnifiedPricingWidgetProps) {
  // Use Phase 2 shared hooks
  const enrollmentState = useEnrollmentState(product)
  const availability = useSeatAvailability(product, options.pollInterval)
  const waitlist = useWaitlist(product)

  // Render variant
  switch (variant) {
    case 'button-only':
      return <ButtonOnlyVariant {...props} />
    case 'compact':
      return <CompactVariant {...props} />
    case 'inline':
      return <InlineVariant {...props} />
    case 'full':
    default:
      return <FullVariant {...props} slots={slots} />
  }
}

// Product-specific wrapper for resource landing
export function ResourceLandingPricingWidget(props: ResourceLandingProps) {
  return (
    <UnifiedPricingWidget
      {...props}
      variant={props.variant ?? 'compact'}
      options={{
        withGuaranteeBadge: props.options?.withGuaranteeBadge ?? true,
        isPPPEnabled: props.options?.isPPPEnabled ?? true,
        ...props.options,
      }}
    />
  )
}
```

---

## Testing Strategy for Resource Landing Migration

### Variant Coverage

Each variant must be tested in isolation:

```typescript
// Resource landing variant tests
describe('ResourceLandingPricingWidget', () => {
  describe('Variant: button-only', () => {
    it('renders only price and button', () => { /* ... */ })
    it('hides all non-essential elements', () => { /* ... */ })
  })

  describe('Variant: compact', () => {
    it('renders title, quantity, price, button, guarantee', () => { /* ... */ })
    it('uses compact styling', () => { /* ... */ })
  })

  describe('Variant: inline', () => {
    it('renders horizontally-aligned price and button', () => { /* ... */ })
    it('shows team quantity input when enabled', () => { /* ... */ })
  })

  describe('Variant: full', () => {
    it('renders all pricing elements', () => { /* ... */ })
    it('shows PPP toggle when enabled', () => { /* ... */ })
    it('shows workshops list when provided', () => { /* ... */ })
  })
})
```

### Cross-App Consistency

Ensure dev-build and just-react behave identically:

```typescript
describe('Resource landing cross-app consistency', () => {
  it('dev-build matches just-react for variant=compact', () => {
    const devBuildOutput = renderDevBuild({ variant: 'compact' })
    const justReactOutput = renderJustReact({ variant: 'compact' })

    expect(devBuildOutput.html()).toBe(justReactOutput.html())
  })
})
```

---

## Success Criteria

Resource landing migration is successful when:

- [ ] **dev-build and just-react share single implementation** (~235 LOC duplication eliminated)
- [ ] **All 4 variants work** (full, compact, inline, button-only)
- [ ] **Polling added** (via `useSeatAvailability` from Phase 2)
- [ ] **Waitlist added** (via `useWaitlist` from Phase 2)
- [ ] **Enrollment states standardized** (via `useEnrollmentState` from Phase 2)
- [ ] **Visual parity confirmed** (screenshot comparison for all 4 variants)
- [ ] **Zero production errors** for 48h after deployment
- [ ] **Test coverage ≥90%** (all variants + options combinations)

---

## Navigation

- [← Back to Phase 4: App Migrations](./phase-4-app-migrations.md)
- [← Back to Index](./00-index.md)
