# Flat Discount Coupons - Comprehensive Testing Plan

## Testing Overview

This testing plan covers all aspects of the flat discount coupon implementation, including unit tests, integration tests, and end-to-end scenarios. Tests are organized by component and include clear setup requirements, test data, and expected outcomes.

## Test Environment Setup

### Prerequisites
- Database with test data (products, users, merchant accounts)
- Stripe test mode API keys configured
- Mock Stripe adapter for unit tests
- Real Stripe adapter for integration tests

### Test Data Requirements

#### Products
```typescript
const testProducts = {
  basic: { id: 'prod_basic', name: 'Basic Course', price: 10000 }, // $100
  bundle: { id: 'prod_bundle', name: 'Bundle', price: 20000 }, // $200
  expensive: { id: 'prod_expensive', name: 'Premium', price: 50000 }, // $500
  cheap: { id: 'prod_cheap', name: 'Mini Course', price: 5000 }, // $50
}
```

#### Merchant Coupons
```typescript
const testCoupons = {
  fixedAmount20: {
    id: 'coupon_fixed_20',
    amountDiscount: 2000, // $20 off
    type: 'special',
  },
  fixedAmount75: {
    id: 'coupon_fixed_75',
    amountDiscount: 7500, // $75 off
    type: 'special',
  },
  percentage25: {
    id: 'coupon_percent_25',
    percentageDiscount: 0.25, // 25% off
    type: 'special',
  },
  ppp60: {
    id: 'coupon_ppp_india',
    percentageDiscount: 0.60, // 60% off
    type: 'ppp',
    country: 'IN',
  },
  bulk20: {
    id: 'coupon_bulk_5seats',
    percentageDiscount: 0.20, // 20% off
    type: 'bulk',
  },
  invalid: {
    id: 'coupon_invalid',
    percentageDiscount: 0.25,
    amountDiscount: 2000, // Both set - should fail validation
  },
}
```

#### Purchases (for upgrade scenarios)
```typescript
const testPurchases = {
  validPurchase: {
    id: 'purchase_valid',
    productId: 'prod_basic',
    status: 'Valid',
    totalAmount: 10000,
  },
  restrictedPurchase: {
    id: 'purchase_restricted',
    productId: 'prod_basic',
    status: 'Restricted',
    totalAmount: 4000, // Paid with PPP
  },
}
```

---

## Unit Tests

### 1. Schema Validation Tests

**File:** `packages/core/src/schemas/merchant-coupon-schema.test.ts`

#### Test Case 1.1: Valid Fixed Amount Coupon
```typescript
it('accepts coupon with amountDiscount only', () => {
  const coupon = {
    id: 'test_1',
    merchantAccountId: 'merchant_1',
    amountDiscount: 2000,
    type: 'special',
    status: 1,
  }

  expect(() => merchantCouponSchema.parse(coupon)).not.toThrow()
})
```

#### Test Case 1.2: Valid Percentage Coupon
```typescript
it('accepts coupon with percentageDiscount only', () => {
  const coupon = {
    id: 'test_2',
    merchantAccountId: 'merchant_1',
    percentageDiscount: 0.25,
    type: 'special',
    status: 1,
  }

  expect(() => merchantCouponSchema.parse(coupon)).not.toThrow()
})
```

#### Test Case 1.3: Reject Both Discount Types
```typescript
it('rejects coupon with both discount types', () => {
  const coupon = {
    id: 'test_3',
    merchantAccountId: 'merchant_1',
    percentageDiscount: 0.25,
    amountDiscount: 2000,
    type: 'special',
    status: 1,
  }

  expect(() => merchantCouponSchema.parse(coupon)).toThrow(
    'Cannot have both percentageDiscount and amountDiscount'
  )
})
```

