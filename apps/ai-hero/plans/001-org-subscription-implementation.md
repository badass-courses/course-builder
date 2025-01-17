# Stripe Implementation Plan (Theo's Approach)

## Core Philosophy
Single source of truth using Redis + single sync function to avoid split brain issues. No complex event processing, just sync customer state on every relevant event.

## Current Implementation Status

### Core Components [DONE]
1. **Redis KV Store**
   - [x] Upstash Redis setup (`apps/ai-hero/src/server/redis-client.ts`)
   - [x] Type-safe cache client (`packages/core/src/lib/subscription/stripe-cache.ts`)
   - [x] Customer ID mapping (`stripe:user:{userId}` -> `stripeCustomerId`)
   - [x] Subscription state (`stripe:customer:{customerId}` -> `SubscriptionInfo`)

2. **Sync Function**
   - [x] Core implementation (`packages/core/src/lib/subscription/sync-stripe-data.ts`)
   - [x] Type definitions (`packages/core/src/schemas/subscription-info.ts`)
   - [x] Error handling and retries
   - [x] Metadata validation (`packages/core/src/schemas/stripe/checkout-session-metadata.ts`)

3. **Webhook Handler**
   - [x] Route setup (`apps/ai-hero/src/app/api/stripe/route.ts`)
   - [x] Signature verification
   - [x] Core events only
   - [x] Fire-and-forget sync
   - [x] Core subscription events:
     ```typescript
     const CORE_SUBSCRIPTION_EVENTS = [
       'checkout.session.completed',
       'customer.subscription.created',
       'customer.subscription.updated',
       'customer.subscription.deleted',
       'customer.subscription.paused',
       'customer.subscription.resumed',
       'invoice.paid',
       'invoice.payment_failed',
       'invoice.payment_action_required',
       'payment_intent.succeeded',
       'payment_intent.payment_failed',
     ] as const
     ```

4. **Business Logic Handler**
   - [x] Inngest function (`apps/ai-hero/src/inngest/functions/stripe/event-subscription-checkout-session-completed.ts`)
   - [x] User creation/lookup
   - [x] Organization setup
   - [x] Role management
   - [x] Event emission

5. **Success Page**
   - [x] Route setup (`apps/ai-hero/src/app/(commerce)/thanks/subscription/page.tsx`)
   - [x] Loading states (Suspense)
   - [x] Error handling
   - [x] Login link component
   - [x] Redirect if logged in
   - [x] Direct Redis sync using `stripePaymentAdapter`

## Next Steps

### 1. Manual Testing [NEXT]
Test the full subscription flow:
1. **Checkout Flow**
   - [ ] Start checkout session
   - [ ] Complete payment
   - [ ] Verify redirect to success page

2. **Success Page**
   - [ ] Verify subscription info loads
   - [ ] Test login link
   - [ ] Test redirect if logged in
   - [ ] Verify Redis state

3. **Webhook Processing**
   - [ ] Use Stripe CLI to trigger events
   - [ ] Verify Redis updates
   - [ ] Check Inngest function execution
   - [ ] Verify organization setup

4. **Error Cases**
   - [ ] Invalid session ID
   - [ ] Missing customer
   - [ ] Failed payment
   - [ ] Network issues

### 2. Cleanup [PENDING]
- [ ] Remove unused subscription types
- [ ] Clean up old event handlers
- [ ] Update tests

### 3. Future Automation [OPTIONAL]
Consider adding:
- [ ] Integration tests using Stripe test mode
- [ ] Webhook event replay tests
- [ ] Redis state verification
- [ ] Organization state checks

## File Structure
```
packages/core/
├── src/
│   ├── lib/
│   │   ├── subscription/
│   │   │   ├── stripe-cache.ts      # KV store operations
│   │   │   └── sync-stripe-data.ts  # Core sync function
│   │   └── pricing/
│   │       └── process-stripe-webhook.ts  # Old webhook (to delete)
│   └── schemas/
│       ├── subscription-info.ts      # Core types
│       └── stripe/
│           └── checkout-session-metadata.ts  # Metadata validation

apps/ai-hero/
└── src/
    ├── server/
    │   ├── redis-client.ts          # Redis setup
    │   └── stripe-client.ts         # Stripe setup
    ├── app/
    │   ├── api/
    │   │   └── stripe/
    │   │       └── route.ts         # New webhook handler
    │   └── (commerce)/
    │       └── thanks/
    │           └── subscription/
    │               └── page.tsx     # Success page
    └── inngest/
        └── functions/
            └── stripe/
                └── event-subscription-checkout-session-completed.ts  # Business logic handler
```

## Reference Implementation
- [Theo's Guide](https://github.com/t3dotgg/stripe-recommendations)
- [T3 Chat Example](https://t3.chat) 