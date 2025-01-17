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

## Next Steps

### 1. Success Page Implementation [NEXT]
- [ ] Add `/checkout/success` route (`apps/ai-hero/src/app/checkout/success/page.tsx`)
- [ ] Get customer ID from session
- [ ] Eager sync before redirect
- [ ] Handle error states
- [ ] Add loading state

### 2. Cleanup [PENDING]
- [ ] Delete old Inngest webhook handler (`apps/ai-hero/src/inngest/functions/stripe/event-subscription-checkout-session-completed.ts`)
- [ ] Remove unused subscription types
- [ ] Clean up old event handlers
- [ ] Update tests

### 3. Customer Management [PENDING]
- [ ] Ensure customer creation before checkout
- [ ] Store user <-> customer mapping
- [ ] Handle existing customers
- [ ] Add metadata validation

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
    │   └── checkout/
    │       └── success/
    │           └── page.tsx         # Success page (to implement)
    └── inngest/
        └── functions/
            └── stripe/
                └── event-subscription-checkout-session-completed.ts  # Old handler (to delete)
```

## Reference Implementation
- [Theo's Guide](https://github.com/t3dotgg/stripe-recommendations)
- [T3 Chat Example](https://t3.chat) 