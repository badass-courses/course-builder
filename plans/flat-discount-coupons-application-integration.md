# Flat Discount Coupons - Application Integration Plan

## Overview

This plan details the application-level integration of fixed discount coupons, starting with AI Hero but designed as a reusable pattern for all Course Builder applications (egghead, epic-react, etc.).

**Status**: Ready for review before execution
**Target App**: ai-hero (primary), with generic components for reuse
**Dependencies**: Core package implementation (completed on `zac/fixed-coupon-discount` branch)

## Assumptions & Prerequisites

### Completed Core Work
Based on the latest commit (`6e19940b - feat(core): implement fixed amount discount functionality for merchant coupons`), we assume the following are complete in `@coursebuilder/core`:

- ✅ Schema updates with `amountDiscount` field
- ✅ `determineCouponToApply` supports fixed discounts
- ✅ `formatPricesForProduct` handles fixed amounts
- ✅ `stripeCheckout` creates amount_off coupons
- ✅ Core unit tests passing

### What's Not Yet Done (Application Layer)
- ❌ UI components for displaying fixed discounts
- ❌ Admin interface for creating/managing fixed discount coupons
- ❌ Checkout page updates to show fixed amounts
- ❌ Purchase confirmation/receipt display
- ❌ Application-level integration tests
- ❌ Feature rollout across apps

## Integration Strategy

### Phase 1: Shared UI Components (Generic)
Create reusable UI components in `@coursebuilder/ui` or `@coursebuilder/commerce-next` that any app can use.

### Phase 2: AI Hero Implementation (Specific)
Integrate into ai-hero as the reference implementation.

### Phase 3: Pattern Documentation (Generic)
Document the integration pattern for other apps to follow.

### Phase 4: Rollout to Other Apps (Specific)
Apply pattern to egghead, epic-react, etc.

---

## Phase 1: Shared UI Components

### 1.1 Pricing Display Components

**Location**: `packages/commerce-next/src/pricing/` or `packages/ui/src/pricing/`

#### Component: `PriceBreakdown`
Displays price breakdown with support for fixed and percentage discounts.

```typescript
// packages/commerce-next/src/pricing/price-breakdown.tsx
import { FormattedPrice } from '@coursebuilder/core/types'

interface PriceBreakdownProps {
  price: FormattedPrice
  showDetails?: boolean
  className?: string
}

export function PriceBreakdown({ price, showDetails = true }: PriceBreakdownProps) {
  const {
    fullPrice,
    calculatedPrice,
    appliedDiscountType,
    appliedFixedDiscount,
    appliedMerchantCoupon,
    fixedDiscountForUpgrade,
  } = price

  const hasDiscount = calculatedPrice < fullPrice
  const discountAmount = fullPrice - calculatedPrice

  return (
    <div className="space-y-2">
      {/* Original Price */}
      {hasDiscount && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Original Price</span>
          <span className="line-through">${fullPrice.toFixed(2)}</span>
        </div>
      )}

      {/* Discount Breakdown */}
      {showDetails && hasDiscount && (
        <div className="space-y-1">
          {/* Fixed Discount */}
          {appliedDiscountType === 'fixed' && appliedFixedDiscount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({appliedMerchantCoupon?.type})</span>
              <span>-${appliedFixedDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* Percentage Discount */}
          {['percentage', 'ppp', 'bulk'].includes(appliedDiscountType || '') && (
            <div className="flex justify-between text-sm text-green-600">
              <span>
                Discount (
                {appliedMerchantCoupon?.percentageDiscount
                  ? `${(appliedMerchantCoupon.percentageDiscount * 100).toFixed(0)}%`
                  : appliedDiscountType}
                )
              </span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Upgrade Discount */}
          {fixedDiscountForUpgrade > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Upgrade Credit</span>
              <span>-${fixedDiscountForUpgrade.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Final Price */}
      <div className="flex justify-between text-lg font-bold border-t pt-2">
        <span>Total</span>
        <span>${calculatedPrice.toFixed(2)}</span>
      </div>
    </div>
  )
}
```

#### Component: `DiscountBadge`
Shows discount type and amount as a badge.

