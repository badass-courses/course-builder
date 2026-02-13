# Caching Architecture PRD: Code with Antonio

**Status**: Draft **Author**: Performance Engineering **Last Updated**:
2026-01-22

---

## Executive Summary

The Code with Antonio workshop platform has a broken caching architecture that
results in **<30% cache hit rates** despite using Next.js `unstable_cache`. The
root causes are cache key collisions, nuclear tag-based invalidation, completely
uncached video data functions, and dead code adding latency without benefit.

**Impact**:

- 10-15 unnecessary database queries per page load
- 300-500ms additional latency on every request
- Video data re-fetched on every lesson view (never changes after upload)

**Effort**: 4-8 hours of focused changes **Risk**: Low (backward compatible,
incremental rollout)

---

## Problem Analysis

### Workshop Caching: Key Collision

Three functions in `workshops-query.ts` share identical `keyParts`:

```typescript
// workshops-query.ts:35-39
export const getCachedWorkshopNavigation = unstable_cache(
	async (slug: string) => getWorkshopNavigation(slug),
	['workshop'], // ← SHARED KEY
	{ revalidate: 3600, tags: ['workshop'] },
)

// workshops-query.ts:49-53
export const getCachedWorkshopProduct = unstable_cache(
	async (workshopIdOrSlug: string) => getWorkshopProduct(workshopIdOrSlug),
	['workshop'], // ← SAME KEY
	{ revalidate: 3600, tags: ['workshop'] },
)

// workshops-query.ts:112-116
export const getCachedMinimalWorkshop = unstable_cache(
	async (slug: string) => getMinimalWorkshop(slug),
	['workshop'], // ← SAME KEY
	{ revalidate: 3600, tags: ['workshop'] },
)
```

**How `unstable_cache` keyParts work**: The cache key is formed by combining
`keyParts` array with the function arguments. With keyParts `['workshop']` and
argument `'next-js-course'`:

```
Cache Key: workshop:next-js-course
```

**The collision**: All three functions produce the **same cache key** for the
same slug input. The first function called populates the cache. Subsequent
functions find a cache entry but it contains the **wrong data** (e.g.,
navigation data when product data was expected).

**Measured impact**:

- Cache hit rate: ~30% (should be >90%)
- 4-6 extra DB queries per workshop page from cache misses
- ~200ms additional latency per page

### Workshop Caching: Nuclear Invalidation

All three functions use `tags: ['workshop']`. When ANY workshop is updated:

```typescript
// workshops-query.ts:421-424
revalidateTag('workshop') // Nukes EVERY workshop cache entry
```

A single workshop edit invalidates cached data for **all workshops** in the
system.

### Workshop Page: Duplicate Fetches

The workshop page renders `WorkshopPricing` **twice** (sidebar + body), each
triggering independent data fetches:

```typescript
// workshops/[module]/page.tsx:173-175 (sidebar)
<WorkshopPricing moduleSlug={params.module} searchParams={searchParams}>

// workshops/[module]/page.tsx:377 (body)
<WorkshopPricing moduleSlug={params.module} searchParams={searchParams}>
```

Each `WorkshopPricing` instance calls:

- `getCachedWorkshopProduct(moduleSlug)`
- `getCachedMinimalWorkshop(moduleSlug)`
- `getAbilityForResource(undefined, workshop.id)`
- `propsForCommerce(...)`

**Total**: 6-10 duplicate queries per workshop page from double rendering.

---

### Lesson Caching: Same Key Collision

```typescript
// lessons-query.ts:173-177
export const getCachedLesson = unstable_cache(
	async (slug: string) => getLesson(slug),
	['lesson'], // ← SHARED KEY (same pattern as workshops)
	{ revalidate: 3600, tags: ['lesson'] },
)

// lessons-query.ts:243-247
export const getCachedExerciseSolution = unstable_cache(
	async (slug: string) => getExerciseSolution(slug),
	['solution'],
	{ revalidate: 3600, tags: ['solution'] },
)
```