#### Test Case 1.4: Accept Coupon with No Discount
```typescript
it('accepts coupon with neither discount type (inactive)', () => {
  const coupon = {
    id: 'test_4',
    merchantAccountId: 'merchant_1',
    type: 'special',
    status: 0,
  }

  expect(() => merchantCouponSchema.parse(coupon)).not.toThrow()
})
```

#### Test Case 1.5: Amount Discount Must Be Integer
```typescript
it('rejects amountDiscount with decimals', () => {
  const coupon = {
    id: 'test_5',
    merchantAccountId: 'merchant_1',
    amountDiscount: 20.5, // Invalid - must be integer cents
    type: 'special',
    status: 1,
  }

  expect(() => merchantCouponSchema.parse(coupon)).toThrow()
})
```

---

### 2. determineCouponToApply Tests

**File:** `packages/core/src/lib/pricing/determine-coupon-to-apply.test.ts`

#### Test Case 2.1: Fixed Amount Takes Priority
```typescript
it('returns appliedDiscountType as "fixed" for amount-based coupons', async () => {
  const result = await determineCouponToApply({
    prismaCtx: mockAdapter,
    merchantCouponId: 'coupon_fixed_20',
    country: 'US',
    quantity: 1,
    productId: 'prod_basic',
    purchaseToBeUpgraded: null,
    autoApplyPPP: true,
    usedCoupon: null,
  })

  expect(result.appliedDiscountType).toBe('fixed')
  expect(result.appliedMerchantCoupon?.amountDiscount).toBe(2000)
})
```

#### Test Case 2.2: Percentage Discount Detection
```typescript
it('returns appliedDiscountType as "percentage" for percentage coupons', async () => {
  const result = await determineCouponToApply({
    prismaCtx: mockAdapter,
    merchantCouponId: 'coupon_percent_25',
    country: 'US',
    quantity: 1,
    productId: 'prod_basic',
    purchaseToBeUpgraded: null,
    autoApplyPPP: true,
    usedCoupon: null,
  })

  expect(result.appliedDiscountType).toBe('percentage')
  expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.25)
})
```

#### Test Case 2.3: PPP Takes Priority Over Fixed When Better
```typescript
it('prefers PPP over fixed amount when PPP provides better discount', async () => {
  // PPP 60% off on $100 = $40 final price
  // Fixed $20 off on $100 = $80 final price
  // PPP is better

  const result = await determineCouponToApply({
    prismaCtx: mockAdapter,
    merchantCouponId: 'coupon_fixed_20',
    country: 'IN', // India has 60% PPP discount
    quantity: 1,
    productId: 'prod_basic',
    purchaseToBeUpgraded: null,
    autoApplyPPP: true,
    usedCoupon: null,
  })

  expect(result.appliedDiscountType).toBe('ppp')
  expect(result.appliedMerchantCoupon?.percentageDiscount).toBe(0.60)
})
```

#### Test Case 2.4: Fixed Takes Priority Over PPP When Better
```typescript
it('prefers fixed amount over PPP when fixed provides better discount', async () => {
  // Fixed $75 off on $100 = $25 final price
  // PPP 60% off on $100 = $40 final price
  // Fixed is better

  const result = await determineCouponToApply({
    prismaCtx: mockAdapter,
    merchantCouponId: 'coupon_fixed_75',
    country: 'IN',
    quantity: 1,
    productId: 'prod_basic',
    purchaseToBeUpgraded: null,
    autoApplyPPP: true,
    usedCoupon: null,
  })

  expect(result.appliedDiscountType).toBe('fixed')
  expect(result.appliedMerchantCoupon?.amountDiscount).toBe(7500)
})
```

#### Test Case 2.5: Bulk Purchases Ignore Fixed Coupons
```typescript
it('does not apply fixed coupon for bulk purchases', async () => {
  const result = await determineCouponToApply({
    prismaCtx: mockAdapter,
    merchantCouponId: 'coupon_fixed_20',
    country: 'US',
    quantity: 5, // Bulk purchase
    productId: 'prod_basic',
    purchaseToBeUpgraded: null,
    autoApplyPPP: true,
    usedCoupon: null,
  })

  // Should fall back to bulk discount instead
  expect(result.appliedDiscountType).toBe('bulk')
})
```

