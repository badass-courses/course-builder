# Course Builder Monorepo Extraction Analysis

> **Strategic Reference**: See also `.cursor/plans/monorepo_consolidation_strategy_6b6597df.plan.md` for high-level strategy and leverage points analysis.

## Executive Summary

### Root Cause of Drift
**189+ `@/` imports** in `lib/` files block all meaningful extraction. The apps share ~80% code but have accumulated significant drift due to:
1. Fork-based app creation without propagation mechanism
2. Tight coupling via `@/` imports (db, auth, env)
3. Premature utils package creation without adoption

### Strategic Leverage Points (Ranked by Impact)
| Rank | Leverage Point | Impact | Risk | Status |
|------|---------------|--------|------|--------|
| L1 | CourseBuilderContext Factory | HIGH | Medium | Future (unblocks lib/) |
| L2 | Utils Package Adoption | MEDIUM | Zero | ~50 files remaining |
| L3 | Hooks/Providers Extraction | LOW-MEDIUM | Low | Ready to extract |

---

## Scope

### Active Apps (IN SCOPE - 5 apps)
| App | Purpose | Canonical For | Lineage |
|-----|---------|---------------|---------|
| `ai-hero` | AI-assisted learning platform | Posts, lists, cohorts (core logic) | Original/primary |
| `epicdev-ai` | Epic Dev AI platform | Live events, scheduling, module navigation | Forked from ai-hero |
| `dev-build` | Developer education | UI, admin UI | Best UI implementation |
| `code-with-antonio` | Code with Antonio courses | General baseline | Similar to dev-build |
| `just-react` | React-focused courses | - | Standard implementation |

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

## Classification of Duplication

### Accidental Drift (SHOULD converge)
- `src/lib/*.ts` query files - 12 files 100% identical, ~20 files 80-95% identical
- `src/hooks/` - 5 files 100% identical
- `src/trpc/routers/` - 7 files 100% identical
- `src/inngest/functions/` - 2 files 100% identical
- API routes - 15 routes 100% identical

### Intentional Differences (Should NOT be centralized)
- Certificate branding (epicdev-ai purple theme, per-app signatures)
- Login page layouts (app-specific branding)
- App-specific email templates
- Environment configuration (`env.mjs`)
- Database connection instances (`@/db`)
- ConvertKit integration (ai-hero only)
- Calendar sync (epicdev-ai only)

### Structural Coupling (Must be addressed before extraction)
- All lib/ query files depend on `@/db`, `@/server/auth`, `@/env.mjs`
- TRPC routers depend on `@/ability`, `@/db`
- Inngest functions depend on `@/inngest/inngest.server`, `@/db`

---

## Extraction Priority

### IN SCOPE for extraction:
1. **API Routes** - Identical webhook handlers, auth routes
2. **Ability** - Authorization logic (CASL-based)
3. **Hooks** - Shared React hooks
4. **Inngest Functions** - Background job handlers
5. **TRPC Routers** - Type-safe API procedures
6. **Server Utilities** - redis-client, with-skill, logger
7. **Providers** - ThemeProvider, etc.

### OUT OF SCOPE (deferred):
- **lib/ query files** - Will be implemented in `@coursebuilder/adapter-drizzle` instead
- **Components with local deps** - Depend on `@/` imports, need refactoring

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
| `@coursebuilder/adapter-drizzle` | DB adapter | ✅ Used, will expand for queries |
| `@coursebuilder/utils-*` | 13 utility packages | ❌ 0% adoption |
| `@coursebuilder/email-templates` | Email templates | ✅ Used |

---

## 2. Duplication Analysis by Category

### TIER 1: API Routes (HIGH PRIORITY)

#### 100% Identical (15 routes)

See [08-pages-extraction.md](./08-pages-extraction.md) for full list. Key routes:

| Route | MD5 Hash |
|-------|----------|
| `api/auth/[...nextauth]/route.ts` | 326e22bee4eec8236b3c992d51de1540 |
| `api/trpc/[trpc]/route.ts` | fa3064c97af5ecb418f2fd05d246c636 |
| `api/inngest/route.ts` | 6f80ce0bfdd5970a5f21eb9c15027925 |
| `api/uploadthing/route.ts` | 69180b2ff1894efe76b231ffad26837e |
| `api/mux/route.ts` | f60dde8adaf79dbd8c6cb8960b44fdac |
| `api/mux/webhook/route.ts` | c8a78a7931442dc8ba6cdb3df5f8de05 |
| `api/coursebuilder/[...nextCourseBuilder]/route.ts` | 3913b4c23a981921bafd584d32e11484 |
| `api/posts/route.ts` | 04deb94197c5898cbe756c232dc85c02 |
| + 7 more (thumbnails, cron, ocr, videos, uploads, etc.) | |