```typescript
// packages/commerce-next/src/pricing/discount-badge.tsx
import { FormattedPrice } from '@coursebuilder/core/types'

interface DiscountBadgeProps {
  price: FormattedPrice
  size?: 'sm' | 'md' | 'lg'
}

export function DiscountBadge({ price, size = 'md' }: DiscountBadgeProps) {
  const {
    fullPrice,
    calculatedPrice,
    appliedDiscountType,
    appliedFixedDiscount,
    appliedMerchantCoupon,
  } = price

  if (calculatedPrice >= fullPrice) return null

  const discountAmount = fullPrice - calculatedPrice
  const discountPercent = ((discountAmount / fullPrice) * 100).toFixed(0)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const getBadgeText = () => {
    switch (appliedDiscountType) {
      case 'fixed':
        return `Save $${discountAmount.toFixed(0)}`
      case 'percentage':
        return `${discountPercent}% OFF`
      case 'ppp':
        return `${discountPercent}% OFF (Regional Pricing)`
      case 'bulk':
        return `${discountPercent}% OFF (Bulk Discount)`
      default:
        return `${discountPercent}% OFF`
    }
  }

  return (
    <span
      className={`inline-flex items-center font-semibold bg-green-100 text-green-800 rounded-md ${sizeClasses[size]}`}
    >
      {getBadgeText()}
    </span>
  )
}
```

#### Component: `CouponInput`
Input field for applying coupon codes.

```typescript
// packages/commerce-next/src/pricing/coupon-input.tsx
'use client'

import { useState } from 'react'
import { FormattedPrice } from '@coursebuilder/core/types'

interface CouponInputProps {
  onApplyCoupon: (couponId: string) => Promise<void>
  currentPrice: FormattedPrice | null
  className?: string
}

export function CouponInput({ onApplyCoupon, currentPrice, className }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    if (!couponCode.trim()) return

    setIsApplying(true)
    setError(null)

    try {
      await onApplyCoupon(couponCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid coupon code')
    } finally {
      setIsApplying(false)
    }
  }

  const hasCoupon = currentPrice?.appliedMerchantCoupon

  return (
    <div className={className}>
      {hasCoupon ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-medium">
              Coupon Applied
            </span>
            {currentPrice.appliedDiscountType === 'fixed' && currentPrice.appliedFixedDiscount && (
              <span className="text-sm text-gray-600">
                (${currentPrice.appliedFixedDiscount.toFixed(2)} off)
              </span>
            )}
            {['percentage', 'ppp', 'bulk'].includes(currentPrice.appliedDiscountType || '') &&
              currentPrice.appliedMerchantCoupon?.percentageDiscount && (
                <span className="text-sm text-gray-600">
                  ({(currentPrice.appliedMerchantCoupon.percentageDiscount * 100).toFixed(0)}% off)
                </span>
              )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isApplying}
            />
            <button
              onClick={handleApply}
              disabled={isApplying || !couponCode.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

### 1.2 Package Configuration

**File**: `packages/commerce-next/package.json`

Add exports for new pricing components:

```json
{
  "exports": {
    "./pricing/price-breakdown": "./src/pricing/price-breakdown.tsx",
    "./pricing/discount-badge": "./src/pricing/discount-badge.tsx",
    "./pricing/coupon-input": "./src/pricing/coupon-input.tsx"
  }
}
```

---

## Phase 2: AI Hero Implementation

### 2.1 Product/Checkout Page Integration

**File**: `apps/ai-hero/src/app/products/[slug]/page.tsx` (or similar)

#### Update Checkout Component

```typescript
// apps/ai-hero/src/app/products/[slug]/_components/product-pricing.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PriceBreakdown } from '@coursebuilder/commerce-next/pricing/price-breakdown'
import { DiscountBadge } from '@coursebuilder/commerce-next/pricing/discount-badge'
import { CouponInput } from '@coursebuilder/commerce-next/pricing/coupon-input'
import { api } from '@/trpc/react'

interface ProductPricingProps {
  productId: string
  initialPrice: FormattedPrice
}

