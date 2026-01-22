# Phase 4: Per-App Migration

**Status:** Not Started
**Depends On:** [Phase 3: Unified Widget](./phase-3-unified-widget.md)
**Priority:** P0-P4 (Incremental rollout)
**Duration:** 2-3 days per app tier

---

## Objective

Incrementally migrate all 10 Course Builder applications from their existing pricing implementations to the unified pricing widget architecture, starting with highest-ROI apps and ending with specialized use cases.

---

## Migration Order (By Priority)

| Priority | App(s) | Current LOC | Target LOC | Savings | Complexity | Duration |
|----------|--------|-------------|------------|---------|------------|----------|
| **P0** | ai-hero | ~797 | ~240 | ~557 (70%) | High | 3 days |
| **P1** | epicdev-ai + code-with-antonio | ~600 (shared) | ~100 each | ~600 total | High | 4 days (both) |
| **P2** | course-builder-web | ~200 | ~70 | ~130 (65%) | Medium | 2 days |
| **P2** | astro-party | ~250 | ~100 | ~150 (60%) | Medium | 2 days |
| **P3** | epic-web | ~150 | ~70 | ~80 (53%) | Low | 1 day |
| **P3** | craft-of-ui | ~150 | ~70 | ~80 (53%) | Low | 1 day |
| **P4** | go-local-first | ~120 | ~50 | ~70 (58%) | Low | 1 day |
| **P4** | dev-build + just-react | ~200 (both) | TBD | TBD | Medium | 2 days (both) |

**Total:** ~4600 LOC → ~1200 LOC (74% reduction across all 10 apps)

---

## Tier 1: Complex Multi-Container Apps (P0-P1)

### 1. ai-hero Migration (P0 - Highest ROI)

**Current State:**
- 3 containers: Workshop, Event, Cohort
- ~797 LOC total pricing logic
- 43.7% duplication rate
- **3 P0 bugs**: Cohort missing sold-out check, Event uses raw totalQuantity, commerce-next isSoldOut type bug

**Migration Steps:**

1. **Replace Workshop Container**
   ```typescript
   // Before: apps/ai-hero/src/app/(commerce)/events/[slug]/workshop-pricing-widget-container.tsx (~300 LOC)
   // After: Use WorkshopPricingWidget from commerce-next

   import { WorkshopPricingWidget } from '@coursebuilder/commerce-next/containers'

   export default async function WorkshopPage({ params }) {
     const workshop = await getWorkshop(params.slug)

     return <WorkshopPricingWidget product={workshop} />
   }
   ```

2. **Replace Event Container**
   ```typescript
   // Before: apps/ai-hero/src/app/(commerce)/events/[slug]/event-pricing-widget-container.tsx (~250 LOC)
   // After: Use EventPricingWidget from commerce-next

   import { EventPricingWidget } from '@coursebuilder/commerce-next/containers'

   export default async function EventPage({ params }) {
     const event = await getEvent(params.slug)

     return <EventPricingWidget product={event} />
   }
   ```

3. **Replace Cohort Container (with tier selection slot)**
   ```typescript
   // Before: apps/ai-hero/src/app/(commerce)/events/[slug]/cohort-pricing-widget-container.tsx (~247 LOC)
   // After: Use CohortPricingWidget with custom tier selector

   import { CohortPricingWidget } from '@coursebuilder/commerce-next/containers'
   import { CohortTierSelector } from '@/components/cohort-tier-selector'

   export default async function CohortPage({ params }) {
     const cohort = await getCohort(params.slug)

     return (
       <CohortPricingWidget
         product={cohort}
         slots={{
           pricingDetails: ({ product }) => (
             <CohortTierSelector tiers={product.fields.tiers} />
           )
         }}
       />
     )
   }
   ```

4. **Delete Old Containers** (~797 LOC removed)
   - `workshop-pricing-widget-container.tsx`
   - `event-pricing-widget-container.tsx`
   - `cohort-pricing-widget-container.tsx`

