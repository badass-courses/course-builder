# Page-Level Server Component Timing Instrumentation Report

**Worker:** CalmDawn / RedDusk
**Epic:** course-builder-turbo--6wppj-mkr0nkxbhx4
**Cell:** course-builder-turbo--6wppj-mkr0nkxmp68
**Date:** 2026-01-23

## Summary

Instrumented three page-level server components in the code-with-antonio app with request-scoped tracing using Axiom logger. All instrumentation logs include a unique `requestId` to trace the full request lifecycle.

## Instrumented Pages

### 1. Home Page (`apps/code-with-antonio/src/app/page.tsx`)

**Instrumentation Added:**
- Page render start/complete with requestId
- Individual fetch timing for:
  - `commerceEnabled()`
  - `getActiveCoupon()`
  - `getSaleBannerData()`
  - `getAllWorkshops()`
- Total duration tracking
- Data loading time aggregation

**Data Fetching Pattern:**
```
commerceEnabled() → getActiveCoupon() → getSaleBannerData() → getAllWorkshops()
```

**Optimization Opportunity:**
- **SEQUENTIAL_FETCHES**: All three data fetches (`getActiveCoupon`, `getSaleBannerData`, `getAllWorkshops`) run sequentially and could be parallelized with `Promise.all()`.
- Estimated speedup: Current waterfall time vs. max(individual times)

### 2. Workshops Page (`apps/code-with-antonio/src/app/(content)/workshops/page.tsx`)

**Instrumentation Added:**
- Page-level timing (main component)
- Component-level timing (WorkshopsList)
- Auth call tracking with callSite metadata
- Database query timing
- Duplicate call detection

**Data Fetching Pattern:**
```
Main Component:
  getServerAuthSession() → getPricingProps()

WorkshopsList Component:
  contentResourceProduct.findMany()
  getAllWorkshops() [call #1]
  getServerAuthSession() [DUPLICATE]
  getAllWorkshops() [call #2, conditional]
```

**Optimization Opportunities:**
1. **DUPLICATE_AUTH_CALL**: `getServerAuthSession()` is called in both the main Workshops component and the WorkshopsList child component. Pass ability as prop instead.

2. **DUPLICATE_WORKSHOPS_CALL**: `getAllWorkshops()` is called twice in WorkshopsList - once unconditionally and again conditionally if `canEdit` is true. The conditional call overwrites the first result, making the first call wasteful when user can edit.

**Recommended Fix:**
```typescript
// Check auth first, then fetch workshops once
const { ability } = await getServerAuthSession()
const canEdit = ability.can('create', 'Content')
const allWorkshops = canEdit
  ? await getAllWorkshops() // All workshops for editors
  : await getAllWorkshops() // Could have separate filtered query
```

### 3. Cohort Page (`apps/code-with-antonio/src/app/(content)/cohorts/[slug]/page.tsx`)

**Instrumentation Added:**
- Page render start/complete with slug metadata
- Individual fetch timing for 9+ async operations
- Loader vs. await distinction tracking
- Sequential fetch time aggregation
- Detailed waterfall tracking

**Data Fetching Pattern:**
```
getServerAuthSession()
  ↓
getCohort(slug)
  ↓
getCohortPricing() [create loader]
  ↓
await cohortPricingLoader
  ↓
getProductSlugToIdMap()
  ↓
getActiveCoupon()
  ↓
getSaleBannerData()
  ↓
compileMDX()
  ↓
getSaleBannerDataFromSearchParams()
```

**Optimization Opportunity:**
- **SEQUENTIAL_WATERFALL**: After `getCohort()` completes, many subsequent fetches are independent and could run in parallel:
  - `getProductSlugToIdMap()`
  - `getActiveCoupon()`
  - `getProviders()` (synchronous)

- After `getActiveCoupon()` completes, these could run in parallel:
  - `getSaleBannerData(defaultCoupon)`
  - `getSaleBannerDataFromSearchParams(searchParams)`

- `compileMDX()` depends on pricing data but could potentially overlap with other independent fetches.

**Recommended Fix:**
```typescript
// After cohort is loaded, parallelize independent fetches
const [cohortPricingData, productMap, defaultCoupon] = await Promise.all([
  cohortPricingLoader,
  getProductSlugToIdMap(),
  getActiveCoupon(searchParams),
])

// Then parallelize dependent fetches
const [saleData, saleBannerData, { content }] = await Promise.all([
  getSaleBannerData(defaultCoupon),
  getSaleBannerDataFromSearchParams(searchParams),
  compileMDX(cohort.fields.body || '', mdxComponents),
])
```

## Log Schema

All logs are sent to Axiom with the following structure:

**Page-level logs:**
```typescript
{
  _time: ISO8601,
  level: 'info' | 'debug',
  event: 'page.render.start' | 'page.render.complete' | 'page.fetch',
  page: string,
  path: string,
  requestId: UUID,
  duration?: number, // ms
  optimizationOpportunity?: string,
  note?: string,
  // ... other metadata
}
```

**Component-level logs:**
```typescript
{
  _time: ISO8601,
  level: 'debug',
  event: 'component.render.start' | 'component.render.complete' | 'component.fetch',
  component: string,
  requestId: UUID,
  fetchName?: string,
  callSite?: string,
  callNumber?: number,
  duration?: number,
  // ... other metadata
}
```

## Key Metrics Captured

For each page render:
1. **Total duration** - Full server component render time
2. **Data loading time** - Sum of all data fetch durations
3. **Sequential fetch time** - Time spent in waterfall fetches
4. **Individual fetch timing** - Each async call tracked separately
5. **Optimization flags** - Metadata indicating parallelization opportunities

## Axiom Query Examples

**Find slowest pages:**
```
['page.render.complete'] | summarize avg(duration), max(duration), count() by page | sort by max_duration desc
```

**Track duplicate calls:**
```
['component.fetch'] | where optimizationOpportunity == 'DUPLICATE_AUTH_CALL' | count by component
```

**Waterfall analysis:**
```
['page.render.complete'] | extend efficiency = (dataLoadingTime / duration) * 100 | project page, duration, efficiency | sort by efficiency asc
```

**Find pages with sequential fetches:**
```
['page.render.complete'] | where optimizationOpportunity =~ 'SEQUENTIAL' | project page, path, sequentialFetchTime, duration
```

## Next Steps

1. **Implement parallelization** in home page (easy win, ~3 independent fetches)
2. **Remove duplicate auth calls** in workshops page (pass props instead)
3. **Optimize workshops query logic** (conditional fetching is wasteful)
4. **Parallelize cohort page fetches** (largest impact, ~6-8 fetches can be parallelized)
5. **Monitor Axiom dashboards** to measure improvement after optimizations
6. **Extend instrumentation** to other heavy pages (module pages, lesson pages)

## Estimated Impact

- **Home page**: 30-50% reduction in total load time (3 parallel fetches vs sequential)
- **Workshops page**: ~50ms saved from duplicate auth call, ~100-200ms from duplicate workshops call
- **Cohort page**: 40-60% reduction in sequential fetch time (most impactful optimization)
