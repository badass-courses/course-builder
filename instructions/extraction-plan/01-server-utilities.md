# Server Utilities Extraction to @coursebuilder/next/server

## Scope

**Active Apps Only**: ai-hero, dev-build, epicdev-ai, just-react, code-with-antonio

---

## Overview
Extract `redis-client.ts`, `with-skill.ts`, and `logger.ts` to `@coursebuilder/next/server`.

**Files touched**: ~20 files (5 active apps)
**Risk**: LOW

## Pre-flight Checks
```bash
# Verify all files are identical
md5 apps/*/src/server/redis-client.ts
md5 apps/*/src/server/with-skill.ts
```

## Step 1: Create package structure

Create `packages/next/src/server/` directory structure:

### packages/next/src/server/redis-client.ts
```typescript
import { Redis } from '@upstash/redis'

/**
 * Redis client initialized from environment variables.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
export const redis = Redis.fromEnv()
```

### packages/next/src/server/with-skill.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'

export type SkillRequest = NextRequest

type NextHandler<T = any> = (
	req: SkillRequest,
	arg?: T,
) => Promise<Response> | Promise<NextResponse> | NextResponse | Response

/**
 * Wrapper for Next.js route handlers.
 * Currently a passthrough, but can be extended for middleware-like behavior.
 */
export function withSkill(params: NextHandler): NextHandler {
	return params
}
```

### packages/next/src/server/logger.ts
```typescript
import { Axiom } from '@axiomhq/js'

export interface LoggerConfig {
	token: string
	orgId: string
	dataset: string
	isDevelopment?: boolean
}

type LogLevel = 'info' | 'error' | 'warn' | 'debug'

export function createLogger(config: LoggerConfig) {
	const axiom = new Axiom({
		token: config.token,
		orgId: config.orgId,
		onError: (err) => {
			if (config.isDevelopment) {
				console.error('Axiom logging error:', err)
			}
		},
	})

	return {
		async write(level: LogLevel, dataset: string, data: Record<string, any>) {
			try {
				await axiom.ingest(config.dataset, [
					{
						_time: new Date().toISOString(),
						level,
						event: dataset,
						...data,
					},
				])
			} catch (error) {
				// Error handling is done by onError callback
			}
		},

		async info(dataset: string, data: Record<string, any>) {
			return this.write('info', dataset, data)
		},

		async error(dataset: string, data: Record<string, any>) {
			return this.write('error', dataset, data)
		},

		async warn(dataset: string, data: Record<string, any>) {
			return this.write('warn', dataset, data)
		},

		async debug(dataset: string, data: Record<string, any>) {
			return this.write('debug', dataset, data)
		},

		async flush() {
			return axiom.flush()
		},
	}
}

export type Logger = ReturnType<typeof createLogger>
```

### packages/next/src/server/index.ts
```typescript
export { redis } from './redis-client'
export { withSkill, type SkillRequest } from './with-skill'
export { createLogger, type Logger, type LoggerConfig } from './logger'
```

## Step 2: Update package.json exports

Edit `packages/next/package.json`:

```json
{
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js"
    },
    "./server": {
      "types": "./server/index.d.ts",
      "import": "./server/index.js"
    }
  },
  "dependencies": {
    "@coursebuilder/core": "1.1.0",
    "@upstash/redis": "^1.28.0",
    "@axiomhq/js": "^1.0.0",
    "inngest": "3.35.0"
  }
}
```

## Step 3: Build and verify package

```bash
cd packages/next
pnpm install
pnpm build
```

## Step 4: Update apps with re-exports

### apps/*/src/server/redis-client.ts (5 active apps)
```typescript
// Re-export from shared package
export { redis } from '@coursebuilder/next/server'
```

### apps/*/src/server/with-skill.ts (5 active apps)
```typescript
// Re-export from shared package
export { withSkill, type SkillRequest } from '@coursebuilder/next/server'
```

### apps/*/src/server/logger.ts (create config pattern)
```typescript
import { createLogger } from '@coursebuilder/next/server'
import { env } from '@/env.mjs'

export const log = createLogger({
	token: process.env.AXIOM_TOKEN!,
	orgId: 'ai-hero', // App-specific
	dataset: env.NEXT_PUBLIC_AXIOM_DATASET!,
	isDevelopment: env.NODE_ENV === 'development',
})
```

## Step 5: Add dependency to all apps

For each app's `package.json`, ensure dependency exists:
```json
"@coursebuilder/next": "workspace:*"
```

## Step 6: Verify builds

```bash
# From root
pnpm build:all
```

## Apps to update (Active Only)

1. `apps/ai-hero/src/server/`
2. `apps/dev-build/src/server/`
3. `apps/epicdev-ai/src/server/`
4. `apps/just-react/src/server/`
5. `apps/code-with-antonio/src/server/`

## Rollback Plan

If issues arise:
1. Revert `packages/next/` changes
2. Restore original app files from git
3. Run `pnpm install && pnpm build:all`

## Success Criteria

- [ ] `packages/next` builds successfully with server export
- [ ] All 5 active apps build successfully
- [ ] Redis operations work (test cache)
- [ ] Logger writes to Axiom (verify in dashboard)
