# Stripe Implementation Plan (Theo's Approach)

## Core Philosophy
Single source of truth using Redis + single sync function to avoid split brain issues.

## Current Implementation Status

### Core Components
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
   - [x] Event processing (`packages/core/src/lib/pricing/process-stripe-webhook.ts`)
   - [x] Signature verification
   - [x] Core events only
   - [x] Customer ID extraction
   - [x] Sync trigger

4. **Checkout Flow**
   - [x] Pre-checkout customer creation (`apps/ai-hero/src/coursebuilder/stripe-provider.ts`)
   - [x] Customer ID storage in KV
   - [x] Success page handling (`apps/ai-hero/src/app/checkout/success/page.tsx`)
   - [x] Eager sync on success

## Next Steps

### 1. Success Page Implementation
- [ ] Add `/checkout/success` route
- [ ] Implement eager sync
- [ ] Add proper redirects
- [ ] Handle error states

### 2. Webhook Processing
- [ ] Update allowed events list
- [ ] Add `waitUntil` for background processing
- [ ] Improve error logging
- [ ] Add signature verification

### 3. Customer Management
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
│   │       └── process-stripe-webhook.ts  # Webhook handler
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
    │   └── checkout/
    │       └── success/
    │           └── page.tsx         # Success page
    └── coursebuilder/
        └── stripe-provider.ts       # Checkout flow
```

## Reference Implementation
- [Theo's Guide](https://github.com/t3dotgg/stripe-recommendations)
- [T3 Chat Example](https://t3.chat) 