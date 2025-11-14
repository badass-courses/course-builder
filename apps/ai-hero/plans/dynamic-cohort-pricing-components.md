# Dynamic Cohort Pricing Components - Implementation Plan

## Problem Statement

The cohort copy needs dynamic pricing components (`<PricingInline>`, `<DiscountDeadline>`, `<HasPurchased>`) that display real-time pricing from the database. Current implementation is broken because:

1. **Misunderstood the loader pattern** - Tried to await `pricingDataLoader` in the server component instead of passing the Promise to client components
2. **No Suspense boundaries** - Client components need Suspense to handle the async data loading
3. **Recursive naming conflicts** - Component wrappers and actual components had the same names
4. **Not following existing patterns** - The `<Enroll>` button (Pricing.Root) already does this correctly with `pricingDataLoader`

## Current Working Pattern (Enroll Button)

The existing `<Enroll>` button shows how to do this correctly:

```tsx
// Server component (page.tsx)
const pricingDataLoader = getPricingData({
  productId: product.id,
  merchantCouponId: defaultCoupon?.id,
  country: countryCode,
  userId: user?.id,
})

// Pass Promise (NOT awaited) to compileMDX
const { content } = await compileMDX(
  cohort.fields.body || '',
  {
    Enroll: ({ children = 'Enroll Now' }) =>
      cohortProps.product ? (
        <Pricing.Root
          {...cohortProps}
          pricingDataLoader={cohortProps.pricingDataLoader} // Promise passed here
        >
          <Pricing.BuyButton>
            {children}
          </Pricing.BuyButton>
        </Pricing.Root>
      ) : null,
  }
)
```

Inside `Pricing.Root` (client component):

```tsx
'use client'
export const PricingProvider = ({ pricingDataLoader, ...props }) => {
  const pricingData = use(pricingDataLoader) // React's use() hook unwraps Promise
  // ... rest of logic
}
```

## Solution Architecture

### 1. Create Client Components with Suspense

Create three new **client components** in `src/components/pricing/`:

#### `pricing-inline.tsx`
```tsx
'use client'
import { use, Suspense } from 'react'
import type { PricingData } from '@/lib/pricing-query'

export function PricingInline({
  type,
  pricingDataLoader,
}: {
  type: 'original' | 'discounted'
  pricingDataLoader: Promise<PricingData>
}) {
  return (
    <Suspense fallback={<span className="inline-block w-16 h-6 bg-muted animate-pulse rounded" />}>
      <PricingInlineContent type={type} pricingDataLoader={pricingDataLoader} />
    </Suspense>
  )
}

function PricingInlineContent({
  type,
  pricingDataLoader,
}: {
  type: 'original' | 'discounted'
  pricingDataLoader: Promise<PricingData>
}) {
  const pricingData = use(pricingDataLoader) // Unwrap Promise
  const formattedPrice = pricingData?.formattedPrice

  const price = type === 'original'
    ? formattedPrice?.unitPrice
    : formattedPrice?.calculatedPrice

  if (!price) return null

  return <>${Math.floor(price)}</>
}
```

#### `discount-deadline.tsx`
```tsx
'use client'
import { use, Suspense } from 'react'
import type { SaleBannerData } from '@/lib/sale-banner'

export function DiscountDeadline({
  format = 'long',
  saleDataLoader,
}: {
  format?: 'short' | 'long'
  saleDataLoader: Promise<SaleBannerData | null>
}) {
  return (
    <Suspense fallback={<span className="inline-block w-32 h-6 bg-muted animate-pulse rounded" />}>
      <DiscountDeadlineContent format={format} saleDataLoader={saleDataLoader} />
    </Suspense>
  )
}

function DiscountDeadlineContent({
  format,
  saleDataLoader,
}: {
  format: 'short' | 'long'
  saleDataLoader: Promise<SaleBannerData | null>
}) {
  const saleData = use(saleDataLoader) // Unwrap Promise

  if (!saleData?.expires) return null

  const dateObj = new Date(saleData.expires)
  const options: Intl.DateTimeFormatOptions =
    format === 'long'
      ? { month: 'long', day: 'numeric', year: 'numeric' }
      : { month: 'short', day: 'numeric' }

  return <>{dateObj.toLocaleDateString('en-US', options)}</>
}
```

#### `has-purchased.tsx`
```tsx
'use client'
import { use, Suspense } from 'react'
import type { Purchase } from '@coursebuilder/core/schemas'

export function HasPurchased({
  productSlug,
  productId,
  children,
  purchasesLoader,
  productMapLoader,
}: {
  productSlug?: string
  productId?: string
  children: React.ReactNode
  purchasesLoader: Promise<Purchase[]>
  productMapLoader: Promise<Map<string, string>>
}) {
  return (
    <Suspense fallback={null}>
      <HasPurchasedContent
        productSlug={productSlug}
        productId={productId}
        purchasesLoader={purchasesLoader}
        productMapLoader={productMapLoader}
      >
        {children}
      </HasPurchasedContent>
    </Suspense>
  )
}

function HasPurchasedContent({
  productSlug,
  productId,
  children,
  purchasesLoader,
  productMapLoader,
}: {
  productSlug?: string
  productId?: string
  children: React.ReactNode
  purchasesLoader: Promise<Purchase[]>
  productMapLoader: Promise<Map<string, string>>
}) {
  const purchases = use(purchasesLoader)
  const productMap = use(productMapLoader)

  let targetProductId = productId

  if (productSlug && !targetProductId) {
    targetProductId = productMap.get(productSlug)
  }

  const hasPurchased = targetProductId
    ? purchases.some((purchase) => purchase.productId === targetProductId)
    : false

  return hasPurchased ? <>{children}</> : null
}
```