export function ProductPricing({ productId, initialPrice }: ProductPricingProps) {
  const [selectedPrice, setSelectedPrice] = useState(initialPrice)
  const router = useRouter()

  const applyCouponMutation = api.pricing.applyCoupon.useMutation({
    onSuccess: (updatedPrice) => {
      setSelectedPrice(updatedPrice)
    },
  })

  const handleApplyCoupon = async (couponCode: string) => {
    await applyCouponMutation.mutateAsync({
      productId,
      couponCode,
      quantity: 1,
    })
  }

  const handleCheckout = async () => {
    // Existing checkout logic
    router.push(`/checkout?productId=${productId}&couponId=${selectedPrice.appliedMerchantCoupon?.id || ''}`)
  }

  return (
    <div className="space-y-6">
      {/* Discount Badge */}
      <DiscountBadge price={selectedPrice} size="lg" />

      {/* Price Breakdown */}
      <PriceBreakdown price={selectedPrice} showDetails={true} />

      {/* Coupon Input */}
      <CouponInput
        onApplyCoupon={handleApplyCoupon}
        currentPrice={selectedPrice}
      />

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
      >
        Proceed to Checkout - ${selectedPrice.calculatedPrice.toFixed(2)}
      </button>
    </div>
  )
}
```

### 2.2 tRPC API Endpoint for Coupon Application

**File**: `apps/ai-hero/src/trpc/routers/pricing.ts` (or add to existing router)

```typescript
import { z } from 'zod'
import { publicProcedure, router } from '@/trpc/trpc'
import { formatPricesForProduct } from '@coursebuilder/core/lib/pricing/format-prices-for-product'

export const pricingRouter = router({
  applyCoupon: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        couponCode: z.string(),
        quantity: z.number().default(1),
        upgradeFromPurchaseId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, couponCode, quantity, upgradeFromPurchaseId } = input

      // Look up coupon by code/identifier
      const merchantCoupon = await ctx.db.query.merchantCoupon.findFirst({
        where: (coupon, { eq }) => eq(coupon.identifier, couponCode),
      })

      if (!merchantCoupon || merchantCoupon.status !== 1) {
        throw new Error('Invalid or inactive coupon code')
      }

      // Get formatted price with coupon
      const formattedPrice = await formatPricesForProduct({
        ctx: ctx.db,
        productId,
        merchantCouponId: merchantCoupon.id,
        quantity,
        userId: ctx.session?.user?.id,
        upgradeFromPurchaseId,
      })

      return formattedPrice
    }),

  getPrice: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        merchantCouponId: z.string().optional(),
        quantity: z.number().default(1),
        upgradeFromPurchaseId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { productId, merchantCouponId, quantity, upgradeFromPurchaseId } = input

      const formattedPrice = await formatPricesForProduct({
        ctx: ctx.db,
        productId,
        merchantCouponId,
        quantity,
        userId: ctx.session?.user?.id,
        upgradeFromPurchaseId,
      })

      return formattedPrice
    }),
})
```

### 2.3 Purchase Confirmation Display

**File**: `apps/ai-hero/src/app/thanks/page.tsx` (or purchase confirmation page)

```typescript
import { PriceBreakdown } from '@coursebuilder/commerce-next/pricing/price-breakdown'

