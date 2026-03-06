# CourseBuilder CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Evolve `packages/aihero-cli` into `packages/cli` — a CLI binary named `coursebuilder` that works across the currently wired apps, consumes the ADR-0001 content API, and preserves the existing agent-first JSON envelope protocol.

**Architecture:** Rename-in-place, then modularize. The 5057-line `cli.ts` splits into per-module files sharing common infrastructure (config, auth, HTTP, envelope, truncation). New commands (`resources`, `links`, `content-model`, `schema`) consume the generic ADR-0001 endpoints, validate responses with exported zod schemas from `@coursebuilder/content-api`, and unwrap the API envelope into stable CLI payloads. Existing typed write commands (`post`, `lesson`, `survey`, `shortlink`) continue working unchanged in the first pass, but generic `resources create/update/delete` are added so the ADR surface is actually complete. Config hard-cuts to `~/.config/coursebuilder/` and `COURSEBUILDER_*`.

**Tech Stack:** Effect/CLI, tsup, Bun compile, Node.js fetch

---

## Current State

```
packages/aihero-cli/
  src/cli.ts          5057 lines, single file, all commands
  package.json        @coursebuilder/aihero-cli, bin: aihero
  tsup.config.ts      ESM, single entry
  scripts/
    build-release-assets.sh   bun build --compile for 4 targets
    install.sh                curl installer from GitHub Releases

packages/content-api/          <-- already implemented (ADR-0001)
  src/schemas/                 content-model, envelope, read, graph, edge-matrix, write
  src/handlers/                list, get, children, parents, content-model, create/delete link, CRUD
  src/auth/policy.ts           AuthorizationPolicy interface

apps/ai-hero/src/lib/content-model/registry.ts           <-- already wired
apps/code-with-antonio/src/lib/content-model/registry.ts <-- already wired
apps/ai-hero/src/app/api/content-model/route.ts
apps/ai-hero/src/app/api/content-resources/*/route.ts
apps/ai-hero/src/app/api/content-resource-links/route.ts
apps/code-with-antonio/src/app/api/content-model/route.ts
apps/code-with-antonio/src/app/api/content-resources/*/route.ts
apps/code-with-antonio/src/app/api/content-resource-links/route.ts
```

### What exists in `cli.ts`

- **Types:** `NextAction`, `AppProfile`, `AiheroConfig`, `AppDefinition`, `ResolvedContext`, `ApiRawResponse`, `ApiRequestError`
- **Constants:** `CLI_NAME='aihero'`, `CLI_VERSION='0.2.0'`, `DEFAULT_APP_ID='ai-hero'`, `MAX_RESPONSE_CHARS=12000`, `KNOWN_APPS` (only ai-hero)
- **Config:** `readConfig`/`writeConfig` at `~/.config/aihero/config.json`, env vars `AIHERO_*`
- **Auth:** OAuth device flow: `authLoginCommand` (POST device/code, poll token), `authWhoamiCommand`, `authLogoutCommand`, `authRouteCommand`
- **HTTP:** `requestApi<T>` (typed), `requestApiRaw` (raw), `buildUrl`, `appendQueryParams`
- **Envelope:** `respond()`, `respondError()` — `{ ok, command, result, next_actions }` / `{ ok, command, error, fix, next_actions }`
- **Truncation:** `compactResponseBody` (12k char limit, overflow to tmpfile), `truncateArray` (25 items)
- **Commands:**
  - `app` → list, use, current
  - `auth` → login, whoami, logout, route
  - `crud` → survey (list/get/create/update/delete/analytics), post (list/get/create/update/delete), lesson (list/update/solution CRUD), product (list/availability), shortlink (list/get/create/update/delete)
  - `creator` → upload (new/signed-url), video (get), publish
  - `support` → action
  - `analytics` → survey analytics, shortlink (get/recent)
  - `trpc` → get, post (passthrough)
  - `uploadthing` → get, post (passthrough)
- **Root subcommands:** app, auth, creator, support, crud, analytics (+ flat path rewriting for `survey`, `post`, `lesson`, `shortlink`, `upload`, `video`)

---

## Dependency Graph

```
P1 Rename + Multi-App ──── P2 Modularize cli.ts ──── P3 ADR-0001 Commands ──── P4 Write Safety
```

Each phase builds on the previous. No parallelism between phases — they touch the same files.

---

## Phase 1: Rename + Multi-App Config

**Goal:** Move package, rename binary to `coursebuilder`, switch config/env to `COURSEBUILDER_*`, and scope known apps to the products that actually expose the mounted routes today.

### Task 1.1: Move package directory

**Files:**
- Move: `packages/aihero-cli/` → `packages/cli/`
- Modify: `pnpm-workspace.yaml` (if explicit), root `turbo.json` (if references exist)

**Step 1: Move directory**

```bash
git mv packages/aihero-cli packages/cli
```

**Step 2: Update package.json name and bin**

Modify: `packages/cli/package.json`

```json
{
  "name": "@coursebuilder/cli",
  "version": "0.3.0",
  "bin": {
    "coursebuilder": "./dist/cli.js"
  }
}
```

**Step 3: Update build-release-assets.sh**

Modify: `packages/cli/scripts/build-release-assets.sh`

- Change `PKG_DIR` to `$ROOT_DIR/packages/cli`
- Change all binary names to `coursebuilder`
- Update archive names: `coursebuilder-$os-$arch.tar.gz`
- Update checksums filename: `coursebuilder-checksums.txt`

**Step 4: Update install.sh**

Modify: `packages/cli/scripts/install.sh`

- Change `INSTALL_DIR` env var to `COURSEBUILDER_INSTALL_DIR`
- Update release tag pattern: `coursebuilder-cli-v*`
- Update asset naming: `coursebuilder-$os-$arch.tar.gz`
- Install only `coursebuilder`

**Step 5: Run pnpm install**

```bash
pnpm install
```

**Step 6: Verify build**

```bash
cd packages/cli && pnpm build
```