**Target**: `@coursebuilder/next/api`

---

### TIER 2: Hooks (HIGH PRIORITY)

#### 100% Identical (5 hooks)
| Hook | MD5 Hash | Lines | Dependencies |
|------|----------|-------|--------------|
| `use-is-mobile.ts` | 238d56565f5aa9316e60221c2f438b2e | 23 | None |
| `use-mutation-observer.ts` | 25caa64fdf6b306783fd695899ac5eea | 20 | None |
| `use-mux-player-prefs.ts` | 7eac892bcb5fe61fb83e6b24db301109 | ~50 | None |
| `use-active-heading.tsx` | af7d668473fcccd71ee79387e23d38c6 | ~40 | None |
| `use-scroll-to-active.ts` | de626732d83cb918a0ac495e155574aa | ~30 | None |

#### 4/5 Identical (3 hooks - ANALYZED)
| Hook | Outlier | Winner | Reason |
|------|---------|--------|--------|
| `use-socket.ts` | epicdev-ai | **epicdev-ai** | Uses `??` (correct nullish coalescing) |
| `use-mux-player.tsx` | epicdev-ai | 4-app majority | Standard implementation |
| `use-convertkit-form.ts` | 3 variants | dev-build cluster | Most common version |

**Target**: `@coursebuilder/next/hooks`

---

### TIER 3: Inngest Utilities (HIGH PRIORITY)

**Strategy**: Extract utilities USED BY inngest functions, not the functions themselves.

#### Extractable Utilities
| Utility | Source | Target |
|---------|--------|--------|
| `sendAnEmail()` | email-send-broadcast.ts | `@coursebuilder/utils-email` |
| `ensurePersonalOrganizationWithLearnerRole()` | personal-organization-service.ts | `@coursebuilder/adapter-drizzle` |
| `getPersonalOrganization()` | personal-organization-service.ts | `@coursebuilder/adapter-drizzle` |

#### Inngest Functions Stay in Apps (Manual Sync)
| Function | Canonical App | Uses Utilities |
|----------|---------------|----------------|
| `email-send-broadcast.ts` | Any | `sendAnEmail()` |
| `ensure-personal-organization.ts` | Any | personal-org-service |
| `create-user-organization.ts` | epicdev-ai | - |
| `cohort-entitlement-sync-workflow.ts` | ai-hero | cohort utilities |

#### Feature Gap Functions (epicdev-ai only)
- `bulk-calendar-invites.ts`
- `calendar-sync.ts`

**Target**: Extract utilities to `@coursebuilder/utils-*` or `@coursebuilder/adapter-drizzle`

---

### TIER 4: TRPC Routers (MEDIUM PRIORITY)

#### 100% Identical (7 routers)
| Router | MD5 Hash |
|--------|----------|
| `progress.ts` | f05b9d4ac9f003ce83fe55881a1bd7a0 |
| `lessons.ts` | 7fd9d4598ac53bffebc54d2e098b851d |
| `tags.ts` | e804b852d2691442f83d5f4e5f7556a3 |
| `users.ts` | 567cd983cef1c9a23c3e98cf0ddeb72a |
| `imageResource.ts` | 187c9f7bb777ae42697c6c15e01db70d |
| `emails.ts` | 892a50b167e37649ea309bf44a14d3b7 |
| `certificate.ts` | 2fcb6eb5499d7c25f431bf14a8e80fa4 |

#### Multiple Variants (6 routers - ANALYZED)
| Router | Variants | Canonical | Notes |
|--------|----------|-----------|-------|
| `ability.ts` | 3 variants | ai-hero | Most complete rules |
| `pricing.ts` | 3 variants | ai-hero | Most features |
| `videoResource.ts` | 2 variants | 4-app majority | ai-hero differs |
| `solutions.ts` | 2 variants | 4-app majority | ai-hero has extra function |
| `contentResources.ts` | 2 variants | ai-hero | Has cohorts/workshops |
| `events.ts` | 2 variants | dev-build (224 lines) | Full with email reminders |