5. **Update Tests**
   - Replace container-specific tests with unified widget tests
   - Add integration tests for tier selector slot
   - Verify all 4 enrollment states (open, sold-out, not-open, closed)

**Expected Outcome:**
- **~797 LOC → ~240 LOC** (70% reduction)
- **3 P0 bugs → 0 bugs** (all fixed in shared package)
- **Polling added to Event and Cohort** (previously only Workshop had it)
- **Consistent enrollment logic** across all 3 product types

**Risk Mitigation:**
- Deploy with feature flag: `useUnifiedPricingWidget`
- Monitor checkout conversion rates for 48h
- Keep old containers in git history for instant rollback

---

### 2. epicdev-ai Migration (P1 - Server Orchestration)

**Current State:**
- 3 containers with complex server orchestration
- ~300-400 LOC (estimated)
- Nearly identical to code-with-antonio (~600 LOC duplication between apps)

**Migration Steps:**

1. **Extract Shared ServerPricingOrchestrator**
   ```typescript
   // In packages/commerce-next/src/containers/server-pricing-orchestrator.tsx

   export async function ServerPricingOrchestrator({
     product,
     purchaseToUpgrade,
     appConfig,
   }: ServerOrchestratorProps) {
     // Complex server logic: cohort/workshop/event routing
     // Shared between epicdev-ai and code-with-antonio

     const resolvedProduct = await resolveProductType(product)
     const pricingProps = await getPricingDataForOrchestrator(resolvedProduct)

     return (
       <UnifiedPricingWidget
         product={resolvedProduct}
         purchaseToUpgrade={purchaseToUpgrade}
         options={appConfig.pricingOptions}
         slots={appConfig.customSlots}
       />
     )
   }
   ```

2. **Replace epicdev-ai Containers**
   ```typescript
   // Before: 3 separate containers with complex server logic (~300-400 LOC)
   // After: Single orchestrator call

   import { ServerPricingOrchestrator } from '@coursebuilder/commerce-next/containers'

   export default async function PricingPage({ params }) {
     const product = await getProduct(params.slug)
     const purchaseToUpgrade = await getPurchaseToUpgrade()

     return (
       <ServerPricingOrchestrator
         product={product}
         purchaseToUpgrade={purchaseToUpgrade}
         appConfig={{
           appName: 'epicdev-ai',
           branding: epicdevBranding,
           pricingOptions: {
             autoApplyPPP: true,
           },
           customSlots: {
             header: EpicDevHeader, // App-specific branding
           }
         }}
       />
     )
   }
   ```

3. **Verify Orchestration Logic**
   - Test cohort routing
   - Test workshop routing
   - Test event routing
   - Verify server data fetching works correctly

**Expected Outcome:**
- **~300-400 LOC → ~100 LOC** (67% reduction)
- **Pattern established** for code-with-antonio to follow
- **Server orchestration shared** between apps (eliminates duplication)

---

### 3. code-with-antonio Migration (P1 - Server Orchestration)

**Current State:**
- 3 containers nearly identical to epicdev-ai
- ~300-400 LOC (estimated)
- **~600 LOC total duplication** between epicdev-ai and code-with-antonio

**Migration Steps:**

1. **Use Shared ServerPricingOrchestrator** (same as epicdev-ai)
   ```typescript
   import { ServerPricingOrchestrator } from '@coursebuilder/commerce-next/containers'

   export default async function PricingPage({ params }) {
     const product = await getProduct(params.slug)
     const purchaseToUpgrade = await getPurchaseToUpgrade()

     return (
       <ServerPricingOrchestrator
         product={product}
         purchaseToUpgrade={purchaseToUpgrade}
         appConfig={{
           appName: 'code-with-antonio',
           branding: antonioBranding, // Different branding from epicdev-ai
           pricingOptions: {
             autoApplyPPP: true,
           },
           customSlots: {
             header: AntonioHeader, // App-specific branding
           }
         }}
       />
     )
   }
   ```

