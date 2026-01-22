# Performance Optimization PRD: Code with Antonio Workshop Platform

**Status**: Draft
**Author**: Performance Engineering Team
**Last Updated**: 2026-01-22
**Target Release**: Q1 2026

---

## Executive Summary

### Problem Statement

The Code with Antonio (CWA) workshop platform exhibits significant performance degradation on critical user paths, with server-side rendering times exceeding 800-1000ms on workshop pages and 600-800ms on lesson pages. Database query counts range from 18-25 per page load, with numerous N+1 patterns, missing indexes, and cache misses creating compounding latency issues.

User-facing metrics fall short of industry standards:
- **TTFB (Time to First Byte)**: 800-1000ms (target: <300ms)
- **LCP (Largest Contentful Paint)**: 1.5-2.5s (target: <1.2s)
- **Database Queries**: 18-25 per page (target: 5-8)

### Solution Overview

This PRD outlines a phased optimization strategy addressing four root cause categories:

1. **Database Layer** - Index optimization, query consolidation, connection pooling
2. **Caching Strategy** - Multi-layer caching with proper key isolation and TTL tuning
3. **Data Fetching Patterns** - Waterfall elimination, parallel loading, request deduplication
4. **Client-Side Optimization** - Bundle reduction, hydration optimization, code splitting

### Expected Outcomes

**Phase 1 (Quick Wins - 2 weeks)**
- 40-50% TTFB reduction (target: 400-600ms)
- 50% reduction in database queries (target: 10-12 per page)
- ROI: High impact, low risk, minimal code changes

**Phase 2 (Structural Improvements - 4 weeks)**
- Additional 30-40% TTFB reduction (target: 200-400ms)
- 60% reduction in database queries (target: 5-8 per page)
- ROI: High impact, moderate complexity, architectural changes

**Phase 3 (Advanced Optimizations - 4 weeks)**
- LCP target: <1.2s (from 1.5-2.5s)
- Client bundle reduction: 20-30%
- ROI: Medium impact, high complexity, requires testing infrastructure

**Total Timeline**: 10 weeks
**Engineering Resources**: 2 senior engineers + 1 database specialist

---

## Current State Analysis

### Workshop Page Data Flow

```
Request Received
  ↓ 0ms
├─ Ability Check (getAbilityForResource) [3x calls - 300ms total]
│   ├─ getCurrentAbilityRules [9 queries: users, accounts, purchases, etc.]
│   ├─ getWorkshopProduct [UNION query - 2 branches executed]
│   └─ Cache Miss: ability key collides with workshop key
│
├─ getActiveCoupon [fetches ALL products - 200ms]
│   └─ Called 2x: page + WorkshopPricing component
│
├─ Promise.all [400ms total]
│   ├─ getWorkshopProduct [already fetched above - duplicate]
│   ├─ getMinimalWorkshopProduct [2 queries]
│   ├─ compileMDX [200ms - UNCACHED]
│   └─ getWorkshopNavigation [cached]
│
├─ getSaleBannerData [100ms - sequential after Promise.all]
│   └─ Could be parallelized
│
└─ TOTAL SSR: 800-1000ms
```

**Database Queries**: 18-22 per authenticated user workshop page load

**Critical Path Bottlenecks**:
1. Ability check waterfall blocks everything (300ms)
2. Duplicate product fetches (3x per page)
3. MDX compilation uncached (200ms per request)
4. Active coupon fetches all products (200ms per request)

### Lesson Page Data Flow

```
Request Received
  ↓ 0ms
├─ Ability Check [100-300ms]
│   ├─ getCurrentAbilityRules [9 queries]
│   ├─ Check: organizationMemberships
│   ├─ Check: entitlements
│   ├─ Check: purchases
│   └─ Check: teamSubscriptions
│
├─ Video Data Fetch [waits for ability check - sequential]
│   ├─ getMuxAsset [2 queries]
│   └─ getVideoResource [1 query]
│
├─ MDX Compilation [200ms - UNCACHED]
│   └─ Blocks content rendering
│
├─ Module Progress [5 queries]
│   └─ Cached at request level only
│
└─ TOTAL SSR: 600-800ms
```

**Database Queries**: 20-25 per authenticated user lesson page load

**Critical Path Bottlenecks**:
1. Ability check blocks video + content fetch (100-300ms)
2. Duplicate ability checks (page + WorkshopPricing component)
3. MDX compilation uncached (200ms)
4. No parallelization opportunities exploited

### Database Query Patterns

**Missing Indexes**:
```sql
-- High-impact missing indexes
1. contentResource.fields->>'$.slug' (full table scan on every lookup)
2. contentResource.type + fields->>'$.state' (workshop state filters)
3. contentResourceResource composite indexes (join optimization)
4. purchases.userId + status (authorization queries)
5. organizationMemberships.userId + role (team access checks)
```