#### App-Specific Routers
| Router | App | Purpose |
|--------|-----|---------|
| `convertkit.ts` | ai-hero only | ConvertKit integration |
| `exercises.ts` | epicdev-ai only | Exercise functionality |
| `feature-flags.ts` | epicdev-ai only | Feature flag management |

**Target**: `@coursebuilder/next/trpc`

---

### TIER 5: Ability (Authorization)

#### Files
| File | Status |
|------|--------|
| `ability/purchase-validators.ts` | 100% identical |
| `ability/index.ts` | 2 variants (ai-hero/epicdev-ai vs dev-build cluster) |

**Target**: `@coursebuilder/core/ability` or `@coursebuilder/next/ability`

---

### TIER 6: Server Utilities (LOW PRIORITY - Small files)

#### 100% Identical
| File | Lines | Dependencies |
|------|-------|--------------|
| `redis-client.ts` | 3 | `@upstash/redis` |
| `with-skill.ts` | 12 | `next/server` |

**Target**: `@coursebuilder/next/server`

---

### TIER 7: Providers (LOW PRIORITY - ANALYZED)

| Provider | Status | Winner | Notes |
|----------|--------|--------|-------|
| `theme-provider.tsx` | ✅ 100% identical | Any | All 5 apps (326 bytes) |
| `amplitude-provider.tsx` | 4/5 identical | **epicdev-ai** | Correct `status` in deps |
| `providers.tsx` | ✅ 100% identical | Any | All 5 apps (986 bytes) |
| `mux-player-provider.tsx` | See hooks | - | In use-mux-player.tsx |

**Target**: `@coursebuilder/next/providers`

---

### TIER 8: Components (DEFERRED - Some extractable)

#### 100% Identical Components
| Component | MD5 Hash | Notes |
|-----------|----------|-------|
| `team-inquiry/*` (3 files) | All identical | Perfect candidate |
| `resources-crud/create-resource-page.tsx` | All identical | 1,331 bytes each |
| `resources-crud/new-lesson-video-form.tsx` | All identical | 887 bytes each |
| `resources-crud/video-upload-form-item.tsx` | All identical | 2,150 bytes each |
| `resources-crud/video-uploader.tsx` | All identical | 980 bytes each |

#### Components with Variants (Intentional Branding)
| Component | Variance | Notes |
|-----------|----------|-------|
| `certificates/background.tsx` | epicdev-ai purple theme | Intentional branding |
| `certificates/logo.tsx` | epicdev-ai Epic AI logo | Intentional branding |
| `certificates/signature.tsx` | epicdev-ai image-based | Intentional - Kent C. Dodds |
| `resources-crud/new-resource-with-video-form.tsx` | 3 variants | UI differences |
| `resources-crud/workshop-resources-edit.tsx` | epicdev-ai nested | Enhanced tree structure |

---

## 3. Target Architecture

```
packages/
├── core/                          # ✅ EXISTS - Framework-agnostic core
│   └── ability/                   # NEW - Authorization logic
│
├── adapter-drizzle/               # ✅ EXISTS - DB adapter
│   └── queries/                   # NEW - Shared query functions (future)
│
├── ui/                            # ✅ EXISTS - UI components
│
├── next/                          # 🔄 EXPAND - Next.js specific
│   ├── src/
│   │   ├── server/               # redis-client, with-skill
│   │   ├── providers/            # theme, amplitude
│   │   ├── hooks/                # use-is-mobile, use-socket, etc.
│   │   ├── api/                  # Shared API route handlers
│   │   ├── trpc/                 # Shared TRPC routers
│   │   └── inngest/              # Shared inngest functions
│
└── utils-*                        # KEEP - Adopt existing packages
```

---

## 4. Migration Plan (PR Series)

> **Note**: Phase order optimized per consolidation strategy - Utils first (zero risk, unlocks patterns), then Hooks/Providers.

### Phase 0: Validate Current State (1 day)
```bash
pnpm build:all && pnpm typecheck  # Establish baseline
```

### Phase 1: Utils Adoption Completion (3-5 days) ⭐ START HERE