2. **Delete Duplicated Orchestration Code** (~300-400 LOC removed)

3. **Cross-App Validation**
   - Compare epicdev-ai and code-with-antonio behavior
   - Ensure branding differences work correctly
   - Verify both apps use identical orchestration logic

**Expected Outcome:**
- **~300-400 LOC → ~100 LOC** (67% reduction)
- **~600 LOC duplication eliminated** (across both apps)
- **Both apps share orchestration logic** while maintaining unique branding

---

### 4. astro-party Migration (P1 - 2 Containers)

**Current State:**
- 2 containers: Workshop, Event
- ~250 LOC (estimated)
- Workshop has polling, Event likely doesn't

**Migration Steps:**

1. **Replace Workshop Container**
   ```typescript
   import { WorkshopPricingWidget } from '@coursebuilder/commerce-next/containers'

   export default async function WorkshopPage({ params }) {
     const workshop = await getWorkshop(params.slug)
     return <WorkshopPricingWidget product={workshop} />
   }
   ```

2. **Replace Event Container**
   ```typescript
   import { EventPricingWidget } from '@coursebuilder/commerce-next/containers'

   export default async function EventPage({ params }) {
     const event = await getEvent(params.slug)
     return <EventPricingWidget product={event} />
   }
   ```

3. **Verify Polling** for both containers (Event gains polling)

**Expected Outcome:**
- **~250 LOC → ~100 LOC** (60% reduction)
- **Polling added to Event** (previously only Workshop)
- **Consistent with ai-hero** Workshop/Event patterns

---

## Tier 2: Standard Implementations (P2-P3)

### 5. epic-web Migration (P2 - autoApplyPPP: false)

**Current State:**
- Standard pricing implementation
- **Unique config**: `autoApplyPPP: false` (only app with this setting)
- ~150 LOC (estimated)

**Migration Steps:**

1. **Replace Standard Container with Config Override**
   ```typescript
   import { UnifiedPricingWidget } from '@coursebuilder/commerce-next/containers'

   export default async function PricingPage({ params }) {
     const product = await getProduct(params.slug)

     return (
       <UnifiedPricingWidget
         product={product}
         options={{
           autoApplyPPP: false, // Epic-web specific config
         }}
       />
     )
   }
   ```

2. **Verify PPP Behavior Unchanged**
   - Test that PPP is NOT auto-applied
   - Verify pricing displays correctly without PPP
   - Confirm manual PPP application still works

**Expected Outcome:**
- **~150 LOC → ~70 LOC** (53% reduction)
- **Validates autoApplyPPP config** works correctly
- **Reference for other apps** with custom PPP behavior

**Risk Mitigation:**
- Critical to verify PPP behavior unchanged (affects pricing display)
- Monitor pricing accuracy in production

---

### 6. course-builder-web Migration (P2 - Local propsForCommerce)

**Current State:**
- Standard implementation
- **Uses LOCAL copy of propsForCommerce** (not @coursebuilder/core)
- Out-of-sync risk with package updates
- ~200 LOC (estimated)

**Migration Steps:**

1. **Phase 2a: Migrate propsForCommerce to Package** (Do this FIRST)
   ```typescript
   // Before: import { propsForCommerce } from './lib/props-for-commerce' (local copy)
   // After: import { propsForCommerce } from '@coursebuilder/core'

   // Delete local copy: apps/course-builder-web/src/lib/props-for-commerce.ts (~150 LOC)
   ```

2. **Verify No Breaking Changes**
   - Compare local copy vs package version (identify diffs)
   - Run comprehensive tests
   - Deploy to staging and test thoroughly

3. **Phase 2b: Migrate to UnifiedPricingWidget** (After package migration stable)
   ```typescript
   import { UnifiedPricingWidget } from '@coursebuilder/commerce-next/containers'

   export default async function PricingPage({ params }) {
     const product = await getProduct(params.slug)
     return <UnifiedPricingWidget product={product} />
   }
   ```