Expected: builds successfully to `dist/cli.js`

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor(cli): move aihero-cli to packages/cli, rename binary to coursebuilder"
```

### Task 1.2: Update constants and config paths

**Files:**
- Modify: `packages/cli/src/cli.ts`

**Step 1: Update top-level constants**

```ts
const CLI_NAME = 'coursebuilder'
const CLI_VERSION = '0.3.0'
```

**Step 2: Update config path**

Replace `getConfigPath`:

```ts
const getConfigDir = () =>
  process.env.COURSEBUILDER_CONFIG_PATH
    ? path.dirname(process.env.COURSEBUILDER_CONFIG_PATH)
    : path.join(os.homedir(), '.config', 'coursebuilder')

const getConfigPath = () =>
  process.env.COURSEBUILDER_CONFIG_PATH ||
  path.join(os.homedir(), '.config', 'coursebuilder', 'config.json')
```

**Step 3: Update env var resolution chain**

In `resolveAppId`:
```ts
normalizeAppId(process.env.COURSEBUILDER_APP) ||
```

In `resolveBaseUrl`:
```ts
process.env[`COURSEBUILDER_BASE_URL_${appSuffix}`] ||
process.env.COURSEBUILDER_BASE_URL ||
```

In `resolveToken`:
```ts
process.env[`COURSEBUILDER_AUTH_TOKEN_${appSuffix}`] ||
process.env.COURSEBUILDER_AUTH_TOKEN ||
process.env.AUTH_TOKEN ||
```

**Step 4: Verify build**

```bash
cd packages/cli && pnpm build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(cli): rename to coursebuilder and switch config/env to coursebuilder"
```

### Task 1.3: Add known app definitions

**Files:**
- Modify: `packages/cli/src/cli.ts` — expand `KNOWN_APPS`

**Step 1: Add currently supported apps**

```ts
const KNOWN_APPS: Record<string, AppDefinition> = {
  'ai-hero': {
    id: 'ai-hero',
    displayName: 'AI Hero',
    defaultBaseUrl: 'https://aihero.dev',
    auth: {
      deviceCodePath: '/oauth/device/code',
      tokenPath: '/oauth/token',
      userInfoPath: '/oauth/userinfo',
    },
    capabilities: {
      surveyApi: true,
    },
    api: {
      surveysPath: '/api/surveys',
      surveyAnalyticsPath: '/api/surveys/analytics',
    },
  },
  'code-with-antonio': {
    id: 'code-with-antonio',
    displayName: 'Code with Antonio',
    defaultBaseUrl: 'https://codewithantonio.com',
    auth: {
      deviceCodePath: '/oauth/device/code',
      tokenPath: '/oauth/token',
      userInfoPath: '/oauth/userinfo',
    },
    capabilities: {
      surveyApi: false,
    },
    api: {
      surveysPath: '/api/surveys',
      surveyAnalyticsPath: '/api/surveys/analytics',
    },
  },
}
```

Do not add speculative app definitions yet. Expand `KNOWN_APPS` only when an app has mounted routes and verified auth behavior.

**Step 2: Update DEFAULT_BASE_URL**

```ts
const DEFAULT_BASE_URL = 'http://localhost:3000'
```

Keep this as localhost — it's the default for unknown apps and local dev.

**Step 3: Update root command description**

```ts
description: 'Agent-first Course Builder CLI for wired apps and ADR-backed content operations',
```

**Step 4: Verify build**

```bash
cd packages/cli && pnpm build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(cli): add known app definitions for wired apps"
```

### Task 1.4: Update all hardcoded `aihero` references in CLI text

**Files:**
- Modify: `packages/cli/src/cli.ts`

**Step 1: Find and replace user-facing strings**

Search for string `'aihero '` and `\`aihero ` in usage strings, fix messages, and error messages. Replace with `coursebuilder` where it appears in user-facing text. Key targets:

- `rewriteCommandPath` / current path rewrite helper — keep flat command-path rewriting, but do not preserve the old CLI name
- `rewriteUsageInResult` — rewrite all usage strings to `coursebuilder`
- All `usage:` string literals in command descriptions (e.g. `'aihero app list'` → `'coursebuilder app list'`)
- Error messages referencing `Run \`aihero auth login\`` → `Run \`coursebuilder auth login\``

Note: The `normalizeCommand` and `respond` functions already use `CLI_NAME` constant, so they'll update automatically. Focus on hardcoded string literals.

**Step 2: Keep flat path rewriting only**

Do not add prefix compatibility logic. Keep only the existing path rewrite behavior for flat command forms like `survey`, `post`, `lesson`, `shortlink`, `upload`, and `video`.

**Step 3: Verify build**

```bash
cd packages/cli && pnpm build
```

**Step 4: Manual smoke test**

```bash
cd packages/cli && pnpm dev
# Should output root JSON envelope with coursebuilder branding
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(cli): replace hardcoded aihero references with coursebuilder"
```

---

## Phase 2: Modularize cli.ts

**Goal:** Break the 5057-line single file into per-module files. No behavior changes. Pure mechanical extraction.

### Target Structure

```
packages/cli/src/
  cli.ts                  ~50 lines: import modules, compose root, run
  types.ts                shared types (NextAction, AppProfile, etc.)
  constants.ts            CLI_NAME, KNOWN_APPS, etc.
  config.ts               readConfig, writeConfig, resolveAppId, etc.
  http.ts                 requestApi, requestApiRaw, buildUrl, etc.
  envelope.ts             respond, respondError, compactResponseBody, truncateArray
  options.ts              shared Effect/CLI options (appOption, baseUrlOption, etc.)
  util.ts                 unwrapOption, normalizeAppId, parseJsonOption, etc.
  commands/
    app.ts                app list/use/current
    auth.ts               auth login/whoami/logout/route
    crud/
      survey.ts           survey CRUD + analytics
      post.ts             post CRUD
      lesson.ts           lesson CRUD + solution
      product.ts          product list/availability
      shortlink.ts        shortlink CRUD
      index.ts            compose crud parent command
    creator/
      upload.ts           upload new/signed-url
      video.ts            video get
      publish.ts          publish command
      index.ts            compose creator parent command
    support.ts            support action
    analytics/
      survey.ts           survey analytics
      shortlink.ts        shortlink analytics
      index.ts            compose analytics parent command
    passthrough/
      trpc.ts             trpc get/post
      uploadthing.ts      uploadthing get/post
      api.ts              generic api passthrough (if exists)
```