**N+1 Patterns**:
- `getCurrentAbilityRules`: 9 queries per call (users → accounts → purchases → subscriptions → organization_memberships → coupon_purchases → organization_invites → emails → organization_roles)
- `getWorkshopProduct`: Executes UNION query with both branches even when direct product exists
- `getModuleProgress`: 1 query per lesson in module (up to 20 queries for large modules)

**Query Complexity**:
- Average query time: 15-30ms
- Slowest queries: 50-100ms (ability rules, workshop product UNION)
- Connection overhead: 5-10ms per query
- Total overhead from N+1: 200-400ms per page load

### Caching Analysis

**Current Coverage**:
```typescript
✅ CACHED (unstable_cache, 3600s)
- getWorkshopNavigation
- getWorkshopMetadata
- getWorkshopProduct (KEY COLLISION ISSUE)

✅ CACHED (React cache, request-level only)
- getAbilityForResource
- getModuleProgress

❌ UNCACHED (50-200ms overhead EVERY request)
- compileMDX (200ms per content page)
- getActiveCoupon (200ms per pricing check)
- getCommerceProps (3-5 DB queries per call)
- getPricingProps (2-3 DB queries per call)
- getSaleBannerData (2 queries per call)
```

**Cache Key Collisions**:
```typescript
// ALL FUNCTIONS SHARE THE SAME KEY - only one gets cached!
unstable_cache(getWorkshopProduct, ['workshop'], { ... })
unstable_cache(getWorkshopNavigation, ['workshop'], { ... })
unstable_cache(getWorkshopMetadata, ['workshop'], { ... })

// RESULT: Only the first function called gets cached
// All others execute fresh queries on every request
```

**Impact**:
- Cache hit rate: <30% (should be >80%)
- Wasted DB queries: 10-15 per page load
- Latency overhead: 300-500ms per cache miss

### Client-Side Analysis

**Component Hydration**:
- 197 client components (28.9% of codebase)
- 16 async data components using React.use()
- Estimated hydration payload: 20-48KB per lesson page

**High-Impact Client Components**:
```typescript
1. ModuleProgressProvider
   - Full progress state in initial payload (5-10KB)
   - Rendered on every lesson page
   - Could use server-only data provider

2. ContentNavigationProvider
   - Entire navigation tree in payload (10-20KB)
   - Same data structure sent to every page
   - Could use static generation + client-side fetch

3. WorkshopPricing (2x renders)
   - Rendered in sidebar AND body
   - Full pricing data duplicated
   - Each render triggers separate data fetches

4. VideoPlayer
   - Large dependencies: mux-player-react, react-use
   - Loaded on every lesson page
   - Could be code-split with dynamic import
```

**Missing Suspense Boundaries**:
- Pricing widgets block layout shift
- Video components delay interactive state
- Progress indicators cause layout thrashing

**Bundle Analysis**:
- Main bundle: 180KB (gzipped)
- First-party code: 45KB
- Third-party dependencies: 135KB
- Opportunities: Code splitting, lazy loading, tree shaking

---

## Root Causes

### Category 1: Database Layer (40% of impact)

**RC-DB-1: Missing Functional Indexes on JSON Fields**
- **Severity**: P0 (Critical)
- **Impact**: Full table scans on contentResource lookups (50-100ms per query)
- **Affected Queries**: `getWorkshopProduct`, `getMinimalWorkshopProduct`, `getLesson`
- **Estimated Fix Time**: 2 hours (index creation + testing)

**RC-DB-2: N+1 in Authorization Layer**
- **Severity**: P0 (Critical)
- **Impact**: 9 queries per ability check, blocks critical path (100-300ms)
- **Affected Functions**: `getCurrentAbilityRules`, `getAbilityForResource`
- **Estimated Fix Time**: 8 hours (query consolidation + testing)

**RC-DB-3: UNION Query Anti-Pattern**
- **Severity**: P1 (High)
- **Impact**: Both UNION branches execute even when direct product exists (30-50ms waste)
- **Affected Functions**: `getWorkshopProduct`
- **Estimated Fix Time**: 4 hours (conditional query logic)

**RC-DB-4: Connection Pool Exhaustion**
- **Severity**: P1 (High)
- **Impact**: Connection overhead on high query volume (5-10ms per query)
- **Metrics**: 18-25 queries per page × 5ms = 90-125ms overhead
- **Estimated Fix Time**: 4 hours (connection pooling configuration)

### Category 2: Caching Strategy (35% of impact)

**RC-CACHE-1: Cache Key Collisions**
- **Severity**: P0 (Critical)
- **Impact**: Only one function per shared key gets cached (<30% hit rate)
- **Affected Functions**: All `unstable_cache` calls with `['workshop']` key
- **Estimated Fix Time**: 2 hours (key isolation)

**RC-CACHE-2: MDX Compilation Uncached**
- **Severity**: P0 (Critical)
- **Impact**: 50-200ms overhead on EVERY content page
- **Affected Functions**: `compileMDX`
- **Estimated Fix Time**: 4 hours (cache layer + invalidation strategy)