**Expected Outcome:**
- **~200 LOC → ~70 LOC** (65% reduction)
- **Eliminates sync risk** with core package
- **Consistent with other 9 apps** (all use package version)

**Risk Mitigation:**
- **Two-phase migration**: Package first, then widget (reduces risk)
- Compare local copy diffs before migration
- Comprehensive testing at each phase

---

### 7. craft-of-ui Migration (P3 - PriceCheckProvider)

**Current State:**
- Standard implementation
- Uses PriceCheckProvider (good composition pattern)
- ~150 LOC (estimated)

**Migration Steps:**

1. **Replace Container (Preserve PriceCheckProvider Wrapper)**
   ```typescript
   import { UnifiedPricingWidget } from '@coursebuilder/commerce-next/containers'
   import { PriceCheckProvider } from '@/providers/price-check-provider'

   export default async function PricingPage({ params }) {
     const product = await getProduct(params.slug)

     return (
       <PriceCheckProvider>
         <UnifiedPricingWidget product={product} />
       </PriceCheckProvider>
     )
   }
   ```

2. **Verify PriceCheckProvider Compatibility**
   - Test price check logic unchanged
   - Verify context providers work together

**Expected Outcome:**
- **~150 LOC → ~70 LOC** (53% reduction)
- **PriceCheckProvider compatibility validated**
- **Pattern for other apps** using provider wrappers

---

## Tier 3: Resource Landing & Single Container Apps (P4)

### 8. go-local-first Migration (P4 - Single Event Container)

**Current State:**
- 1 container: Event pricing
- ~120 LOC (estimated)
- Simplest migration (single container)

**Migration Steps:**

1. **Replace Event Container**
   ```typescript
   import { EventPricingWidget } from '@coursebuilder/commerce-next/containers'

   export default async function EventPage({ params }) {
     const event = await getEvent(params.slug)
     return <EventPricingWidget product={event} />
   }
   ```

**Expected Outcome:**
- **~120 LOC → ~50 LOC** (58% reduction)
- **Polling added to Event** (previously missing)

---

### 9. dev-build Migration (P4 - Resource Landing)

**Current State:**
- Resource landing pattern (unique use case)
- ~100 LOC (estimated)
- May not fit standard UnifiedPricingWidget model

**Migration Steps:**

1. **Evaluate UnifiedPricingWidget Fit**
   - Does resource landing pattern work with UnifiedPricingWidget?
   - **Option A**: Use UnifiedPricingWidget with heavy slot customization
   - **Option B**: Create separate `ResourceLandingPricingWidget` abstraction

2. **Option A: Use UnifiedPricingWidget**
   ```typescript
   import { UnifiedPricingWidget } from '@coursebuilder/commerce-next/containers'

   export default async function ResourceLandingPage({ params }) {
     const resource = await getResource(params.slug)

     return (
       <UnifiedPricingWidget
         product={resource}
         slots={{
           header: ResourceLandingHeader,
           checkoutForm: ResourceLandingCheckout,
           footer: ResourceLandingFooter,
         }}
       />
     )
   }
   ```

3. **Option B: Create ResourceLandingPricingWidget** (if Option A too complex)
   ```typescript
   // In packages/commerce-next/src/containers/resource-landing-pricing-widget.tsx

   export function ResourceLandingPricingWidget({ resource }: Props) {
     // Use shared hooks from Phase 2
     const enrollmentState = useEnrollmentState(resource)
     const availability = useSeatAvailability(resource)

     // Custom resource landing UI
     return (
       <div className="resource-landing-pricing">
         {/* Resource-specific layout */}
       </div>
     )
   }
   ```

4. **Document Decision** for future resource landing apps

**Expected Outcome:**
- **TBD** (depends on evaluation)
- **Pattern established** for resource landing pricing

---

### 10. just-react Migration (P4 - Resource Landing)

