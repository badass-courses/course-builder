# Business Logic Extraction Plan (lib/ directory)

## Scope

**Active Apps Only**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Key Principle: Non-Identical = Accidental Drift

When files are ~80-95% identical across apps, the variations are **accidental drift** from incomplete updates or new apps being created by copying older apps - NOT intentional differences.

**Strategy to pick the canonical version:**
1. **Primary**: Pick the **largest file** (most complete implementation)
2. **Secondary**: Review diff to confirm larger = more features (not just whitespace)
3. **Ignore timestamps**: New apps might be copied from older apps, so "newest" isn't reliable

**Domain-specific sources (from analysis):**
| Domain | Best Source | Reason |
|--------|-------------|--------|
| Entitlements, commerce | ai-hero | Largest, most complete |
| Cohorts core logic | ai-hero | 524 lines vs 469 (dev-build) |
| Live events, workshops | epicdev-ai | 1336 lines vs 564 (others) |
| Events query | dev-build/epicdev-ai | 1097 lines vs 96 (ai-hero) |
| Lists | dev-build | 560 lines vs 521 (ai-hero) |

---

## TIER 1: 100% Identical (12 files - Extract Immediately)

| File | MD5 Hash | Lines |
|------|----------|-------|
| ai-chat-query.ts | 96331c26ee31a81846a5180ce0016e97 | ~100 |
| completions-query.ts | f7be38142268cd9756a0e7598a037d22 | ~80 |
| discord-utils.ts | fce29380a96e18054dc77807677aa517 | ~150 |
| organizations.ts | b8623cce6768a5df85724618d3005c7c | ~200 |
| pricing-query.ts | 1524eff841db1522fa31f2a07ead8c56 | ~150 |
| progress.ts | 2bf0d355611f12be30fed5cd73c2992c | ~100 |
| modules-query.ts | b485fe6e49793435a8886bf2be26944a | 71 |
| module.ts | abe1b57874c918c619ef3d3af9d27d96 | 115 |
| subscriptions.ts | 36ff6b78a2c8e82b7e1eb73770761e51 | ~80 |
| resources-query.ts | 3eaf43ccbcfb04a7422ed5d8ca8a47c1 | ~100 |
| image-resource-query.ts | a419ec482ad1941d07f42f521c04332b | ~60 |

**Action**: Extract directly, simple re-export pattern.

---

## TIER 2: 4/5 Identical (6 files - Pick Majority or Largest)

| File | Outlier | Majority Version | Recommendation |
|------|---------|------------------|----------------|
| entitlements.ts | ai-hero (506 lines) | 435 lines | **Use ai-hero** - has extra features |
| emails.ts | ai-hero (45 lines) | 47 lines | Use majority (trivial diff) |
| typesense.ts | ai-hero (50 lines) | 55 lines | Use majority |
| tags-query.ts | epicdev-ai | all others same | Use majority |
| events-query.ts | ai-hero (96 lines) | 1097 lines | **Use majority** - ai-hero missing live events |
| content-navigation.ts | ai-hero | 3 others same | Use majority (trivial: return type annotation) |

### entitlements.ts Analysis
```
ai-hero:    506 lines  (LARGEST - use this)
dev-build:  435 lines
epicdev-ai: 435 lines
```
ai-hero has ~70 extra lines of entitlement logic. Extract ai-hero version.

### events-query.ts Analysis
```
ai-hero:    96 lines   (SMALLEST - missing live events)
dev-build:  1097 lines (LARGEST)
epicdev-ai: 1097 lines
```
ai-hero never had live events, so it's minimal. Use dev-build/epicdev-ai version.

---

## TIER 3: 3 Clusters (ai-hero vs epicdev-ai vs dev-build group)

Pattern: ai-hero = original, epicdev-ai = forked with event features, dev-build/just-react/code-with-antonio = shared cluster

| File | ai-hero | epicdev-ai | dev-build cluster | Recommendation |
|------|---------|------------|-------------------|----------------|
| **cohorts-query.ts** | 524 lines | 248 lines | 469 lines | **ai-hero** - most cohort features |
| **workshops-query.ts** | 564 lines | **1336 lines** | 564 lines | **epicdev-ai** - live workshop features |
| **products-query.ts** | **260 lines** | 152 lines | 137 lines | **ai-hero** - most product features |
| **certificates.ts** | differs | differs | same (3 apps) | Review diffs |
| **entitlements-query.ts** | **190 lines** | 170 lines | 117 lines | **ai-hero** |
| **cohort.ts** | 139 lines | 113 lines | **140 lines** | **dev-build** (trivially largest) |
| video-resource-query.ts | differs | differs | same (2 apps) | Review diffs |
| typesense.ts | differs | differs | same (3 apps) | Review diffs |

### workshops-query.ts Analysis
```
ai-hero:    564 lines
dev-build:  564 lines
epicdev-ai: 1336 lines  (LARGEST - live workshop scheduling features)
```
epicdev-ai has 2.4x more code for live workshop functionality. **This is intentional domain expertise, not drift.**

### cohorts-query.ts Analysis
```
ai-hero:    524 lines  (LARGEST)
dev-build:  469 lines
epicdev-ai: 248 lines  (SMALLEST - cohort logic moved to workshops-query?)
```
ai-hero has the most complete cohort querying. epicdev-ai may have moved some logic to workshops.

---

## TIER 4: Multiple Variants (Requires Merge)

### posts-query.ts (COMPLEX - needs careful merge)
| App | Lines | Unique Features |
|-----|-------|-----------------|
| ai-hero | 1086 | Auth checks (`ability.can('update', 'Content')`) |
| epicdev-ai | 1304 | ? |
| dev-build | 1309 | `getProductForPost()` commerce function (215 lines) |
| just-react | 1309 | Same as dev-build |
| code-with-antonio | 1309 | Same as dev-build |

**Issue**: dev-build has commerce fn but REMOVED auth checks.
**Recommendation**: Merge dev-build's `getProductForPost()` INTO ai-hero's auth-protected base.

### lessons-query.ts (needs merge)
| App | Lines | Unique Features |
|-----|-------|-----------------|
| ai-hero | 746 | `getAllLessons()`, `revalidateTag('workshop-navigation')` |
| others | 751 | `getAllLessonsForUser(userId)` - user-scoped |

**Recommendation**: Keep BOTH functions, add missing revalidate tag.

### lists-query.ts (4 different versions)
| App | Lines |
|-----|-------|
| ai-hero | 521 |
| epicdev-ai | 521 |
| dev-build | 560 |
| just-react | 560 |
| code-with-antonio | 527 |

**Recommendation**: Use dev-build (560 lines, largest).

---

## Feature Gap Files (EXTRACT & ADD TO ALL APPS)

**Goal**: Feature parity across all apps. These files exist in some apps but should be available to all.

### From epicdev-ai (live events/scheduling)
Extract and add to other apps:
- calendar-invite-utils.ts
- google-calendar.ts
- live-workshops-query.ts
- sections-query.ts
- exercises-query.ts, exercises.ts
- transform-workshop-result.ts
- user-has-entitlement-for-product.ts
- user-has-product.ts
- skill-cookie.ts
- sale-banner-helpers.ts

### From ai-hero (surveys/convertkit)
Extract and add to other apps:
- convertkit.ts
- surveys-query.ts, surveys.ts

### From dev-build (feed/products)
Extract and add to other apps:
- feed-query.ts
- product-map.ts

### May remain app-specific (evaluate)
- github-query.ts (may be epicdev-specific integration)
- kit-query.ts (may be epicdev-specific)

**Strategy**: Extract to `@coursebuilder/next/query/`, then import into all apps.

---

## Extraction Strategy

### For 100% Identical Files
```typescript
// apps/ai-hero/src/lib/organizations.ts
export * from '@coursebuilder/next/query/organizations'
```

### For Domain-Specific Files (e.g., workshops-query.ts from epicdev-ai)
```typescript
// packages/next/src/query/workshops-query.ts
// Extracted from epicdev-ai - has live workshop features

// apps/ai-hero/src/lib/workshops-query.ts
export * from '@coursebuilder/next/query/workshops-query'
```

### For Merged Files (e.g., posts-query.ts)
1. Start with ai-hero base (has auth)
2. Add `getProductForPost()` from dev-build
3. Extract to shared package
4. All apps re-export

---

## Implementation Priority

### Phase 1: 100% Identical (12 files)
Immediate extraction, no decisions needed.

### Phase 2: 4/5 Identical (6 files)
Pick version based on analysis above.

### Phase 3: Domain-Specific (3 files)
- workshops-query.ts → epicdev-ai
- events-query.ts → dev-build/epicdev-ai
- cohorts-query.ts → ai-hero

### Phase 4: Merges (3 files)
- posts-query.ts (ai-hero + dev-build features)
- lessons-query.ts (combine both function sets)
- lists-query.ts (use dev-build)

---

## Package Structure

```
packages/next/src/query/
├── index.ts
├── # 100% Identical
├── ai-chat-query.ts
├── completions-query.ts
├── discord-utils.ts
├── organizations.ts
├── pricing-query.ts
├── progress.ts
├── modules-query.ts
├── module.ts
├── subscriptions.ts
├── resources-query.ts
├── image-resource-query.ts
├── # Picked from specific app
├── entitlements.ts         # from ai-hero
├── entitlements-query.ts   # from ai-hero
├── products-query.ts       # from ai-hero
├── cohorts-query.ts        # from ai-hero
├── workshops-query.ts      # from epicdev-ai (live events)
├── events-query.ts         # from dev-build/epicdev-ai
├── # Merged
├── posts-query.ts          # ai-hero base + dev-build commerce
├── lessons-query.ts        # combined
└── lists-query.ts          # from dev-build
```

---

## Verification

```bash
# Compare file identity
md5 apps/*/src/lib/organizations.ts

# Compare sizes for drift analysis
wc -l apps/*/src/lib/workshops-query.ts

# Build after changes
pnpm build:all
```
