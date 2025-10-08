# Flat Discount Coupons - Code Changes Quick Reference

## Schema Changes

### 1. Update MerchantCoupon Schema
**File:** `packages/core/src/schemas/merchant-coupon-schema.ts`

```typescript
// BEFORE
export const merchantCouponSchema = z.object({
  id: z.string().max(191),
  identifier: z.string().max(191).optional().nullable(),
  status: z.number().int().default(0),
  merchantAccountId: z.string().max(191),
  percentageDiscount: z.coerce.number().refine((value) => {
    const decimalPlaces = value.toString().split('.')[1]?.length || 0
    return decimalPlaces <= 2
  }),
  type: z.string().max(191),
})

// AFTER
export const merchantCouponSchema = z.object({
  id: z.string().max(191),
  identifier: z.string().max(191).optional().nullable(),
  status: z.number().int().default(0),
  merchantAccountId: z.string().max(191),
  percentageDiscount: z.coerce.number().optional().refine((value) => {
    if (value === undefined) return true
    const decimalPlaces = value.toString().split('.')[1]?.length || 0
    return decimalPlaces <= 2
  }),
  amountDiscount: z.number().int().optional(), // NEW: cents, integer
  type: z.string().max(191),
}).refine(
  (data) => {
    // Prevent both discount types
    const hasPercent = data.percentageDiscount !== undefined && data.percentageDiscount > 0
    const hasAmount = data.amountDiscount !== undefined && data.amountDiscount > 0
    return !(hasPercent && hasAmount)
  },
  { message: "Coupon cannot have both percentageDiscount and amountDiscount" }
)
```

### 2. Update Types
**File:** `packages/core/src/types.ts`

```typescript
// Add to exports
export type DiscountType = 'fixed' | 'percentage' | 'ppp' | 'bulk' | 'none'

// Update MinimalMerchantCoupon type (around line 263)
export type MinimalMerchantCoupon = Omit<
  MerchantCouponWithCountry,
  'identifier' | 'merchantAccountId'
> & {
  amountDiscount?: number  // NEW
}

// Update FormattedPrice type (around line 270)
export type FormattedPrice = {
  id: string
  quantity: number
  unitPrice: number
  fullPrice: number
  fixedDiscountForUpgrade: number
  appliedFixedDiscount?: number  // NEW: from merchant coupon
  calculatedPrice: number
  availableCoupons: Array<Omit<MerchantCouponWithCountry, 'identifier'> | undefined>
  appliedMerchantCoupon?: MinimalMerchantCoupon
  appliedDiscountType?: DiscountType  // NEW
  upgradeFromPurchaseId?: string
  upgradeFromPurchase?: Purchase
  upgradedProduct?: ProductWithPrices | null
  bulk: boolean
  usedCouponId?: string
  usedCoupon?: Coupon | null
  defaultCoupon?: Coupon | null
}

// Update PaymentsAdapter interface (around line 131)
export interface PaymentsAdapter {
  getCouponPercentOff(identifier: string): Promise<number>
  getCouponAmountOff(identifier: string): Promise<number>  // NEW
  createCoupon(params: Stripe.CouponCreateParams): Promise<string>
  // ... rest unchanged
}
```

## Business Logic Changes

### 3. Update determineCouponToApply
**File:** `packages/core/src/lib/pricing/determine-coupon-to-apply.ts`

```typescript
// Add to return type (around line 127)
export const determineCouponToApply = async (
  params: DetermineCouponToApplyParams,
) => {
  // ... existing logic ...

  // Determine appliedDiscountType
  const appliedDiscountType: DiscountType = (() => {
    if (!couponToApply) return 'none'
    if (couponToApply.type === 'ppp') return 'ppp'
    if (couponToApply.type === 'bulk') return 'bulk'
    // NEW: Check for fixed amount discount
    if (couponToApply.amountDiscount && couponToApply.amountDiscount > 0) {
      return 'fixed'
    }
    if (couponToApply.percentageDiscount && couponToApply.percentageDiscount > 0) {
      return 'percentage'
    }
    return 'none'
  })()

  return {
    appliedMerchantCoupon: couponToApply || undefined,
    appliedCouponType,  // existing
    appliedDiscountType,  // NEW
    availableCoupons,
    bulk: consideredBulk,
  }
}
```

### 4. Update formatPricesForProduct
**File:** `packages/core/src/lib/pricing/format-prices-for-product.ts`