**Current State:**
- Resource landing pattern (similar to dev-build)
- ~100 LOC (estimated)

**Migration Steps:**

1. **Use Same Pattern as dev-build** (consistent approach)
   - If dev-build uses Option A, just-react uses Option A
   - If dev-build uses Option B, just-react uses Option B

2. **Cross-App Validation**
   - Verify both apps behave identically
   - Ensure resource landing pattern works in both

**Expected Outcome:**
- **TBD** (depends on dev-build evaluation)
- **Both apps share resource landing pattern**

---

## Per-App Migration Checklist (Reusable Template)

Use this checklist for each app migration:

### Pre-Migration
- [ ] Review app-specific pricing patterns and identify customizations needed
- [ ] Identify required slots/render props for unique UI elements
- [ ] Check if app has custom `autoApplyPPP`, timezone, or polling config
- [ ] Review existing tests (unit + integration)
- [ ] Document current behavior (screenshots, recordings, test cases)
- [ ] Ensure Phase 1-3 complete (bugs fixed, hooks extracted, unified widget ready)

### Implementation
- [ ] Replace container(s) with unified variant (WorkshopPricingWidget, EventPricingWidget, CohortPricingWidget, or UnifiedPricingWidget)
- [ ] Pass app-specific config via `options` prop (autoApplyPPP, timezone, etc)
- [ ] Implement app-specific slots (if needed) for custom UI elements
- [ ] Remove old container file(s) (record LOC savings)
- [ ] Update import statements across app
- [ ] Fix TypeScript errors

### Testing
- [ ] Update unit tests for new container usage
- [ ] Update integration tests (end-to-end checkout flow)
- [ ] Test all enrollment states: open, sold-out, not-open, closed
- [ ] Test product types: workshop, event, cohort (if applicable)
- [ ] Test coupon bypass flows (sold-out bypass, restricted products)
- [ ] Test polling behavior (if limited-seat product)
- [ ] Test waitlist submission (sold-out state)
- [ ] Verify visual parity with old implementation (screenshot comparison)
- [ ] Run full test suite locally (ensure no regressions)

### Staging Verification
- [ ] Deploy to staging environment
- [ ] Smoke test: load pricing page for each product type
- [ ] Test checkout flow end-to-end (use test Stripe account)
- [ ] Test sold-out state with real product data
- [ ] Test waitlist form submission
- [ ] Check browser console for errors
- [ ] Verify analytics events firing correctly
- [ ] Test on mobile devices (responsive design)
- [ ] Performance test: verify polling doesn't degrade performance

### Production Deployment
- [ ] Enable feature flag: `useUnifiedPricingWidget` (default: true for this app)
- [ ] Deploy to production with feature flag enabled
- [ ] Monitor Datadog dashboards (checkout conversion, error rate)
- [ ] Monitor Sentry for pricing-related errors
- [ ] Check Axiom logs for checkout attempts in sold-out state (should be zero)
- [ ] Monitor for 48 hours (critical window for catching issues)
- [ ] If errors spike (>5% increase), toggle feature flag to false (instant rollback)

### Post-Deployment
- [ ] Document app-specific patterns used (slots, config, customizations)
- [ ] Record metrics: LOC before/after, bugs fixed, new features gained
- [ ] Add to monorepo-wide migration tracker (9/10 complete, etc)
- [ ] Share learnings with team (what went well, what to improve for next app)
- [ ] Remove feature flag after 1 week of stability (full migration complete)

### Rollback Plan
- [ ] Keep old containers in Git history (easy revert)
- [ ] Feature flag allows instant rollback: `useUnifiedPricingWidget: false`
- [ ] Document rollback process for on-call engineers
- [ ] If rolled back, create incident post-mortem and fix before re-enabling

---

## Rollback Strategy

### Per-App Rollback (Isolated Issue)

**Trigger:**
- Error rate increases >5% for this app only
- Checkout conversion rate drops >10% for this app
- Customer reports spike (>10 tickets/day) for this app