**RC-CACHE-3: Commerce/Pricing Data Uncached**
- **Severity**: P1 (High)
- **Impact**: 3-5 DB queries per pricing check (100-150ms)
- **Affected Functions**: `getActiveCoupon`, `getCommerceProps`, `getPricingProps`
- **Estimated Fix Time**: 6 hours (cache implementation + TTL tuning)

**RC-CACHE-4: Request-Level Cache Insufficient**
- **Severity**: P2 (Medium)
- **Impact**: Ability checks and progress queries repeat on subsequent page loads
- **Affected Functions**: All React cache implementations
- **Estimated Fix Time**: 8 hours (distributed cache migration)

### Category 3: Data Fetching Patterns (20% of impact)

**RC-FETCH-1: Ability Check Waterfall**
- **Severity**: P0 (Critical)
- **Impact**: Blocks video + MDX rendering (100-300ms)
- **Affected Pages**: All authenticated lesson pages
- **Estimated Fix Time**: 6 hours (parallel fetch refactor)

**RC-FETCH-2: Duplicate Product Fetches**
- **Severity**: P1 (High)
- **Impact**: Same product fetched 3x per page (workshop, minimal, pricing)
- **Affected Components**: Page + PurchaseDataProvider + WorkshopPricing
- **Estimated Fix Time**: 4 hours (data provider consolidation)

**RC-FETCH-3: Sequential vs Parallel Fetching**
- **Severity**: P1 (High)
- **Impact**: `getSaleBannerData` waits for `Promise.all` to complete (~100ms waste)
- **Affected Pages**: All workshop pages
- **Estimated Fix Time**: 2 hours (Promise.all expansion)

**RC-FETCH-4: Duplicate Coupon Fetches**
- **Severity**: P2 (Medium)
- **Impact**: `getActiveCoupon` called 2x per page (200ms × 2)
- **Affected Components**: Page + WorkshopPricing
- **Estimated Fix Time**: 2 hours (context provider pattern)

### Category 4: Client-Side Optimization (5% of impact)

**RC-CLIENT-1: Large Hydration Payloads**
- **Severity**: P2 (Medium)
- **Impact**: 20-48KB initial payload, delays TTI
- **Affected Components**: ModuleProgressProvider, ContentNavigationProvider
- **Estimated Fix Time**: 8 hours (server-only data provider pattern)

**RC-CLIENT-2: Missing Suspense Boundaries**
- **Severity**: P2 (Medium)
- **Impact**: Layout shift, delayed interactivity
- **Affected Components**: WorkshopPricing, VideoPlayer
- **Estimated Fix Time**: 4 hours (Suspense wrapper implementation)

**RC-CLIENT-3: Duplicate Component Renders**
- **Severity**: P2 (Medium)
- **Impact**: WorkshopPricing rendered 2x with full data refetch
- **Affected Components**: Sidebar + body pricing widgets
- **Estimated Fix Time**: 4 hours (component deduplication)

**RC-CLIENT-4: Bundle Size Opportunities**
- **Severity**: P3 (Low)
- **Impact**: 180KB main bundle, third-party dependencies dominate
- **Opportunities**: Code splitting, lazy loading, tree shaking
- **Estimated Fix Time**: 16 hours (bundle analysis + optimization)

---

## Proposed Solutions

### Phase 1: Quick Wins (P0 - 2 weeks)

**Goal**: Achieve 40-50% TTFB reduction with minimal code changes and zero risk to functionality.

#### Solution 1.1: Fix Cache Key Collisions (P0)
**Problem**: All workshop functions share `['workshop']` key
**Solution**: Isolate cache keys per function
```typescript
// Before
unstable_cache(getWorkshopProduct, ['workshop'], { ... })
unstable_cache(getWorkshopNavigation, ['workshop'], { ... })

// After
unstable_cache(getWorkshopProduct, ['workshop', 'product', slug], { ... })
unstable_cache(getWorkshopNavigation, ['workshop', 'nav', slug], { ... })
```
**Expected Impact**:
- Cache hit rate: 30% → 85%
- TTFB reduction: 200-300ms
- Query reduction: 8-12 queries per page

**Effort**: 2 hours
**Risk**: Low (backward compatible)
**Testing**: Verify cache keys unique, no key collisions in logs

#### Solution 1.2: Add Database Indexes (P0)
**Problem**: Full table scans on JSON field lookups
**Solution**: Create functional indexes
```sql
-- High-impact indexes
CREATE INDEX idx_content_resource_slug
  ON contentResource((fields->>'$.slug'));

CREATE INDEX idx_content_resource_type_state
  ON contentResource(type, (fields->>'$.state'));

CREATE INDEX idx_purchases_user_status
  ON purchases(userId, status);

CREATE INDEX idx_org_memberships_user_role
  ON organizationMemberships(userId, role);
```
**Expected Impact**:
- Query time: 50-100ms → 5-15ms
- TTFB reduction: 150-250ms
- Database load reduction: 40-50%

