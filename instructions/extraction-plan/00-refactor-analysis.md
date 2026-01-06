# Course Builder Monorepo Extraction Analysis

## Scope

### Active Apps (IN SCOPE - 5 apps)
| App | Purpose | Canonical For | Lineage |
|-----|---------|---------------|---------|
| `ai-hero` | AI-assisted learning platform | Posts, lists, cohorts (core logic) | Original/primary |
| `epicdev-ai` | Epic Dev AI platform | Live events, scheduling, module navigation | Forked from ai-hero |
| `dev-build` | Developer education | UI, admin UI | Best UI implementation |
| `code-with-antonio` | Code with Antonio courses | General baseline | Similar to dev-build |
| `just-react` | React-focused courses | - | Standard implementation |

**Current extraction priority**: Business logic & data fetching first, UI components later.
**Goal**: Feature parity across all apps (same features, similar look).

### Ignored Apps (OUT OF SCOPE - 13 apps)
| App | Reason |
|-----|--------|
| `astro-party` | Different stack (Astro) |
| `astro-test` | Test app |
| `course-builder-video-blog` | Not active |
| `course-builder-web` | Not active |
| `craft-of-ui` | Not active |
| `egghead` | Not active |
| `epic-react` | Not active |
| `epic-web` | Not active |
| `go-local-first` | Not active |
| `js-visualized` | Not active |
| `pro-aws` | Not active |
| `pro-nextjs` | Not active |
| `value-based-design` | Not active |

---

## 1. Repo Map

### Workspace Configuration
- **Package Manager**: PNPM v8.15.5+ with workspaces
- **Build Tool**: Turborepo
- **Workspace Paths**: `apps/*`, `packages/*`, `packages/config/**`, `docs`, `cli`

### Existing Packages (18 packages)
| Package | Purpose | Status |
|---------|---------|--------|
| `@coursebuilder/core` | Framework-agnostic core | ✅ Used |
| `@coursebuilder/ui` | Shared shadcn/ui components | ✅ Used |
| `@coursebuilder/next` | Next.js bindings | 🔄 Needs expansion |
| `@coursebuilder/adapter-drizzle` | DB adapter | ✅ Used |
| `@coursebuilder/utils-*` | 13 utility packages | ❌ 0% adoption, but some useful |
| `@coursebuilder/email-templates` | Email templates | ✅ Used |

### Simplify: Use What Already Exists

Instead of creating new packages, use utils from existing packages:

| Utility | Already Exists In | Action |
|---------|-------------------|--------|
| `cn` | `@coursebuilder/ui/utils/cn` | Import from ui |
| `guid` | `@coursebuilder/utils-core/guid` | Import from utils-core |
| `sendAnEmail` | `@coursebuilder/utils-email` | Import from utils-email |

**Approach**: Don't create new packages - adopt existing ones. Apps re-export for backward compatibility.

---

## 2. Duplication Hotspots (Ranked by Impact)

### TIER 1: CRITICAL - Identical files across active apps

#### 1.1 Server Utilities - 100% identical
| File | Apps | Risk | Target Package |
|------|------|------|----------------|
| `redis-client.ts` | 5 | LOW | `@coursebuilder/next/server` |
| `with-skill.ts` | 5 | LOW | `@coursebuilder/next/server` |

```typescript
// redis-client.ts - IDENTICAL in all 5 apps
import { Redis } from '@upstash/redis'
export const redis = Redis.fromEnv()
```

```typescript
// with-skill.ts - IDENTICAL in all 5 apps
export type SkillRequest = NextRequest
export function withSkill(params: NextHandler): NextHandler { return params }
```

#### 1.2 Pure Utilities - 100% identical (packages exist but 0% adoption)
| File | Apps | Package Exists? | Adoption |
|------|------|-----------------|----------|
| `cn.ts` | 5 | ✅ `@coursebuilder/utils-ui` | 0% |
| `guid.ts` | 5 | ✅ `@coursebuilder/utils-core` | 0% |
| `send-an-email.ts` | 5 | ✅ `@coursebuilder/utils-email` | 0% |
| `get-unique-filename.ts` | 5 | ✅ `@coursebuilder/utils-file` | 0% |
| `get-og-image-url-for-resource.ts` | 5 | ✅ `@coursebuilder/utils-seo` | 0% |