---

### 3. formatPricesForProduct Tests

**File:** `packages/core/src/lib/pricing/format-prices-for-product.test.ts`

#### Test Case 3.1: Basic Fixed Amount Discount
```typescript
it('applies fixed-amount merchant coupon correctly', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_basic',
    merchantCouponId: 'coupon_fixed_20',
    quantity: 1,
  })

  expect(result.unitPrice).toBe(100)
  expect(result.fullPrice).toBe(100)
  expect(result.appliedFixedDiscount).toBe(20)
  expect(result.appliedDiscountType).toBe('fixed')
  expect(result.calculatedPrice).toBe(80)
})
```

#### Test Case 3.2: Fixed Discount Greater Than Price
```typescript
it('clamps price to $0 when fixed discount exceeds price', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_cheap', // $50
    merchantCouponId: 'coupon_fixed_75', // $75 off
    quantity: 1,
  })

  expect(result.calculatedPrice).toBe(0)
  expect(result.appliedFixedDiscount).toBe(75)
})
```

#### Test Case 3.3: Fixed Discount Equals Price
```typescript
it('results in $0 when fixed discount equals price', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_basic', // $100
    merchantCouponId: 'coupon_fixed_100', // $100 off
    quantity: 1,
  })

  expect(result.calculatedPrice).toBe(0)
})
```

#### Test Case 3.4: Percentage Discount (Unchanged Behavior)
```typescript
it('applies percentage discount correctly (backward compatibility)', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_basic', // $100
    merchantCouponId: 'coupon_percent_25', // 25% off
    quantity: 1,
  })

  expect(result.unitPrice).toBe(100)
  expect(result.fullPrice).toBe(100)
  expect(result.appliedDiscountType).toBe('percentage')
  expect(result.calculatedPrice).toBe(75)
  expect(result.appliedFixedDiscount).toBeUndefined()
})
```

#### Test Case 3.5: Upgrade + Fixed Merchant Conflict (Max Wins)
```typescript
it('takes max discount when upgrade and fixed merchant both apply', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_bundle', // $200
    merchantCouponId: 'coupon_fixed_20', // $20 off
    upgradeFromPurchaseId: 'purchase_valid', // $100 credit
    quantity: 1,
  })

  expect(result.fixedDiscountForUpgrade).toBe(100)
  expect(result.appliedFixedDiscount).toBe(20)
  // Should use the better discount
  expect(result.calculatedPrice).toBe(100) // $200 - $100 upgrade discount
})
```

#### Test Case 3.6: Upgrade + Fixed Merchant (Merchant Wins)
```typescript
it('uses fixed merchant when better than upgrade discount', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_expensive', // $500
    merchantCouponId: 'coupon_fixed_200', // $200 off
    upgradeFromPurchaseId: 'purchase_basic', // $100 credit
    quantity: 1,
  })

  expect(result.fixedDiscountForUpgrade).toBe(100)
  expect(result.appliedFixedDiscount).toBe(200)
  expect(result.calculatedPrice).toBe(300) // $500 - $200 merchant discount
})
```

#### Test Case 3.7: PPP Upgrade with Restricted Purchase
```typescript
it('handles PPP upgrade from restricted purchase correctly', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_basic', // $100, same product
    upgradeFromPurchaseId: 'purchase_restricted', // Paid $40 with PPP
    quantity: 1,
  })

  // Upgrading from Restricted to Unrestricted on same product
  expect(result.fixedDiscountForUpgrade).toBe(40)
  expect(result.calculatedPrice).toBe(60) // $100 - $40
})
```