### Task 2.1: Extract types and constants

**Files:**
- Create: `packages/cli/src/types.ts`
- Create: `packages/cli/src/constants.ts`
- Modify: `packages/cli/src/cli.ts` — import from new files

**Step 1: Create types.ts**

Move all type definitions from top of cli.ts:
- `NextActionParam`, `NextAction`, `HttpMethod`, `AppProfile`, `AiheroConfig` (rename to `CliConfig`), `AppDefinition`, `DeviceCodeResponse`, `TokenResponse`, `ResolvedContext`, `ApiRawResponse`, `ApiRequestError`

**Step 2: Create constants.ts**

Move:
- `CLI_NAME`, `CLI_VERSION`, `DEFAULT_APP_ID`, `DEFAULT_BASE_URL`, `FOCUSED_TOP_LEVEL_COMMANDS`, `HTTP_METHODS`, `MAX_RESPONSE_CHARS`, `KNOWN_APPS`

**Step 3: Update cli.ts imports**

Replace inline definitions with imports from new modules.

**Step 4: Verify build**

```bash
cd packages/cli && pnpm build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(cli): extract types and constants into separate modules"
```

### Task 2.2: Extract config, HTTP, envelope, options, and util modules

**Files:**
- Create: `packages/cli/src/config.ts` — `readConfig`, `writeConfig`, `resolveAppId`, `resolveBaseUrl`, `resolveToken`, `saveAppSession`, `clearAppToken`, `setCurrentApp`, `getConfigPath`, `getConfigDir`
- Create: `packages/cli/src/http.ts` — `requestApi`, `requestApiRaw`, `buildUrl`, `appendQueryParams`
- Create: `packages/cli/src/envelope.ts` — `respond`, `respondError`, `compactResponseBody`, `truncateArray`, `runAndPrint`, `runEndpointCommand`
- Create: `packages/cli/src/options.ts` — `appOption`, `baseUrlOption`, `tokenOption`, `bodyOption`, `noAuthOption`, `entityRequestOptions`, `withContext`, `parseAppFromArgs`
- Create: `packages/cli/src/util.ts` — `unwrapOption`, `normalizeAppId`, `parseJsonOption`, `stringifyShort`, `toRecord`, `normalizeProfile`, `normalizeCommand`, `rewriteCommandPath`, `rewriteUsageInResult`, `sleep`
- Modify: `packages/cli/src/cli.ts`

**Step 1: Create each file, move functions, update imports**

Each file imports from `./types` and `./constants` as needed. Functions that call each other stay in the same module or import across.

Dependency order:
```
types.ts, constants.ts       (no imports from src/)
util.ts                      (imports types, constants)
config.ts                    (imports types, constants, util)
http.ts                      (imports types, constants, util)
envelope.ts                  (imports types, constants, util, http)
options.ts                   (imports types, constants, config, util, envelope)
```

**Step 2: Verify build**

```bash
cd packages/cli && pnpm build
```

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor(cli): extract config, http, envelope, options, util modules"
```

### Task 2.3: Extract command modules

**Files:**
- Create: `packages/cli/src/commands/app.ts`
- Create: `packages/cli/src/commands/auth.ts`
- Create: `packages/cli/src/commands/crud/survey.ts`
- Create: `packages/cli/src/commands/crud/post.ts`
- Create: `packages/cli/src/commands/crud/lesson.ts`
- Create: `packages/cli/src/commands/crud/product.ts`
- Create: `packages/cli/src/commands/crud/shortlink.ts`
- Create: `packages/cli/src/commands/crud/index.ts`
- Create: `packages/cli/src/commands/creator/upload.ts`
- Create: `packages/cli/src/commands/creator/video.ts`
- Create: `packages/cli/src/commands/creator/publish.ts`
- Create: `packages/cli/src/commands/creator/index.ts`
- Create: `packages/cli/src/commands/support.ts`
- Create: `packages/cli/src/commands/analytics/survey.ts`
- Create: `packages/cli/src/commands/analytics/shortlink.ts`
- Create: `packages/cli/src/commands/analytics/index.ts`
- Create: `packages/cli/src/commands/passthrough/trpc.ts`
- Create: `packages/cli/src/commands/passthrough/uploadthing.ts`
- Modify: `packages/cli/src/cli.ts` — slim down to root command + run

**Step 1: Move each command group into its file**

Each file exports the parent `Command` (e.g. `export const appCommand = ...`).

**Step 2: Slim cli.ts to ~50 lines**

```ts
#!/usr/bin/env node
import { Command } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Effect } from 'effect'
import { CLI_NAME, CLI_VERSION } from './constants'
import { runAndPrint, respond } from './envelope'
import { readConfig, resolveAppId } from './config'
import { getAppDefinition } from './util'
import { appCommand } from './commands/app'
import { authCommand } from './commands/auth'
import { creatorCommand } from './commands/creator'
import { supportCommand } from './commands/support'
import { crudCommand } from './commands/crud'
import { analyticsCommand } from './commands/analytics'

const root = Command.make(CLI_NAME, {}, () =>
  runAndPrint(async () => {
    // ... existing root handler, unchanged
  }),
).pipe(
  Command.withSubcommands([
    appCommand,
    authCommand,
    creatorCommand,
    supportCommand,
    crudCommand,
    analyticsCommand,
  ]),
  Command.withDescription('Course Builder CLI for wired apps and ADR-backed content operations'),
)