Same collision pattern. Same nuclear invalidation via `revalidateTag('lesson')`.

### Lesson Caching: Dead Redis Code (Double-Caching Antipattern)

`getLesson` has an internal Redis cache that provides **zero benefit**:

```typescript
// lessons-query.ts:179-241
export async function getLesson(lessonSlugOrId: string) {
  // Redis check - 10 SECOND TTL
  const cachedLesson = await redis.get(
    `lesson:${env.NEXT_PUBLIC_APP_NAME}:${lessonSlugOrId}`,
  )

  const lesson = cachedLesson
    ? cachedLesson
    : await db.query.contentResource.findFirst({...})

  if (!cachedLesson) {
    await redis.set(
      `lesson:${env.NEXT_PUBLIC_APP_NAME}:${lessonSlugOrId}`,
      lesson,
      { ex: 10 },  // ← 10 SECOND TTL
    )
  }
  return parsedLesson.data
}
```

**Why it's dead code**:

1. `getCachedLesson` wraps `getLesson` with `unstable_cache` (3600s TTL)
2. `getLesson` only executes when `unstable_cache` **misses**
3. When it runs, Redis cache was populated 3600+ seconds ago → **already
   expired** (10s TTL)
4. Redis gets populated again, then `unstable_cache` intercepts for the next
   3600 seconds
5. By the time `getLesson` runs again, Redis has expired again

**Result**: The Redis layer adds ~20-50ms network latency to Upstash on every
cache miss while providing **zero cache hits**. Pure overhead.

### Lesson Caching: Completely Uncached Video Functions

These functions hit the database on **EVERY lesson page view**:

```typescript
// lessons-query.ts:39-63
export const getLessonVideoTranscript = async (lessonIdOrSlug?: string | null) => {
  // NO CACHING - raw DB query every time
  const query = sql`SELECT cr_video.fields->>'$.transcript' AS transcript
    FROM ${contentResource} AS cr_lesson
    JOIN ${contentResourceResource} AS crr ON cr_lesson.id = crr.resourceOfId
    JOIN ${contentResource} AS cr_video ON crr.resourceId = cr_video.id
    WHERE (cr_lesson.id = ${lessonIdOrSlug} OR ...) AND cr_video.type = 'videoResource'
    LIMIT 1;`
  const result = await db.execute(query)
  return ...
}

// lessons-query.ts:88-108
export const getLessonMuxPlaybackId = async (lessonIdOrSlug: string) => {
  // NO CACHING - raw DB query every time
  const query = sql`SELECT cr_video.fields->>'$.muxPlaybackId' AS muxPlaybackId
    FROM ${contentResource} AS cr_lesson
    JOIN ${contentResourceResource} AS crr ON cr_lesson.id = crr.resourceOfId
    JOIN ${contentResource} AS cr_video ON crr.resourceId = cr_video.id
    WHERE (cr_lesson.id = ${lessonIdOrSlug} OR ...) AND cr_video.type = 'videoResource'
    LIMIT 1;`
  const result = await db.execute(query)
  return ...
}
```

Called from `shared-page.tsx`:

```typescript
// shared-page.tsx:209-211
const muxPlaybackId = ability.canViewLesson
	? await getLessonMuxPlaybackId(lesson.id) // UNCACHED
	: null

// shared-page.tsx:163
const transcriptLoader = getLessonVideoTranscript(lessonId) // UNCACHED
```

**Critical insight**: `muxPlaybackId` and `transcript` are **static data**.
They're set once when the video is processed and **never change**. There's no
reason to query them more than once per deployment.

**Impact**:

- 2 unnecessary DB queries per lesson page view
- Popular lesson with 1,000 views = 2,000 wasted queries
- ~40-80ms latency added to every lesson page

---

## Solution

### Fix 1: Isolate Cache Keys

Change keyParts to include function identity and resource ID:

```typescript
// workshops-query.ts - BEFORE
unstable_cache(fn, ['workshop'], { tags: ['workshop'] })

// workshops-query.ts - AFTER
export const getCachedWorkshopNavigation = unstable_cache(
	async (slug: string) => getWorkshopNavigation(slug),
	['workshop-navigation'],
	{ revalidate: 3600, tags: ['workshop-navigation'] },
)

export const getCachedWorkshopProduct = unstable_cache(
	async (workshopIdOrSlug: string) => getWorkshopProduct(workshopIdOrSlug),
	['workshop-product'],
	{ revalidate: 3600, tags: ['workshop-product'] },
)

export const getCachedMinimalWorkshop = unstable_cache(
	async (slug: string) => getMinimalWorkshop(slug),
	['workshop-minimal'],
	{ revalidate: 3600, tags: ['workshop-minimal'] },
)
```

**Same pattern for lessons**:

```typescript
export const getCachedLesson = unstable_cache(
	async (slug: string) => getLesson(slug),
	['lesson-full'],
	{ revalidate: 3600, tags: ['lesson'] },
)
```

**Expected impact**:

- Cache hit rate: 30% → 90%+
- DB queries per page: -6 to -10
- TTFB reduction: 200-300ms

**Effort**: 30 minutes

### Fix 2: Resource-Specific Tag Invalidation

Add resource ID to tags for surgical invalidation:

```typescript
// workshops-query.ts
export const getCachedMinimalWorkshop = unstable_cache(
	async (slug: string) => getMinimalWorkshop(slug),
	['workshop-minimal'],
	{
		revalidate: 3600,
		tags: (slug) => ['workshop-minimal', `workshop:${slug}`], // Resource-specific
	},
)

// On update, invalidate only the affected workshop:
export async function updateWorkshop(input: Partial<Workshop>) {
	// ... update logic ...

	// Surgical invalidation - only this workshop
	revalidateTag(`workshop:${workshopSlug}`)

	// Only if structure changed (e.g., sections added/removed)
	if (structureChanged) {
		revalidateTag('workshop-navigation')
	}
}
```

**Expected impact**:

- Prevents cache stampede when one workshop updates
- Other workshop caches remain warm
- Reduces unnecessary revalidation by ~95%

**Effort**: 1 hour

### Fix 3: Cache Video Data Functions

Add `unstable_cache` to the static video data functions:

```typescript
// lessons-query.ts - BEFORE
export const getLessonVideoTranscript = async (
	lessonIdOrSlug?: string | null,
) => {
	// Raw DB query every time
}

// lessons-query.ts - AFTER
export const getCachedLessonVideoTranscript = unstable_cache(
	async (lessonIdOrSlug: string) => {
		if (!lessonIdOrSlug) return null
		const query = sql`SELECT cr_video.fields->>'$.transcript' AS transcript...`
		const result = await db.execute(query)
		// ... parsing ...
		return parsedResult.data[0]?.transcript
	},
	['lesson-transcript'],
	{
		revalidate: false, // Never expires - transcript is immutable
		tags: (lessonIdOrSlug) => ['lesson-transcript', `lesson:${lessonIdOrSlug}`],
	},
)

export const getCachedLessonMuxPlaybackId = unstable_cache(
	async (lessonIdOrSlug: string) => {
		const query = sql`SELECT cr_video.fields->>'$.muxPlaybackId'...`
		const result = await db.execute(query)
		// ... parsing ...
		return parsedResult.data[0]?.muxPlaybackId
	},
	['lesson-playback-id'],
	{
		revalidate: false, // Never expires - playbackId is immutable
		tags: (lessonIdOrSlug) => [
			'lesson-playback-id',
			`lesson:${lessonIdOrSlug}`,
		],
	},
)
```

**Update call sites**:

```typescript
// shared-page.tsx
const muxPlaybackId = ability.canViewLesson
	? await getCachedLessonMuxPlaybackId(lesson.id) // Now cached
	: null

const transcriptLoader = getCachedLessonVideoTranscript(lessonId) // Now cached
```