**Effort**: 2 hours (creation + testing)
**Risk**: Low (non-breaking, monitor index size)
**Testing**: Query explain plans, performance monitoring

#### Solution 1.3: Cache MDX Compilation (P0)
**Problem**: MDX compiled on every request (200ms overhead)
**Solution**: Add unstable_cache layer
```typescript
const compileMDX = unstable_cache(
  async (content: string, slug: string) => {
    return await mdxCompile(content)
  },
  ['mdx', 'compiled'],
  { revalidate: 3600, tags: ['mdx'] }
)
```
**Expected Impact**:
- MDX compilation: 200ms → 0ms (cache hit)
- TTFB reduction: 150-200ms
- Cache hit rate: >90% (content changes infrequent)

**Effort**: 4 hours (cache layer + invalidation strategy)
**Risk**: Low (invalidate on content update)
**Testing**: Verify compiled output correctness, cache invalidation

#### Solution 1.4: Consolidate Ability Rules Query (P0)
**Problem**: 9 queries per ability check (getCurrentAbilityRules)
**Solution**: Single query with JOINs
```typescript
// Before: 9 sequential queries
const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
const accounts = await db.query.accounts.findMany({ where: eq(accounts.userId, userId) })
// ... 7 more queries

// After: 1 query with JOINs
const abilityData = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    accounts: true,
    purchases: { with: { product: true } },
    organizationMemberships: { with: { organization: true, role: true } },
    couponPurchases: { with: { coupon: true } },
    emails: true
  }
})
```
**Expected Impact**:
- Ability check: 100-300ms → 20-50ms
- Query count: 9 → 1
- Critical path unblocked: waterfall eliminated

**Effort**: 8 hours (query refactor + CASL integration + testing)
**Risk**: Medium (ensure CASL rules unchanged)
**Testing**: Authorization test suite, manual QA on all permission levels

**Phase 1 Total Impact**:
- TTFB: 800-1000ms → 400-600ms (40-50% reduction)
- Database queries: 18-22 → 10-12 per page (45% reduction)
- Cache hit rate: 30% → 85%

### Phase 2: Structural Improvements (P1 - 4 weeks)

**Goal**: Achieve sub-400ms TTFB through architectural changes and query optimization.

#### Solution 2.1: Parallel Data Fetching Architecture (P1)
**Problem**: Sequential ability check blocks video + content fetch
**Solution**: Parallel fetch with early authorization
```typescript
// Before: Sequential
const ability = await getAbilityForResource()
if (!ability.can('view', 'Content')) throw new Error('Unauthorized')
const video = await getVideoResource()
const content = await compileMDX()

// After: Parallel with early auth
const [ability, video, content] = await Promise.all([
  getAbilityForResource(),
  getVideoResource(),
  compileMDX()
])
if (!ability.can('view', 'Content')) throw new Error('Unauthorized')
```
**Expected Impact**:
- TTFB reduction: 100-200ms
- Critical path: ability check no longer blocking
- User experience: faster content rendering

**Effort**: 6 hours (refactor + error handling + testing)
**Risk**: Medium (ensure auth checked before content returned)
**Testing**: Security audit, authorization test coverage

#### Solution 2.2: Eliminate Duplicate Product Fetches (P1)
**Problem**: Workshop product fetched 3x per page
**Solution**: Unified data provider with React Server Component context
```typescript
// apps/code-with-antonio/src/app/workshops/[slug]/layout.tsx
export default async function WorkshopLayout({ params, children }) {
  // Fetch once at layout level
  const workshopData = await getWorkshopWithPricing(params.slug)

  return (
    <WorkshopDataProvider data={workshopData}>
      {children}
    </WorkshopDataProvider>
  )
}

// Child components read from context (no refetch)
function WorkshopPricing() {
  const workshop = useWorkshopData() // No fetch
  return <PricingWidget {...workshop.pricing} />
}
```
**Expected Impact**:
- Query reduction: 6-9 queries eliminated
- TTFB reduction: 50-100ms
- Code simplification: single source of truth

**Effort**: 4 hours (context provider + component refactor)
**Risk**: Low (layout-level caching ensures performance)
**Testing**: Verify data consistency across components

#### Solution 2.3: Cache Commerce & Pricing Data (P1)
**Problem**: Coupon/pricing queries execute on every request
**Solution**: Add unstable_cache with short TTL
```typescript
const getActiveCoupon = unstable_cache(
  async (productId: string) => {
    return await db.query.coupons.findFirst({
      where: and(
        eq(coupons.productId, productId),
        eq(coupons.status, 'active'),
        or(
          gte(coupons.expires, new Date()),
          isNull(coupons.expires)
        )
      )
    })
  },
  ['coupon', 'active'],
  { revalidate: 300, tags: ['coupons'] } // 5min TTL for pricing
)
```
**Expected Impact**:
- Query reduction: 3-5 queries per page
- TTFB reduction: 100-150ms
- Cache hit rate: >80% (pricing changes infrequent)

