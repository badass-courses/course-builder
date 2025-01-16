# Subscription Implementation Plan

## Current State
- Next.js app with Drizzle schema
- Basic org/tenant boundaries in place
- Two-layer subscription model:
  - `MerchantSubscription`: Stripe data
  - `Subscription`: Platform data
- Strong subscription type safety:
  - `SubscriptionInfo` schema
  - Proper metadata validation
  - Permission determination
- Checkout flow safeguards:
  - Pre-checkout login verification
  - Subscription status checks
  - One subscription per customer limit
  - Customer existence verification
- Clean pricing component architecture
- Webhook handlers stubbed out

## Core Problems to Solve
1. Race Conditions
   - Webhook events arrive out of order
   - Success page vs webhook timing
   - Multiple checkout sessions
   - Subscription state inconsistencies

2. State Management
   - No single source of truth
   - Complex status transitions
   - Subscription metadata sync
   - Customer <-> Org mapping

3. Error Handling
   - Failed payments
   - Webhook failures
   - Checkout errors
   - State recovery

## Implementation Strategy

### Phase 1: Single Source of Truth
1. Redis Integration
   - [x] Set up Upstash Redis
   - [x] Add subscription-specific keys:
     - Created `StripeCacheClient` in core package
     - Type-safe Redis operations
     - 24h TTL on subscription state
     - Sync attempt tracking
   - [ ] Add monitoring wrapper
   - [ ] Add health checks

2. Core Sync Function
   - [ ] Implement `syncStripeDataToKV`
   - [ ] Reuse existing `SubscriptionInfo` type
   - [ ] Add proper error boundaries
   - [ ] Handle all subscription states
   - [ ] Add structured logging:
     ```ts
     type SyncLog = {
       customerId: string
       operation: 'sync' | 'retry' | 'recovery'
       duration: number
       status: 'success' | 'failure'
       errorCode?: string
       retryCount: number
       source: 'webhook' | 'success-page' | 'manual'
     }
     ```
   - [ ] Add performance metrics
   - [ ] Set up error alerting

3. Webhook Handler
   - [ ] Update to use sync function
   - [ ] Handle core events only:
     ```ts
     const CORE_EVENTS = [
       'checkout.session.completed',
       'customer.subscription.created',
       'customer.subscription.updated',
       'customer.subscription.deleted',
       'invoice.paid',
       'invoice.payment_failed'
     ]
     ```
   - [ ] Add retry mechanism
   - [ ] Leverage existing metadata parsing
   - [ ] Track webhook processing times
   - [ ] Monitor event ordering
   - [ ] Alert on critical failures

4. Observability Setup
   - [ ] Set up Axiom structured logging
   - [ ] Configure error tracking in Sentry
   - [ ] Add key metrics to Grafana:
     - Sync success/failure rates
     - Cache performance
     - Webhook processing times
     - State transition latency
   - [ ] Create operational dashboards:
     - Subscription health overview
     - Webhook processing status
     - Cache performance metrics
     - Error rate tracking
   - [ ] Configure alerts:
     - Sync failures > 3 attempts
     - Webhook processing delays
     - Cache miss spikes
     - Critical path errors

### Phase 2: Checkout Flow
1. Customer Management
   - [x] Pre-checkout verification
   - [x] Login requirement
   - [x] Subscription status check
   - [ ] Store org mapping in Redis
   - [ ] Handle existing customers

2. Success Page
   - [ ] Add eager sync
   - [ ] Proper error handling
   - [ ] Loading states
   - [ ] Reuse subscription info parsing

3. Error Prevention
   - [x] Enable one subscription limit
   - [x] Pre-checkout validation
   - [ ] Add idempotency keys
   - [ ] Implement timeouts

### Phase 3: Status Management
1. Core States
   - [ ] Use existing `SubscriptionInfo` type
   - [ ] Add status transitions
   - [ ] Handle edge cases
   - [ ] Sync with merchant subscription

2. Recovery Flows
   - [ ] Past due handling
   - [ ] Failed payment recovery
   - [ ] Cancellation flows
   - [ ] Status reconciliation

3. Portal Integration
   - [ ] Configure allowed actions
   - [ ] Handle portal events
   - [ ] Add return URLs
   - [ ] Status sync on return

## Testing Strategy
- Unit tests for sync function
- Webhook event replay
- Stripe test mode coverage
- State transition tests
- Metadata validation tests
- Permission checks

## Monitoring & Observability

### Real-time Metrics
- Webhook processing:
  - Success/failure rates
  - Processing latency
  - Event ordering issues
  - Retry counts
- Sync operations:
  - Success rates by source
  - Duration percentiles
  - Error distribution
  - Recovery attempts
- Cache performance:
  - Hit/miss rates
  - Key distribution
  - TTL violations
  - Stale data incidents

### Health Checks
- Subscription state consistency
- Webhook queue depth
- Redis connection status
- Stripe API health
- Critical path latency

### Alerting Rules
- P0 (Immediate):
  - Webhook processing failures
  - Sync failures > 3 attempts
  - Cache connection issues
  - Critical path errors
- P1 (15min):
  - High retry rates
  - Cache miss spikes
  - Slow sync operations
  - Webhook delays
- P2 (1hr):
  - Unusual event patterns
  - Cache key distribution
  - Performance degradation
  - Error rate trends

### Debugging Tools
- Subscription state explorer
- Webhook event replay
- Sync operation logs
- Cache inspection tools
- State transition viewer

## Future Considerations
These are explicitly NOT part of the current subscription implementation:
- Usage tracking
- Custom portal
- Advanced analytics
- Multiple subscriptions

---

## Future Steps
Once subscriptions are rock solid, we'll tackle:

### Phase 4: Organization Enhancement
- Deep org settings & configuration
- Advanced member management
- Team collaboration features
- Proper org switching UX

### Phase 5: Access Control System
- Fine-grained permissions
- Audit logging
- Resource-level access
- Team-based permissions

### Phase 6: Platform Hardening
- Query optimization
- Schema documentation
- Test coverage expansion
- Monitoring improvements

## References
- [Stripe Implementation Guide](https://github.com/t3dotgg/stripe-recommendations)
- [Multi-tenant Guide](https://www.flightcontrol.dev/blog/ultimate-guide-to-multi-tenant-saas-data-modeling) 