#### 1.3 Single File Components - 100% identical
| File | Apps | Risk | Target Package |
|------|------|------|----------------|
| `theme-provider.tsx` | 5 | LOW | `@coursebuilder/next/providers` |
| `spinner.tsx` | 5 | LOW | `@coursebuilder/ui` |
| `party.tsx` | 5 | LOW | `@coursebuilder/ui` |
| `player-skeleton.tsx` | 5 | LOW | `@coursebuilder/ui` |

### TIER 2: HIGH - TSX Component Directories

See [05-component-extraction-NEW.md](./05-component-extraction-NEW.md) for complete analysis with MD5 hashes.

**Summary Statistics**:
| Category | 100% Identical | 4/5 Identical | Multiple Variants |
|----------|----------------|---------------|-------------------|
| Single Files | 7 | 1 | 6+ (app-specific) |
| CodeHike | 10 | 2 | 1 |
| Certificates | 2 | 3 (branding) | - |
| List-editor | 4 | 2 | 3 |
| Resources-crud | 4 | 1 | 1 |
| Feedback-widget | 3 | - | - |
| Team-inquiry | 3 | - | - |
| Hooks | 5 | 3 | 1 |
| **TOTAL** | **38** | **12** | **12+** |

#### 2.1 Single TSX Files - 100% Identical (7 files)
| File | MD5 Hash | Target |
|------|----------|--------|
| `spinner.tsx` | 6bf0df7d5fcd5a99da1f74036419b2e7 | `@coursebuilder/ui` |
| `party.tsx` | 524774a64dd90f0cf1bcd41a39810f6b | `@coursebuilder/ui` |
| `player-skeleton.tsx` | 1e9b29b7995385643f0d526ed5b275b5 | `@coursebuilder/ui` |
| `providers.tsx` | 0a770e1983f2e3e184791fb58071c1ab | `@coursebuilder/next/providers` |
| `theme-provider.tsx` | fd461456d86914fc23038dca9dc7dd85 | `@coursebuilder/next/providers` |
| `video-block-newsletter-cta.tsx` | 0527348fa494087be9920bcacadec130 | `@coursebuilder/next/components` |
| `assistant-workflow-selector.tsx` | 66e4575eb45525222c15506579b296a7 | `@coursebuilder/next/components` |

#### 2.2 CodeHike Components - 10/13 100% identical
**100% identical (10 files)**: callout, diff, focus.client, focus, fold, handlers, link, mark, smooth-pre, token-transitions
**4/5 identical (2 files)**: copy-button (ai-hero differs), scrollycoding (epicdev-ai differs)
**Multiple variants (1 file)**: code.tsx (4 unique versions)

#### 2.3 Feedback-widget & Team-inquiry - 100% Identical
- `feedback-widget/` (3 files): feedback-actions, feedback-insert, use-feedback-form
- `team-inquiry/` (3 files): team-inquiry-actions, team-inquiry-form, team-inquiry-schema

#### 2.4 Resources-crud - 4/6 100% identical
**100% identical**: create-resource-page, new-lesson-video-form, video-upload-form-item, video-uploader
**4/5 identical**: workshop-resources-edit (epicdev-ai differs)

#### 2.5 List-editor - 4/10 100% identical
**100% identical**: draggable-item-renderer, resource-list, search-config, selection-context
**Multiple variants**: hit, list-resources-edit, resources-infinite-hits

#### 2.6 Certificates - epicdev-ai has different branding
**100% identical**: cohort-certificate, module-certificate
**4/5 identical (branding)**: background, logo, signature (epicdev-ai differs)

### TIER 3: HIGH - Business Logic (lib/)

See [06-business-logic-extraction.md](./06-business-logic-extraction.md) for complete analysis.