#### Test Case 3.8: Bulk Purchase (No Fixed Discount)
```typescript
it('does not apply fixed discount for bulk purchases', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_basic',
    quantity: 5,
  })

  expect(result.bulk).toBe(true)
  expect(result.appliedDiscountType).toBe('bulk')
  expect(result.appliedFixedDiscount).toBeUndefined()
  // Should have bulk percentage discount instead
})
```

---

### 4. getCalculatedPrice Tests

**File:** `packages/core/src/lib/pricing/get-calculated-price.test.ts`

#### Test Case 4.1: Fixed Discount Only
```typescript
it('applies fixed discount without percentage', () => {
  const result = getCalculatedPrice({
    unitPrice: 100,
    quantity: 1,
    fixedDiscount: 20,
    percentOfDiscount: 0,
  })

  expect(result).toBe(80)
})
```

#### Test Case 4.2: Percentage Discount Only
```typescript
it('applies percentage discount without fixed', () => {
  const result = getCalculatedPrice({
    unitPrice: 100,
    quantity: 1,
    fixedDiscount: 0,
    percentOfDiscount: 0.25,
  })

  expect(result).toBe(75)
})
```

#### Test Case 4.3: Both Discounts (Order Matters)
```typescript
it('applies fixed discount before percentage (upgrade scenario)', () => {
  // (100 - 20) * 0.75 = 60
  const result = getCalculatedPrice({
    unitPrice: 100,
    quantity: 1,
    fixedDiscount: 20,
    percentOfDiscount: 0.25,
  })

  expect(result).toBe(60)
})
```

#### Test Case 4.4: Non-Negative Enforcement
```typescript
it('clamps negative results to 0', () => {
  const result = getCalculatedPrice({
    unitPrice: 50,
    quantity: 1,
    fixedDiscount: 100,
    percentOfDiscount: 0,
  })

  expect(result).toBe(0)
})
```

#### Test Case 4.5: Quantity Multiplier
```typescript
it('applies quantity before discounts', () => {
  // (100 * 3 = 300) - 50 = 250
  const result = getCalculatedPrice({
    unitPrice: 100,
    quantity: 3,
    fixedDiscount: 50,
    percentOfDiscount: 0,
  })

  expect(result).toBe(250)
})
```

---

## Integration Tests

### 5. Stripe Checkout Integration

**File:** `packages/core/src/lib/pricing/stripe-checkout.test.ts`

#### Test Case 5.1: Create Transient amount_off Coupon for Fixed Merchant
```typescript
it('creates transient amount_off coupon for fixed merchant coupons', async () => {
  const mockCreateCoupon = vi.fn().mockResolvedValue('stripe_coupon_123')
  const mockAdapter = {
    paymentsAdapter: {
      createCoupon: mockCreateCoupon,
      createCheckoutSession: vi.fn().mockResolvedValue('session_url'),
    },
  }

  await stripeCheckout({
    params: {
      productId: 'prod_basic',
      couponId: 'coupon_fixed_20',
      quantity: 1,
      bulk: false,
      cancelUrl: 'http://test.com/cancel',
    },
    config: mockConfig,
    adapter: mockAdapter,
  })

  expect(mockCreateCoupon).toHaveBeenCalledWith({
    amount_off: 2000,
    name: expect.stringContaining('discount'),
    max_redemptions: 1,
    redeem_by: expect.any(Number),
    currency: 'USD',
    applies_to: {
      products: [expect.any(String)],
    },
  })
})
```

#### Test Case 5.2: Use Promotion Code for Percentage Merchant
```typescript
it('creates promotion code for percentage merchant coupons', async () => {
  const mockCreatePromotionCode = vi.fn().mockResolvedValue('promo_123')
  const mockAdapter = {
    paymentsAdapter: {
      createPromotionCode: mockCreatePromotionCode,
      createCheckoutSession: vi.fn().mockResolvedValue('session_url'),
    },
  }

  await stripeCheckout({
    params: {
      productId: 'prod_basic',
      couponId: 'coupon_percent_25',
      quantity: 1,
      bulk: false,
      cancelUrl: 'http://test.com/cancel',
    },
    config: mockConfig,
    adapter: mockAdapter,
  })

  expect(mockCreatePromotionCode).toHaveBeenCalledWith({
    coupon: expect.any(String), // Stripe coupon identifier
    max_redemptions: 1,
    expires_at: expect.any(Number),
  })
})
```