**Effort**: 6 hours (cache implementation + TTL tuning)
**Risk**: Low (short TTL ensures pricing freshness)
**Testing**: Verify coupon updates reflected within TTL

#### Solution 2.4: Fix UNION Query Anti-Pattern (P1)
**Problem**: Both UNION branches execute even when direct product exists
**Solution**: Conditional query logic
```typescript
// Before: UNION always executes both branches
const product = await db.query.products.findFirst({
  where: or(
    eq(products.id, productId),
    eq(products.slug, slug)
  )
})

// After: Conditional query based on input type
const product = productId
  ? await db.query.products.findFirst({ where: eq(products.id, productId) })
  : await db.query.products.findFirst({ where: eq(products.slug, slug) })
```
**Expected Impact**:
- Query time: 40-60ms → 15-25ms
- Query complexity: UNION → simple WHERE
- Database load: 30-40% reduction on product queries

**Effort**: 4 hours (query refactor + testing)
**Risk**: Low (logic equivalent)
**Testing**: Verify both productId and slug lookups work

#### Solution 2.5: Connection Pooling Configuration (P1)
**Problem**: High query volume causes connection overhead
**Solution**: Optimize Drizzle connection pool
```typescript
// drizzle.config.ts
export default {
  pool: {
    min: 5,
    max: 20,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 10000
  }
}
```
**Expected Impact**:
- Connection overhead: 5-10ms → 1-2ms per query
- Total overhead: 90-125ms → 20-40ms per page
- Database connection stability improved

**Effort**: 4 hours (configuration + load testing)
**Risk**: Low (monitor connection pool saturation)
**Testing**: Load testing, connection pool metrics

**Phase 2 Total Impact**:
- TTFB: 400-600ms → 200-400ms (50% additional reduction)
- Database queries: 10-12 → 5-8 per page (40% reduction)
- Total reduction from baseline: 60-70%

### Phase 3: Advanced Optimizations (P2 - 4 weeks)

**Goal**: Achieve LCP <1.2s and optimize client-side performance.

#### Solution 3.1: Server-Only Data Providers (P2)
**Problem**: Large hydration payloads (20-48KB)
**Solution**: Move data providers to server-only
```typescript
// Before: Client component with full state
'use client'
export function ModuleProgressProvider({ children, progress }) {
  return <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
}

// After: Server-only data + client UI
// layout.tsx (server component)
export default async function LessonLayout({ children }) {
  const progress = await getModuleProgress() // Server-only
  return <LessonContent progress={progress}>{children}</LessonContent>
}

// LessonContent.tsx (client component - minimal state)
'use client'
export function LessonContent({ progress, children }) {
  const [localProgress, setLocalProgress] = useState(progress)
  // Only client interaction state, not full data
}
```
**Expected Impact**:
- Hydration payload: 20-48KB → 5-10KB
- TTI improvement: 200-400ms
- LCP improvement: 100-200ms

**Effort**: 8 hours (architecture refactor + testing)
**Risk**: Medium (ensure client interactions preserved)
**Testing**: Interactive testing, hydration performance monitoring

#### Solution 3.2: Add Suspense Boundaries (P2)
**Problem**: Pricing widgets and video components block layout
**Solution**: Wrap async components in Suspense
```typescript
// workshop/[slug]/page.tsx
export default function WorkshopPage({ params }) {
  return (
    <div>
      <WorkshopHero /> {/* Static content first */}
      <Suspense fallback={<PricingSkeleton />}>
        <WorkshopPricing slug={params.slug} />
      </Suspense>
      <Suspense fallback={<VideoSkeleton />}>
        <WorkshopVideo slug={params.slug} />
      </Suspense>
      <WorkshopContent /> {/* Static content */}
    </div>
  )
}
```
**Expected Impact**:
- LCP improvement: 300-500ms (static content renders first)
- Cumulative Layout Shift: eliminated
- Perceived performance: significantly improved

**Effort**: 4 hours (Suspense boundaries + skeleton components)
**Risk**: Low (progressive enhancement)
**Testing**: Visual regression testing, layout shift monitoring

#### Solution 3.3: Deduplicate WorkshopPricing Renders (P2)
**Problem**: WorkshopPricing rendered 2x (sidebar + body) with duplicate fetches
**Solution**: Single component with CSS positioning
```typescript
// Before: Two separate components
<aside><WorkshopPricing /></aside>
<main><WorkshopPricing /></main>

// After: Single component, CSS handles layout
<WorkshopPricing className="lg:sticky lg:top-4" />

// CSS controls sidebar vs inline placement
@media (min-width: 1024px) {
  .workshop-pricing {
    position: sticky;
    top: 1rem;
    grid-column: sidebar;
  }
}

@media (max-width: 1023px) {
  .workshop-pricing {
    grid-column: main;
    margin-top: 2rem;
  }
}
```
**Expected Impact**:
- Query reduction: 3-5 queries eliminated
- Render time: 100-150ms saved
- Code complexity: reduced duplication

