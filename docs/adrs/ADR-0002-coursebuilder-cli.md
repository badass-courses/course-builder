# ADR-0002: Course Builder CLI

**Status:** Proposed
**Date:** 2026-03-06
**Authors:** Vojta Holik
**Deciders:** Vojta Holik, Joel Hooks

## Context

We run multiple course-builder apps (ai-hero, code-with-antonio, epic-web, tuis-dev) that share the same data model but each has its own type taxonomy and business rules. We need a single CLI that can manage content across all of them — usable by humans and AI agents alike.

`packages/aihero-cli` already solves this for AI Hero. It's a 5031-line Effect/CLI program with OAuth device flow auth, structured JSON output, multi-app profiles, context truncation, and 65+ commands covering CRUD, analytics, uploads, and generic endpoint passthrough. It's battle-tested with Claude Code.

The problem: it's hardcoded to AI Hero. Every app needs the same operations.

ADR-0001 defines the API surface these operations depend on — generic read/query endpoints, typed write endpoints per resource type, graph mutations, and a `/api/content-model` capability discovery endpoint. This ADR covers the CLI that consumes that API.

## Decision

### 1. Rename aihero-cli to cli, call the binary `coursebuilder`

Evolve in place — don't fork. Move `packages/aihero-cli` to `packages/cli`.

- Binary: `coursebuilder`
- Config: `~/.config/coursebuilder/config.json`
- Auto-migrate `~/.config/aihero/config.json` on first run
- Keep `aihero` as an alias during transition

Everything that works today keeps working: JSON envelope, OAuth, Effect/CLI, Bun compile, context truncation.

### 2. JSON Envelope Protocol

Every response follows the same structure. This is the contract between the CLI and any consumer (agent, script, human piping to `jq`).

```
Success:
{
  "ok": true,
  "command": "resources list",
  "result": { ... },
  "next_actions": [
    {
      "command": "resources get abc123",
      "description": "View resource details",
      "params": { "depth": { "default": 1 } }
    }
  ]
}

Error:
{
  "ok": false,
  "command": "resources list",
  "error": { "message": "...", "code": "HTTP_401" },
  "fix": "Run: coursebuilder auth login",
  "next_actions": [
    { "command": "auth login", "description": "Authenticate" }
  ]
}
```

`next_actions` is the key agent pattern — every response tells the agent what to do next without the agent needing to know the full command tree upfront.

### 3. Command Tree

```
coursebuilder <command> [options]

Global options on every command:
  --app ID          override active app
  --base-url URL    override base URL
  --token TOKEN     override auth token
  --no-auth         skip authentication
  --full            disable response truncation

App management:
  app list                       list configured apps
  app use ID                     switch active app
  app current                    show active app + base URL

Auth:
  auth login                     OAuth device flow
  auth whoami                    show current user
  auth logout                    clear stored token

Content resources (generic reads — ADR-0001):
  resources list                 [--type T] [--state S] [--search Q]
  resources get ID               [--depth N]
  resources tree ID              full hierarchy
  resources children ID
  resources parents ID

Content graph (ADR-0001):
  links create                   --parent ID --child ID [--position N]
  links delete                   --parent ID --child ID

Typed writes (per resource type — ADR-0001):
  post list | get | create | update | delete
  lesson list | update
  solution get | create | update | delete
  survey list | get | create | update | delete
  shortlink list | get | create | update | delete

Versions:
  versions list ID
  versions diff ID               --from V1 --to V2
  versions rollback ID           --to VERSION

Discovery:
  content-model                  what types/operations this app supports
  schema ENTITY                  Zod-derived JSON schema for any command

Generic passthrough:
  api GET|POST|PUT|DELETE PATH   hit any app API route directly
```

Typed write commands (`post`, `lesson`, `survey`, etc.) accept both forms:

```bash
# Agent path — raw JSON payload
coursebuilder post create --json '{"fields":{"title":"X","body":"Y"}}'

# Human path — convenience flags
coursebuilder post create --title "X" --body "Y"
```