### 2. Create Data Loaders in Server Component

In `page.tsx`, create Promise-based loaders (DO NOT AWAIT):

```tsx
// Server component - page.tsx

// Create loaders (Promises, not awaited)
const pricingDataLoader = product ? getPricingData({
  productId: product.id,
  merchantCouponId: defaultCoupon?.id,
  country: countryCode,
  userId: user?.id,
}) : Promise.resolve({
  formattedPrice: null,
  purchaseToUpgrade: null,
  quantityAvailable: -1,
})

const saleDataLoader = product && defaultCoupon
  ? getSaleBannerData(defaultCoupon)
  : Promise.resolve(null)

const purchasesLoader = user
  ? courseBuilderAdapter.getPurchasesForUser(user.id).then(purchases => purchases || [])
  : Promise.resolve([])

const productMapLoader = db.query.products.findMany({
  where: eq(products.status, 1),
}).then(allProducts =>
  new Map(allProducts.map((p) => [p.fields?.slug, p.id]))
)

// Pass loaders to MDX components
const { content } = await compileMDX(
  cohort.fields.body || '',
  {
    Enroll: ({ children = 'Enroll Now' }) => /* existing Enroll */,
    HasDiscount: ({ children }) => /* existing HasDiscount */,
    DiscountCountdown: ({ children }) => /* existing DiscountCountdown */,

    // NEW COMPONENTS - Pass Promises, not awaited data
    PricingInline: ({ type }: { type: 'original' | 'discounted' }) => (
      <PricingInline type={type} pricingDataLoader={pricingDataLoader} />
    ),
    DiscountDeadline: ({ format }: { format?: 'short' | 'long' }) => (
      <DiscountDeadline format={format} saleDataLoader={saleDataLoader} />
    ),
    HasPurchased: ({
      productSlug,
      productId,
      children
    }: {
      productSlug?: string
      productId?: string
      children: React.ReactNode
    }) => (
      <HasPurchased
        productSlug={productSlug}
        productId={productId}
        purchasesLoader={purchasesLoader}
        productMapLoader={productMapLoader}
      >
        {children}
      </HasPurchased>
    ),
  }
)
```

### 3. MDX Usage (No Changes Needed)

The MDX content remains the same:

```mdx
For the 5-day cohort course, the price is <PricingInline type="original" />.

It's a steal for ~~<PricingInline type="original" />~~ <PricingInline type="discounted" />
if you enroll by <DiscountDeadline />!

<HasPurchased productSlug="ai-sdk-v5-crash-course">
Owners of the AI SDK v5 Crash Course: You save an additional $99!
</HasPurchased>
```

## Key Principles

1. **Server Component (page.tsx)**: Creates Promise loaders, does NOT await them
2. **MDX Wrapper Functions**: Pass Promises to client components
3. **Client Components**: Use React's `use()` hook to unwrap Promises
4. **Suspense Boundaries**: Wrap each async component with Suspense + loading fallback
5. **Separate Inner Components**: Split into outer (Suspense wrapper) and inner (uses `use()` hook)

## Why This Works

- **No data fetching in client components** - Server creates the Promises
- **Automatic streaming** - Suspense allows page to render before all data loads
- **Parallel data fetching** - All loaders start immediately, don't wait for each other
- **Follows Next.js 16 patterns** - Uses App Router async patterns correctly
- **Matches existing code** - Same pattern as Pricing.Root already uses

## Implementation Steps

1. ✅ Clean up broken code:
   - Remove `PricingInlineDisplay` and `DiscountDeadlineDisplay` from mdx-components.tsx
   - Remove awaited pricing data in page.tsx
   - Remove debug logging

2. ✅ Create new client components:
   - `src/components/pricing/pricing-inline.tsx`
   - `src/components/pricing/discount-deadline.tsx`
   - `src/components/pricing/has-purchased.tsx`

3. ✅ Update page.tsx:
   - Create Promise loaders (don't await)
   - Pass loaders to MDX component wrappers
   - Import new client components

4. ✅ Test with actual cohort data:
   - Verify prices show correctly
   - Check Suspense fallbacks appear briefly
   - Confirm HasPurchased conditionally renders
   - Test with/without discount active

5. ✅ Remove debug code and polish

## Files to Modify

- `src/app/(content)/cohorts/[slug]/page.tsx` - Create loaders, pass to MDX
- `src/components/pricing/pricing-inline.tsx` - NEW FILE
- `src/components/pricing/discount-deadline.tsx` - NEW FILE
- `src/components/pricing/has-purchased.tsx` - NEW FILE
- `src/components/mdx/mdx-components.tsx` - REMOVE broken components

## Files to Leave Alone

- `content/cohort-copy.mdx` - Already using correct syntax
- `src/lib/pricing-query.ts` - getPricingData works correctly
- `src/lib/sale-banner.ts` - getSaleBannerData works correctly
- Existing Pricing.Root and related components - Don't touch

## Testing Checklist

- [ ] PricingInline shows $795 for type="original"
- [ ] PricingInline shows $477 for type="discounted" (with active coupon)
- [ ] DiscountDeadline shows formatted date from coupon expiration
- [ ] HasPurchased shows content only when user owns specified product
- [ ] HasPurchased hides content when user doesn't own product
- [ ] HasPurchased hides content when user not authenticated
- [ ] Suspense fallbacks appear briefly on slow connections
- [ ] No hydration errors
- [ ] No infinite re-renders
- [ ] TypeScript compiles with no errors