#### Test Case 5.3: Metadata Includes Discount Type
```typescript
it('includes discount type and amount in checkout metadata', async () => {
  const mockCreateSession = vi.fn().mockResolvedValue('session_url')
  const mockAdapter = {
    paymentsAdapter: {
      createCoupon: vi.fn().mockResolvedValue('coupon_123'),
      createCheckoutSession: mockCreateSession,
    },
  }

  await stripeCheckout({
    params: {
      productId: 'prod_basic',
      couponId: 'coupon_fixed_20',
      quantity: 1,
      bulk: false,
      cancelUrl: 'http://test.com/cancel',
    },
    config: mockConfig,
    adapter: mockAdapter,
  })

  const sessionCall = mockCreateSession.mock.calls[0][0]
  expect(sessionCall.metadata).toMatchObject({
    discountType: 'fixed',
    discountAmount: 2000,
  })
})
```

#### Test Case 5.4: Upgrade Coupon Created Correctly
```typescript
it('creates upgrade amount_off coupon with correct amount', async () => {
  const mockCreateCoupon = vi.fn().mockResolvedValue('upgrade_coupon_123')

  await stripeCheckout({
    params: {
      productId: 'prod_bundle',
      upgradeFromPurchaseId: 'purchase_valid',
      quantity: 1,
      bulk: false,
      cancelUrl: 'http://test.com/cancel',
    },
    config: mockConfig,
    adapter: mockAdapterWithUpgrade,
  })

  expect(mockCreateCoupon).toHaveBeenCalledWith(
    expect.objectContaining({
      amount_off: expect.any(Number),
      name: expect.stringContaining('Upgrade'),
    })
  )
})
```

#### Test Case 5.5: No Double Discount on Upgrade + Fixed Merchant
```typescript
it('does not stack upgrade and fixed merchant discounts', async () => {
  const mockCreateCoupon = vi.fn().mockResolvedValue('coupon_123')

  await stripeCheckout({
    params: {
      productId: 'prod_bundle',
      couponId: 'coupon_fixed_20',
      upgradeFromPurchaseId: 'purchase_valid',
      quantity: 1,
      bulk: false,
      cancelUrl: 'http://test.com/cancel',
    },
    config: mockConfig,
    adapter: mockAdapter,
  })

  // Should only create ONE coupon (whichever discount is better)
  expect(mockCreateCoupon).toHaveBeenCalledTimes(1)
})
```

---

## End-to-End Test Scenarios

### 6. Complete Checkout Flows

**File:** `apps/course-builder-web/tests/e2e/checkout-fixed-discount.spec.ts`

#### E2E Test 6.1: Fixed Amount Coupon Checkout
```typescript
test('completes checkout with fixed-amount coupon', async ({ page }) => {
  // 1. Navigate to product page
  await page.goto('/products/prod_basic')

  // 2. Apply fixed discount coupon
  await page.fill('[data-test="coupon-input"]', 'FIXED20')
  await page.click('[data-test="apply-coupon"]')

  // 3. Verify discount displayed
  await expect(page.locator('[data-test="original-price"]')).toHaveText('$100.00')
  await expect(page.locator('[data-test="discount-amount"]')).toHaveText('-$20.00')
  await expect(page.locator('[data-test="final-price"]')).toHaveText('$80.00')

  // 4. Proceed to checkout
  await page.click('[data-test="checkout-button"]')

  // 5. Verify Stripe session created with correct amount
  const stripeUrl = await page.url()
  expect(stripeUrl).toContain('stripe.com/checkout')

  // Verify via Stripe API (in test mode)
  const session = await getStripeSession(extractSessionId(stripeUrl))
  expect(session.amount_total).toBe(8000) // $80.00 in cents
})
```

