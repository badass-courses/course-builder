# Phase 3: Build UnifiedPricingWidget

**Status:** Not Started
**Depends On:** [Phase 2: Shared Hooks](./phase-2-shared-hooks.md)
**Estimated Duration:** 5-7 days

---

## Objective

Create a single, unified pricing widget implementation that works across all 10 Course Builder applications, providing a consistent user experience and eliminating duplicate container logic.

The `UnifiedPricingWidget` serves as the single implementation point for all pricing widgets in the monorepo, supporting all product types (workshop, event, cohort) with maximum customization through a slots/render props pattern.

---

## Component Architecture

### Core Component Design

The `UnifiedPricingWidget` uses the shared hooks from Phase 2 and provides a flexible composition pattern:

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
  // Shared hooks (from Phase 2)
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

### Slots/Render Props Pattern

The widget uses **slots** for maximum customization without forking logic. Each app can customize UI while sharing core enrollment and availability logic.

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

### Default Slot Implementations

Phase 3 includes creating default implementations for all slots:

1. **DefaultHeader** - Product name, dates, enrollment status badge
2. **DefaultFooter** - Seat counter, enrollment dates, timezone info
3. **DefaultCheckoutForm** - Standard checkout flow with Stripe integration
4. **DefaultWaitlistForm** - Email capture with ConvertKit integration
5. **DefaultPurchasedBanner** - "You're enrolled!" message with access instructions

All defaults are designed for maximum reusability across apps while allowing per-app customization through slots.

---

## Product-Specific Variants

Create thin wrapper components for each product type:

### WorkshopPricingWidget

```typescript
/**
 * Workshop-specific pricing widget (thin wrapper around UnifiedPricingWidget)
 */
export function WorkshopPricingWidget({
  product,
  purchaseToUpgrade,
  options,
  slots,
}: WorkshopPricingWidgetProps) {
  return (
    <UnifiedPricingWidget
      product={product}
      purchaseToUpgrade={purchaseToUpgrade}
      options={options}
      slots={{
        // Workshop-specific defaults
        header: slots?.header ?? WorkshopHeader,
        footer: slots?.footer ?? WorkshopFooter,
        ...slots,
      }}
    />
  )
}
```

### EventPricingWidget

```typescript
/**
 * Event-specific pricing widget (thin wrapper around UnifiedPricingWidget)
 */
export function EventPricingWidget({
  product,
  purchaseToUpgrade,
  options,
  slots,
}: EventPricingWidgetProps) {
  return (
    <UnifiedPricingWidget
      product={product}
      purchaseToUpgrade={purchaseToUpgrade}
      options={options}
      slots={{
        // Event-specific defaults (e.g., countdown to event start)
        header: slots?.header ?? EventHeader,
        dateDisplay: slots?.dateDisplay ?? EventDateDisplay,
        ...slots,
      }}
    />
  )
}
```

### CohortPricingWidget

```typescript
/**
 * Cohort-specific pricing widget with tier support
 * (thin wrapper around UnifiedPricingWidget)
 */
export function CohortPricingWidget({
  product,
  purchaseToUpgrade,
  options,
  slots,
}: CohortPricingWidgetProps) {
  return (
    <UnifiedPricingWidget
      product={product}
      purchaseToUpgrade={purchaseToUpgrade}
      options={options}
      slots={{
        // Cohort-specific defaults (includes tier selection)
        header: slots?.header ?? CohortHeader,
        pricingDetails: slots?.pricingDetails ?? CohortTierSelector,
        ...slots,
      }}
    />
  )
}
```

---

## XState Machine Design

The enrollment state machine manages all pricing widget state transitions:

