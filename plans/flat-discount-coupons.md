# Flat Discount Coupon Support

## Summary
- Add first-class support for fixed-amount coupons alongside existing percentage-based flow.
- Unify price calculation and checkout metadata so either discount type produces consistent Stripe sessions and UI pricing.
- Preserve upgrade behaviour and PPP edge cases while adding validation and logging for the new path.

## Difficulty & Risk
- **Difficulty:** High — spans schema updates, pricing logic, adapters, and Stripe integration with careful backward-compat handling.
- **Risk:** Medium-High — miscalculations or coupon stacking bugs can impact revenue; mitigated via tests and logging.

## Current Behaviour
- `formatPricesForProduct` only exposes a percent-based discount from `determineCouponToApply`; flat discounts are limited to upgrade flows via `getFixedDiscountForIndividualUpgrade`.

```204:233:packages/core/src/lib/pricing/format-prices-for-product.ts
const percentOfDiscount = appliedMerchantCoupon?.percentageDiscount
// ... existing code ...
return {
    ...product,
    quantity,
    unitPrice,
    fullPrice,
    fixedDiscountForUpgrade,
    calculatedPrice: getCalculatedPrice({
        unitPrice,
        percentOfDiscount,
        fixedDiscount: fixedDiscountForUpgrade,
        quantity,
    }),
    availableCoupons: result.availableCoupons,
    appliedMerchantCoupon,
    // ... existing code ...
}
```

- `stripeCheckout` already fabricates single-use `amount_off` coupons for upgrade scenarios but defaults to existing Stripe coupons (percentage) for merchant coupons.

```319:395:packages/core/src/lib/pricing/stripe-checkout.ts
if (isUpgrade && upgradeFromPurchase && loadedProduct && customerId) {
    const fixedDiscountForIndividualUpgrade = await getFixedDiscountForIndividualUpgrade({
        // ... existing code ...
    })
    if (fixedDiscountForIndividualUpgrade > 0) {
        const amount_off_in_cents = (fullPrice - calculatedPrice) * 100
        const couponId = await config.paymentsAdapter.createCoupon({
            amount_off: amount_off_in_cents,
            name: couponName,
            max_redemptions: 1,
            redeem_by: TWELVE_FOUR_HOURS_FROM_NOW,
            currency: 'USD',
            applies_to: { products: [merchantProductIdentifier] },
        })
        discounts.push({ coupon: couponId })
    }
} else if (merchantCoupon && merchantCoupon.identifier) {
    // percentage-only flow relying on pre-existing Stripe coupon ids
    const promotionCodeId = await config.paymentsAdapter.createPromotionCode({
        coupon: merchantCoupon.identifier,
        max_redemptions: 1,
        expires_at: TWELVE_FOUR_HOURS_FROM_NOW,
    })
    discounts.push({ promotion_code: promotionCodeId })
}
```

- Merchant coupon metadata (types, value) is assumed to live in adapters; current schema lacks an explicit fixed-amount field and downstream code expects percentages.

## Goals
- Model `amountOff` (in cents) for merchant coupons and expose it through adapters and pricing utilities.
- Ensure `formatPricesForProduct` and `stripeCheckout` understand when to prioritise fixed versus percent discounts, avoiding double-discounts.
- Maintain current behaviour for PPP, upgrades, and bulk pricing.
- Provide logs/telemetry for discount type decisions.

## Proposed Changes

### 1. Data & Adapter Surface
- Extend coupon schema/types (`MerchantCoupon`, `determineCouponToApply` return payload) to carry mutually exclusive `percentageDiscount` and `amountDiscount` fields (cents, integer).
- Update adapter contracts (`PaymentsAdapter`, `CourseBuilderAdapter`) to return Stripe coupon metadata with amount information. Ensure tsup build passes.
- Add migration or seed updates if coupon records live in persistence layer.

### 2. Coupon Selection Logic
- Update `determineCouponToApply` to:
  - Validate and normalise fixed-amount coupons (include currency assumptions, e.g. USD).
  - Resolve conflicts: prefer `amountDiscount` when defined, otherwise fall back to percentage.
  - Surface an explicit `appliedDiscountType` enum (`'fixed' | 'percentage' | 'ppp' | 'bulk'`).
- Add unit tests covering precedence rules, PPP interactions, and invalid configurations.

### 3. Price Formatting Pipeline
- Modify `formatPricesForProduct` to propagate fixed discount amounts:
  - Inject `appliedFixedDiscount = appliedMerchantCoupon?.amountDiscount ?? 0`.
  - Feed `appliedFixedDiscount` into `getCalculatedPrice` (requires ensuring helper supports arbitrary fixed deductions beyond upgrades).
  - Update return payload to include `appliedDiscountType`, `appliedFixedDiscount`, and to reuse existing `fixedDiscountForUpgrade` without collision.
- Ensure `fullPrice` and `calculatedPrice` stay non-negative; clamp where necessary.
- Write unit tests for `formatPricesForProduct` covering: no coupon, percentage coupon, fixed coupon, upgrade + fixed coupon conflict, bulk.

### 4. Stripe Checkout Integration
- When `merchantCoupon` carries `amountDiscount`:
  - Use Stripe promotion codes only if the underlying coupon already has `amount_off`; otherwise create a transient coupon mirroring `amountDiscount` (similar to upgrade flow) and store identifier for reconciliation.
  - Update checkout metadata to capture `discountType`, `discountAmount`, and existing fields.
  - Prevent stacking upgrade discount coupon creation when a fixed merchant coupon applies; decide precedence and enforce via guard clauses.
- Add logging via server logger (`@/server/logger` equivalent in packages) for coupon application decisions; remove stray `console.log`.
- Extend existing integration tests/mocks for `PaymentsAdapter` to validate `amount_off` path.

### 5. Client & Admin Surfaces (if applicable)
- Audit UI surfaces that display coupon details to ensure they can show fixed amounts (currency formatting) as well as percentages.
- Update documentation/help text to clarify supported discount types.

### 6. Observability & Cleanup
- Replace remaining `console.*` usage in pricing code with central logger.
- Document new coupon fields in package README or `docs/pricing.md` if available.

## Testing & Definition of Done
- Unit tests: `determineCouponToApply`, `getCalculatedPrice`, `formatPricesForProduct` covering both discount types, PPP, upgrade interactions.
- Integration tests: mocked Stripe checkout flow verifying discount payloads, metadata, and adapter interactions for fixed vs percentage.
- Type checks + `pnpm test --filter core` (or package-specific script) pass.
- No new eslint errors; tsup build for affected packages succeeds.
- Logging verified in local/dev environment (ensure correct context IDs).
- Documentation or admin UI updates merged.
- Feature flag (if needed) toggled or rollout plan documented.