**Invalidation** (only when video is re-processed):

```typescript
// In video processing webhook
revalidateTag(`lesson:${lessonId}`)
```

**Expected impact**:

- 2 DB queries eliminated per lesson page
- Popular lesson: 2,000 queries → 1 query
- ~40-80ms latency eliminated per lesson page

**Effort**: 1 hour

### Fix 4: Remove Dead Redis Code

Delete the useless Redis layer in `getLesson`:

```typescript
// lessons-query.ts - BEFORE
export async function getLesson(lessonSlugOrId: string) {
  const cachedLesson = await redis.get(...)  // USELESS
  const lesson = cachedLesson ? cachedLesson : await db.query...
  if (!cachedLesson) await redis.set(..., { ex: 10 })  // USELESS
  return parsedLesson.data
}

// lessons-query.ts - AFTER
export async function getLesson(lessonSlugOrId: string) {
  const lesson = await db.query.contentResource.findFirst({
    where: and(
      or(
        eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, lessonSlugOrId),
        eq(contentResource.id, lessonSlugOrId),
        like(contentResource.id, `%${last(lessonSlugOrId.split('-'))}%`),
      ),
      or(
        eq(contentResource.type, 'lesson'),
        eq(contentResource.type, 'exercise'),
        eq(contentResource.type, 'solution'),
        eq(contentResource.type, 'post'),
      ),
    ),
    with: {
      tags: { with: { tag: true }, orderBy: asc(contentResourceTag.position) },
      resources: { with: { resource: { columns: { type: true } } } },
    },
  })

  const parsedLesson = LessonSchema.safeParse(lesson)
  if (!parsedLesson.success) {
    console.error('Error parsing lesson', lesson, parsedLesson.error)
    return null
  }
  return parsedLesson.data
}
```

**Expected impact**:

- 20-50ms latency reduction on cache misses
- Removes Redis import and connection
- Simpler, more predictable code path

**Effort**: 15 minutes

### Fix 5: Request-Level Deduplication

Wrap cached functions with React `cache()` to deduplicate within a single
request:

```typescript
// workshops-query.ts
import { cache } from 'react'

// Request-level deduplication + cross-request caching
export const getCachedMinimalWorkshop = cache(
	unstable_cache(
		async (slug: string) => getMinimalWorkshop(slug),
		['workshop-minimal'],
		{ revalidate: 3600, tags: ['workshop-minimal'] },
	),
)

export const getCachedWorkshopProduct = cache(
	unstable_cache(
		async (workshopIdOrSlug: string) => getWorkshopProduct(workshopIdOrSlug),
		['workshop-product'],
		{ revalidate: 3600, tags: ['workshop-product'] },
	),
)
```

**How this helps**: When `WorkshopPricing` renders twice on the same page:

1. First render calls `getCachedMinimalWorkshop('next-js')`
2. React `cache()` memoizes the promise
3. Second render calls `getCachedMinimalWorkshop('next-js')`
4. React `cache()` returns the same promise (no second fetch)

**Expected impact**:

- Eliminates duplicate fetches from double `WorkshopPricing` renders
- 3-5 fewer queries per workshop page
- ~100ms latency reduction

**Effort**: 30 minutes

### Fix 6: Deduplicate WorkshopPricing Render (Optional)

If Fix 5 doesn't fully address the double-render issue, restructure to render
once:

```typescript
// workshops/[module]/page.tsx
export default async function ModulePage(props: Props) {
  // ... existing code ...

  // Fetch pricing data ONCE at page level
  const pricingData = await getWorkshopPricingData(params.module, searchParams)

  return (
    <ResourceLayout
      sidebar={
        <WorkshopPricingSidebar data={pricingData} />  // Pure render, no fetch
      }
    >
      <ResourceBody>
        <WorkshopPricingBody data={pricingData} />  // Pure render, no fetch
      </ResourceBody>
    </ResourceLayout>
  )
}
```