#### E2E Test 6.2: PPP vs Fixed Discount Selection
```typescript
test('selects better discount between PPP and fixed amount', async ({ page, context }) => {
  // Set geolocation to India
  await context.setGeolocation({ latitude: 28.6139, longitude: 77.2090 })

  // Navigate to product
  await page.goto('/products/prod_basic')

  // Apply fixed coupon
  await page.fill('[data-test="coupon-input"]', 'FIXED20')
  await page.click('[data-test="apply-coupon"]')

  // Should show PPP discount instead (60% > $20)
  await expect(page.locator('[data-test="discount-type"]')).toHaveText('PPP Discount')
  await expect(page.locator('[data-test="final-price"]')).toHaveText('$40.00')
})
```

#### E2E Test 6.3: Upgrade with Fixed Discount
```typescript
test('applies correct discount for upgrade scenario', async ({ page }) => {
  // Assume user has purchased basic product for $100
  await loginUser(page, 'user_with_basic_purchase')

  // Navigate to bundle upgrade
  await page.goto('/products/prod_bundle/upgrade')

  // Original: $200, Upgrade credit: $100, Expected: $100
  await expect(page.locator('[data-test="upgrade-credit"]')).toHaveText('-$100.00')
  await expect(page.locator('[data-test="final-price"]')).toHaveText('$100.00')

  // Apply additional fixed coupon
  await page.fill('[data-test="coupon-input"]', 'FIXED20')
  await page.click('[data-test="apply-coupon"]')

  // Should still be $100 (upgrade credit is better than $20 coupon)
  await expect(page.locator('[data-test="final-price"]')).toHaveText('$100.00')
})
```

---

## Database Integration Tests

### 7. Database Schema and Queries

**File:** `packages/adapter-drizzle/src/schemas/merchant-coupon-schema.test.ts`

#### Test Case 7.1: Insert Fixed Amount Coupon
```typescript
it('inserts coupon with amountDiscount', async () => {
  const result = await db.insert(merchantCoupons).values({
    id: 'test_coupon_1',
    merchantAccountId: 'merchant_1',
    amountDiscount: 2000,
    type: 'special',
    status: 1,
  })

  expect(result).toBeTruthy()

  const inserted = await db.query.merchantCoupons.findFirst({
    where: eq(merchantCoupons.id, 'test_coupon_1'),
  })

  expect(inserted?.amountDiscount).toBe(2000)
})
```

#### Test Case 7.2: Query Coupons by Discount Type
```typescript
it('queries fixed amount coupons', async () => {
  const fixedCoupons = await db.query.merchantCoupons.findMany({
    where: and(
      isNotNull(merchantCoupons.amountDiscount),
      gt(merchantCoupons.amountDiscount, 0)
    ),
  })

  expect(fixedCoupons.length).toBeGreaterThan(0)
  fixedCoupons.forEach(coupon => {
    expect(coupon.amountDiscount).toBeGreaterThan(0)
    expect(coupon.percentageDiscount).toBeFalsy()
  })
})
```

#### Test Case 7.3: Database Constraint Prevents Both Discounts
```typescript
it('rejects insert with both discount types via DB constraint', async () => {
  await expect(
    db.insert(merchantCoupons).values({
      id: 'test_invalid',
      merchantAccountId: 'merchant_1',
      percentageDiscount: '0.25',
      amountDiscount: 2000,
      type: 'special',
      status: 1,
    })
  ).rejects.toThrow()
})
```

---

## Payment Adapter Tests

### 8. Stripe Adapter Tests

**File:** `packages/core/src/providers/stripe.test.ts`