### 4. Multi-App Profiles

```json
// ~/.config/coursebuilder/config.json
{
  "currentApp": "ai-hero",
  "apps": {
    "ai-hero": {
      "baseUrl": "https://aihero.dev",
      "token": "...",
      "tokenCreatedAt": "2026-03-06T10:00:00Z"
    },
    "code-with-antonio": {
      "baseUrl": "https://codewithantonio.com",
      "token": "...",
      "tokenCreatedAt": "2026-03-06T10:05:00Z"
    },
    "local": {
      "baseUrl": "http://localhost:3000",
      "token": "..."
    }
  }
}
```

Resolution chain (same as aihero-cli, new prefix):

```
CLI flag --app           -> picks the app
CLI flag --base-url      -> overrides base URL
CLI flag --token         -> overrides token
COURSEBUILDER_APP         -> env override for active app
COURSEBUILDER_BASE_URL    -> env override for base URL
COURSEBUILDER_AUTH_TOKEN  -> env override for token
config file              -> stored values
built-in defaults        -> known app definitions
```

Known apps ship with the CLI (id, displayName, defaultBaseUrl, auth paths). Unknown app IDs create profiles on the fly with sensible defaults.

### 5. Capability Discovery via content-model

The CLI queries `GET /api/content-model` (defined in ADR-0001) to learn what the current app supports:

- Resource types and their fields
- Available operations per type
- Allowed parent-child edges
- Field schema references

This means when an app adds a new resource type, the CLI picks it up without a release. `coursebuilder content-model` shows the full capability matrix. `coursebuilder schema post.create` returns the JSON schema for creating a post.

### 6. Context Management for Agents

Agents have limited context windows. The CLI protects them:

- **Response truncation**: Inline output capped at 12k chars. Full response written to `/tmp/coursebuilder-{app}-{command}-{timestamp}.json` with a pointer in the response.
- **Array truncation**: Lists capped at 25 items by default. `--full` returns everything.
- **`--full` flag**: Disables all truncation when the agent or human wants the complete output.
- **Input hardening**: Reject malformed resource IDs (embedded query params, fragments, whitespace), path traversals, double-encoded URLs. Validate JSON payloads against Zod schemas before sending.

### 7. Write Safety

- **`--dry-run` on every write**: Returns diff without applying. Default when no TTY detected (agent mode) — requires `--confirm` to apply.
- **Version snapshots**: Opt-in on API write routes that choose to create a `ContentResourceVersion` before mutation. Measure DB cost before expanding.
- **Rate limiting**: In-process write counter. Configurable max writes per minute/session.
- **Audit log**: Every command logged to `./audit/YYYY-MM-DD.jsonl`.

### 8. API-First

CLI talks HTTP to product apps. No direct DB access. No `DATABASE_URL`.

The app owns validation, auth, business logic, side effects (Inngest events, etc.). The CLI is a thin authenticated HTTP client with structured output. API routes needed by the CLI are defined in ADR-0001 and implemented via a shared `@coursebuilder/content-api` package plus thin app-local `route.ts` wrappers. Auth remains app-owned; shared handlers receive injected authorization callbacks rather than importing app-local ability types.

### 9. Toolchain

- **Runtime**: `@effect/cli` for command parsing, `effect` for structured errors
- **Build**: `tsup` for ESM, `bun build --compile` for standalone binary
- **Targets**: darwin-x64, darwin-arm64, linux-x64, linux-arm64
- **Distribution**: GitHub Releases + curl installer
- **Dev**: `tsx src/cli.ts` for running from source

## Implementation Plan

### Phase 1 — Rename + generalize (CLI only, no new API routes)

1. Move `packages/aihero-cli` -> `packages/cli`
2. Rename binary `aihero` -> `coursebuilder`, keep `aihero` as alias
3. Config: `~/.config/aihero/` -> `~/.config/coursebuilder/`, auto-migrate on first run
4. Env vars: `AIHERO_*` -> `COURSEBUILDER_*`, keep old vars as fallback
5. Add known app definitions for all products (code-with-antonio, epic-web, tuis-dev)
6. Existing commands keep working against existing app API routes — zero breakage

