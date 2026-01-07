---
name: Monorepo Consolidation Strategy
overview: ""
todos:
  - id: utils-adoption
    content: Complete utils package adoption in ai-hero, then propagate to other apps
    status: pending
  - id: hooks-extraction
    content: Extract 5 identical hooks to @coursebuilder/next/hooks
    status: pending
  - id: providers-extraction
    content: Extract 3 providers to @coursebuilder/next/providers
    status: pending
    dependencies:
      - hooks-extraction
  - id: canonical-tracking
    content: Create CANONICAL.md files for TRPC routers and Inngest functions
    status: pending
  - id: context-factory
    content: Design and implement CourseBuilderContext factory (optional, high leverage)
    status: pending
    dependencies:
      - utils-adoption
      - providers-extraction
---

# Monorepo Consolidation Strategy

## 1. Problem Framing

### Where Drift Exists

The monorepo has **5 active apps** (ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio) that share approximately 80% of their code but have accumulated significant drift. The drift manifests across several layers:| Layer | Files per App | Drift Pattern ||-------|--------------|---------------|| `src/lib/` (business logic) | ~73 files | 3 variant clusters: ai-hero, epicdev-ai, dev-build group || `src/hooks/` | ~12 files | 5 100% identical, 3 with minor variants || `src/trpc/routers/` | ~15 files | 7 100% identical, 6 with variants || `src/inngest/functions/` | ~27 files | 2 100% identical, rest diverged || `src/utils/` | ~35 files | Partially migrated to @coursebuilder/utils-* || `src/components/` | ~100+ files | Heavy branding, mixed identical/variant |

### Why Drift Occurred

1. **Fork-based app creation**: ai-hero → epicdev-ai fork, dev-build → just-react → code-with-antonio fork chain
2. **No propagation mechanism**: Features added to one app aren't synced to others
3. **Tight coupling via `@/` imports**: 189 `@/` imports in lib/ alone, making extraction impossible without refactoring the dependency model
4. **Premature utils package creation**: 13 `utils-*` packages exist with 0-30% adoption each

### Classification of Duplication

**Accidental drift** (should converge):

- `src/lib/*.ts` query files - 12 files 100% identical, ~20 files 80-95% identical
- `src/hooks/` - 5 files 100% identical
- `src/trpc/routers/` - 7 files 100% identical
- `src/inngest/functions/` - 2 files 100% identical
- API routes - 15 routes 100% identical

**Intentional differences** (should NOT be centralized):

- Certificate branding (epicdev-ai purple theme, per-app signatures)
- Login page layouts (app-specific branding)
- App-specific email templates
- Environment configuration (`env.mjs`)
- Database connection instances (`@/db`)
- ConvertKit integration (ai-hero only)
- Calendar sync (epicdev-ai only)

**Structural coupling** (must be addressed before extraction):

- All lib/ query files depend on `@/db`, `@/server/auth`, `@/env.mjs`
- TRPC routers depend on `@/ability`, `@/db`
- Inngest functions depend on `@/inngest/inngest.server`, `@/db`

---

## 2. Leverage Points (Ranked)

### Leverage Point 1: Dependency Injection Layer (Impact: HIGH, Reversibility: HIGH)

**The problem**: 189+ `@/` imports in lib/ files block all meaningful extraction.**The solution**: Extend the existing `course-builder-config.ts` pattern to create injectable context.The file [apps/ai-hero/src/coursebuilder/course-builder-config.ts](apps/ai-hero/src/coursebuilder/course-builder-config.ts) already injects `adapter`, `inngest`, `providers`. Extend this to also inject:

- Database connection factory
- Auth session getter
- Environment access

This ONE change unblocks extraction of lib/, trpc/, and inngest/ layers.**Why this over alternatives**: The pattern already exists and works. No new concepts needed.

### Leverage Point 2: Utils Package Adoption (Impact: MEDIUM, Reversibility: HIGH)

**The problem**: 13 `@coursebuilder/utils-*` packages exist but aren't fully adopted. Apps still have local copies.**The solution**: Complete the re-export pattern already in use:

```typescript
// apps/*/src/utils/guid.ts (current pattern, incomplete)
export { guid } from '@coursebuilder/utils-core/guid'
```