**Why first**: 287 imports already use re-export pattern, just complete remaining ~50 files. Zero risk.

| PR | Description | Files | First App |
|----|-------------|-------|-----------|
| 1.1 | Audit ai-hero utils against existing packages | ~15 | ai-hero |
| 1.2 | Update remaining files to re-export pattern | ~35 | ai-hero → all |

**Validation**: All apps build, grep for duplicate implementations decreases.

### Phase 2: Hooks/Providers Extraction (2-3 days)

| PR | Description | Files | First App |
|----|-------------|-------|-----------|
| 2.1 | Server utilities to `@coursebuilder/next/server` | ~20 | ai-hero |
| 2.2 | Providers to `@coursebuilder/next/providers` | ~15 | ai-hero |
| 2.3 | Pure hooks to `@coursebuilder/next/hooks` | ~40 | ai-hero |

**Validation**: Theme switching works, Amplitude events fire, Mux player preferences persist.

### Phase 3: Ability Extraction (LOW RISK)

| PR | Description | Files |
|----|-------------|-------|
| 3.1 | Extract purchase-validators to `@coursebuilder/core/ability` | ~10 |

### Phase 4: Context Factory (OPTIONAL - HIGH LEVERAGE)

**Why optional**: Highest potential impact but requires more investment. Unblocks lib/ extraction.

| PR | Description | Files |
|----|-------------|-------|
| 4.1 | Create `CourseBuilderContext` interface in `packages/next/` | ~5 |
| 4.2 | Refactor ONE query file (`posts-query.ts`) to use context | ~10 |
| 4.3 | If successful, refactor remaining 100% identical query files | ~50+ |

See `.cursor/plans/monorepo_consolidation_strategy_6b6597df.plan.md` for full context factory design.

### NOT Worth Doing Now

| Opportunity | Why Skip |
|-------------|----------|
| Component extraction | Heavy branding variance, `@/` deps |
| TRPC router extraction | Blocked by `@/ability`, `@/db` deps |
| Inngest function extraction | Blocked by `@/inngest/*`, `@/db` deps |
| lib/ business logic | Blocked by 189 `@/` imports - need Context Factory first |
| API route extraction | 15 routes are tiny (~10 lines each), low cognitive overhead |

### Deferred: Inngest & TRPC (Keep in apps, manual sync)

Due to heavy `@/` dependencies, inngest functions and TRPC routers remain in apps.
Track canonical versions and sync manually when changes are made.

See:
- [07-inngest-extraction.md](./07-inngest-extraction.md)
- [09-trpc-extraction.md](./09-trpc-extraction.md)

---

## 5. Extraction Rules & Conventions

### Extraction Rules

1. **Re-export pattern**: Apps keep file paths, re-export from shared packages
   ```typescript
   // apps/ai-hero/src/hooks/use-is-mobile.ts
   export { useIsMobile } from '@coursebuilder/next/hooks'
   ```

2. **Pick majority for variants**: When files differ, use the version shared by most apps (unless outlier is correct)

3. **Config injection for env-dependent files**: Pass config instead of importing `@/env.mjs`

4. **lib/ queries stay in apps**: Will eventually move via Context Factory pattern

### Conventions (Guardrails for Future)

#### Convention 1: Utils Must Re-export
**Rule**: Any utility function in `apps/*/src/utils/` must either:
- Re-export from a `@coursebuilder/utils-*` package, OR
- Be documented as app-specific with a comment explaining why

**Enforcement**: ESLint rule checking imports in utils/ directories (future)

#### Convention 2: New App Creation via Template
**Rule**: New apps must be created from `cli/template/`, not by forking existing apps

**Enforcement**: Documentation + code review. Update template when shared packages change.

#### Convention 3: Canonical Version Tracking
**Rule**: For files that intentionally differ (TRPC routers, Inngest functions), document which app is canonical

**Enforcement**: Add `CANONICAL.md` files in each category:
```markdown
# TRPC Routers - Canonical Versions
| Router | Canonical App | Last Synced |
|--------|--------------|-------------|
| pricing.ts | ai-hero | 2026-01-07 |
| events.ts | epicdev-ai | 2026-01-07 |
```

#### Convention 4: No Direct `@/db` in Extractable Code
**Rule**: Code intended for extraction must use injected context, not direct `@/` imports

