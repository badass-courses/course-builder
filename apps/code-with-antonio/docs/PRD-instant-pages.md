# PRD: Instant Workshop & Lesson Pages

**Epic:** instant-workshop-pages
**App:** code-with-antonio
**Next.js Version:** 16.0.10
**Status:** Draft

---

## 1. Overview

### Problem

Both workshop landing pages and lesson pages are currently rendered as
fully dynamic (`export const dynamic = 'force-dynamic'`). Every page
visit triggers a full server-render cycle: auth session lookup, product
queries, purchase verification, coupon resolution, MDX compilation, and
navigation data assembly — all blocking the initial HTML response.

The `WorkshopPricing` server component alone chains together 6+ serial
async operations (session, product fetch, pricing data, commerce props,
purchase details, ability check), and it appears **twice** on the
workshop landing page — once in the sidebar, once in the body — both
wrapped in the same Suspense boundary or rendered inline.

Result: TTFB is high, LCP is blocked behind auth, and the page feels
sluggish even when content is cacheable.

### Goal

Deliver the static structural shell of workshop and lesson pages
instantly via Partial Prerendering (PPR), then stream only the
user-specific "holes" asynchronously. The page skeleton — title, layout,
description, JSON-LD, navigation structure — becomes a prerendered
static asset. Pricing state, user progress, access gates, and the
Start/Continue button hydrate in after the shell is already painted.

---

## 2. Current State Analysis

### Workshop Landing Page
**File:** `src/app/(content)/workshops/[module]/page.tsx`

**What runs on every request (currently dynamic):**

| Operation | Why it's dynamic | Could be static? |
|---|---|---|
| `getCachedMinimalWorkshop(slug)` | Returns cacheable workshop metadata | Yes — already uses `unstable_cache` with 1h TTL |
| `getAbilityForResource(...)` | Reads auth session via `headers()` | No — user-specific |
| `getCachedWorkshopProduct(slug)` | Product data is cacheable | Yes — already uses `unstable_cache` |
| `getSaleBannerDataFromSearchParams` | Reads searchParams | No — request-specific |
| `createWorkshopPurchaseDataLoader` | User purchases, auth | No — user-specific |
| `getProductSlugToIdMap()` | Static mapping | Yes |
| `getActiveCoupon(searchParams)` | Request-specific | No |
| `compileMDX(body, mdxComponents)` | MDX with pricing-aware components baked in | Partially — body without pricing refs could be static |
| `WorkshopPricing` (sidebar) | Auth + purchase checks | No — but already Suspense-wrapped |
| `WorkshopPricing` (body) | Same as above | No — NOT Suspense-wrapped currently |
| `ResourceActions` (Start/Continue) | Reads module progress via client context | No — client-side but depends on hydration |
| `ResourceHeader` | Workshop fields only | Yes |
| `WorkshopMetadata` (JSON-LD) | Static fields | Yes |
| `generateStaticParams` | Already implemented | Already in place |

**Key finding:** `generateStaticParams` exists and pre-builds workshop
slugs, but `dynamic = 'force-dynamic'` overrides it completely. The
page never actually uses the prebuilt params for static rendering.

**Second `WorkshopPricing` instance (line 390-423):** Rendered inside
`ResourceBody` with **no Suspense boundary**. This is an unconditional
blocking fetch that serializes the entire body section.

### Lesson Page
**File:** `src/app/(content)/workshops/[module]/[lesson]/(view)/page.tsx`
**Shared renderer:** `src/app/(content)/workshops/[module]/[lesson]/(view)/shared-page.tsx`

| Operation | Could be static? |
|---|---|
| `getCachedLesson(slug)` | Yes — cacheable |
| `getCachedMinimalWorkshop(slug)` | Yes — cacheable |
| `getAbilityForResource(...)` | No — auth |
| `compileMDX(body)` | Yes — no pricing components |
| `getCachedLessonMuxPlaybackId` | Yes if public; No if gated |
| `getCachedLessonVideoTranscript` | Yes — cacheable |
| `WorkshopPricing` (video overlay) | No — user purchase state |
| `UpNext` component | Partially — navigation is static, progress is dynamic |

