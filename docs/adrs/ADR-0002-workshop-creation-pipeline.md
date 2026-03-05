---
id: ADR-0002
title: Workshop Creation Pipeline (API Route, CLI Commands, Dropbox Import)
status: proposed
date: 2026-03-04
deciders:
  - app-engineering-code-with-antonio
  - platform-engineering
consulted:
  - joelhooks (CLI design principles, ADR-0001 author)
informed:
  - all app teams consuming the CLI
---

# Workshop Creation Pipeline (API Route, CLI Commands, Dropbox Import)

## Context and Problem Statement

How should agents and CLI tooling create workshops programmatically in
code-with-antonio?

ADR-0001 defined a hybrid API model: generic read endpoints for discovery,
typed write endpoints for resource creation. The `createWorkshopWithLessons()`
function already existed in `adapter-drizzle` and was called from the admin UI
via server actions, but no REST endpoint or CLI command exposed this capability
to agents.

The immediate use case: a creator has a Dropbox folder full of video files
organized by section. They want to run a single CLI command that creates the
full workshop structure (sections + lessons) and uploads all the videos.

Related: [ADR-0001](ADR-0001-content-resource-api-surface.md) — this ADR
implements part of ADR-0001's plan (typed write surface for workshops, CLI
capability discovery).

## Decision Drivers

* ADR-0001 mandates typed write endpoints per property, not generic CRUD
* CLI must follow agent-first design principles (JSON always, HATEOAS
  `next_actions`, errors suggest fixes, context-protecting output)
* Bearer token auth (OAuth device flow) is the CLI's auth mechanism —
  `getServerAuthSession()` only works with cookie-based sessions
* `courseBuilderAdapter.createWorkshop()` already handles the full transaction
  (workshop + sections + lessons + product + coupon) in adapter-drizzle
* Dropbox shared folder URLs are the primary video delivery mechanism for
  creators
* Lesson and section naming must be inferred from filenames automatically

## Considered Options

### Option A: Route calls `createWorkshopWithLessons()` from workshops-query.ts

Call the existing server action function directly from the API route.

* Good, because reuses existing code including TypeSense indexing and cache
  revalidation
* Bad, because `createWorkshopWithLessons()` internally calls
  `getServerAuthSession()` which requires cookie-based auth — bearer tokens
  from CLI would fail silently with an unauthorized error

### Option B: Route calls `courseBuilderAdapter.createWorkshop()` directly

The API route does its own auth via `getUserAbilityForRequest(request)`, then
calls the adapter method directly, bypassing the server action's session check.

* Good, because bearer token auth works correctly
* Good, because auth boundary stays at the route level (single responsibility)
* Good, because adapter handles the full transaction (workshop + sections +
  lessons + product + coupon)
* Bad, because TypeSense indexing and cache revalidation from the server action
  are not included (must be added separately if needed)

### Option C: Refactor `createWorkshopWithLessons()` to accept a userId parameter

Modify the server action to optionally accept a userId instead of always
calling `getServerAuthSession()`.

* Good, because single code path for both UI and API
* Bad, because server actions marked `'use server'` have different execution
  constraints than route handlers
* Bad, because requires changing a working function that the admin UI depends on

## Decision Outcome

Chosen option: **Option B — route calls adapter directly**, because it cleanly
separates the auth concern (route handles bearer tokens) from the business
logic (adapter handles the transaction). This follows ADR-0001's principle that
typed write endpoints own their auth boundaries.

### Consequences

* Good, because CLI and agents can create workshops via bearer token auth
* Good, because the route is a clean typed write surface per ADR-0001
* Good, because existing admin UI workflow is completely unaffected
* Bad, because TypeSense indexing does not happen on API-created workshops
  (acceptable for now — can be added via Inngest event later)
* Neutral, because cache revalidation (`revalidateTag`) only matters for the
  Next.js UI, not CLI consumers