**Effort**: 4 hours (component refactor + CSS)
**Risk**: Low (visual parity maintained)
**Testing**: Visual regression testing across breakpoints

#### Solution 3.4: Code Splitting & Lazy Loading (P3)
**Problem**: 180KB main bundle, large third-party dependencies
**Solution**: Dynamic imports for non-critical components
```typescript
// Before: Eager import
import { VideoPlayer } from '@/components/video-player'

// After: Dynamic import with Suspense
const VideoPlayer = dynamic(() => import('@/components/video-player'), {
  loading: () => <VideoSkeleton />,
  ssr: false // Client-only video player
})
```
**Target Components**:
- VideoPlayer (mux-player-react)
- CodeEditor (monaco-editor)
- MarkdownEditor (react-markdown)
- Analytics scripts

**Expected Impact**:
- Main bundle: 180KB → 120-140KB (20-30% reduction)
- Initial page load: 400-600ms faster
- TTI improvement: 300-500ms

**Effort**: 16 hours (bundle analysis + lazy loading + testing)
**Risk**: Medium (ensure critical functionality works)
**Testing**: Bundle size monitoring, manual testing on slow connections

#### Solution 3.5: Migrate to Distributed Cache (P2)
**Problem**: React cache limited to request scope
**Solution**: Add Redis layer for cross-request caching
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'
import { unstable_cache } from 'next/cache'

const redis = new Redis({ /* config */ })

export function cacheWithRedis<T>(
  fn: () => Promise<T>,
  key: string[],
  ttl: number
) {
  return unstable_cache(
    async () => {
      // Try Redis first
      const cached = await redis.get(key.join(':'))
      if (cached) return cached as T

      // Miss: execute and cache
      const result = await fn()
      await redis.set(key.join(':'), result, { ex: ttl })
      return result
    },
    key,
    { revalidate: ttl }
  )
}
```
**Expected Impact**:
- Cache hit rate: 85% → 95% (across user sessions)
- Database load: 30-40% reduction
- TTFB: 50-100ms improvement on cache hits

**Effort**: 8 hours (Redis setup + cache migration + monitoring)
**Risk**: Medium (ensure cache invalidation works)
**Testing**: Cache hit rate monitoring, invalidation testing

**Phase 3 Total Impact**:
- LCP: 1.5-2.5s → <1.2s (40-52% improvement)
- Client bundle: 180KB → 120-140KB (20-30% reduction)
- TTI: 300-500ms improvement
- Total TTFB: 200-400ms → 150-300ms (with distributed cache)

---

## Implementation Phases

### Phase 1: Quick Wins (Weeks 1-2)

**Week 1**:
- Day 1-2: Solution 1.1 (Cache key isolation)
- Day 2-3: Solution 1.2 (Database indexes)
- Day 3-5: Solution 1.4 (Consolidate ability rules query)

**Week 2**:
- Day 1-3: Solution 1.3 (MDX caching)
- Day 4-5: Testing, monitoring, rollout

**Deliverables**:
- TTFB reduction: 40-50%
- Database query reduction: 45%
- Performance dashboard with Core Web Vitals
- Monitoring alerts for regressions

**Success Criteria**:
- TTFB: <600ms (p95)
- Database queries: <12 per page
- Cache hit rate: >85%
- Zero production incidents

### Phase 2: Structural Improvements (Weeks 3-6)

**Week 3**:
- Day 1-3: Solution 2.1 (Parallel data fetching)
- Day 4-5: Solution 2.2 (Eliminate duplicate product fetches)

**Week 4**:
- Day 1-3: Solution 2.3 (Cache commerce & pricing data)
- Day 4-5: Solution 2.4 (Fix UNION query anti-pattern)

**Week 5**:
- Day 1-2: Solution 2.5 (Connection pooling)
- Day 3-5: Integration testing, load testing

**Week 6**:
- Day 1-3: Performance validation, monitoring
- Day 4-5: Documentation, team training

**Deliverables**:
- TTFB reduction: 60-70% (cumulative)
- Database query reduction: 60%
- Architectural improvements documented
- Load testing results

**Success Criteria**:
- TTFB: <400ms (p95)
- Database queries: <8 per page
- No degradation in functionality
- Positive user feedback on perceived performance

### Phase 3: Advanced Optimizations (Weeks 7-10)

**Week 7**:
- Day 1-3: Solution 3.1 (Server-only data providers)
- Day 4-5: Solution 3.2 (Suspense boundaries)

**Week 8**:
- Day 1-3: Solution 3.3 (Deduplicate WorkshopPricing)
- Day 4-5: Solution 3.5 (Distributed cache setup)

**Week 9**:
- Day 1-5: Solution 3.4 (Code splitting & lazy loading)

**Week 10**:
- Day 1-3: End-to-end testing, performance validation
- Day 4-5: Documentation, retrospective, handoff

**Deliverables**:
- LCP: <1.2s
- Client bundle reduction: 20-30%
- Distributed cache infrastructure
- Performance playbook

**Success Criteria**:
- LCP: <1.2s (p95)
- TTI: <2.5s (p95)
- Bundle size: <140KB
- All Core Web Vitals in "Good" range

---

## Success Metrics

### Primary Metrics

**Server-Side Performance**:
```
Metric          Baseline    Phase 1    Phase 2    Phase 3
TTFB (p95)      800-1000ms  400-600ms  200-400ms  150-300ms
DB Queries      18-22       10-12      5-8        4-6
Cache Hit Rate  <30%        85%        90%        95%
```

**Client-Side Performance**:
```
Metric          Baseline    Phase 1    Phase 2    Phase 3
LCP (p95)       1.5-2.5s    1.3-2.2s   1.0-1.5s   <1.2s
TTI (p95)       2.5-3.5s    2.2-3.0s   1.8-2.5s   <2.0s
Bundle Size     180KB       180KB      160KB      120-140KB
```

**Database Performance**:
```
Metric                  Baseline    Phase 1    Phase 2
Avg Query Time          15-30ms     8-15ms     5-10ms
Slow Queries (>50ms)    15%         5%         <2%
Connection Pool Usage   70-80%      50-60%     40-50%
```

### Secondary Metrics

**User Experience**:
- Bounce rate reduction: 10-15%
- Session duration increase: 20-30%
- Video play rate increase: 15-20%

**Operational Metrics**:
- Database CPU usage: -40%
- Application memory usage: -20%
- CDN cache hit rate: +15%

### Measurement Approach

**Real User Monitoring (RUM)**:
```typescript
// Implement Core Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric)
  const url = '/api/analytics'

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body)
  } else {
    fetch(url, { body, method: 'POST', keepalive: true })
  }
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