const cli = Command.run(root, { name: CLI_NAME, version: CLI_VERSION })
const argv = process.argv.filter((arg) => arg !== '--json')
cli(argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)
```

**Step 3: Update tsup.config.ts**

No changes needed — entry remains `src/cli.ts`.

**Step 4: Verify build**

```bash
cd packages/cli && pnpm build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(cli): modularize commands into per-module files"
```

---

### Task 2.4: Add a real test harness

**Files:**
- Modify: `packages/cli/package.json`
- Create: `packages/cli/vitest.config.ts`
- Create: `packages/cli/src/__tests__/`

**Step 1: Add Vitest**

Add `vitest` to `devDependencies` and add scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 2: Create `vitest.config.ts`**

Use a minimal Node test environment matching the package layout.

**Step 3: Add an initial smoke test file**

Create `packages/cli/src/__tests__/envelope.test.ts` with a minimal assertion around `respond()` so the harness is actually exercised before phase 3.

**Step 4: Verify tests run**

```bash
cd packages/cli && pnpm test
```

Expected: Vitest runs and the smoke test passes.

**Step 5: Commit**

```bash
git add -A
git commit -m "test(cli): add vitest harness for cli package"
```

---

## Phase 3: ADR-0001 Generic Commands

**Goal:** Add `content-model`, `schema`, `resources`, and `links` commands that consume the ADR-0001 API surface, validate responses with exported zod schemas, and unwrap the API envelope into stable CLI payloads.

### Task 3.1: Add `content-model` command

**Files:**
- Modify: `packages/cli/package.json` — add `@coursebuilder/content-api`
- Create: `packages/cli/src/commands/content-model.ts`
- Modify: `packages/cli/src/cli.ts` — add to root subcommands

**Step 1: Implement content-model command**

```ts
import { Command } from '@effect/cli'
import {
  ApiSuccessSchema,
  ContentModelResponseSchema,
} from '@coursebuilder/content-api'
import { runAndPrint, respond, respondError } from '../envelope'
import { requestApi } from '../http'
import { entityRequestOptions, withContext } from '../options'

export const contentModelCommand = Command.make(
  'content-model',
  { ...entityRequestOptions },
  ({ app, baseUrl, token, noAuth }) =>
    runAndPrint(async () => {
      const resolved = await withContext({
        app,
        baseUrl,
        token,
        command: 'content-model',
        requireToken: false,
      })
      if (!resolved.ok) return resolved.payload

      try {
        const payload = await requestApi<unknown>({
          baseUrl: resolved.context.baseUrl,
          pathname: '/api/content-model',
          token: noAuth ? undefined : resolved.context.token,
        })

        const parsed = ApiSuccessSchema(ContentModelResponseSchema).safeParse(payload)
        if (!parsed.success) {
          return respondError(
            'content-model',
            'Invalid ADR content-model response',
            'INVALID_CONTENT_MODEL_RESPONSE',
            'Check the mounted route and schema exports, then retry.',
            [],
          )
        }

        return respond(
          'content-model',
          {
            app: resolved.context.appId,
            ...parsed.data.data,
          },
          [
            {
              command: 'resources list [--type <type>] [--app <app-id>]',
              description: 'List resources using a discovered type',
            },
            {
              command: 'schema <type>',
              description: 'View JSON schema for a resource type',
            },
          ],
        )
      } catch (error) {
        return respondError(
          'content-model',
          error instanceof Error ? error.message : 'Failed to fetch content model',
          'CONTENT_MODEL_FAILED',
          'Ensure the app is running and has /api/content-model mounted.',
          [],
        )
      }
    }),
).pipe(Command.withDescription('Show content model capabilities for the active app'))
```

**Step 2: Wire into root**

Add `contentModelCommand` to root subcommands array.

**Step 3: Verify build**

```bash
cd packages/cli && pnpm build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(cli): add content-model command for ADR-0001 capability discovery"
```

### Task 3.2: Add `schema` command

**Files:**
- Create: `packages/cli/src/commands/schema.ts`
- Modify: `packages/cli/src/cli.ts`

**Step 1: Implement schema command**

Fetches `/api/content-model`, extracts and formats the JSON schema for the requested type.

```ts
import { Args, Command } from '@effect/cli'
import {
  ApiSuccessSchema,
  ContentModelResponseSchema,
} from '@coursebuilder/content-api'
import { runAndPrint, respond, respondError } from '../envelope'
import { entityRequestOptions, withContext } from '../options'
import { requestApi } from '../http'

export const schemaCommand = Command.make(
  'schema',
  {
    ...entityRequestOptions,
    entity: Args.text({ name: 'entity' }).pipe(
      Args.withDescription('Resource type (e.g. post, lesson, post.create)'),
    ),
  },
  ({ app, baseUrl, token, noAuth, entity }) =>
    runAndPrint(async () => {
      const resolved = await withContext({
        app,
        baseUrl,
        token,
        command: `schema ${entity}`,
        requireToken: false,
      })
      if (!resolved.ok) return resolved.payload

      try {
        const payload = await requestApi<unknown>({
          baseUrl: resolved.context.baseUrl,
          pathname: '/api/content-model',
          token: noAuth ? undefined : resolved.context.token,
        })
        const parsed = ApiSuccessSchema(ContentModelResponseSchema).safeParse(payload)
        if (!parsed.success) {
          return respondError(
            `schema ${entity}`,
            'Invalid ADR content-model response',
            'INVALID_CONTENT_MODEL_RESPONSE',
            'Check the mounted route and schema exports, then retry.',
            [],
          )
        }

        const typeName = entity.split('.')[0]!
        const found = parsed.data.data.resourceTypes.find((rt) => rt.type === typeName)

        if (!found) {
          return respondError(
            `schema ${entity}`,
            `Type '${typeName}' not found in content model`,
            'TYPE_NOT_FOUND',
            'Run `coursebuilder content-model` to see available types.',
            [
              {
                command: 'content-model [--app <app-id>]',
                description: 'View all registered types',
              },
            ],
          )
        }

        return respond(
          `schema ${entity}`,
          {
            type: found.type,
            label: found.label,
            operations: found.operations,
            states: found.states,
            fieldsJsonSchema: found.fieldsJsonSchema,
          },
          [
            {
              command: `resources list --type ${found.type} [--app <app-id>]`,
              description: `List ${found.type} resources`,
            },
          ],
        )
      } catch (error) {
        return respondError(
          `schema ${entity}`,
          error instanceof Error ? error.message : 'Failed to fetch content model',
          'CONTENT_MODEL_FAILED',
          'Ensure the app is running and has /api/content-model mounted.',
          [],
        )
      }
    }),
).pipe(Command.withDescription('Show JSON schema for a resource type'))
```

**Step 2: Wire into root**

**Step 3: Verify build and commit**

```bash
cd packages/cli && pnpm build
git add -A
git commit -m "feat(cli): add schema command for type introspection"
```

### Task 3.3: Add `resources` commands

**Files:**
- Create: `packages/cli/src/commands/resources.ts`
- Modify: `packages/cli/src/cli.ts`

**Step 1: Implement resources list/get/create/update/delete/children/parents/tree**

```ts
import {
  ApiSuccessSchema,
  ContentResourceListResponseSchema,
  ContentResourceReadSchema,
  CreateResourceSchema,
  UpdateResourceFieldsSchema,
} from '@coursebuilder/content-api'