```typescript
import { createMachine, assign } from 'xstate'

/**
 * Enrollment state machine for UnifiedPricingWidget
 *
 * States:
 * - notOpen: Enrollment hasn't opened yet
 * - open: Accepting enrollments
 * - soldOut: No seats available (show waitlist)
 * - closed: Enrollment permanently closed
 * - purchased: User already owns this product
 * - checkingOut: Processing purchase
 * - error: Checkout failed
 */
export const enrollmentMachine = createMachine({
  id: 'enrollment',
  initial: 'loading',
  context: {
    product: null,
    enrollmentState: 'open',
    availability: null,
    purchaseToUpgrade: null,
    error: null,
  },
  states: {
    loading: {
      on: {
        LOADED: {
          target: 'evaluating',
          actions: assign({
            product: (_, event) => event.product,
            enrollmentState: (_, event) => event.enrollmentState,
            availability: (_, event) => event.availability,
            purchaseToUpgrade: (_, event) => event.purchaseToUpgrade,
          }),
        },
      },
    },
    evaluating: {
      always: [
        { target: 'purchased', cond: 'hasPurchase' },
        { target: 'soldOut', cond: 'isSoldOut' },
        { target: 'notOpen', cond: 'isNotOpen' },
        { target: 'closed', cond: 'isClosed' },
        { target: 'open' },
      ],
    },
    purchased: {
      type: 'final',
    },
    open: {
      on: {
        CHECKOUT: 'checkingOut',
        SOLD_OUT: 'soldOut',
      },
    },
    soldOut: {
      on: {
        JOIN_WAITLIST: 'joiningWaitlist',
        SEATS_AVAILABLE: 'open',
      },
    },
    notOpen: {
      on: {
        OPENED: 'open',
      },
    },
    closed: {
      type: 'final',
    },
    checkingOut: {
      on: {
        SUCCESS: 'purchased',
        ERROR: {
          target: 'error',
          actions: assign({
            error: (_, event) => event.error,
          }),
        },
        CANCEL: 'open',
      },
    },
    joiningWaitlist: {
      on: {
        SUCCESS: 'waitlistSuccess',
        ERROR: {
          target: 'soldOut',
          actions: assign({
            error: (_, event) => event.error,
          }),
        },
      },
    },
    waitlistSuccess: {
      type: 'final',
    },
    error: {
      on: {
        RETRY: 'open',
      },
    },
  },
}, {
  guards: {
    hasPurchase: (context) => !!context.purchaseToUpgrade,
    isSoldOut: (context) => context.enrollmentState === 'sold-out',
    isNotOpen: (context) => context.enrollmentState === 'not-open',
    isClosed: (context) => context.enrollmentState === 'closed',
  },
})
```

---

## Props & Configuration

### TypeScript Interfaces

```typescript
interface UnifiedPricingWidgetProps {
  product: Product
  purchaseToUpgrade?: Purchase
  options?: PricingWidgetOptions
  slots?: PricingWidgetSlots
}

interface PricingWidgetOptions {
  coupon?: Coupon
  bypassChecks?: boolean
  pollingEnabled?: boolean
  pollingInterval?: number
  timezone?: string
  autoApplyPPP?: boolean
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
```

### Per-App Customization Examples

**Default (ai-hero, astro-party, most apps):**
```typescript
<UnifiedPricingWidget
  product={workshopProduct}
  // All defaults work out-of-box
/>
```

**ai-hero Cohort (tier selection):**
```typescript
<CohortPricingWidget
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

**epic-web (disable PPP auto-apply):**
```typescript
<UnifiedPricingWidget
  product={product}
  options={{
    autoApplyPPP: false, // epic-web specific
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

---

## File Locations

All components will be added to the `commerce-next` package:

```
packages/commerce-next/src/
├── containers/
│   ├── unified-pricing-widget.tsx          # Main component
│   ├── workshop-pricing-widget.tsx         # Thin wrapper
│   ├── event-pricing-widget.tsx            # Thin wrapper
│   ├── cohort-pricing-widget.tsx           # Thin wrapper
│   └── server-pricing-orchestrator.tsx     # For epicdev-ai/code-with-antonio
├── components/
│   ├── default-header.tsx                  # Slot default
│   ├── default-footer.tsx                  # Slot default
│   ├── default-checkout-form.tsx           # Slot default
│   ├── default-waitlist-form.tsx           # Slot default
│   └── default-purchased-banner.tsx        # Slot default
├── machines/
│   └── enrollment-machine.ts               # XState machine
└── index.ts                                # Re-exports
```

---

## Success Criteria

- [ ] `UnifiedPricingWidget` works with all 3 product types (workshop, event, cohort)
- [ ] Visual parity with existing widgets in ai-hero (no UX regressions)
- [ ] All slots can be customized without breaking core logic
- [ ] Product-specific wrappers (Workshop/Event/Cohort) provide sensible defaults
- [ ] XState machine handles all enrollment state transitions correctly
- [ ] Storybook stories demonstrate all variants and customization patterns
- [ ] TypeScript inference guides customization (no manual type annotations needed)
- [ ] Migration guide explains how to replace existing containers
- [ ] 100% test coverage for state machine and default slots
- [ ] Single source of truth for enrollment logic across all 10 apps

---

## Navigation

[← Phase 2: Shared Hooks](./phase-2-shared-hooks.md) | [Next: Phase 4 - App Migrations →](./phase-4-app-migrations.md)