**Key finding:** `dynamic = 'force-dynamic'` on lesson page too.
`generateStaticParams` pre-builds all lesson slugs across all workshops.
The lesson body MDX does **not** include pricing components (unlike the
workshop page), making it a clean candidate for static shell rendering.

### Navigation & Progress Components

- **`ModuleResourceList`** (`navigation/module-resource-list.tsx`): `'use client'` component. Fetches ability rules via `api.ability.getCurrentAbilityRules.useQuery` (tRPC), reads module progress from context. Entirely client-side — will hydrate into a Suspense hole.

- **`ContentNavigationProvider`** (`navigation/provider.tsx`): `'use client'`, uses `React.use()` to consume a navigation data promise. Wraps the sidebar layout.

- **`ModuleProgressProvider`** (`module-progress-provider.tsx`): `'use client'`, context-based progress state with reducer. All navigation progress state lives here.

- **`ResourceActions`** (Start/Continue button): `'use client'`, reads `useModuleProgress()` and `useContentNavigation()`. Fully client-side — renders nothing until progress data loads.

---

## 3. Target Architecture

### Static Shell vs Dynamic Holes

```
┌─────────────────────────────────────────────────────────────┐
│  STATIC SHELL (prerendered, instant)                        │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │  ResourceHeader                                  │       │
│  │    - title, description, cover image, badge      │       │
│  │    - contributor bio                             │       │
│  │    ┌──────────────────────────────┐              │       │
│  │    │  DYNAMIC HOLE: ResourceActions│              │       │
│  │    │  (Start/Continue button)     │              │       │
│  │    │  fallback: <Button skeleton> │              │       │
│  │    └──────────────────────────────┘              │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │  ResourceBody (MDX content — static)             │       │
│  │                                                  │       │
│  │  ┌──────────────────────────────┐               │       │
│  │  │  DYNAMIC HOLE: Content List  │               │       │
│  │  │  (ModuleResourceList)        │               │       │
│  │  │  fallback: <list skeleton>   │               │       │
│  │  └──────────────────────────────┘               │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────┐  ┌──────────────────────┐        │
│  │  DYNAMIC HOLE:      │  │  WorkshopMetadata    │        │
│  │  Sidebar/Pricing    │  │  (JSON-LD, static)   │        │
│  │  fallback: skeletons│  └──────────────────────┘        │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### Components That Become Static

| Component | Reason |
|---|---|
| `ResourceHeader` (title, description, image, badge) | Pure workshop fields |
| `WorkshopMetadata` (JSON-LD `<script>`) | Static fields only |
| `ResourceBody` wrapper + MDX content | Workshop description text |
| Page layout (`ResourceLayout`, grid structure) | Pure structure |
| `generateMetadata` output | Cacheable workshop fields |
| `ResourceSidebar` shell | Layout only |
| Lesson title (`<h1>`) | Static lesson fields |
| Lesson MDX body | No pricing-aware components |
| Transcript section shell | Cacheable transcript data |

### Components That Remain Dynamic (Suspense Boundaries Required)

| Component | Why dynamic | Suspense fallback |
|---|---|---|
| `WorkshopPricing` (sidebar) | Auth, purchase state, pricing | Skeleton stack (already exists) |
| `WorkshopPricing` (body content list) | Conditionally renders based on purchase | Skeleton list |
| `ResourceActions` (Start/Continue) | Progress-dependent, client-side | Button skeleton |
| `ResourceAdminActions` | Ability check (`canView`) | Empty or hidden |
| `ModuleResourceList` (sidebar, purchased state) | Client progress + ability rules | Skeleton list |
| `Certificate` | User-specific achievement | Empty |
| Video player + overlay (lesson page) | Mux playback ID gated by ability | Player skeleton (already exists) |
| `UpNext` (lesson page) | Navigation + progress state | `null` (already exists) |
| `LessonBody` (lesson page) | Already Suspense-wrapped | Skeleton (already exists) |

---

## 4. Technical Approach

### 4.1 Enable PPR

**File:** `next.config.mjs`

Add `cacheComponents: true` to the config object. This is the Next.js 16
stable API replacing `experimental: { ppr: true }`.

```js
const config = {
  cacheComponents: true,  // enables PPR
  experimental: {
    mdxRs: true,
    turbopackFileSystemCacheForDev: true,
  },
  // ...rest unchanged
}
```

No other config changes needed. PPR activates per-route based on
Suspense boundary placement.

### 4.2 Static Shell: Workshop Page

**Remove `dynamic = 'force-dynamic'`** from
`src/app/(content)/workshops/[module]/page.tsx`.

`generateStaticParams` already returns all workshop slugs. With PPR
enabled and `force-dynamic` removed, the static shell will be
prerendered at build time for known slugs.

**Refactor the page component** to separate static data from dynamic
data. The workshop metadata fetch (`getCachedMinimalWorkshop`) and
product fetch (`getCachedWorkshopProduct`) already use `unstable_cache`
— they will be served from cache for the static shell.

**Key change — compile MDX without pricing components for the static
shell.** Currently `compileMDX` receives `mdxComponents` that include
`PricingWidget` and related commerce elements baked into the MDX body.
Split this:

1. Compile the workshop body MDX with only static-safe components
   (headings, code blocks, images, etc.)
2. Any `<PricingWidget>` or pricing-related MDX usage gets wrapped in
   its own Suspense boundary inside the MDX output

This allows the bulk of the description text to be prerendered.

### 4.3 Dynamic Holes (Suspense Boundaries)

#### Pricing Widget (sidebar) — already handled
The sidebar `WorkshopPricing` call is already inside `<React.Suspense>`
with skeleton fallbacks. No change needed for PPR — this hole will
stream after the shell.

#### Content List (body) — needs wrapping
Lines 390-423 in the workshop page render a second `WorkshopPricing`
instance inside `ResourceBody` with **no Suspense boundary**. This
blocks the entire body from prerendering.

```tsx
// BEFORE: blocks static shell
<WorkshopPricing moduleSlug={params.module} searchParams={searchParams}>
  {(pricingProps) => { /* content list */ }}
</WorkshopPricing>

// AFTER: streams as dynamic hole
<Suspense fallback={
  <div className="mt-8">
    <Skeleton className="mb-3 h-8 w-48" />
    <Skeleton className="h-64 w-full rounded-lg" />
  </div>
}>
  <WorkshopContentList
    moduleSlug={params.module}
    searchParams={searchParams}
  />
</Suspense>
```

Extract the content list logic into a standalone async server component
`WorkshopContentList` that handles its own `WorkshopPricing` call
internally.

#### ResourceActions (Start/Continue button)
This is already a `'use client'` component. It renders `null` until
progress context hydrates. For PPR, wrap it in Suspense on the server
side to create a clean boundary:

```tsx
<Suspense fallback={
  <div className="mt-8 h-12 w-40 animate-pulse rounded-lg bg-primary/20" />
}>
  <ResourceActions
    moduleType="workshop"
    moduleSlug={params.module}
    hasAccess={ability.canViewWorkshop}
    hasProduct={!!product}
    githubUrl={workshop?.fields?.github}
    title={workshop.fields?.title || ''}
  />
</Suspense>
```

**Problem:** `ability.canViewWorkshop` is computed from `getAbilityForResource`
which reads auth headers — it cannot be in the static shell. Move the
ability check into a dynamic wrapper component or pass it as a prop
that resolves within a Suspense boundary.

#### Lesson Page — Video + Overlay
`PlayerContainer` in `shared-page.tsx` is already Suspense-wrapped.
The `WorkshopPricing` inside it (line 251-265) streams correctly as a
hole. No structural change needed.

### 4.4 Caching Strategy

#### Migrate `unstable_cache` to `use cache`

Next.js 16 stable: `use cache` directive replaces `unstable_cache`.
Migrate the key data-fetching functions in `src/lib/workshops-query.ts`
and `src/lib/lessons-query.ts`:

```typescript
// BEFORE
export const getCachedMinimalWorkshop = cache(async (slug: string) => {
  return unstable_cache(
    async () => getMinimalWorkshop(slug),
    ['workshop-minimal', slug],
    { revalidate: 3600, tags: ['workshop-minimal', slug] },
  )()
})