#### Test Case 8.1: getCouponAmountOff Implementation
```typescript
it('retrieves amount_off from Stripe coupon', async () => {
  const stripeAdapter = new StripePaymentAdapter(mockStripeClient)

  mockStripeClient.coupons.retrieve.mockResolvedValue({
    id: 'stripe_coupon_123',
    amount_off: 2000,
    currency: 'usd',
  })

  const amountOff = await stripeAdapter.getCouponAmountOff('stripe_coupon_123')

  expect(amountOff).toBe(2000)
})
```

#### Test Case 8.2: getCouponAmountOff Returns 0 for Percentage Coupon
```typescript
it('returns 0 for percentage-based coupons', async () => {
  const stripeAdapter = new StripePaymentAdapter(mockStripeClient)

  mockStripeClient.coupons.retrieve.mockResolvedValue({
    id: 'stripe_coupon_percent',
    percent_off: 25,
  })

  const amountOff = await stripeAdapter.getCouponAmountOff('stripe_coupon_percent')

  expect(amountOff).toBe(0)
})
```

---

## Edge Case Tests

### 9. Edge Cases and Error Handling

#### Test Case 9.1: Extremely Large Fixed Discount
```typescript
it('handles very large fixed discounts', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_basic', // $100
    merchantCouponId: 'coupon_fixed_10000', // $10,000 off
    quantity: 1,
  })

  expect(result.calculatedPrice).toBe(0)
})
```

#### Test Case 9.2: Negative Amount Discount
```typescript
it('rejects negative amountDiscount', () => {
  const coupon = {
    id: 'test_negative',
    merchantAccountId: 'merchant_1',
    amountDiscount: -1000,
    type: 'special',
    status: 1,
  }

  expect(() => merchantCouponSchema.parse(coupon)).toThrow()
})
```

#### Test Case 9.3: Zero Amount Discount
```typescript
it('treats zero amountDiscount as no discount', async () => {
  const result = await determineCouponToApply({
    prismaCtx: mockAdapter,
    merchantCouponId: 'coupon_zero',
    quantity: 1,
    productId: 'prod_basic',
  })

  expect(result.appliedDiscountType).toBe('none')
})
```

#### Test Case 9.4: Currency Mismatch (Future Consideration)
```typescript
it('assumes USD for all amount discounts', async () => {
  // Current implementation assumes USD
  // This test documents the assumption for future multi-currency support
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_basic',
    merchantCouponId: 'coupon_fixed_20',
    quantity: 1,
  })

  // Amount discount applied directly without currency conversion
  expect(result.appliedFixedDiscount).toBe(20)
})
```

#### Test Case 9.5: Bulk Purchase with Fixed Coupon
```typescript
it('ignores fixed coupon for bulk purchases', async () => {
  const result = await formatPricesForProduct({
    ctx: mockAdapter,
    productId: 'prod_basic',
    merchantCouponId: 'coupon_fixed_20',
    quantity: 5, // Bulk
  })

  expect(result.bulk).toBe(true)
  expect(result.appliedDiscountType).toBe('bulk')
  expect(result.appliedFixedDiscount).toBeUndefined()
})
```

---

## Performance Tests

### 10. Performance Benchmarks

#### Test Case 10.1: Price Calculation Performance
```typescript
it('calculates prices within acceptable time', async () => {
  const start = performance.now()

  for (let i = 0; i < 1000; i++) {
    await formatPricesForProduct({
      ctx: mockAdapter,
      productId: 'prod_basic',
      merchantCouponId: 'coupon_fixed_20',
      quantity: 1,
    })
  }

  const end = performance.now()
  const avgTime = (end - start) / 1000

  expect(avgTime).toBeLessThan(1) // < 1ms per calculation
})
```

---

## Test Execution Order

### Recommended Execution Sequence

1. **Schema Validation** (fastest, catches basic issues)
   - Run first to validate data model changes

2. **Unit Tests - Business Logic**
   - `determineCouponToApply`
   - `getCalculatedPrice`
   - `formatPricesForProduct`

3. **Database Integration**
   - Schema tests
   - Query tests