// resources list — GET /api/content-resources
export const resourcesListCommand = Command.make(
  'list',
  {
    ...entityRequestOptions,
    type: Options.text('type').pipe(Options.optional),
    state: Options.text('state').pipe(Options.optional),
    search: Options.text('search').pipe(Options.optional),
    page: Options.integer('page').pipe(Options.optional),
    limit: Options.integer('limit').pipe(Options.optional),
    sort: Options.text('sort').pipe(Options.optional),
    order: Options.text('order').pipe(Options.optional),
  },
  ({ app, baseUrl, token, noAuth, type, state, search, page, limit, sort, order }) =>
    runAndPrint(async () => {
      // Resolve context, fetch /api/content-resources, parse with
      // ApiSuccessSchema(ContentResourceListResponseSchema), and return
      // parsed.data.data as the CLI result payload.
    }),
).pipe(Command.withDescription('List content resources with filters'))

// resources get — GET /api/content-resources/:id
export const resourcesGetCommand = Command.make(
  'get',
  {
    ...entityRequestOptions,
    id: Args.text({ name: 'id' }).pipe(Args.withDescription('Resource ID')),
  },
  ({ app, baseUrl, token, noAuth, id }) =>
    runAndPrint(async () => {
      // Resolve context, fetch /api/content-resources/:id, parse with
      // ApiSuccessSchema(ContentResourceReadSchema), and return
      // parsed.data.data as the CLI result payload.
    }),
).pipe(Command.withDescription('Get a content resource by ID'))

// resources create — POST /api/content-resources
export const resourcesCreateCommand = Command.make(
  'create',
  {
    ...entityRequestOptions,
    body: bodyOption,
    dryRun: dryRunOption,
    confirm: confirmOption,
  },
  ({ app, baseUrl, token, noAuth, body, dryRun, confirm }) =>
    runAndPrint(async () => {
      // Parse body JSON, validate with CreateResourceSchema, require --confirm,
      // and return the created resource after ApiSuccessSchema(ContentResourceReadSchema) validation.
    }),
).pipe(Command.withDescription('Create a content resource'))

// resources update — PATCH /api/content-resources/:id
export const resourcesUpdateCommand = Command.make(
  'update',
  {
    ...entityRequestOptions,
    id: Args.text({ name: 'id' }).pipe(Args.withDescription('Resource ID')),
    body: bodyOption,
    dryRun: dryRunOption,
    confirm: confirmOption,
  },
  ({ app, baseUrl, token, noAuth, id, body, dryRun, confirm }) =>
    runAndPrint(async () => {
      // Parse body JSON, validate with UpdateResourceFieldsSchema, require --confirm,
      // and return the updated resource after ApiSuccessSchema(ContentResourceReadSchema) validation.
    }),
).pipe(Command.withDescription('Update a content resource'))

// resources delete — DELETE /api/content-resources/:id
export const resourcesDeleteCommand = Command.make(
  'delete',
  {
    ...entityRequestOptions,
    id: Args.text({ name: 'id' }).pipe(Args.withDescription('Resource ID')),
    dryRun: dryRunOption,
    confirm: confirmOption,
  },
  ({ app, baseUrl, token, noAuth, id, dryRun, confirm }) =>
    runAndPrint(async () => {
      // Require --confirm, call DELETE /api/content-resources/:id,
      // and surface the validated ADR response cleanly.
    }),
).pipe(Command.withDescription('Delete a content resource'))

// resources children — GET /api/content-resources/:id/children
export const resourcesChildrenCommand = Command.make(
  'children',
  {
    ...entityRequestOptions,
    id: Args.text({ name: 'id' }).pipe(Args.withDescription('Resource ID')),
  },
  ({ app, baseUrl, token, noAuth, id }) =>
    runAndPrint(async () =>
      runEndpointCommand({
        command: `resources children ${id}`,
        app, baseUrl, token, noAuth,
        method: 'GET',
        pathname: `/api/content-resources/${encodeURIComponent(id)}/children`,
        defaultNextActions: [
          {
            command: `resources get ${id} [--app <app-id>]`,
            description: 'View this resource',
          },
          {
            command: `links create --parent ${id} --child <child-id> [--app <app-id>]`,
            description: 'Link a child resource',
          },
        ],
      }),
    ),
).pipe(Command.withDescription('List child resources'))