#### 3.1 Query Files - 100% identical (12 files, extract immediately)
| File | MD5 Hash | Lines |
|------|----------|-------|
| `ai-chat-query.ts` | 96331c26ee31a81846a5180ce0016e97 | ~100 |
| `completions-query.ts` | f7be38142268cd9756a0e7598a037d22 | ~80 |
| `discord-utils.ts` | fce29380a96e18054dc77807677aa517 | ~150 |
| `organizations.ts` | b8623cce6768a5df85724618d3005c7c | ~200 |
| `pricing-query.ts` | 1524eff841db1522fa31f2a07ead8c56 | ~150 |
| `progress.ts` | 2bf0d355611f12be30fed5cd73c2992c | ~100 |
| `modules-query.ts` | b485fe6e49793435a8886bf2be26944a | 71 |
| `module.ts` | abe1b57874c918c619ef3d3af9d27d96 | 115 |
| `subscriptions.ts` | 36ff6b78a2c8e82b7e1eb73770761e51 | ~80 |
| `resources-query.ts` | 3eaf43ccbcfb04a7422ed5d8ca8a47c1 | ~100 |
| `image-resource-query.ts` | a419ec482ad1941d07f42f521c04332b | ~60 |

#### 3.2 Query Files - 4/5 Identical (6 files, pick majority or largest)
| File | Outlier | Majority | Recommendation |
|------|---------|----------|----------------|
| `entitlements.ts` | ai-hero (506 lines) | 435 lines | **Use ai-hero** - has extra features |
| `emails.ts` | ai-hero (45 lines) | 47 lines | Use majority (trivial diff) |
| `typesense.ts` | ai-hero (50 lines) | 55 lines | Use majority |
| `tags-query.ts` | epicdev-ai | all others same | Use majority |
| `events-query.ts` | ai-hero (96 lines) | 1097 lines | **Use majority** - ai-hero missing live events |
| `content-navigation.ts` | ai-hero | 3 others same | Use majority |

#### 3.3 Domain-Specific Files (3 clusters - pick by domain expertise)
| File | ai-hero | epicdev-ai | dev-build cluster | Use |
|------|---------|------------|-------------------|-----|
| `cohorts-query.ts` | **524 lines** | 248 lines | 469 lines | **ai-hero** |
| `workshops-query.ts` | 564 lines | **1336 lines** | 564 lines | **epicdev-ai** (live events) |
| `products-query.ts` | **260 lines** | 152 lines | 137 lines | **ai-hero** |
| `entitlements-query.ts` | **190 lines** | 170 lines | 117 lines | **ai-hero** |
| `cohort.ts` | 139 lines | 113 lines | **140 lines** | **dev-build** |

#### 3.4 Files Needing Merge (3 files)
| File | Issue | Resolution |
|------|-------|------------|
| `posts-query.ts` | dev-build has commerce fn (20KB) but removed auth checks | Merge: ai-hero auth + dev-build commerce |
| `lessons-query.ts` | ai-hero has `getAllLessons()`, others have `getAllLessonsForUser(userId)` | Keep BOTH functions |
| `lists-query.ts` | 4 different versions (521-560 lines) | Use dev-build (560 lines, largest) |

**Note**: workshopsQuery in epicdev-ai is 2.4x larger (1336 vs 564 lines) - intentional domain expertise for live workshop scheduling, NOT accidental drift.

### TIER 4: HIGH - Inngest Functions

See [07-inngest-extraction.md](./07-inngest-extraction.md) for complete analysis.

#### 4.1 Inngest Functions - 100% identical (7 functions, extract immediately)
| Function | MD5 Hash |
|----------|----------|
| `video-resource-attached.ts` | 3f2f2f8f1f8b37271a26ed4574cb1625 |
| `split_video.ts` | e51ff289e7cc1e4639658b3d2c9b9159 |
| `email-send-broadcast.ts` | 28bc363e176c44285609f1e876d16b7a |
| `ensure-personal-organization.ts` | aef8b7f7c3f819835ac00af9ae7ff380 |
| `sync-purchase-tags.ts` | 8c0d7b6613c685d891d5799324120f17 |
| `user-created.ts` | c48bd213d3707f429ba8255335a153a6 |
| `cloudinary/image-resource-created.ts` | 5dbde432ab5216c67c683d9e4920d2b5 |