```typescript
export async function formatPricesForProduct(
  options: FormatPricesForProductOptions,
): Promise<FormattedPrice> {
  // ... existing setup code ...

  const {
    appliedMerchantCoupon,
    appliedCouponType,
    appliedDiscountType,  // NEW
    ...result
  } = await determineCouponToApply({
    // ... existing params
  })

  // ... existing upgrade discount logic ...

  const unitPrice: number = price.unitAmount
  const fullPrice: number = unitPrice * quantity - fixedDiscountForUpgrade

  // NEW: Extract fixed discount from merchant coupon
  const appliedFixedDiscount = appliedDiscountType === 'fixed'
    ? (appliedMerchantCoupon?.amountDiscount || 0) / 100  // Convert cents to dollars
    : 0

  // Extract percentage discount (existing, but update for clarity)
  const percentOfDiscount = ['percentage', 'ppp', 'bulk'].includes(appliedDiscountType || '')
    ? appliedMerchantCoupon?.percentageDiscount
    : undefined

  // Handle conflicts: If upgrade has fixed discount AND merchant coupon has fixed discount
  const effectiveFixedDiscount = fixedDiscountForUpgrade > 0 && appliedFixedDiscount > 0
    ? Math.max(fixedDiscountForUpgrade, appliedFixedDiscount)  // Take better discount
    : fixedDiscountForUpgrade + appliedFixedDiscount

  const upgradeDetails = // ... existing ...

  return {
    ...product,
    quantity,
    unitPrice,
    fullPrice,
    fixedDiscountForUpgrade,
    appliedFixedDiscount,  // NEW
    appliedDiscountType,   // NEW
    calculatedPrice: getCalculatedPrice({
      unitPrice,
      percentOfDiscount,
      fixedDiscount: effectiveFixedDiscount,  // UPDATED
      quantity,
    }),
    availableCoupons: result.availableCoupons,
    appliedMerchantCoupon,
    ...(usedCoupon?.merchantCouponId === appliedMerchantCoupon?.id && {
      usedCouponId,
    }),
    bulk: result.bulk,
    ...upgradeDetails,
  }
}
```

### 5. Update getCalculatedPrice (if needed)
**File:** `packages/core/src/lib/pricing/get-calculated-price.ts`

```typescript
// Current implementation already handles fixedDiscount
// Just ensure prices don't go negative:

export function getCalculatedPrice({
  unitPrice,
  percentOfDiscount = 0,
  quantity = 1,
  fixedDiscount = 0,
}: GetCalculatePriceOptions) {
  const fullPrice = unitPrice * quantity
  const discountMultiplier = 1 - percentOfDiscount
  const calculatedPrice = (
    (fullPrice - fixedDiscount) * discountMultiplier
  ).toFixed(2)

  // NEW: Ensure non-negative
  return Math.max(0, Number(calculatedPrice))
}
```

## Stripe Integration Changes

### 6. Update stripeCheckout
**File:** `packages/core/src/lib/pricing/stripe-checkout.ts`

```typescript
export async function stripeCheckout({
  params,
  config,
  adapter,
}: {
  params: CheckoutParams
  config: PaymentsProviderConsumerConfig
  adapter?: CourseBuilderAdapter
}): Promise<any> {
  // ... existing setup ...

  const merchantCoupon = couponId
    ? await adapter.getMerchantCoupon(couponId as string)
    : null

  // NEW: Determine if this is a fixed amount coupon
  const isMerchantCouponFixedAmount =
    merchantCoupon?.amountDiscount && merchantCoupon.amountDiscount > 0

  const stripeCouponPercentOff =
    merchantCoupon && merchantCoupon.identifier && !isMerchantCouponFixedAmount
      ? await config.paymentsAdapter.getCouponPercentOff(merchantCoupon.identifier)
      : 0

  let discounts = []
  let appliedPPPStripeCouponId: string | undefined | null = undefined
  let upgradedFromPurchaseId: string | undefined | null = undefined

  const isUpgrade = Boolean(
    (availableUpgrade || upgradeFromPurchase?.status === 'Restricted') &&
      upgradeFromPurchase,
  )

  const TWELVE_FOUR_HOURS_FROM_NOW = Math.floor(
    add(new Date(), { hours: 12 }).getTime() / 1000,
  )

  if (isUpgrade && upgradeFromPurchase && loadedProduct && customerId) {
    // ... existing upgrade logic ...

    if (fixedDiscountForIndividualUpgrade > 0) {
      // ... existing upgrade coupon creation ...
    }
  }
  // NEW: Handle fixed-amount merchant coupons
  else if (merchantCoupon && isMerchantCouponFixedAmount) {
    const amountOffInCents = merchantCoupon.amountDiscount!

    // Create transient amount_off coupon (similar to upgrade flow)
    const couponId = await config.paymentsAdapter.createCoupon({
      amount_off: amountOffInCents,
      name: `${merchantCoupon.type} discount`,
      max_redemptions: 1,
      redeem_by: TWELVE_FOUR_HOURS_FROM_NOW,
      currency: 'USD',
      applies_to: {
        products: [merchantProductIdentifier],
      },
    })

    discounts.push({
      coupon: couponId,
    })

    // Log for observability
    console.log('[Stripe Checkout] Applied fixed-amount merchant coupon', {
      merchantCouponId: merchantCoupon.id,
      amountOffInCents,
      transientStripeCouponId: couponId,
    })
  }
  // EXISTING: Percentage-based merchant coupons
  else if (merchantCoupon && merchantCoupon.identifier) {
    const isNotPPP = merchantCoupon.type !== 'ppp'
    if (isNotPPP || quantity === 1) {
      appliedPPPStripeCouponId =
        merchantCoupon.type === 'ppp' ? merchantCoupon?.identifier : undefined
      const promotionCodeId = await config.paymentsAdapter.createPromotionCode({
        coupon: merchantCoupon.identifier,
        max_redemptions: 1,
        expires_at: TWELVE_FOUR_HOURS_FROM_NOW,
      })
      discounts.push({
        promotion_code: promotionCodeId,
      })
    }
  }

  // ... rest of checkout session creation ...

  const metadata = CheckoutSessionMetadataSchema.parse({
    // ... existing metadata ...

    // NEW: Add discount type information
    ...(merchantCoupon && {
      discountType: isMerchantCouponFixedAmount ? 'fixed' : 'percentage',
      discountAmount: isMerchantCouponFixedAmount
        ? merchantCoupon.amountDiscount
        : Math.round((stripeCouponPercentOff || 0) * 100),
    }),
  })

  // ... rest unchanged
}
```

### 7. Add getCouponAmountOff to Stripe Adapter
**File:** `packages/core/src/providers/stripe.ts`

```typescript
export class StripePaymentAdapter implements PaymentsAdapter {
  // ... existing methods ...

  async getCouponPercentOff(identifier: string) {
    const coupon = await this.stripe.coupons.retrieve(identifier)
    return coupon && coupon.percent_off ? coupon.percent_off / 100 : 0
  }

  // NEW
  async getCouponAmountOff(identifier: string) {
    const coupon = await this.stripe.coupons.retrieve(identifier)
    return coupon && coupon.amount_off ? coupon.amount_off : 0
  }

  // ... rest unchanged
}

// Update mock adapter
export const mockStripeAdapter: PaymentsAdapter = {
  getCouponPercentOff: async () => 0,
  getCouponAmountOff: async () => 0,  // NEW
  // ... rest unchanged
}
```

## Database Migration

### 8. Add Database Column
**Create migration file:** `packages/adapter-drizzle/drizzle/migrations/XXXX-add-merchant-coupon-amount-discount.sql`

```sql
-- Add amountDiscount column to MerchantCoupon table
ALTER TABLE MerchantCoupon
ADD COLUMN amountDiscount INTEGER NULL;

-- Add check constraint to prevent both discount types
-- Note: Syntax varies by database (MySQL, PostgreSQL, etc.)
-- MySQL version:
ALTER TABLE MerchantCoupon
ADD CONSTRAINT chk_single_discount_type CHECK (
  (percentageDiscount IS NOT NULL AND percentageDiscount > 0 AND (amountDiscount IS NULL OR amountDiscount = 0)) OR
  (amountDiscount IS NOT NULL AND amountDiscount > 0 AND (percentageDiscount IS NULL OR percentageDiscount = 0)) OR
  (percentageDiscount IS NULL OR percentageDiscount = 0) AND (amountDiscount IS NULL OR amountDiscount = 0)
);

-- Add index for queries
CREATE INDEX idx_merchant_coupon_amount_discount ON MerchantCoupon(amountDiscount);
```