4. **Payment Adapter Tests**
   - Stripe adapter methods

5. **Stripe Checkout Integration**
   - Mock-based integration tests

6. **End-to-End Tests**
   - Full checkout flows
   - Real Stripe test mode (slowest)

---

## Acceptance Criteria

### Feature Complete When:

- [ ] **All Unit Tests Pass (100% coverage)**
  - Schema validation
  - Business logic functions
  - Edge cases

- [ ] **Integration Tests Pass**
  - Database operations
  - Stripe checkout creation
  - Payment adapter methods

- [ ] **End-to-End Tests Pass**
  - Fixed amount checkout flow
  - PPP comparison logic
  - Upgrade scenarios

- [ ] **Backward Compatibility Verified**
  - Percentage coupons work unchanged
  - PPP flow unaffected
  - Bulk pricing unaffected
  - Upgrade flow unaffected

- [ ] **Edge Cases Handled**
  - Discount > price (clamps to $0)
  - Both discount types (validation fails)
  - Negative prices prevented
  - Large discounts handled

- [ ] **Performance Acceptable**
  - Price calculation < 1ms
  - Stripe checkout creation < 500ms
  - No N+1 queries

- [ ] **Observability Implemented**
  - Discount type logged
  - Discount amount logged
  - Conflict resolution logged
  - No `console.log` statements

---

## Test Commands

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm test --filter="@coursebuilder/core"

# Run specific test file
cd packages/core && pnpm test src/lib/pricing/format-prices-for-product.test.ts

# Watch mode for development
cd packages/core && pnpm test:watch

# Coverage report
pnpm test --coverage

# E2E tests only
pnpm test:e2e

# Integration tests
pnpm test:integration
```

---

## Regression Testing Checklist

Before deployment, verify these existing flows still work:

- [ ] Percentage-only merchant coupon checkout
- [ ] PPP discount application
- [ ] Bulk purchase pricing
- [ ] Upgrade from valid purchase
- [ ] Upgrade from restricted (PPP) purchase
- [ ] Unrestricted upgrade from PPP
- [ ] Bundle upgrade with multiple prior purchases
- [ ] Subscription checkout (if applicable)
- [ ] Free product (price = $0)
- [ ] Applied coupon displayed in UI
- [ ] Purchase confirmation email

---

## Test Data Cleanup

After test runs:

```sql
-- Clean up test coupons
DELETE FROM MerchantCoupon WHERE id LIKE 'test_%';

-- Clean up test purchases
DELETE FROM Purchase WHERE id LIKE 'test_%';

-- Clean up test Stripe resources
-- (Use Stripe CLI or API to clean test mode data)
```

---

## Monitoring Post-Deployment

### Metrics to Track

1. **Discount Type Distribution**
   ```sql
   SELECT
     CASE
       WHEN mc.amountDiscount > 0 THEN 'fixed'
       WHEN mc.percentageDiscount > 0 THEN 'percentage'
       ELSE 'none'
     END as discount_type,
     COUNT(*) as usage_count
   FROM Purchase p
   LEFT JOIN MerchantCoupon mc ON p.merchantCouponId = mc.id
   GROUP BY discount_type;
   ```

2. **Average Discount Amount**
   ```sql
   SELECT
     AVG(mc.amountDiscount / 100) as avg_fixed_discount,
     AVG(p.totalAmount * mc.percentageDiscount) as avg_percentage_discount
   FROM Purchase p
   JOIN MerchantCoupon mc ON p.merchantCouponId = mc.id
   WHERE p.createdAt > NOW() - INTERVAL 7 DAY;
   ```

3. **Checkout Success Rate by Discount Type**
   - Monitor failed checkouts
   - Compare success rates across discount types

---

## Conclusion

This testing plan ensures comprehensive coverage of the fixed discount coupon feature across all layers of the application. Execute tests in the recommended order, verify all acceptance criteria, and monitor metrics post-deployment to ensure successful implementation.