**Synthetic Monitoring**:
- Lighthouse CI: Run on every PR, block if Core Web Vitals regress
- WebPageTest: Weekly tests from 3 geographic locations
- Load testing: Artillery scripts for workshop + lesson pages

**Database Monitoring**:
```sql
-- Track slow queries
SET long_query_time = 0.05; -- 50ms threshold
SET log_queries_not_using_indexes = 1;

-- Monitor query patterns
SELECT
  query_pattern,
  COUNT(*) as execution_count,
  AVG(query_time) as avg_time,
  MAX(query_time) as max_time
FROM performance_schema.events_statements_history
GROUP BY query_pattern
HAVING avg_time > 0.02
ORDER BY execution_count DESC;
```

**Performance Dashboard**:
- Grafana dashboards for all metrics
- PagerDuty alerts on regressions
- Weekly performance reports to stakeholders

---

## Risks & Mitigations

### Risk 1: Cache Invalidation Complexity (HIGH)

**Description**: Multi-layer caching introduces risk of stale data, especially for pricing and user-specific content.

**Impact**: Users see incorrect pricing, outdated content, authorization bugs

**Mitigation Strategy**:
1. Use conservative TTLs (5-10min for pricing, 1hr for content)
2. Implement cache tags for granular invalidation
3. Add cache versioning to force refresh on schema changes
4. Monitor cache hit/miss rates and invalidation frequency

**Rollback Plan**: Disable caching layer, revert to direct queries

**Monitoring**:
```typescript
// Add cache metrics
export async function trackCacheMetrics(key: string, hit: boolean) {
  await analytics.track('cache_event', {
    key,
    hit,
    timestamp: Date.now()
  })
}
```

### Risk 2: Authorization Regression (HIGH)

**Description**: Consolidating ability rules query may introduce permission bugs.

**Impact**: Users gain unauthorized access or legitimate users blocked

**Mitigation Strategy**:
1. Comprehensive authorization test coverage (100+ test cases)
2. Shadow mode: run old + new logic in parallel, compare results
3. Feature flag for gradual rollout (5% → 25% → 100%)
4. Manual QA on all permission combinations

**Rollback Plan**: Feature flag instant rollback to old query logic

**Testing**:
```typescript
// Shadow mode testing
const oldResult = await getCurrentAbilityRules_v1(userId)
const newResult = await getCurrentAbilityRules_v2(userId)

if (!deepEqual(oldResult, newResult)) {
  await logger.error('Authorization mismatch', {
    userId,
    old: oldResult,
    new: newResult
  })
}

return featureFlags.newAbilityRules ? newResult : oldResult
```

### Risk 3: Database Index Bloat (MEDIUM)

**Description**: Adding multiple indexes increases storage and slows write operations.

**Impact**: Increased database costs, slower content updates