### Phase 2 — ADR-0001 generic read surface

Depends on ADR-0001 shipping `content-model` and shared read routes.

1. Add `content-model` command (queries `GET /api/content-model`)
2. Add `schema ENTITY` command (queries `GET /api/content-model` + formats per-type schemas)
3. Add `resources list|get|tree|children|parents` commands
4. Wire `next_actions` to reference generic resource commands alongside typed ones

### Phase 3 — Graph + typed writes

Depends on ADR-0001 graph routes and any opt-in typed write envelope/version work that actually lands.

1. Add `links create|delete` commands
2. Add `versions list|diff|rollback` commands
3. Add `--dry-run` / `--confirm` flow for all write commands
4. Non-TTY detection: default to dry-run when agent is driving

### Phase 4 — Modularize

1. Break `cli.ts` (5031 lines) into per-command modules
2. Shared: envelope, config, auth, truncation, input validation
3. Per-command: resources, links, versions, post, lesson, survey, etc.

### Verification

- [ ] `coursebuilder app list` shows all configured products
- [ ] `coursebuilder auth login` completes OAuth device flow against any app
- [ ] `coursebuilder resources list --type lesson` returns stable JSON envelope
- [ ] `coursebuilder content-model` returns capability matrix from current app
- [ ] `coursebuilder schema post.create` returns Zod-derived JSON schema
- [ ] `coursebuilder post create --dry-run --json '{...}'` returns diff without writing
- [ ] Existing `aihero` binary alias still works
- [ ] Auto-migration from `~/.config/aihero/` succeeds on first run
- [ ] Context truncation: responses >12k chars overflow to temp file with pointer

## Consequences

### Positive

- **One CLI, all apps**: Same commands, same workflow everywhere
- **Proven foundation**: Refactored from working code, not greenfield
- **Agent-native**: JSON envelope + `next_actions` + schema introspection + context truncation. Zero upfront context cost — agent discovers on demand
- **Human-friendly too**: Convenience flags, `--help`, interactive prompts
- **Capability-driven**: content-model means new types work without CLI releases
- **Incremental**: Migration is step-by-step, nothing breaks along the way

### Negative

- **Bounded by API**: CLI can only do what the API exposes (ADR-0001 scope)
- **Single-file debt**: 5031 lines needs modularization
- **Config migration**: Existing aihero-cli users need auto-migration (proven pattern)

### Risks

- **Adapter gaps**: Some operations may need new `CourseBuilderAdapter` methods — additive, won't break existing
- **Type divergence**: Apps define different taxonomies — mitigated by content-model discovery
- **Package drift**: API contract and handler semantics can diverge from ADR-0001 if package boundaries are renamed loosely — mitigated by standardizing on `@coursebuilder/content-api`
- **Token expiry**: CLI handles 401 with `next_actions` pointing to `auth login`

## Alternatives Considered

### MCP server instead of CLI

Rejected. Tool definitions consume context tokens on every conversation — scales poorly as capabilities grow. CLI achieves the same agent integration with zero upfront cost via `--help` and `coursebuilder schema`. Also composable (piping, cron), framework-agnostic, testable as a standard program.

### Direct DB access

Rejected. Schema coupling, no business logic reuse, safety risk. See ADR-0001 for the API-first rationale.

### Separate CLI per app

Rejected. Duplicates envelope, auth, config, truncation patterns N times.

### Keep the name aihero-cli

Rejected. Name implies single-product scope. `coursebuilder` is the neutral monorepo name.

## References

- [ADR-0001: Hybrid Content Resource API Surface](ADR-0001-content-resource-api-surface.md) — defines the API endpoints this CLI consumes
- `packages/aihero-cli/src/cli.ts` — current implementation being evolved