287 imports already use this pattern. Finish the remaining ~50 files.**Why this over alternatives**: Zero risk. The packages exist, the pattern works, just needs completion.

### Leverage Point 3: Hooks/Providers to @coursebuilder/next (Impact: LOW-MEDIUM, Reversibility: HIGH)

**The problem**: 5 hooks and 3 providers are 100% identical across all apps.**The solution**: Move to [packages/next/src/](packages/next/src/) which currently has only 4 files:

- `use-is-mobile.ts`
- `use-mutation-observer.ts`
- `theme-provider.tsx`
- `amplitude-provider.tsx` (use epicdev-ai version with correct deps)

**Why this over alternatives**: Small, safe, immediate win. These have zero `@/` dependencies.

### Why Other DRY Opportunities Are NOT Worth Doing Now

| Opportunity | Why Skip ||-------------|----------|| Component extraction | Heavy branding variance, `@/` deps || TRPC router extraction | Blocked by `@/ability`, `@/db` deps || Inngest function extraction | Blocked by `@/inngest/*`, `@/db` deps || lib/ business logic | Blocked by 189 `@/` imports - need Leverage Point 1 first || API route extraction | 15 routes are tiny (~10 lines each), low cognitive overhead |---

## 3. Target Abstraction Designs

### Abstraction 1: CourseBuilder Context Factory

**Boundary**:

- IN: Database adapter, auth getter, env access, inngest client
- OUT: App-specific providers (email, stripe), email templates, branding

**Ownership**: `@coursebuilder/next` (shared), apps configure via factory call**API Surface**:

```typescript
// packages/next/src/context.ts
export interface CourseBuilderContext {
  db: DatabaseAdapter
  getSession: () => Promise<Session | null>
  inngest: Inngest
  env: {
    get: (key: string) => string | undefined
  }
}

export function createCourseBuilderContext(config: {
  adapter: DatabaseAdapter
  getSession: () => Promise<Session | null>
  inngest: Inngest
  env: Record<string, string | undefined>
}): CourseBuilderContext

// Usage in query files:
export function createPostsQuery(ctx: CourseBuilderContext) {
  return {
    async getAllPosts() {
      const session = await ctx.getSession()
      // ... use ctx.db instead of @/db
    }
  }
}
```

**Extension Points**:

- Context can be extended per-app with additional properties
- Query functions are created via factory, not imported directly

**Failure Modes**:

- Performance: Context creation overhead - mitigated by singleton pattern
- Type safety: Env access loses type safety - mitigated by typed env schema per app

**Escape Hatch**: Apps can always import `@/db` directly for app-specific queries not meant for sharing.

### Abstraction 2: Utils Re-export Convention

**Boundary**:

- IN: Pure utility functions with no app dependencies
- OUT: Functions requiring database, auth, or env access

**Ownership**: `@coursebuilder/utils-*` packages (shared), apps re-export**Shape**:

```javascript
packages/utils-core/src/guid.ts      → export function guid(): string
apps/*/src/utils/guid.ts             → export { guid } from '@coursebuilder/utils-core/guid'
```

**Extension Points**: Apps can wrap shared utils with app-specific defaults.**Failure Modes**: None significant - this is already working.

### Abstraction 3: Hooks/Providers Package

**Boundary**:

- IN: Client-side hooks with no server deps, provider components with config injection
- OUT: Hooks using `@/` imports, providers hardcoding env vars

**Ownership**: `@coursebuilder/next/hooks` and `@coursebuilder/next/providers`**Shape**:

```typescript
// packages/next/src/providers/amplitude-provider.tsx
export function AmplitudeProvider({ 
  children, 
  config 
}: { 
  children: ReactNode
  config: { apiKey: string | undefined }
})

// apps/*/src/components/amplitude-provider.tsx
import { AmplitudeProvider } from '@coursebuilder/next/providers'
import { env } from '@/env.mjs'

export default function AppAmplitudeProvider({ children }) {
  return <AmplitudeProvider config={{ apiKey: env.NEXT_PUBLIC_AMPLITUDE_API_KEY }}>{children}</AmplitudeProvider>
}
```