## Filename-to-Title Convention

When importing from Dropbox (or any folder-based source), lesson and section
titles are derived from filenames using this deterministic algorithm:

### Algorithm

```
Input:  "00_RESONANCE_INTRO.mp4"
Step 1: Strip file extension          → "00_RESONANCE_INTRO"
Step 2: Strip leading digit prefix    → "RESONANCE_INTRO"
Step 3: Replace underscores/hyphens   → "RESONANCE INTRO"
Step 4: Title case                    → "Resonance Intro"
```

### Rules

1. **Strip extension**: remove everything after the last `.`
2. **Strip leading numeric prefix**: remove any leading digits followed by
   underscore or hyphen (`/^\d+[_-]+/`). Examples: `00_`, `01-`, `123_`
3. **Replace separators**: all underscores and hyphens become spaces
4. **Title case**: first letter of each word capitalized, rest lowercase

### Examples

| Filename | Title |
|---|---|
| `00_RESONANCE_INTRO.mp4` | Resonance Intro |
| `01_SETUP_AND_INSTALL.mov` | Setup And Install |
| `02-advanced-patterns.mp4` | Advanced Patterns |
| `10_FINAL_PROJECT.webm` | Final Project |

### Folder names follow the same rules

| Folder | Section Title |
|---|---|
| `01_FUNDAMENTALS/` | Fundamentals |
| `02_ADVANCED_TOPICS/` | Advanced Topics |

## Folder Structure Inference Convention

When importing from a Dropbox shared folder, the directory structure maps
directly to workshop hierarchy:

```
Dropbox Shared Folder (--url)
├── 00_INTRO.mp4                  → top-level lesson "Intro"
├── 01_GETTING_STARTED.mp4        → top-level lesson "Getting Started"
├── 02_FUNDAMENTALS/              → section "Fundamentals"
│   ├── 00_VARIABLES.mp4          →   lesson "Variables"
│   ├── 01_FUNCTIONS.mp4          →   lesson "Functions"
│   └── 02_CLASSES.mp4            →   lesson "Classes"
└── 03_ADVANCED/                  → section "Advanced"
    ├── 00_GENERICS.mp4           →   lesson "Generics"
    └── 01_PATTERNS.mp4           →   lesson "Patterns"
```

### Rules

1. **Video files** (`.mp4`, `.mov`, `.webm`) at the top level become
   **top-level lessons** (no section wrapper)
2. **Folders** at the top level become **sections**
3. **Video files inside folders** become **lessons within that section**
4. **Non-video files** are ignored (`.txt`, `.pdf`, `.png`, etc.)
5. **Ordering**: entries sorted alphabetically by filename — numeric prefixes
   (`00_`, `01_`, `02_`) provide natural ordering
6. **Empty folders** (no video files inside) are skipped
7. **Nesting depth**: only one level of folders is supported — subfolders
   inside subfolders are not traversed

## Implementation Plan

### Affected paths

* `apps/code-with-antonio/src/app/api/workshops/route.ts` — new file (typed
  write endpoint)
* `packages/aihero-cli/src/cli.ts` — modified (workshop CRUD + Dropbox import
  commands)

### Dependencies

* Dropbox API v2 (`files/list_folder` endpoint) — no new npm package, uses
  native `fetch()`
* Dropbox API access token required (`--dropbox-token` flag or
  `DROPBOX_TOKEN` env var)

### Patterns to follow

* **API route auth**: `getUserAbilityForRequest(request)` from
  `@/server/ability-for-request` — same as `posts/route.ts` and
  `uploads/new/route.ts`
* **API route structure**: CORS headers, OPTIONS handler, Zod validation,
  structured logging via `@/server/logger` — same as all existing routes
* **CLI command structure**: `Command.make()` with `entityRequestOptions`,
  `runEndpointCommand()` for API calls, `respond()`/`respondError()` for
  output — same as `postCommand`, `lessonCommand`, `shortlinkCommand`