// AFTER (Next.js 16)
async function getMinimalWorkshopCached(slug: string) {
  'use cache'
  cacheTag('workshop-minimal', slug)
  cacheLife('hours') // ~1h, matches current revalidate: 3600
  return getMinimalWorkshop(slug)
}

export const getCachedMinimalWorkshop = cache(getMinimalWorkshopCached)
```

Keep the `cache()` (React) wrapper for request-level deduplication.
The `use cache` directive handles persistent caching.

#### Cache Tags for Revalidation

Current tags already map cleanly:

| Tag | Used for | Trigger |
|---|---|---|
| `workshop-minimal` | Workshop metadata | Content update |
| `workshop-product` | Product association | Product/pricing change |
| `workshop-navigation` | Navigation structure | Resource add/remove/reorder |
| `workshop-lesson-{slug}` | Lesson data | Lesson content update |
| `{workshopSlug}` | Per-workshop scope | Any workshop mutation |

`revalidateTag()` calls in `updateWorkshop` already invalidate these.
No tag strategy changes needed — just migrate the cache mechanism.

#### Cache Life Profiles

| Profile | TTL | Use for |
|---|---|---|
| `'hours'` | ~1h | Workshop metadata, product data, navigation |
| `'days'` | ~1d | Lesson transcripts, static MDX content |
| `'seconds'` | ~60s | Pricing data (volatile, region-specific) |

---

## 5. Implementation Plan

### Phase 1: Enable PPR (low risk, ~2h)

1. Add `cacheComponents: true` to `next.config.mjs`
2. Verify build passes — PPR is additive, no routes break without
   Suspense boundaries
3. No behavioral change until shell/hole refactoring in Phase 2

**Files changed:** `next.config.mjs`

### Phase 2: Workshop Page Static Shell (~4-6h)

1. Remove `dynamic = 'force-dynamic'` from workshop page
2. Extract `WorkshopContentList` server component (body content list
   with its own `WorkshopPricing` call)
3. Wrap `WorkshopContentList` in Suspense with skeleton fallback
4. Move `ability` computation into a dynamic server component so it
   doesn't block the shell — pass as prop via Suspense boundary
5. Wrap `ResourceActions` in Suspense with button skeleton fallback
6. Verify `generateStaticParams` produces correct output
7. Test: workshop page shell renders without auth

**Files changed:**
- `src/app/(content)/workshops/[module]/page.tsx`
- New: `src/app/(content)/workshops/_components/workshop-content-list.tsx`
- New or modified: ability wrapper component

### Phase 3: Lesson Page Static Shell (~3-4h)

1. Remove `dynamic = 'force-dynamic'` from lesson page
2. The lesson MDX is already clean (no pricing components) — static
   shell includes title + compiled MDX body
3. `PlayerContainer` is already Suspense-wrapped — streams as hole
4. Verify `generateStaticParams` (already generates all lesson slugs)
5. Test: lesson page renders title + body without auth

**Files changed:**
- `src/app/(content)/workshops/[module]/[lesson]/(view)/page.tsx`
- `src/app/(content)/workshops/[module]/[lesson]/(view)/shared-page.tsx`

### Phase 4: Caching Migration (~3-4h)

1. Migrate `getCachedMinimalWorkshop`, `getCachedWorkshopProduct`,
   `getCachedWorkshopNavigation` from `unstable_cache` to `use cache`
   with `cacheTag` + `cacheLife`
2. Migrate `getCachedLesson`, `getCachedLessonMuxPlaybackId`,
   `getCachedLessonVideoTranscript` similarly
3. Verify revalidation still works (existing `revalidateTag` calls
   remain compatible)
4. Test cache hit/miss behavior across deploys

**Files changed:**
- `src/lib/workshops-query.ts`
- `src/lib/lessons-query.ts`

### Phase 5: Validation & Optimization (~2h)

1. Measure TTFB, LCP, CLS with and without PPR
2. Audit Suspense boundary placement — ensure no dynamic code leaks
   into static shell
3. Add loading.tsx fallbacks if needed for edge cases
4. Performance regression test on CI

---

## 6. Success Metrics

| Metric | Current (baseline) | Target |
|---|---|---|
| TTFB (workshop page) | Measure at phase start | < 200ms (from CDN edge) |
| LCP (workshop page) | Measure at phase start | < 1.5s |
| TTFB (lesson page) | Measure at phase start | < 200ms (from CDN edge) |
| LCP (lesson page) | Measure at phase start | < 2.0s (video player thumbnail) |
| CLS | Measure at phase start | < 0.1 |
| Time to interactive (pricing widget) | Measure at phase start | < 3s (streams after shell) |
| Core Web Vitals score | Measure at phase start | All green |

Baseline measurements should be taken before Phase 1 on production
traffic to establish the delta.

---

## 7. Risks & Mitigations

### Hydration Mismatches

**Risk:** Client components inside the static shell render different
HTML on the server (prerender) vs client (hydrate) because user state
isn't available during prerender.

**Mitigation:**
- All user-dependent UI lives inside Suspense boundaries (dynamic
  holes), never in the static shell
- `ResourceActions` already renders `null` when progress context is
  empty — matches the prerendered state (skeleton fallback)
- `ModuleResourceList` is `'use client'` and returns `null` when
  `moduleNavigation` is falsy — safe for prerender

### Cache Invalidation Complexity

**Risk:** Migrating from `unstable_cache` to `use cache` changes cache
semantics. `use cache` functions are automatically deduplicated by
argument identity — complex objects as arguments may cause cache misses.

**Mitigation:**
- Current cached functions already take simple string arguments (slugs,
  IDs) — no object identity issues
- Keep `revalidateTag()` calls unchanged — they work with both APIs
- Add integration tests that verify revalidation after content updates

### User-Specific Content in Static Shell

**Risk:** Accidentally including purchase-gated or auth-dependent data
in the prerendered shell, causing content to flash then disappear on
hydration.

**Mitigation:**
- The `WorkshopPricing` component is the single gate for all user-
  specific rendering. Keep it entirely inside Suspense boundaries
- Never await `getAbilityForResource` outside a Suspense-wrapped
  dynamic component in the page body
- The workshop page's `ability.canViewWorkshop` prop passed to
  `ResourceActions` must move into the dynamic hole (see Phase 2, step 4)

### MDX with Pricing Components

**Risk:** The workshop page MDX body currently receives pricing-aware
`mdxComponents` (via `createPricingMdxComponents`). If the MDX source
contains pricing-related shortcodes, they'll block static rendering.

**Mitigation:**
- Audit MDX content for pricing shortcodes — if none exist in practice,
  compile with static-only components for the shell
- If pricing shortcodes are used, wrap them in a client component that
  lazy-loads pricing state, or extract them into a separate dynamic
  section outside the MDX render

### Build Time Impact

**Risk:** `generateStaticParams` queries all workshops and all lessons
at build time. With PPR enabled and `force-dynamic` removed, the build
must successfully prerender each page's static shell.

**Mitigation:**
- `generateStaticParams` already has try/catch with fallback to empty
  array — graceful degradation if DB is unavailable
- Static shell rendering only needs `getCachedMinimalWorkshop` (fast,
  cacheable) — no auth or purchase queries run during prerender
- Monitor build duration; if it grows significantly, consider limiting
  `generateStaticParams` to recently-updated workshops
