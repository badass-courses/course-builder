# OpenCode Agent Guidelines for Course Builder

This file guides AI agents working in the Course Builder monorepo.

## Commands (Run from root or specific workspace)

- **Build All:** `pnpm build:all`
- **Build App/Pkg:** `pnpm build --filter="<name>"` (e.g., `ai-hero`, `@coursebuilder/core`)
- **Dev All:** `pnpm dev:all`
- **Test All:** `pnpm test`
- **Test Package:** `pnpm test --filter="<pkg-name>"`
- **Test Single File:** `cd <app/pkg-dir> && pnpm test <path/to/test.test.ts>`
- **Lint:** `pnpm lint` or `pnpm lint --filter="<name>"`
- **Format Check:** `pnpm format:check`
- **Format:** `pnpm format`
- **Typecheck:** `pnpm typecheck`
- **Fix Deps:** `pnpm manypkg fix`

## Code Style & Conventions

- **Frameworks:** Next.js (App Router), TypeScript, Turborepo (PNPM), Drizzle, tRPC, Inngest, Tailwind CSS.
- **Formatting:** Single quotes, no semicolons, tabs (width: 2), 80 char limit (use `pnpm format`).
- **Imports:** Order: React -> Next -> 3rd party -> internal (`@coursebuilder/*`) -> relative.
- **Naming:** camelCase for variables/functions, PascalCase for types/classes/components. Use `kebab-case` for file names.
- **Commits:** Conventional Commits: `<type>(<scope>): <description>` (Scopes: app codes like `aih`, `egh` or package names like `utils-email`).
- **Utils:** Create shared utils in `/packages` using `pnpm plop package-utils`. Use re-export pattern for backward compatibility.
- **UI:** Use `@coursebuilder/ui` components (`/packages/ui`, shadcn/radix based). Use `cn()` for class merging.
- **Error Handling:** Standard try/catch. Consider context for specific error handling patterns.
- **Server:** Use server actions and RSC where appropriate.
- **DB:** Use Drizzle ORM (`src/db/schema.ts`).
- **Testing:** Vitest. Add tests for new logic.
- **Comments:** Add JSDoc to exported methods and React components. Avoid excessive inline comments.
- **Logging:** Use `@/server/logger.ts` server-side for observability/debugging (system ops, backend, errors).
- **Analytics:** Use `@/utils/analytics.ts` (`track`) client-side ONLY for learner/customer activity (progress, purchases, etc.).