**Extension Points**: Config injection allows per-app customization.---

## 4. Migration Plan

### Phase 0: Validate Current State (1 day)

- Run `pnpm build:all` and `pnpm typecheck` to establish baseline
- Document any existing build failures

### Phase 1: Utils Adoption Completion (3-5 days)

**First app**: ai-hero (canonical for most business logic)**Steps**:

1. Audit ai-hero's `src/utils/` against existing packages
2. Update remaining files to re-export pattern
3. Verify: `pnpm --filter="ai-hero" build`
4. Propagate to other 4 apps
5. Verify: `pnpm build:all`

**Validation signals**:

- All apps build
- No new `@coursebuilder/utils-*` imports fail
- Grep for duplicate implementations decreases

**Rollback**: Git revert. No breaking changes.

### Phase 2: Hooks/Providers Extraction (2-3 days)

**First app**: ai-hero**Steps**:

1. Add 5 hooks to `packages/next/src/hooks/`
2. Add 3 providers to `packages/next/src/providers/`
3. Update `packages/next/package.json` exports
4. Update ai-hero to re-export
5. Verify: `pnpm --filter="ai-hero" dev` - test theme switching, analytics
6. Propagate to other apps

**Validation signals**:

- Theme switching works
- Amplitude events fire
- Mux player preferences persist

**Rollback**: Delete new files in packages/next, restore app files from git.

### Phase 3: Context Factory (5-7 days) - OPTIONAL, high leverage but higher effort

**First app**: ai-hero**Steps**:

1. Create `CourseBuilderContext` interface in `packages/next/`
2. Create `createCourseBuilderContext()` factory
3. Refactor ONE query file (`posts-query.ts`) to use context
4. Create app-level context in ai-hero
5. Verify posts functionality works
6. If successful, refactor remaining 100% identical query files

**Validation signals**:

- Posts CRUD works
- No performance regression
- Types are preserved

**Rollback**: Delete context factory, restore original query file.

### Migration Order Rationale

ai-hero first because:

1. It's the canonical source for most business logic (per extraction docs)
2. It has the most complete implementation of features
3. If it works in the most complex app, it'll work everywhere

---

## 5. Guardrails for the Future

### Convention 1: Utils Must Re-export

**Rule**: Any utility function in `apps/*/src/utils/` must either:

- Re-export from a `@coursebuilder/utils-*` package, OR
- Be documented as app-specific with a comment explaining why

**Enforcement**: ESLint rule checking imports in utils/ directories

### Convention 2: New App Creation via Template

**Rule**: New apps must be created from `cli/template/`, not by forking existing apps**Enforcement**: Documentation + code review. Update template when shared packages change.

### Convention 3: Canonical Version Tracking

**Rule**: For files that intentionally differ (TRPC routers, Inngest functions), document which app is canonical**Enforcement**: Add `CANONICAL.md` files in each category:

```markdown
# TRPC Routers - Canonical Versions
| Router | Canonical App | Last Synced |
|--------|--------------|-------------|
| pricing.ts | ai-hero | 2026-01-07 |
| events.ts | epicdev-ai | 2026-01-07 |
```



### Convention 4: No Direct `@/db` in Extractable Code

**Rule**: Code intended for extraction must use injected context, not direct `@/` imports**Enforcement**: Code review. Future: ESLint rule.

### CI/Linting Additions

1. **Cross-app hash check**: CI job that hashes "should-be-identical" files and fails if they diverge
2. **Import path lint**: Warn on `from '@/'` in packages/
3. **Package.json sync**: manypkg check for dependency version alignment

### Documentation

1. Update `CONTRIBUTING.md` with new app creation process
2. Add `packages/next/README.md` documenting hooks/providers
3. Keep extraction plan docs updated as work completes

---

## Summary

The highest-leverage intervention is completing the **utils package adoption** (low risk, immediate value) followed by **hooks/providers extraction** (low risk, moderate value). The **context factory** approach has the highest potential impact but requires more investment.The key insight is that most extraction is blocked by `@/` coupling, not by the code itself. Addressing the dependency model through context injection would unlock the entire lib/ layer for sharing, but this can be done incrementally after the lower-risk wins.**Do not attempt**: