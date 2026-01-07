# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Course Builder is a real-time multiplayer CMS for building developer education products. This Turborepo monorepo contains multiple Next.js applications and shared packages.

### Key Technologies
- **Framework**: Next.js 15+ (App Router, RSC, Server Actions)
- **Monorepo**: Turborepo with PNPM workspaces
- **Database**: Drizzle ORM with MySQL/PlanetScale
- **API**: tRPC for type-safe API calls
- **Real-time**: PartyKit for collaboration
- **Events**: Inngest for workflows and background jobs
- **Media**: Mux for video, Deepgram for transcription
- **Payments**: Stripe integration

## Repository Structure

- `/apps/*` - Next.js applications (ai-hero, egghead, epic-web, etc.) and Astro apps
- `/packages/*` - Shared libraries:
  - `core` - Framework-agnostic core library
  - `ui` - Shared shadcn/ui components
  - `next` - Next.js specific bindings
  - `adapter-drizzle` - Database adapter
  - `utils-*` - Utility packages (ai, auth, aws, browser, core, email, file, media, resource, search, seo, string, ui)

## Command Reference

### Build & Dev
```bash
pnpm build:all              # Build all packages and apps
pnpm build                  # Build packages only (not apps)
pnpm build --filter="ai-hero"  # Build specific app
pnpm dev                    # Dev mode for packages only
```

### Testing
```bash
cd packages/package-name && pnpm test                    # Run tests for specific package
cd packages/package-name && pnpm test src/file.test.ts   # Single test file
cd packages/package-name && pnpm test:watch              # Watch mode
```

### Linting & Formatting
```bash
pnpm lint                # Lint all packages/apps
pnpm format              # Format with Prettier
pnpm typecheck           # TypeScript checking
pnpm manypkg fix         # Fix dependency mismatches and sort package.json
```

## Code Style

- **Formatting**: Single quotes, no semicolons, tabs (width: 2), 80 char line limit
- **Imports**: React → Next → 3rd party → internal
- **Package Manager**: PNPM (v8.15.5+)
- **Testing**: Vitest

### Conventional Commits
Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`
- App scopes: `aih` (ai-hero), `egh` (egghead), `eweb` (epic-web)
- Package scopes: use package name (e.g., `utils-email`, `core`, `ui`)

## Code Generation

Create new utility packages with Plop:
```bash
pnpm plop package-utils <domain> <utilityName> <functionName> "<description>"
# Example:
pnpm plop package-utils browser cookies getCookies "Browser cookie utility"
```

## Common Patterns

### Re-export Pattern for Shared Utilities
When centralizing utilities, maintain backward compatibility:
```typescript
// In /apps/app-name/src/utils/some-utility.ts
export { someUtility } from '@coursebuilder/utils-domain/some-utility'
```

### Avoid Object.defineProperty for Re-exports
Do NOT use `Object.defineProperty(exports, ...)` - causes "Cannot redefine property" errors with Next.js/tRPC. Use standard exports instead.

### App Directory Structure
Apps typically follow:
- `src/app` - Next.js App Router pages/layouts
- `src/components` - React components
- `src/lib` - Domain-specific business logic
- `src/utils` - Utility functions (often re-exports from @coursebuilder packages)
- `src/db` - Database schema and queries
- `src/server` - Server-side functions
- `src/trpc` - tRPC router and procedures

### Database Schema
Drizzle ORM schema in `src/db/schema.ts` includes users, content resources, progress tracking, purchases.

### Auth Pattern
- NextAuth.js for authentication
- CASL for authorization abilities
- Custom middleware for route protection

## Development Guidelines

- Check the plan before starting; ask for one if missing
- Run tests in the package/app directory, not root
- Use logger for server-side logging and think about observability
- Add JSDoc comments to functions and React components
- Be pragmatic - don't over-engineer