#### 4.2 Inngest Functions - 4/5 identical (3 functions)
| Function | Outlier | Use Version |
|----------|---------|-------------|
| `create-user-organization.ts` | epicdev-ai differs | 4-app version (ai-hero, dev-build, just-react, code-with-antonio) |
| `cohort-entitlement-sync-workflow.ts` | ai-hero smaller (3764 vs 3944 bytes) | 4-app version (dev-build, epicdev-ai, just-react, code-with-antonio) |
| `send-workshop-access-emails.ts` | ai-hero differs (11318 vs 11321 bytes) | Review both, extract more complete |

#### 4.3 Inngest Functions - Multiple Variants (2 functions, use largest)
| Function | ai-hero | epicdev-ai | dev-build cluster | Use |
|----------|---------|------------|-------------------|-----|
| `post-purchase-workflow.ts` | **20078 bytes** | 19799 bytes | 15935 bytes | **ai-hero** |
| `product-transfer-workflow.ts` | **21076 bytes** | 13994 bytes | 13981 bytes | **ai-hero** |

#### 4.4 Feature Gap Inngest Functions (EXTRACT & ADD TO ALL APPS)
**From epicdev-ai (live events)**: bulk-calendar-invites.ts, calendar-sync.ts, event-reminder-broadcast.ts, post-event-purchase.ts, unlist-past-events.ts
**From ai-hero**: cohort-entitlement-sync-user.ts

### TIER 5: HIGH - API Routes & Pages

See [08-pages-extraction.md](./08-pages-extraction.md) for complete analysis with MD5 hashes.

**Summary Statistics**:
| Category | 100% Identical | 4/5 Identical | Multiple Variants |
|----------|----------------|---------------|-------------------|
| API Routes | 15 | 2 | 3 |
| Admin Pages | 4 | 5 | 2 |
| Commerce Pages | 0 | 3 | 2 |
| User Pages | 1 | 1 | 3 |
| Root Files | 1 | 0 | 4 |
| **TOTAL** | **21** | **11** | **14** |

#### 5.1 API Routes - 100% Identical (15 routes, extract immediately)
| Route | MD5 Hash |
|-------|----------|
| `api/auth/[...nextauth]/route.ts` | 326e22bee4eec8236b3c992d51de1540 |
| `api/trpc/[trpc]/route.ts` | fa3064c97af5ecb418f2fd05d246c636 |
| `api/inngest/route.ts` | 6f80ce0bfdd5970a5f21eb9c15027925 |
| `api/uploadthing/route.ts` | 69180b2ff1894efe76b231ffad26837e |
| `api/mux/route.ts` | f60dde8adaf79dbd8c6cb8960b44fdac |
| `api/mux/webhook/route.ts` | c8a78a7931442dc8ba6cdb3df5f8de05 |
| `api/postmark/webhook/route.ts` | 9644ab2a40675d49f0acc1c77405c48a |
| `api/thumbnails/route.ts` | 8f7700fc11acd74d19e61a0d4d1d7585 |
| `api/cron/route.ts` | 71da79b1bc0e4271fc34dc7cb510b76a |
| `api/ocr/webhook/route.ts` | b48f7c16d6999d7bad7f68e047a1fed9 |
| `api/coursebuilder/[...nextCourseBuilder]/route.ts` | 3913b4c23a981921bafd584d32e11484 |
| `api/videos/[videoResourceId]/route.ts` | c609d381f520ed2699b0cf3dac2ff01d |
| `api/uploads/new/route.ts` | bfef1d51cec97e6974e39959b8b1963f |
| `api/uploads/signed-url/route.ts` | e1396523ffaf3c40bd7399421fc4b0cc |
| `api/posts/route.ts` | 04deb94197c5898cbe756c232dc85c02 |

**Note**: ai-hero uses `api/(content)/...` route groups for some routes, but content is 100% identical.

#### 5.2 Admin Pages - 100% Identical (4 pages)
| Page | MD5 Hash |
|------|----------|
| `admin/tags/page.tsx` | 3eb276d0e7bf99554cfc835357dc4ac7 |
| `admin/coupons/page.tsx` | 608ac8e02f617bbe0fe9e655bfa9ccac |
| `admin/emails/new/page.tsx` | dfbc56b036d4d8f1bd60819de47f79b1 |

#### 5.3 Feature Gap API Routes (extract & add to all apps)
**From ai-hero**: `api/shortlinks/route.ts`
**From epicdev-ai (live events)**: `api/progress/route.ts`, `api/workshops/[slug]/route.ts`, `api/workshops/[slug]/access/route.ts`

### TIER 6: MEDIUM - Hooks
| File | Apps | Identical? | Target Package |
|------|------|------------|----------------|
| `use-is-mobile.ts` | 5 | ✅ 100% | `@coursebuilder/next/hooks` |
| `use-socket.ts` | 5 | 🔄 pick newest | `@coursebuilder/next/hooks` |
| `use-mux-player.tsx` | 5 | 🔄 pick newest | `@coursebuilder/next/hooks` |
| `use-mux-player-prefs.ts` | 5 | ✅ ~90% | `@coursebuilder/next/hooks` |
| `use-convertkit-form.ts` | 5 | ✅ ~95% | `@coursebuilder/next/hooks` |
| `use-transcript.tsx` | 5 | 🔄 pick newest | `@coursebuilder/next/hooks` |
| `use-mutation-observer.ts` | 5 | ✅ 100% | `@coursebuilder/next/hooks` |

### TIER 7: MEDIUM - Providers
| File | Apps | Identical? | Target Package |
|------|------|------------|----------------|
| `amplitude-provider.tsx` | 5 | 🔄 pick newest | `@coursebuilder/next/providers` |

---

## 3. Target Architecture

```
packages/
├── core/                          # ✅ EXISTS - Framework-agnostic core
├── adapter-drizzle/               # ✅ EXISTS - DB adapter
│
├── ui/                            # ✅ EXISTS → EXPAND with shared components
│   ├── src/
│   │   ├── primitives/           # Existing shadcn components
│   │   ├── codehike/             # NEW - CodeHike components
│   │   ├── certificates/         # NEW - Certificate components
│   │   ├── list-editor/          # NEW - List editor components
│   │   ├── resources-crud/       # NEW - CRUD components
│   │   ├── feedback-widget/      # NEW - Feedback widget
│   │   ├── team-inquiry/         # NEW - Team inquiry
│   │   ├── spinner.tsx           # NEW
│   │   ├── party.tsx             # NEW
│   │   └── player-skeleton.tsx   # NEW
│
├── next/                          # 🔄 EXPAND - Next.js specific (big package)
│   ├── src/
│   │   ├── server/               # redis-client, with-skill, logger, auth utils
│   │   ├── providers/            # theme, amplitude, mux-player
│   │   ├── hooks/                # use-is-mobile, use-socket, use-mux-player, etc.
│   │   ├── query/                # All query files (completions, lessons, etc.)
│   │   ├── inngest/              # Shared inngest functions
│   │   ├── api/                  # Shared API route handlers (auth, trpc, inngest, mux, etc.)
│   │   ├── admin/                # Shared admin pages (tags, coupons, emails)
│   │   └── analytics/            # Analytics utilities
│
├── utils/                         # 🆕 CONSOLIDATE - General utilities
│   ├── src/
│   │   ├── cn.ts                 # from utils-ui
│   │   ├── guid.ts               # from utils-core
│   │   ├── cookies.ts            # from utils-browser
│   │   ├── chicago-title.ts      # from utils-string
│   │   ├── filter-resources.ts   # from utils-resource
│   │   ├── og-image.ts           # from utils-seo
│   │   └── index.ts
│
├── media/                         # 🆕 CONSOLIDATE - Media utilities
│   ├── src/
│   │   ├── video-resource.ts     # from utils-media
│   │   ├── cloudinary.ts         # from utils-media
│   │   ├── get-unique-filename.ts # from utils-file
│   │   └── index.ts
│
├── email/                         # KEEP - External deps (Postmark/Resend)
│   └── src/send-an-email.ts
│
├── search/                        # KEEP - Typesense deps
│   └── src/typesense-adapter.ts
│
├── ai/                            # KEEP - OpenAI deps
│   └── src/...
│
├── discord/                       # 🆕 NEW - Discord utilities
│   └── src/discord.ts
│
└── commerce/                      # 🆕 NEW - Pricing, checkout, etc.
    └── src/...                    # Extract from apps later
```

### Package Principles

