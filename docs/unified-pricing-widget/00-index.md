# Unified Pricing Widget Architecture

**Status:** Planning
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

The Course Builder monorepo contains **10 applications** with pricing functionality, each implementing pricing widgets independently. This has led to critical bugs, massive duplication (~4600 LOC), and inconsistent user experiences across all apps.

This documentation tracks the unified pricing widget architecture initiative - consolidating all pricing logic into a shared, composable abstraction in the `commerce-next` package.

### Problem Statement

- **Critical P0 Bugs**: `isSoldOut` check missing `'cohort'` type (affects ALL 10 apps), ai-hero cohort missing sold-out check entirely, event using raw vs calculated quantity
- **Massive Duplication**: ~4600 LOC across 10 apps, 43.7% duplication rate within ai-hero alone
- **Inconsistent Patterns**: 6 different implementations of quantity calculation, inconsistent polling (only 2 of 10 apps), stale data risks
- **No Mid-Level Abstractions**: Apps must compose from raw `Pricing.*` components with no shared containers or hooks

### Solution Approach

Create a **unified pricing widget abstraction** in `commerce-next` that provides:
- **Shared hooks**: `useEnrollmentState`, `useSeatAvailability`, `useWaitlist`
- **Unified container**: `UnifiedPricingWidget` with composition slots
- **Bug fixes**: All P0 bugs resolved in shared package (benefits all 10 apps immediately)
- **Monorepo-wide conventions**: Standardized patterns for pricing across all apps

---

## Quick Stats

| Metric | Current | Target | Impact |
|--------|---------|--------|--------|
| **Total LOC** | ~4600 | ~1200 | **74% reduction** |
| **Apps with P0 bugs** | 10 | 0 | **100% resolution** |
| **Apps with polling** | 2 | 10 | **400% increase** |
| **Quantity calc implementations** | 6 | 1 | **Unified** |
| **Apps using local copies** | 1 | 0 | **Eliminated** |

---

## Phase Overview

This initiative is structured into 4 sequential phases, each building on the previous:

| Phase | Focus | Key Deliverables | Status |
|-------|-------|-----------------|--------|
| **Phase 1** | P0 Bug Fixes | Fix 3 critical bugs in commerce-next and ai-hero | 🔴 Not Started |
| **Phase 2** | Shared Hooks | Extract `useEnrollmentState`, `useSeatAvailability`, `useWaitlist` | 🔴 Not Started |
| **Phase 3** | Unified Container | Build `UnifiedPricingWidget` with slots pattern | 🔴 Not Started |
| **Phase 4** | App Migrations | Migrate all 10 apps incrementally (ai-hero → epicdev-ai → others) | 🔴 Not Started |

**Timeline:** ~15-20 days total (1-2 days Phase 1, 3-4 days Phase 2, 5-7 days Phase 3, 2-3 days per app Phase 4)

---

## Phase Documentation

### Phase 1: P0 Bug Fixes (1-2 days)
**[→ Read Phase 1 Details](./phase-1-p0-bug-fixes.md)**

**Priority:** Immediate production fixes affecting all 10 apps

**Key Tasks:**
- Fix commerce-next `isSoldOut` type check (`'live'` → `'live' || 'cohort'`)
- Fix ai-hero cohort missing sold-out state in `getEnrollmentState()`
- Fix ai-hero event using raw `totalQuantity` instead of calculated `quantityAvailable`

**Impact:** All 10 apps benefit immediately from commerce-next fix

---

### Phase 2: Shared Hooks (3-4 days)
**[→ Read Phase 2 Details](./phase-2-shared-hooks.md)**

**Priority:** Foundation for unified widget (benefits all 10 apps)

**Key Deliverables:**
- `useEnrollmentState` - Standardized 4-state enrollment logic
- `useSeatAvailability` - Real-time seat polling with optimistic updates
- `useWaitlist` - ConvertKit integration with analytics

**Impact:** 8 apps gain polling, all apps get standardized enrollment logic

---

### Phase 3: Unified Container (5-7 days)
**[→ Read Phase 3 Details](./phase-3-unified-widget.md)**

**Priority:** Single implementation point for all 10 apps

**Key Deliverables:**
- `UnifiedPricingWidget` component with XState machine
- Default slot implementations (Header, Footer, CheckoutForm, WaitlistForm, PurchasedBanner)
- Product-specific wrappers (`WorkshopPricingWidget`, `EventPricingWidget`, `CohortPricingWidget`)
- `ServerPricingOrchestrator` for epicdev-ai/code-with-antonio