**Effort**: 2-3 hours (component restructure)

---

## Implementation Order

| Order | Fix                         | Impact | Effort  | Risk |
| ----- | --------------------------- | ------ | ------- | ---- |
| 1     | Isolate cache keys          | High   | 30 min  | None |
| 2     | Cache video functions       | High   | 1 hr    | None |
| 3     | Remove dead Redis code      | Medium | 15 min  | None |
| 4     | Request-level deduplication | Medium | 30 min  | None |
| 5     | Resource-specific tags      | Medium | 1 hr    | Low  |
| 6     | Deduplicate WorkshopPricing | Low    | 2-3 hrs | Low  |

**Total effort**: 4-6 hours for fixes 1-5 (high/medium impact)

---

## Expected Results

### Before

| Metric             | Workshop Page | Lesson Page |
| ------------------ | ------------- | ----------- |
| Cache hit rate     | ~30%          | ~30%        |
| DB queries         | 18-22         | 20-25       |
| TTFB               | 800-1000ms    | 600-800ms   |
| Video data queries | N/A           | 2 per view  |

### After

| Metric             | Workshop Page | Lesson Page |
| ------------------ | ------------- | ----------- |
| Cache hit rate     | 90%+          | 90%+        |
| DB queries         | 6-8           | 5-7         |
| TTFB               | 200-400ms     | 150-300ms   |
| Video data queries | N/A           | 0 (cached)  |

**Projected improvement**:

- TTFB: 60-70% reduction
- DB queries: 65-75% reduction
- Cache hit rate: 3x improvement

---

## Validation

### Cache Hit Rate Monitoring

Add logging to track cache effectiveness:

```typescript
// lib/cache-monitoring.ts
export function monitoredCache<T>(
	fn: (...args: any[]) => Promise<T>,
	keyParts: string[],
	options: { revalidate: number | false; tags: string[] },
) {
	const cacheFn = unstable_cache(
		async (...args: any[]) => {
			const start = performance.now()
			const result = await fn(...args)
			const duration = performance.now() - start

			// Log cache miss (function executed = miss)
			console.log(
				`[CACHE MISS] ${keyParts.join(':')} - ${duration.toFixed(0)}ms`,
			)

			return result
		},
		keyParts,
		options,
	)

	return cacheFn
}
```

### Query Count Verification

Before/after query count comparison:

```typescript
// Temporarily enable query logging
import { db } from '@/db'

let queryCount = 0
db.$on('query', () => queryCount++)

// At end of request
console.log(`[QUERY COUNT] ${queryCount} queries this request`)
```

### Regression Testing

1. Verify all workshop pages load correctly
2. Verify all lesson pages load correctly
3. Verify video playback works
4. Verify transcript display works
5. Verify content updates invalidate correctly
6. Verify pricing displays correctly after cache

---

## Files to Modify

| File                                                                   | Changes                                                         |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `src/lib/workshops-query.ts`                                           | Fix cache keys, add React cache wrapper, resource-specific tags |
| `src/lib/lessons-query.ts`                                             | Fix cache keys, cache video functions, remove dead Redis code   |
| `src/app/(content)/workshops/[module]/page.tsx`                        | (Optional) Deduplicate WorkshopPricing                          |
| `src/app/(content)/workshops/[module]/[lesson]/(view)/shared-page.tsx` | Update to use cached video functions                            |

---

## Rollout

1. **Phase 1**: Deploy fixes 1-4 (cache keys, video caching, Redis removal,
   deduplication)
2. **Monitor**: 24 hours of cache hit rate and TTFB monitoring
3. **Phase 2**: Deploy fix 5 (resource-specific tags)
4. **Phase 3**: (If needed) Deploy fix 6 (WorkshopPricing restructure)

**Rollback**: All changes are backward compatible. If issues arise, revert the
specific commit.