1. **Consolidate small utils**: Don't have 13 tiny packages, merge into logical groups
2. **Separate by external deps**: Packages with heavy external deps (OpenAI, AWS, Typesense) stay separate
3. **`@coursebuilder/next` is the big one**: Most Next.js app code goes here
4. **`@coursebuilder/ui` for components**: All shared React components
5. **Create new packages when domain is clear**: discord, commerce, etc.

---

## 4. Refactor Playbook

### Extraction Rules

1. **Pure functions first**: Extract utilities with no dependencies before those with app-specific imports.

2. **Re-export pattern**: Apps keep their file paths, re-export from shared packages:
   ```typescript
   // apps/ai-hero/src/utils/cn.ts
   export { cn } from '@coursebuilder/utils-ui/cn'
   ```

3. **Config injection**: Shared code accepts config, doesn't import app internals:
   ```typescript
   // ❌ BAD - imports app env
   import { env } from '@/env.mjs'

   // ✅ GOOD - accepts config
   export function createLogger(config: LoggerConfig) { ... }
   ```

4. **Non-identical files = pick the largest/most complete version**: When files are ~80-95% identical, the variations are likely accidental drift from incomplete updates or new apps being copied from older apps. Strategy:
   - **Primary**: Pick the largest file (most complete implementation)
   - **Secondary**: Review diff to confirm larger = more features (not just whitespace)
   - **Ignore timestamps**: New apps might be copied from older apps, so "newest" isn't reliable
   - Extract that version as canonical, all apps adopt it

   **Canonical source by domain:**
   | Domain | Best Source | Notes |
   |--------|-------------|-------|
   | Posts, lists, cohorts (core) | ai-hero | Most battle-tested |
   | Live events, scheduling | epicdev-ai | Created from ai-hero, extended for events |
   | Module navigation | epicdev-ai | Recent DRY work done here |
   | UI, admin UI | dev-build | Best UI implementation |
   | General baseline | code-with-antonio | Similar to dev-build, created few weeks earlier |

   ```bash
   # Find largest version (primary criterion)
   wc -l apps/*/src/lib/lessons-query.ts

   # Confirm differences are additional features
   diff apps/ai-hero/src/lib/lessons-query.ts apps/dev-build/src/lib/lessons-query.ts
   ```

5. **Factory pattern only when truly needed**: Only use factory/config pattern when there are genuine app-specific requirements (different DB schemas, different auth providers), NOT for accidental variations.

6. **Server/client separation**: Use Next.js `server-only` and proper exports conditions.

### Circular Dependency Prevention

1. `@coursebuilder/core` → no internal deps
2. `@coursebuilder/utils-*` → may depend on `core`, never on `next` or apps
3. `@coursebuilder/next` → may depend on `core`, `utils-*`
4. Apps → may depend on any package

---

## 5. Migration Plan (PR Series)

### Phase 0: Package Consolidation (do first)

| PR | Description | Risk |
|----|-------------|------|
| PR 0.1 | Create `@coursebuilder/utils` - consolidate utils-ui, utils-core, utils-string, utils-browser, utils-seo, utils-resource | LOW |
| PR 0.2 | Create `@coursebuilder/media` - consolidate utils-media, utils-file | LOW |
| PR 0.3 | Create `@coursebuilder/discord` - new package | LOW |
| PR 0.4 | Delete empty/unused utils-* packages | LOW |

### Phase 1: Server & Utils Adoption

| PR | Description | Files | Risk |
|----|-------------|-------|------|
| PR 1.1 | Extract server utilities to @coursebuilder/next/server | 12 | LOW |
| PR 1.2 | Adopt @coursebuilder/utils (cn, guid, etc.) in all apps | 36+ | LOW |
| PR 1.3 | Adopt @coursebuilder/email in all apps | 6 | LOW |

### Phase 2: Providers & Hooks

| PR | Description | Files | Risk |
|----|-------------|-------|------|
| PR 2.1 | Extract providers to @coursebuilder/next/providers | 18 | LOW-MEDIUM |
| PR 2.2 | Extract hooks to @coursebuilder/next/hooks | 30+ | LOW-MEDIUM |

### Phase 3: TSX Components to @coursebuilder/ui