**Impact:** Single source of truth, ~70% LOC reduction across all apps

---

### Phase 4: App Migrations (2-3 days per app)
**[→ Read Phase 4 Details](./phase-4-app-migrations.md)**

**Priority:** Incremental rollout, highest ROI first

**Migration Order:**
1. **ai-hero** (P0) - 3 containers, ~797 LOC → ~240 LOC (70% reduction)
2. **epicdev-ai + code-with-antonio** (P1) - Eliminate ~600 LOC cross-app duplication
3. **course-builder-web** (P2) - Migrate from local propsForCommerce copy
4. **astro-party** (P2) - 2 containers, add polling to Event
5. **epic-web** (P3) - Validate `autoApplyPPP: false` works
6. **craft-of-ui** (P3) - Ensure PriceCheckProvider compatibility
7. **go-local-first** (P4) - Single Event container
8. **dev-build + just-react** (P4) - Evaluate resource landing pattern fit

**Rollback Plan:** Feature flags per app, instant rollback on error spike

---

## Current State: App Status

| App | Containers | LOC | autoApplyPPP | Polling | Sold-Out Bugs |
|-----|-----------|-----|--------------|---------|---------------|
| **ai-hero** | 3 (W/E/C) | ~797 | true | Workshop only | Cohort missing, commerce-next bug |
| **epicdev-ai** | 3 (complex) | ~300 | true | Unknown | commerce-next bug |
| **code-with-antonio** | 3 (duplicate) | ~300 | true | Unknown | commerce-next bug |
| **astro-party** | 2 (W/E) | ~250 | Unknown | Workshop only | commerce-next bug |
| **epic-web** | 1 (standard) | ~150 | **false** | No | commerce-next bug |
| **course-builder-web** | 1 (local copy) | ~200 | Unknown | No | commerce-next bug |
| **craft-of-ui** | 1 (standard) | ~150 | Unknown | No | commerce-next bug |
| **go-local-first** | 1 (Event) | ~120 | Unknown | No | commerce-next bug |
| **dev-build** | 1 (resource) | ~100 | true | No | commerce-next bug |
| **just-react** | 1 (resource) | ~100 | true | No | commerce-next bug |

**Legend:**
- **W/E/C** = Workshop/Event/Cohort containers
- **Local copy** = course-builder-web uses local propsForCommerce instead of @coursebuilder/core
- **commerce-next bug** = `isSoldOut` check only evaluates `'live'` type, missing `'cohort'`

---

## Quick Reference

### Full PRD
**[→ Read Full PRD](../PRD-unified-pricing-widget.md)**

Complete product requirements document with:
- Detailed current state analysis (per-app breakdown)
- Architecture proposals (hooks, container, slots pattern)
- API design and TypeScript interfaces
- Success metrics and monitoring
- Migration checklists

### Key Files in commerce-next

**Current State:**
- `packages/commerce-next/src/pricing/pricing-context.tsx` - Contains P0 `isSoldOut` bug
- `packages/commerce-next/src/pricing/*` - Existing `Pricing.*` components

**Planned Additions:**
- `packages/commerce-next/src/hooks/use-enrollment-state.ts`
- `packages/commerce-next/src/hooks/use-seat-availability.ts`
- `packages/commerce-next/src/hooks/use-waitlist.ts`
- `packages/commerce-next/src/containers/unified-pricing-widget.tsx`
- `packages/commerce-next/src/containers/server-pricing-orchestrator.tsx`

---

## Success Metrics

**Monorepo-Wide Impact:**
- ✅ **Zero P0 bugs** related to sold-out state (fixed in shared package)
- ✅ **~3400 LOC reduction** (74% across all 10 apps)
- ✅ **Consistent UX** for enrollment states across all products
- ✅ **Faster feature development** (implement once, deploy to 10 apps)
- ✅ **Real-time seat updates** (no stale data, race conditions eliminated)

**Operational:**
- 70% reduction in Sentry issues for pricing
- <1% error rate across all 10 apps
- Feature flags allow instant per-app rollback
- Monitoring dashboards unified across apps

---

## Next Steps

1. **Start Phase 1**: Fix P0 bugs in commerce-next and ai-hero
2. **Validate fixes**: Test all 10 apps after commerce-next fix deployed
3. **Extract hooks**: Build foundation in Phase 2 (validate in 2+ apps before Phase 3)
4. **Build container**: Create UnifiedPricingWidget in Phase 3
5. **Incremental migration**: Roll out to apps one-by-one in Phase 4 (highest ROI first)

---

**For detailed implementation guides, see individual phase documents linked above.**