**Mitigation Strategy**:
1. Monitor index usage with `pg_stat_user_indexes`
2. Set index fill factor to 90% for frequently updated tables
3. Schedule monthly index maintenance (REINDEX)
4. Remove unused indexes after 90 days

**Monitoring**:
```sql
-- Track index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid > 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Risk 4: Parallel Fetching Race Conditions (MEDIUM)

**Description**: Parallel data fetching may introduce timing issues or duplicate work.

**Impact**: Inconsistent data state, wasted resources

**Mitigation Strategy**:
1. Use React cache to deduplicate identical requests within a render
2. Implement request memoization with cache keys
3. Add comprehensive error boundaries
4. Test race conditions with concurrent requests

**Testing**:
```typescript
// Concurrent request testing
const requests = Array.from({ length: 100 }, () =>
  fetch('/api/workshop/next-js')
)

const results = await Promise.all(requests)
const uniqueResults = new Set(results.map(r => r.json()))

// All results should be identical
expect(uniqueResults.size).toBe(1)
```

### Risk 5: Third-Party Dependency Changes (LOW)

**Description**: Code splitting may break if third-party libraries change chunk boundaries.

**Impact**: Broken dynamic imports, runtime errors

**Mitigation Strategy**:
1. Pin major versions of critical dependencies
2. Add bundle size checks to CI pipeline
3. Test dynamic imports in integration tests
4. Monitor error rates on lazy-loaded components

**CI Check**:
```bash
# Fail build if bundle size increases >5%
npm run build
BUNDLE_SIZE=$(wc -c < .next/static/chunks/main.js)
if [ $BUNDLE_SIZE -gt $MAX_BUNDLE_SIZE ]; then
  echo "Bundle size exceeded: $BUNDLE_SIZE > $MAX_BUNDLE_SIZE"
  exit 1
fi
```

---

## Appendices

### Appendix A: Performance Testing Checklist

**Pre-Deployment**:
- [ ] Run Lighthouse CI on staging (all Core Web Vitals green)
- [ ] Execute load test with Artillery (500 concurrent users)
- [ ] Verify cache hit rates in staging (>85%)
- [ ] Run authorization test suite (100% pass)
- [ ] Manual QA on workshop + lesson pages (3 permission levels)
- [ ] Database query count validation (target: 5-8 per page)

**Post-Deployment**:
- [ ] Monitor TTFB for 24 hours (p95 <600ms Phase 1, <400ms Phase 2)
- [ ] Track error rates (no increase >5%)
- [ ] Verify cache invalidation working (update content, verify TTL)
- [ ] Monitor database connection pool (usage <60%)
- [ ] User feedback survey (perceived performance improvement)

### Appendix B: Monitoring Queries

**Track TTFB Over Time**:
```sql
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ttfb) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ttfb) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY ttfb) as p99
FROM web_vitals
WHERE metric = 'TTFB'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour DESC;
```

**Database Query Performance**:
```sql
SELECT
  query_pattern,
  COUNT(*) as count,
  ROUND(AVG(query_time)::numeric, 2) as avg_ms,
  ROUND(MAX(query_time)::numeric, 2) as max_ms
FROM query_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY query_pattern
HAVING AVG(query_time) > 0.02
ORDER BY count DESC
LIMIT 20;
```

**Cache Hit Rates**:
```typescript
// Track in application
const cacheStats = await redis.hgetall('cache:stats')
const hitRate = (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100

if (hitRate < 85) {
  await alerting.send('Cache hit rate below threshold', { hitRate })
}
```

### Appendix C: Related Documents

- **Database Schema**: `apps/code-with-antonio/src/db/schema.ts`
- **Authorization Logic**: `apps/code-with-antonio/src/lib/ability.ts`
- **Cache Implementation**: `apps/code-with-antonio/src/lib/cache.ts`
- **Workshop Page**: `apps/code-with-antonio/src/app/workshops/[slug]/page.tsx`
- **Lesson Page**: `apps/code-with-antonio/src/app/workshops/[slug]/[lessonSlug]/page.tsx`

### Appendix D: Team Responsibilities

**Backend Engineering**:
- Database index creation and monitoring
- Query consolidation and optimization
- Connection pool configuration

**Frontend Engineering**:
- React component optimization
- Code splitting and lazy loading
- Suspense boundary implementation

**DevOps/SRE**:
- Distributed cache (Redis) setup
- Performance monitoring dashboard
- Load testing infrastructure

**QA Engineering**:
- Authorization test coverage
- Performance regression testing
- Load testing execution

---

## Approval & Sign-off

**Prepared By**: Performance Engineering Team
**Reviewed By**: [Engineering Manager, Product Manager]
**Approved By**: [VP Engineering]
**Date**: 2026-01-22

**Next Steps**:
1. Present PRD to engineering team (Week of 2026-01-27)
2. Allocate resources (2 senior engineers + 1 database specialist)
3. Begin Phase 1 implementation (Week of 2026-02-03)
4. Weekly progress reviews with stakeholders