* **CLI output**: JSON envelopes with `ok`, `command`, `result`,
  `next_actions` — never plain text

### Patterns to avoid

* Do NOT call `createWorkshopWithLessons()` from the route — it uses
  `getServerAuthSession()` which fails with bearer tokens
* Do NOT use `requestApi()` for Dropbox API calls — that helper is for the
  CWA server, use native `fetch()` for external APIs
* Do NOT add `--json` flags — JSON is always the output format
* Do NOT add Dropbox OAuth flow (browser redirect, token exchange, refresh) —
  the user provides a pre-generated access token via `--dropbox-token` or
  `DROPBOX_TOKEN` env var. This is intentional: simpler, no state to manage,
  and the token can be generated from https://www.dropbox.com/developers/apps

### Configuration

* `DROPBOX_TOKEN` environment variable (optional — can also use
  `--dropbox-token` flag)
* No other env vars or config changes needed

### API endpoint details

**POST /api/workshops**

Request body (Zod-validated):
```json
{
  "workshop": { "title": "string", "description": "string?" },
  "createProduct": "boolean?",
  "pricing": { "price": "number?", "quantity": "number?" },
  "coupon": { "enabled": "boolean", "percentageDiscount": "string?", "expires": "date?" },
  "structure": [
    { "type": "section", "title": "string", "lessons": [{ "title": "string", "videoResourceId": "string?" }] },
    { "type": "lesson", "title": "string", "videoResourceId": "string?" }
  ]
}
```

Response (201):
```json
{
  "success": true,
  "workshop": { "id": "workshop~xxx", "type": "workshop", "fields": { ... } },
  "sections": [{ "id": "section~xxx", ... }],
  "lessons": [{ "id": "lesson_xxx", ... }],
  "product": null
}
```

**GET /api/workshops**

* No params: returns array of all workshops
* `?slugOrId=<value>`: returns single workshop with sections/lessons

### CLI commands

```bash
# Workshop CRUD
aihero crud workshop list
aihero crud workshop get <slug-or-id>
aihero crud workshop create --title <title> --structure '<json>'

# Dropbox import
aihero creator import dropbox --url <dropbox-url> --title <title> --dry-run --dropbox-token <token>
aihero creator import dropbox --url <dropbox-url> --title <title> --dropbox-token <token>

# Legacy alias
aihero workshop list  # → aihero crud workshop list
```

### Verification

- [ ] `pnpm build` in `packages/aihero-cli` succeeds with no errors
- [ ] `aihero crud workshop --help` shows list, get, create subcommands
- [ ] `aihero creator import --help` shows dropbox subcommand
- [ ] `aihero workshop list` rewrites to `aihero crud workshop list` (legacy alias)
- [ ] POST `/api/workshops` with valid bearer token and structure body returns
      201 with workshop/section/lesson IDs
- [ ] POST `/api/workshops` without auth returns 401
- [ ] POST `/api/workshops` with invalid body returns 400 with Zod errors
- [ ] GET `/api/workshops` returns array of workshops
- [ ] GET `/api/workshops?slugOrId=<id>` returns single workshop with children
- [ ] `--dry-run` on Dropbox import returns inferred structure without creating
      anything
- [ ] Filename `00_RESONANCE_INTRO.mp4` produces title "Resonance Intro"
- [ ] Folders in Dropbox become sections, video files become lessons
- [ ] Non-video files are ignored during import

## More Information

* This ADR implements items 4 and 5 from ADR-0001's Implementation Plan
  (typed write endpoints and CLI capability updates)
* The Dropbox import uses the
  [files/list_folder](https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder)
  API with `shared_link` parameter to access shared folder contents
* TypeSense indexing for API-created workshops is deferred — when needed, add
  an Inngest event triggered by workshop creation
* Future work: `creator import` could support other sources (Google Drive, S3)
  using the same structure inference convention