export default async function ThanksPage({ searchParams }: { searchParams: { session_id: string } }) {
  // Fetch purchase details from session_id
  const purchase = await getPurchaseFromSession(searchParams.session_id)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Thank You for Your Purchase!</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {/* Product Info */}
        <div>
          <h2 className="text-xl font-semibold">{purchase.product.name}</h2>
        </div>

        {/* Price Breakdown */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Order Summary</h3>
          <PriceBreakdown price={purchase.formattedPrice} showDetails={true} />
        </div>

        {/* Applied Discount Info */}
        {purchase.merchantCoupon && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">
              {purchase.merchantCoupon.amountDiscount
                ? `You saved $${(purchase.merchantCoupon.amountDiscount / 100).toFixed(2)} with your discount code!`
                : `You saved ${(purchase.merchantCoupon.percentageDiscount * 100).toFixed(0)}% with your discount code!`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Phase 3: Admin Interface for Fixed Discount Coupons

### 3.1 Admin Coupon Creation Form

**File**: `apps/ai-hero/src/app/admin/coupons/new/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'

export default function NewCouponPage() {
  const router = useRouter()
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [formData, setFormData] = useState({
    identifier: '',
    type: 'special',
    percentageDiscount: '',
    amountDiscount: '',
  })

  const createCouponMutation = api.admin.createMerchantCoupon.useMutation({
    onSuccess: () => {
      router.push('/admin/coupons')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const couponData =
      discountType === 'percentage'
        ? {
            ...formData,
            percentageDiscount: parseFloat(formData.percentageDiscount) / 100,
            amountDiscount: undefined,
          }
        : {
            ...formData,
            percentageDiscount: undefined,
            amountDiscount: parseInt(formData.amountDiscount) * 100, // Convert to cents
          }

    await createCouponMutation.mutateAsync(couponData)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Coupon</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
        {/* Coupon Code */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Coupon Code
          </label>
          <input
            type="text"
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value.toUpperCase() })}
            placeholder="SAVE20"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        {/* Coupon Type */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Coupon Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="special">Special</option>
            <option value="ppp">PPP</option>
            <option value="bulk">Bulk</option>
          </select>
        </div>

        {/* Discount Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Discount Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="percentage"
                checked={discountType === 'percentage'}
                onChange={(e) => setDiscountType(e.target.value as 'percentage')}
                className="mr-2"
              />
              Percentage
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="fixed"
                checked={discountType === 'fixed'}
                onChange={(e) => setDiscountType(e.target.value as 'fixed')}
                className="mr-2"
              />
              Fixed Amount
            </label>
          </div>
        </div>

        {/* Discount Value */}
        {discountType === 'percentage' ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              Percentage Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={formData.percentageDiscount}
              onChange={(e) => setFormData({ ...formData, percentageDiscount: e.target.value })}
              placeholder="25"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Enter percentage (0-100). Example: 25 for 25% off
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">
              Fixed Discount Amount ($)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.amountDiscount}
              onChange={(e) => setFormData({ ...formData, amountDiscount: e.target.value })}
              placeholder="20"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Enter dollar amount. Example: 20 for $20 off
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={createCouponMutation.isPending}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {createCouponMutation.isPending ? 'Creating...' : 'Create Coupon'}
        </button>
      </form>
    </div>
  )
}
```

### 3.2 Admin tRPC Endpoint

**File**: `apps/ai-hero/src/trpc/routers/admin.ts`

```typescript
import { z } from 'zod'
import { protectedProcedure, router } from '@/trpc/trpc'
import { merchantCouponSchema } from '@coursebuilder/core/schemas/merchant-coupon-schema'

export const adminRouter = router({
  createMerchantCoupon: protectedProcedure
    .input(
      merchantCouponSchema.omit({ id: true, merchantAccountId: true, status: true })
    )
    .mutation(async ({ ctx, input }) => {
      // Check admin permissions
      if (!ctx.ability.can('create', 'MerchantCoupon')) {
        throw new Error('Unauthorized')
      }

      const merchantAccount = await ctx.db.query.merchantAccount.findFirst({
        where: (account, { eq }) => eq(account.ownerId, ctx.session.user.id),
      })

      if (!merchantAccount) {
        throw new Error('Merchant account not found')
      }

      const newCoupon = await ctx.db.insert(merchantCoupon).values({
        id: `coupon_${Date.now()}`,
        merchantAccountId: merchantAccount.id,
        status: 1,
        ...input,
      })

      return newCoupon
    }),

  listMerchantCoupons: protectedProcedure.query(async ({ ctx }) => {
    const merchantAccount = await ctx.db.query.merchantAccount.findFirst({
      where: (account, { eq }) => eq(account.ownerId, ctx.session.user.id),
    })

    if (!merchantAccount) return []

    const coupons = await ctx.db.query.merchantCoupon.findMany({
      where: (coupon, { eq }) => eq(coupon.merchantAccountId, merchantAccount.id),
    })

    return coupons
  }),
})
```

---

## Phase 4: Testing at Application Level

### 4.1 Integration Tests for AI Hero

**File**: `apps/ai-hero/src/__tests__/pricing/fixed-discount-flow.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Fixed Discount Coupon Flow', () => {
  test('applies fixed discount coupon on product page', async ({ page }) => {
    // Navigate to product
    await page.goto('/products/example-product')

    // Apply fixed discount coupon
    await page.fill('[data-testid="coupon-input"]', 'FIXED20')
    await page.click('[data-testid="apply-coupon"]')

    // Verify discount applied
    await expect(page.locator('[data-testid="discount-badge"]')).toContainText('Save $20')
    await expect(page.locator('[data-testid="final-price"]')).toContainText('$80.00')
  })

  test('shows fixed discount in checkout', async ({ page }) => {
    // Navigate to checkout with coupon
    await page.goto('/checkout?productId=prod_123&couponId=coupon_fixed_20')

    // Verify price breakdown shows fixed discount
    await expect(page.locator('[data-testid="discount-type"]')).toContainText('Discount')
    await expect(page.locator('[data-testid="discount-amount"]')).toContainText('-$20.00')
    await expect(page.locator('[data-testid="total"]')).toContainText('$80.00')
  })

  test('creates admin coupon with fixed amount', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('[type="submit"]')

    // Navigate to coupon creation
    await page.goto('/admin/coupons/new')

    // Fill form
    await page.fill('[name="identifier"]', 'TESTFIXED')
    await page.click('[value="fixed"]')
    await page.fill('[name="amountDiscount"]', '25')
    await page.click('[type="submit"]')

    // Verify coupon created
    await expect(page).toHaveURL('/admin/coupons')
    await expect(page.locator('text=TESTFIXED')).toBeVisible()
  })
})
```

### 4.2 Manual Testing Checklist

Create a testing checklist for QA:

**File**: `apps/ai-hero/TESTING_CHECKLIST.md`

```markdown
# Fixed Discount Coupon Testing Checklist

## Product Page
- [ ] Fixed discount coupon displays correctly
- [ ] Badge shows "Save $X" format
- [ ] Price breakdown shows discount line item
- [ ] Coupon input accepts and validates codes
- [ ] Invalid coupons show error message
- [ ] Applied coupon displays confirmation

## Checkout Flow
- [ ] Fixed discount carries through to checkout
- [ ] Stripe session created with correct amount_off
- [ ] Metadata includes discount type and amount
- [ ] Payment processes successfully
- [ ] Receipt shows applied discount

## Admin Interface
- [ ] Can create percentage coupon
- [ ] Can create fixed amount coupon
- [ ] Cannot create coupon with both types (validation)
- [ ] Coupon list displays discount type correctly
- [ ] Can edit existing coupons

## Edge Cases
- [ ] Fixed discount > product price (should clamp to $0)
- [ ] Upgrade + fixed discount (better discount wins)
- [ ] PPP + fixed discount (comparison logic)
- [ ] Bulk purchase (should ignore fixed discount)
- [ ] Multiple coupons (should only allow one)

## Backward Compatibility
- [ ] Existing percentage coupons work unchanged
- [ ] PPP flow unaffected
- [ ] Bulk pricing unaffected
- [ ] Upgrade flow unaffected
```

---

## Phase 5: Rollout Pattern Documentation

### 5.1 Integration Guide for Other Apps

**File**: `docs/features/fixed-discount-coupons-integration.md`

```markdown
# Fixed Discount Coupon Integration Guide

This guide explains how to integrate fixed discount coupon support into any Course Builder application.

## Step 1: Install Dependencies

Ensure you have the latest versions of:
- `@coursebuilder/core@latest`
- `@coursebuilder/commerce-next@latest` (if using shared components)

## Step 2: Add Shared UI Components

Import pricing components:

```typescript
import { PriceBreakdown } from '@coursebuilder/commerce-next/pricing/price-breakdown'
import { DiscountBadge } from '@coursebuilder/commerce-next/pricing/discount-badge'
import { CouponInput } from '@coursebuilder/commerce-next/pricing/coupon-input'
```

## Step 3: Update Product/Pricing Pages

See `apps/ai-hero/src/app/products/[slug]/_components/product-pricing.tsx` for reference implementation.

Key changes:
1. Use `PriceBreakdown` component instead of custom price display
2. Add `CouponInput` component for coupon application
3. Add `DiscountBadge` for visual discount indicator

## Step 4: Add tRPC Endpoints

Copy `apps/ai-hero/src/trpc/routers/pricing.ts` and adapt for your app's structure.

Required endpoints:
- `applyCoupon` - Applies coupon and returns updated price
- `getPrice` - Gets formatted price with optional coupon

## Step 5: Admin Interface (Optional)

If your app has admin functionality, copy `apps/ai-hero/src/app/admin/coupons/` pages.

## Step 6: Testing

Run integration tests:
```bash
pnpm test --filter="your-app-name"
```

Manual testing checklist available at `apps/ai-hero/TESTING_CHECKLIST.md`

## Customization

### Styling
All components accept `className` prop for custom styling.

### Discount Logic
Core discount logic lives in `@coursebuilder/core`. If you need app-specific behavior, extend in your app's tRPC layer.
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review core package implementation (tests passing?)
- [ ] Confirm database migration applied
- [ ] Review this plan with team

### Phase 1: Shared Components (Week 1)
- [ ] Create `PriceBreakdown` component
- [ ] Create `DiscountBadge` component
- [ ] Create `CouponInput` component
- [ ] Add exports to `@coursebuilder/commerce-next`
- [ ] Write component tests
- [ ] Build and verify exports work

### Phase 2: AI Hero Integration (Week 1-2)
- [ ] Update product pricing page
- [ ] Add tRPC pricing endpoints
- [ ] Update checkout page
- [ ] Update purchase confirmation page
- [ ] Test end-to-end flow

### Phase 3: Admin Interface (Week 2)
- [ ] Create admin coupon creation form
- [ ] Add tRPC admin endpoints
- [ ] Create coupon list page
- [ ] Add authorization checks
- [ ] Test admin flow

### Phase 4: Testing (Week 2-3)
- [ ] Write Playwright integration tests
- [ ] Manual testing with checklist
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Performance testing

### Phase 5: Documentation & Rollout (Week 3)
- [ ] Document integration pattern
- [ ] Create migration guide
- [ ] Update main docs
- [ ] Deploy to staging
- [ ] QA approval
- [ ] Deploy to production

### Phase 6: Other Apps (Week 4+)
- [ ] Integrate into egghead
- [ ] Integrate into epic-react
- [ ] Integrate into other apps as needed

---

## Risk Mitigation

### Revenue Protection
- **Test thoroughly in staging** with real Stripe test mode
- **Monitor Stripe webhooks** for correct discount amounts
- **Add logging** for all discount decisions (use app logger, not console)
- **Implement alerts** for unusual discount patterns

### User Experience
- **Clear error messages** for invalid coupons
- **Loading states** during coupon application
- **Responsive design** for mobile devices
- **Accessibility** (keyboard nav, screen readers)

### Technical Debt
- **Consistent patterns** across apps
- **Shared components** reduce duplication
- **Comprehensive tests** prevent regressions
- **Documentation** helps future developers

---

## Success Metrics

### Technical Metrics
- [ ] 100% test coverage for new components
- [ ] Zero console.log statements in production
- [ ] Build time < 2 minutes for affected apps
- [ ] Page load time unchanged (<50ms difference)

### Business Metrics
- [ ] Coupon application success rate > 95%
- [ ] Checkout completion rate unchanged
- [ ] Revenue tracking accurate (compare Stripe vs DB)
- [ ] Support tickets related to coupons < 5/week

### User Experience Metrics
- [ ] Lighthouse score >= 90 for pricing pages
- [ ] Mobile conversion rate unchanged
- [ ] Average time to checkout <= 2 minutes
- [ ] Coupon application < 500ms

---

## Timeline Estimate

**Total Duration**: 3-4 weeks for full rollout

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Shared Components | 3-4 days | Core package complete |
| AI Hero Integration | 5-7 days | Shared components |
| Admin Interface | 3-4 days | AI Hero integration |
| Testing | 3-5 days | All features complete |
| Documentation | 2-3 days | Testing complete |
| Rollout to Other Apps | 2-3 days per app | Pattern documented |

---

## Open Questions

1. **Coupon Code Generation**: Should we auto-generate codes or require manual entry?
2. **Expiration Dates**: Do we need UI for setting coupon expiration?
3. **Usage Limits**: Should coupons have per-user or global redemption limits?
4. **Multiple Coupons**: Can users stack multiple coupons? (Current plan: No)
5. **Discount Comparison UI**: Should we show users which discount is better (PPP vs fixed)?
6. **Currency Support**: Are we supporting non-USD currencies initially?
7. **Bulk Fixed Discounts**: Should fixed discounts apply to bulk purchases? (Current plan: No)

---

## Next Steps

1. **Review this plan** with engineering and product teams
2. **Answer open questions** above
3. **Create tickets** in project management system
4. **Assign owners** for each phase
5. **Schedule kickoff meeting**
6. **Begin Phase 1** (Shared Components)

---

## References

- [Flat Discount Coupons Architecture](./flat-discount-coupons-architecture.md)
- [Code Changes Reference](./flat-discount-coupons-code-changes.md)
- [Decision Flow](./flat-discount-coupons-decision-flow.md)
- [Testing Plan](./flat-discount-coupons-testing-plan.md)
- [AI Hero Source](../apps/ai-hero/)
- [Commerce Next Package](../packages/commerce-next/)