// resources parents — GET /api/content-resources/:id/parents
export const resourcesParentsCommand = Command.make(
  'parents',
  {
    ...entityRequestOptions,
    id: Args.text({ name: 'id' }).pipe(Args.withDescription('Resource ID')),
  },
  ({ app, baseUrl, token, noAuth, id }) =>
    runAndPrint(async () =>
      runEndpointCommand({
        command: `resources parents ${id}`,
        app, baseUrl, token, noAuth,
        method: 'GET',
        pathname: `/api/content-resources/${encodeURIComponent(id)}/parents`,
      }),
    ),
).pipe(Command.withDescription('List parent resources'))

// resources tree — recursive children walk
export const resourcesTreeCommand = Command.make(
  'tree',
  {
    ...entityRequestOptions,
    id: Args.text({ name: 'id' }).pipe(Args.withDescription('Resource ID')),
    depth: Options.integer('depth').pipe(
      Options.withDescription('Max tree depth (default: 3)'),
      Options.withDefault(3),
    ),
  },
  ({ app, baseUrl, token, noAuth, id, depth }) =>
    runAndPrint(async () => {
      const resolved = await withContext({
        app, baseUrl, token,
        command: `resources tree ${id}`,
        requireToken: false,
      })
      if (!resolved.ok) return resolved.payload

      const fetchNode = async (nodeId: string, currentDepth: number): Promise<unknown> => {
        const resource = await requestApi<unknown>({
          baseUrl: resolved.context.baseUrl,
          pathname: `/api/content-resources/${encodeURIComponent(nodeId)}`,
          token: noAuth ? undefined : resolved.context.token,
        })
        if (currentDepth >= depth) return resource

        try {
          const childrenResponse = await requestApi<unknown>({
            baseUrl: resolved.context.baseUrl,
            pathname: `/api/content-resources/${encodeURIComponent(nodeId)}/children`,
            token: noAuth ? undefined : resolved.context.token,
          })
          const children = ApiSuccessSchema(ContentResourceListResponseSchema)
            .parse(childrenResponse)
            .data.data
          if (Array.isArray(children) && children.length > 0) {
            const childTrees = await Promise.all(
              children.map((child: { id: string }) =>
                fetchNode(child.id, currentDepth + 1),
              ),
            )
            return { ...toRecord(resource), children: childTrees }
          }
        } catch {
          // No children endpoint or empty
        }

        return resource
      }

      try {
        const tree = await fetchNode(id, 0)
        const compact = await compactResponseBody({
          body: tree,
          label: `tree-${resolved.context.appId}-${id}`,
        })

        return respond(
          `resources tree ${id}`,
          {
            app: resolved.context.appId,
            depth,
            tree: compact.body,
            treeTruncated: compact.bodyTruncated,
            ...(compact.bodyFullOutput && { treeFullOutput: compact.bodyFullOutput }),
          },
          [
            {
              command: `resources get ${id} [--app <app-id>]`,
              description: 'View root resource details',
            },
          ],
        )
      } catch (error) {
        return respondError(
          `resources tree ${id}`,
          error instanceof Error ? error.message : 'Failed to build tree',
          'TREE_FAILED',
          'Check resource ID and permissions.',
          [],
        )
      }
    }),
).pipe(Command.withDescription('Show full resource hierarchy'))
```

**Step 2: Compose parent command**

```ts
export const resourcesCommand = Command.make('resources', {}, () =>
  runAndPrint(async () =>
    respond('resources', {
      description: 'Generic content resource operations (ADR-0001)',
      commands: [
        { name: 'list', description: 'List resources', usage: 'coursebuilder resources list [--type <type>]' },
        { name: 'get', description: 'Get resource by ID', usage: 'coursebuilder resources get <id>' },
        { name: 'create', description: 'Create resource', usage: "coursebuilder resources create --body '<json>' --confirm" },
        { name: 'update', description: 'Update resource', usage: "coursebuilder resources update <id> --body '<json>' --confirm" },
        { name: 'delete', description: 'Delete resource', usage: 'coursebuilder resources delete <id> --confirm' },
        { name: 'tree', description: 'Full hierarchy', usage: 'coursebuilder resources tree <id>' },
        { name: 'children', description: 'List children', usage: 'coursebuilder resources children <id>' },
        { name: 'parents', description: 'List parents', usage: 'coursebuilder resources parents <id>' },
      ],
    }, [
      { command: 'resources list [--type <type>] [--app <app-id>]', description: 'List resources' },
      { command: 'content-model [--app <app-id>]', description: 'View available types' },
    ]),
  ),
).pipe(
  Command.withSubcommands([
    resourcesListCommand,
    resourcesGetCommand,
    resourcesCreateCommand,
    resourcesUpdateCommand,
    resourcesDeleteCommand,
    resourcesTreeCommand,
    resourcesChildrenCommand,
    resourcesParentsCommand,
  ]),
  Command.withDescription('Generic content resource CRUD operations (ADR-0001)'),
)
```

**Step 3: Wire into root subcommands**

**Step 4: Verify build and commit**

```bash
cd packages/cli && pnpm build
git add -A
git commit -m "feat(cli): add resources commands for ADR-0001 generic surface"
```

### Task 3.4: Add `links` commands

**Files:**
- Create: `packages/cli/src/commands/links.ts`
- Modify: `packages/cli/src/cli.ts`

**Step 1: Implement links create/delete**

```ts
// links create — POST /api/content-resource-links
export const linksCreateCommand = Command.make(
  'create',
  {
    ...entityRequestOptions,
    parent: Options.text('parent').pipe(Options.withDescription('Parent resource ID')),
    child: Options.text('child').pipe(Options.withDescription('Child resource ID')),
    position: Options.integer('position').pipe(
      Options.withDescription('Position in parent (default: 0)'),
      Options.optional,
    ),
  },
  ({ app, baseUrl, token, noAuth, parent, child, position }) =>
    runAndPrint(async () =>
      runEndpointCommand({
        command: `links create --parent ${parent} --child ${child}`,
        app, baseUrl, token, noAuth,
        method: 'POST',
        pathname: '/api/content-resource-links',
        body: {
          parentId: parent,
          childId: child,
          position: unwrapOption<number>(position) ?? 0,
        },
        defaultNextActions: [
          {
            command: `resources children ${parent} [--app <app-id>]`,
            description: 'View children of parent',
          },
        ],
      }),
    ),
).pipe(Command.withDescription('Create a parent-child resource link'))