### 9. Update Drizzle Schema
**File:** `packages/adapter-drizzle/src/schemas/merchant-coupon-schema.ts` (or similar)

```typescript
export const merchantCoupons = mysqlTable('MerchantCoupon', {
  id: varchar('id', { length: 191 }).primaryKey(),
  identifier: varchar('identifier', { length: 191 }),
  status: int('status').default(0),
  merchantAccountId: varchar('merchantAccountId', { length: 191 }),
  percentageDiscount: decimal('percentageDiscount', { precision: 3, scale: 2 }),
  amountDiscount: int('amountDiscount'),  // NEW
  type: varchar('type', { length: 191 }),
})
```

## Testing Checklist

### Unit Tests

**File:** `packages/core/src/lib/pricing/format-prices-for-product.test.ts`

```typescript
describe('formatPricesForProduct with fixed-amount coupons', () => {
  it('applies fixed-amount merchant coupon correctly', async () => {
    // Test fixed amount discount
  })

  it('prefers fixed discount over percentage when specified', async () => {
    // Test precedence
  })

  it('handles upgrade + fixed merchant coupon conflict', async () => {
    // Test conflict resolution
  })

  it('ensures non-negative prices', async () => {
    // Test price clamping
  })
})
```

**File:** `packages/core/src/lib/pricing/determine-coupon-to-apply.test.ts`

```typescript
describe('determineCouponToApply with fixed-amount coupons', () => {
  it('returns appliedDiscountType as "fixed" for amount-based coupons', async () => {
    // Test discount type detection
  })

  it('validates mutual exclusivity of discount types', async () => {
    // Test validation
  })
})
```

**File:** `packages/core/src/lib/pricing/stripe-checkout.test.ts`

```typescript
describe('stripeCheckout with fixed-amount coupons', () => {
  it('creates transient amount_off coupon for fixed merchant coupons', async () => {
    // Test Stripe coupon creation
  })

  it('includes discount metadata in checkout session', async () => {
    // Test metadata
  })
})
```

### Integration Tests

```typescript
describe('Fixed Amount Coupon E2E', () => {
  it('completes checkout with fixed-amount coupon', async () => {
    // Full checkout flow test
  })

  it('handles PPP ineligibility with fixed-amount fallback', async () => {
    // Test PPP + fixed interaction
  })
})
```

## Validation Checklist

- [ ] Schema migration applied
- [ ] TypeScript compilation passes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] No `console.log` statements (use logger)
- [ ] Documentation updated
- [ ] Edge cases covered:
  - [ ] Fixed discount > product price
  - [ ] Both discount types set (should fail validation)
  - [ ] Upgrade + merchant fixed conflict
  - [ ] PPP + fixed interaction
  - [ ] Bulk + fixed interaction
- [ ] Stripe checkout sessions created successfully
- [ ] Metadata includes discount type and amount
- [ ] Non-negative price enforcement
- [ ] Backward compatibility verified

## Rollout Considerations

### Feature Flag (Optional)
```typescript
// In config/environment
const FIXED_AMOUNT_COUPONS_ENABLED = process.env.ENABLE_FIXED_COUPONS === 'true'

// In determineCouponToApply
if (FIXED_AMOUNT_COUPONS_ENABLED && coupon.amountDiscount) {
  // New logic
} else {
  // Existing logic
}
```

### Observability
```typescript
// Replace console.log with proper logging
import { logger } from '@/server/logger'

logger.info('Applied fixed-amount coupon', {
  merchantCouponId: coupon.id,
  amountDiscount: coupon.amountDiscount,
  productId,
  userId,
})
```

### Monitoring Queries
```sql
-- Find all fixed-amount coupons
SELECT * FROM MerchantCoupon WHERE amountDiscount IS NOT NULL AND amountDiscount > 0;

-- Find coupons with both discount types (should be empty)
SELECT * FROM MerchantCoupon
WHERE percentageDiscount > 0 AND amountDiscount > 0;

-- Usage analytics
SELECT
  type,
  COUNT(*) as usage_count,
  AVG(amountDiscount) as avg_discount
FROM Purchase p
JOIN MerchantCoupon mc ON p.merchantCouponId = mc.id
WHERE mc.amountDiscount IS NOT NULL
GROUP BY type;
```