**Enforcement**: Code review. Future: ESLint rule.

### CI/Linting Additions (Future)

1. **Cross-app hash check**: CI job that hashes "should-be-identical" files and fails if they diverge
2. **Import path lint**: Warn on `from '@/'` in packages/
3. **Package.json sync**: manypkg check for dependency version alignment

---

## 6. Verification

```bash
# After each PR
pnpm build:all
pnpm typecheck

# Verify specific app
pnpm --filter="ai-hero" dev
```

---

## Document Index

### Strategic Documents
| Document | Description |
|----------|-------------|
| `.cursor/plans/monorepo_consolidation_strategy_*.plan.md` | High-level strategy, leverage points, context factory design |
| [10-ai-hero-extraction-readiness.md](./10-ai-hero-extraction-readiness.md) | ai-hero app deep analysis |

### Extraction Plans
| Document | Description | Status |
|----------|-------------|--------|
| [01-server-utilities.md](./01-server-utilities.md) | Server utilities extraction | ✅ Ready |
| [02-providers-extraction.md](./02-providers-extraction.md) | Provider components | ✅ Ready + Analyzed |
| [03-hooks-extraction.md](./03-hooks-extraction.md) | React hooks | ✅ Ready + Analyzed |
| [04-utils-adoption.md](./04-utils-adoption.md) | Existing utils adoption | ⭐ START HERE |
| [05-component-extraction-NEW.md](./05-component-extraction-NEW.md) | TSX components | ⏸️ DEFERRED |
| [06-business-logic-extraction.md](./06-business-logic-extraction.md) | lib/ business logic | ⏸️ BLOCKED (needs Context Factory) |
| [07-inngest-extraction.md](./07-inngest-extraction.md) | Inngest utilities | ✅ Ready + Analyzed |
| [08-pages-extraction.md](./08-pages-extraction.md) | API routes & pages | ⏸️ LOW VALUE |
| [09-trpc-extraction.md](./09-trpc-extraction.md) | TRPC routers | ⏸️ BLOCKED (@/ deps) |
| [10-ability-extraction.md](./10-ability-extraction.md) | Authorization (CASL) | ✅ Ready |

---

## 7. Deep Analysis Summary (48 Agents)

### Key Findings by Category

#### Canonical Version Winners
| Category | File | Winner | Reason |
|----------|------|--------|--------|
| Hooks | `use-socket.ts` | epicdev-ai | Correct `??` nullish coalescing |
| Providers | `amplitude-provider.tsx` | epicdev-ai | Correct `status` in deps |
| Inngest | `create-user-organization.ts` | epicdev-ai | Event delegation pattern |
| Inngest | `cohort-entitlement-sync-workflow.ts` | ai-hero | Fan-out pattern for scale |
| TRPC | `events.ts` | dev-build | Full email reminder workflows |
| TRPC | `ability.ts` | ai-hero | Most complete rules |
| TRPC | `contentResources.ts` | ai-hero | Has cohorts/workshops |

#### Confirmed 100% Identical (Ready for Extraction)
- **Providers**: theme-provider.tsx, providers.tsx
- **Hooks**: use-is-mobile.ts, use-mutation-observer.ts, use-mux-player-prefs.ts, use-active-heading.tsx, use-scroll-to-active.ts
- **Inngest**: email-send-broadcast.ts, ensure-personal-organization.ts
- **TRPC Routers**: progress.ts, lessons.ts, tags.ts, users.ts, imageResource.ts, emails.ts, certificate.ts
- **Ability**: purchase-validators.ts
- **Components**: team-inquiry/* (all 3 files), 4 resources-crud files

#### Intentional Branding Differences (Keep Separate)
- epicdev-ai certificate components (purple theme, Epic AI logo, Kent C. Dodds signature)
- Login page layouts (each app has distinct branding)

#### Feature Gaps to Address
| Missing From | Add To |
|--------------|--------|
| ai-hero | use-confirm.tsx, use-event-email-reminders.ts, use-lesson-active-state.ts |
| epicdev-ai | use-transcript.tsx, use-prefetch-next-resource.ts, use-sale-toast-notifier.tsx |
| ai-hero | events.ts full version (224 lines with email reminders) |
| All except epicdev-ai | bulk-calendar-invites.ts, calendar-sync.ts |

### Analysis Date: 2026-01-07