// links delete — DELETE /api/content-resource-links
export const linksDeleteCommand = Command.make(
  'delete',
  {
    ...entityRequestOptions,
    parent: Options.text('parent').pipe(Options.withDescription('Parent resource ID')),
    child: Options.text('child').pipe(Options.withDescription('Child resource ID')),
  },
  ({ app, baseUrl, token, noAuth, parent, child }) =>
    runAndPrint(async () =>
      runEndpointCommand({
        command: `links delete --parent ${parent} --child ${child}`,
        app, baseUrl, token, noAuth,
        method: 'DELETE',
        pathname: '/api/content-resource-links',
        body: {
          parentId: parent,
          childId: child,
        },
        defaultNextActions: [
          {
            command: `resources children ${parent} [--app <app-id>]`,
            description: 'View remaining children',
          },
        ],
      }),
    ),
).pipe(Command.withDescription('Delete a parent-child resource link'))
```

**Step 2: Compose parent, wire into root**

**Step 3: Verify build and commit**

```bash
cd packages/cli && pnpm build
git add -A
git commit -m "feat(cli): add links commands for ADR-0001 graph mutations"
```

### Task 3.5: Add generic `api` passthrough command

**Files:**
- Create: `packages/cli/src/commands/api.ts`
- Modify: `packages/cli/src/cli.ts`

**Step 1: Implement generic API passthrough**

```ts
// api <method> <path> [--body <json>] [--header <key:value>]
export const apiCommand = Command.make(
  'api',
  {
    ...entityRequestOptions,
    method: Args.text({ name: 'method' }).pipe(
      Args.withDescription('HTTP method (GET|POST|PUT|PATCH|DELETE)'),
    ),
    path: Args.text({ name: 'path' }).pipe(
      Args.withDescription('API path (e.g. /api/posts)'),
    ),
    body: bodyOption,
  },
  ({ app, baseUrl, token, noAuth, method, path: apiPath, body }) =>
    runAndPrint(async () => {
      const upperMethod = method.toUpperCase()
      if (!HTTP_METHODS.includes(upperMethod as HttpMethod)) {
        return respondError(
          `api ${method} ${apiPath}`,
          `Unsupported method '${method}'`,
          'INVALID_HTTP_METHOD',
          `Use one of: ${HTTP_METHODS.join(', ')}`,
          [],
        )
      }

      const parsedBody = parseJsonOption({
        command: `api ${method} ${apiPath}`,
        option: 'body',
        value: unwrapOption<string>(body),
      })
      if (!parsedBody.ok) return parsedBody.payload

      return runEndpointCommand({
        command: `api ${upperMethod} ${apiPath}`,
        app, baseUrl, token, noAuth,
        method: upperMethod as HttpMethod,
        pathname: apiPath,
        body: parsedBody.value,
      })
    }),
).pipe(Command.withDescription('Hit any app API route directly'))
```

**Step 2: Wire into root**

**Step 3: Verify build and commit**

```bash
cd packages/cli && pnpm build
git add -A
git commit -m "feat(cli): add generic api passthrough command"
```

### Task 3.6: Update root command and next_actions

**Files:**
- Modify: `packages/cli/src/cli.ts` (or `packages/cli/src/commands/root.ts`)

**Step 1: Update root handler**

Add new commands to the root `commands` array and `next_actions`:

```ts
commands: [
  // ... existing
  {
    name: 'content-model',
    description: 'Content model capability matrix',
    usage: 'coursebuilder content-model [--app <app-id>]',
  },
  {
    name: 'resources',
    description: 'Generic content resource CRUD operations',
    usage: 'coursebuilder resources list [--type <type>]',
  },
  {
    name: 'links',
    description: 'Content resource graph mutations',
    usage: 'coursebuilder links create --parent <id> --child <id>',
  },
  {
    name: 'schema',
    description: 'JSON schema for a resource type',
    usage: 'coursebuilder schema <type>',
  },
  {
    name: 'api',
    description: 'Generic API passthrough',
    usage: 'coursebuilder api GET /api/some-path',
  },
],
```

**Step 2: Update `FOCUSED_TOP_LEVEL_COMMANDS`**

Add: `'resources'`, `'links'`, `'content-model'`, `'schema'`, `'api'`

**Step 3: Verify build and commit**

```bash
cd packages/cli && pnpm build
git add -A
git commit -m "feat(cli): wire new ADR-0001 commands into root and update next_actions"
```

---

## Phase 4: Write Safety + Polish

**Goal:** Add `--full`, require explicit `--confirm` for all mutations, and harden input/response handling.

### Task 4.1: Add `--full` flag

**Files:**
- Modify: `packages/cli/src/options.ts`
- Modify: `packages/cli/src/envelope.ts`

**Step 1: Add fullOption**

```ts
export const fullOption = Options.boolean('full').pipe(
  Options.withDescription('Disable response truncation'),
  Options.withDefault(false),
)
```

**Step 2: Thread through compactResponseBody and truncateArray**

When `full` is true, skip truncation and return the full body.

**Step 3: Add to entityRequestOptions**

```ts
const entityRequestOptions = {
  app: appOption,
  baseUrl: baseUrlOption,
  token: tokenOption,
  noAuth: noAuthOption,
  full: fullOption,
}
```

**Step 4: Update runEndpointCommand to accept `full`**

**Step 5: Verify build and commit**

```bash
cd packages/cli && pnpm build
git add -A
git commit -m "feat(cli): add --full flag to disable response truncation"
```

### Task 4.2: Require `--confirm` for write commands

**Files:**
- Modify: `packages/cli/src/options.ts` — add `dryRunOption`, `confirmOption`
- Modify: `packages/cli/src/envelope.ts` — add `runWriteCommand` wrapper

**Step 1: Add options**

```ts
export const dryRunOption = Options.boolean('dry-run').pipe(
  Options.withDescription('Preview changes without applying'),
  Options.withDefault(false),
)