**Process:**
1. **Instant Rollback**: Toggle feature flag for affected app
   ```typescript
   // In app's environment config
   NEXT_PUBLIC_USE_UNIFIED_PRICING_WIDGET=false
   ```

2. **Monitor Recovery**
   - Verify old container works correctly
   - Confirm error rate returns to normal
   - Check checkout conversion recovers

3. **Investigate Root Cause**
   - Analyze Sentry errors
   - Check Datadog dashboards
   - Review Axiom logs for patterns
   - Identify what broke (enrollment logic, polling, slots, etc)

4. **Fix in Unified Widget**
   - Create fix PR for commerce-next or app-specific slots
   - Test in staging thoroughly
   - Validate fix resolves issue

5. **Re-enable with Monitoring**
   - Re-deploy with fix
   - Enable feature flag again
   - Monitor closely for 48h

---

### Monorepo-Wide Rollback (Commerce-Next Bug)

**Trigger:**
- Error rate increases across **multiple apps** (3+)
- Commerce-next package bug discovered (affects all 10 apps)
- Sold-out state logic broken across monorepo

**Process:**
1. **Emergency Rollback**: Revert commerce-next package changes
   ```bash
   git revert <commerce-next-commit-hash>
   pnpm build --filter="@coursebuilder/commerce-next"
   ```

2. **Redeploy All Affected Apps**
   - All 10 apps fall back to old commerce-next automatically (package version update)
   - No per-app changes needed (benefit of shared package)

3. **Post-Mortem**
   - Identify root cause in commerce-next
   - Add regression tests to prevent recurrence
   - Document learnings for future monorepo-wide changes

4. **Fix and Re-Deploy**
   - Fix commerce-next bug
   - Test in all 10 app contexts (staging environments)
   - Phased rollout: 1 app → 3 apps → all 10 apps

---

## Success Criteria (Monorepo-Wide)

### Quantitative Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Total LOC (pricing)** | ~4600 | ~1200 | 🔄 |
| **Apps migrated** | 0 | 10 | 🔄 |
| **Apps with P0 bugs** | 10 (commerce-next) | 0 | 🔄 |
| **Apps with polling** | 2 | 10 | 🔄 |
| **Quantity calc duplication** | 6 implementations | 1 | 🔄 |
| **Test coverage (pricing)** | ~60% avg | 90%+ | 🔄 |
| **Sentry errors (pricing)** | ~50/week | <15/week | 🔄 |

### Per-App Success Criteria

Each app migration is successful when:
- [ ] **Zero production errors** for 48h after deployment
- [ ] **Checkout conversion rate unchanged** (within ±2% of baseline)
- [ ] **Visual parity confirmed** (screenshot comparison passes)
- [ ] **All tests passing** (unit + integration)
- [ ] **App-specific features working** (tier selection, PPP config, etc)
- [ ] **LOC reduction achieved** (within 10% of target)
- [ ] **Polling working** (for limited-seat products)
- [ ] **Waitlist working** (sold-out products show waitlist form)
- [ ] **Analytics events firing** (checkout attempts, waitlist submissions)

### Monorepo-Wide Success Criteria

Phase 4 is complete when:
- [ ] **All 10 apps migrated** to UnifiedPricingWidget or product-specific wrappers
- [ ] **Zero P0 bugs** across all apps (commerce-next fix deployed everywhere)
- [ ] **~3400 LOC eliminated** (74% reduction target achieved)
- [ ] **Consistent UX** across all 10 apps (enrollment states, sold-out messaging, waitlist)
- [ ] **All old containers deleted** (monorepo-wide cleanup complete)
- [ ] **Feature flags removed** (after 1 week stability per app)
- [ ] **Documentation updated** (monorepo-wide pricing guide written)
- [ ] **Migration retrospective complete** (learnings captured)

---

## Navigation

- [← Phase 3: Unified Widget](./phase-3-unified-widget.md)
- [Back to Index](./00-index.md)