| PR | Description | Files | Risk |
|----|-------------|-------|------|
| PR 3.1 | Extract codehike/ components | 65 | LOW |
| PR 3.2 | Extract certificates/ components | 25 | LOW |
| PR 3.3 | Extract list-editor/ components | 48+ | MEDIUM |
| PR 3.4 | Extract resources-crud/ components | 36 | MEDIUM |
| PR 3.5 | Extract single components (spinner, party, etc.) | 15 | LOW |

### Phase 4: Business Logic to @coursebuilder/next/query

| PR | Description | Files | Risk |
|----|-------------|-------|------|
| PR 4.1 | Extract query files (pick largest/most complete versions) | 60+ | LOW |
| PR 4.2 | Create @coursebuilder/discord with discord utils | 5 | LOW |

### Phase 5: Inngest Functions to @coursebuilder/next/inngest

| PR | Description | Files | Risk |
|----|-------------|-------|------|
| PR 5.1 | Extract shared inngest functions (pick newest) | 30+ | LOW |

### Phase 6: API Routes & Pages to @coursebuilder/next

| PR | Description | Files | Risk |
|----|-------------|-------|------|
| PR 6.1 | Extract 15 identical API route handlers | 75 | LOW |
| PR 6.2 | Extract 4 identical admin pages | 20 | LOW |
| PR 6.3 | Add feature gap API routes to all apps | 20 | LOW |

### Phase 7: Future - Commerce Package

| PR | Description | Risk |
|----|-------------|------|
| PR 7.1 | Create `@coursebuilder/commerce` - pricing, checkout components | MEDIUM |

---

## 6. Feature Parity Goal

**All apps should have the same functionality.** Files that currently exist in only one app should be:
1. Extracted to shared packages
2. Imported into all apps

See detailed lists in:
- [06-business-logic-extraction.md](./06-business-logic-extraction.md) - "Feature Gap Files"
- [07-inngest-extraction.md](./07-inngest-extraction.md) - "Feature Gap Functions"
- [08-pages-extraction.md](./08-pages-extraction.md) - "Feature Gap API Routes"

## 7. "Do Not Extract" List

| File/Pattern | Reason |
|--------------|--------|
| `src/server/auth.ts` | App-specific auth config (providers, callbacks) |
| `src/db/schema.ts` | App-specific DB schema |
| `src/env.mjs` | App-specific env validation |
| `src/app/layout.tsx` | App-specific root layout (branding, metadata) |
| `navigation/footer.tsx` | App-specific branding |
| Brand assets (logos, etc.) | Intentionally unique per app |

---

## 8. Metrics

**Current state (5 active apps)**:
- ~400+ duplicated files across categories:
  - 15 identical API routes (100% same)
  - 38 identical TSX components (100% same)
  - 12 identical business logic files (100% same)
  - 7 identical inngest functions (100% same)
  - 4 identical admin pages (100% same)
- 0% adoption of existing utils packages
- No shared hooks/providers/components

**After refactor**:
- ~60% reduction in duplicated code
- 100% adoption of utils packages
- Centralized hooks/providers/components
- Shared API route handlers
- Shared admin pages
- Faster onboarding for new apps

---

## 9. Verification Strategy

```bash
# Before any PR
pnpm build:all
pnpm typecheck
pnpm test

# After each PR
pnpm build:all
pnpm typecheck

# Manual testing
pnpm --filter="ai-hero" dev
```

---

## Document Index

| Document | Description |
|----------|-------------|
| [01-server-utilities.md](./01-server-utilities.md) | Server utilities extraction |
| [02-providers-extraction.md](./02-providers-extraction.md) | Provider components |
| [03-hooks-extraction.md](./03-hooks-extraction.md) | React hooks |
| [04-utils-adoption.md](./04-utils-adoption.md) | Existing utils adoption |
| [05-component-extraction-NEW.md](./05-component-extraction-NEW.md) | TSX components |
| [06-business-logic-extraction.md](./06-business-logic-extraction.md) | lib/ business logic |
| [07-inngest-extraction.md](./07-inngest-extraction.md) | Inngest functions |
| [08-pages-extraction.md](./08-pages-extraction.md) | API routes & pages |