export const confirmOption = Options.boolean('confirm').pipe(
  Options.withDescription('Apply changes (required for all write commands)'),
  Options.withDefault(false),
)
```

**Step 2: Add write safety wrapper**

In commands that mutate (create, update, delete on typed endpoints; generic `resources` create/update/delete; links create/delete), require `--confirm`. Without it, return a preview envelope and do not execute the write:

```ts
const shouldPreview = dryRun || !confirm

if (shouldPreview) {
  return respond(
    command,
    {
      mode: 'dry-run',
      description: 'Write not applied — pass --confirm to execute',
      wouldExecute: { method, pathname, body },
    },
    [
      {
        command: `${command} --confirm`,
        description: 'Execute this write',
      },
    ],
  )
}
```

**Step 3: Add to write commands**

Thread `dryRunOption` and `confirmOption` into the existing typed write commands plus the new generic ones: `post create/update/delete`, `survey create/update/delete`, `shortlink create/update/delete`, `lesson update`, `lesson solution create/update/delete`, `resources create/update/delete`, `links create/delete`.

**Step 4: Verify build and commit**

```bash
cd packages/cli && pnpm build
git add -A
git commit -m "feat(cli): require confirm for write commands and add preview mode"
```

### Task 4.3: Input hardening

**Files:**
- Create: `packages/cli/src/validate.ts`
- Modify write commands to use validators

**Step 1: Add input validators**

```ts
const RESOURCE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/

export const validateResourceId = (
  id: string,
  command: string,
): { ok: true } | { ok: false; payload: string } => {
  if (!id || !RESOURCE_ID_PATTERN.test(id)) {
    return {
      ok: false,
      payload: respondError(
        command,
        `Invalid resource ID '${id}' — must be alphanumeric, hyphens, underscores only`,
        'INVALID_RESOURCE_ID',
        'Check the ID and retry.',
        [],
      ),
    }
  }
  return { ok: true }
}

export const validatePathname = (
  pathname: string,
  command: string,
): { ok: true } | { ok: false; payload: string } => {
  if (pathname.includes('..') || pathname.includes('//') || /[<>"{}|\\^`]/.test(pathname)) {
    return {
      ok: false,
      payload: respondError(
        command,
        `Suspicious pathname '${pathname}'`,
        'INVALID_PATHNAME',
        'Remove path traversals, double slashes, or special characters.',
        [],
      ),
    }
  }
  return { ok: true }
}
```

**Step 2: Add validation to `resources get`, `resources tree`, `resources children`, `resources parents`, and `api` passthrough**

**Step 3: Verify build and commit**

```bash
cd packages/cli && pnpm build
git add -A
git commit -m "feat(cli): add input hardening for resource IDs and pathnames"
```

---

## Testing Strategy

### Automated tests

Create `packages/cli/src/__tests__/` with:

- `config.test.ts` — config read/write, `COURSEBUILDER_*` env var precedence
- `envelope.test.ts` — respond/respondError structure, truncation
- `adr-response.test.ts` — `ApiSuccessSchema(...)` parsing and CLI unwrapping for `content-model`, `schema`, and `resources`
- `write-safety.test.ts` — preview mode without `--confirm`, execution path with `--confirm`
- `validate.test.ts` — resource ID and pathname validators

These can be added incrementally alongside each phase.

### Manual smoke testing

```bash
# After Phase 1
cd packages/cli && pnpm dev
# -> root envelope with "coursebuilder" branding

cd packages/cli && pnpm dev -- app list
# -> lists all known apps

# After Phase 3
cd packages/cli && pnpm dev -- content-model --app ai-hero --base-url http://localhost:3000
cd packages/cli && pnpm dev -- resources list --type post --app ai-hero --base-url http://localhost:3000
cd packages/cli && pnpm dev -- schema post --app ai-hero --base-url http://localhost:3000
cd packages/cli && pnpm dev -- resources create --body '{"type":"post","fields":{"title":"Test"}}'
# -> preview envelope, write not applied
cd packages/cli && pnpm dev -- resources create --body '{"type":"post","fields":{"title":"Test"}}' --confirm
```

### End-to-end with ngrok

Use the flow described in `docs/plans/2026-03-06-content-api.md` — device OAuth via Playwright or manual CLI auth.

```bash
BASE=https://vojta.ngrok.app
coursebuilder auth login --app ai-hero --base-url $BASE
coursebuilder content-model
coursebuilder resources list --type post
coursebuilder resources get $SOME_ID
coursebuilder resources tree $SOME_ID
coursebuilder links create --parent $LESSON_ID --child $VIDEO_ID
```

---

## Summary

```
P1 Rename + Multi-App ──── P2 Modularize ──── P3 ADR-0001 Commands ──── P4 Write Safety
```

| Phase | Scope | Key deliverable |
|-------|-------|----|
| P1 | Move package, rename binary, multi-app config | `coursebuilder` binary with hard cutover config/env naming |
| P2 | Break 5057-line monolith into modules | ~20 focused files, same behavior |
| P3 | content-model, schema, resources, links, api | ADR-0001 generic CLI surface |
| P4 | --confirm, --dry-run, --full, input validation | Explicit write safety for agent workflows |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| `@effect/cli` Option API quirks during modularization | Verify each phase builds; no behavior changes in P2 |
| Wired app list drifts from reality | Only add `KNOWN_APPS` entries for apps with mounted routes and verified auth behavior |
| Tree command hits API rate limits on deep hierarchies | Depth cap (default 3), --depth flag |
| Confirm-required writes add friction | Preview envelope includes exact request and `next_actions` point to the `--confirm` form |
| Package rename breaks CI/deploy | Update CI/release/install references in the same PR |
