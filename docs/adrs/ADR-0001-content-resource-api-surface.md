---
id: ADR-0001
title: Hybrid Content Resource API Surface (Generic Reads, Typed Writes)
status: proposed
date: 2026-03-04
deciders:
  - platform-engineering
  - app-engineering-ai-hero
  - app-engineering-code-with-antonio
technical_story: Support multi-property content APIs without type-safety erosion.
---

## Context

We need an API surface for content resources that:

- Works for current `ai-hero` usage in production.
- Can be opened to other properties (for example `code-with-antonio`) with
  partially different concrete resource types.
- Preserves strong TypeScript and schema guarantees for library-style reuse.

### Observed production usage (AI Hero)

Live usage from `AI_ContentResource*` tables shows:

- `AI_ContentResource`: 1742 rows
- `AI_ContentResourceResource`: 1451 rows
- `AI_ContentResourceVersion`: 1074 rows
- `AI_ContentResourceProduct`: 5 rows
- `AI_ContentResourceTag`: 22 rows

Dominant resource types:

- `videoResource` (524)
- `raw-transcript` (507)
- `lesson` (309)
- `post` (109)
- `solution` (100)

Dominant relationship patterns:

- `videoResource -> raw-transcript` (501)
- `lesson -> videoResource` (224)
- `section -> lesson` (224)
- `workshop -> lesson` (109)
- `lesson -> solution` (100)
- `solution -> videoResource` (100)

The `fields` JSON payload is polymorphic by resource type, with significant
shape variation even inside a single type over historical records.

### Cross-property divergence

`code-with-antonio` uses the same conceptual model but a different table prefix
(`CWA_`) and has different type taxonomy entries in app-level enums
(`event`, `event-series`) that do not exactly match AI Hero local definitions.

## Decision

Adopt a **hybrid API model**:

1. **Generic read/query and graph endpoints** shared across properties.
2. **Type-specific write endpoints** owned by each property (or shared modules
   that remain per-type, not mega-generic).
3. **Capability and schema introspection endpoint** to let CLI/agents discover
   what each property supports at runtime.

### Why this decision

- A single generic write endpoint would collapse into weakly typed
  `type + blob` handling and degrade safety.
- Production data shows relationship-heavy graph operations that benefit from a
  shared generic graph API.
- Property-specific business invariants differ enough that write contracts
  should stay explicit and discriminated by type.

## Considered Options

### Option A: One generalized CRUD endpoint for all resource types

**Rejected.**

- Pros: single endpoint family, apparent uniformity.
- Cons: weak contracts, broad conditional logic, fragile auth/validation,
  difficult evolution across properties.

### Option B: Fully type-specific endpoints only

**Partially accepted but incomplete.**

- Pros: strong contracts and clear ownership.
- Cons: no shared discovery/query surface; poor fit for tooling and cross-app
  automation.

### Option C: Hybrid (selected)

**Accepted.**

- Keeps typed write boundaries.
- Provides shared query/graph model.
- Supports property-specific type taxonomies without forking client logic.

## Target API Shape

### Shared generic read/query surface

- `GET /api/content-resources`
- `GET /api/content-resources/:id`
- `GET /api/content-resources/:id/children`
- `GET /api/content-resources/:id/parents`

Common filters:

- `type`, `state`, `visibility`, `organizationId`, pagination, sort

### Shared graph mutation surface

- `POST /api/content-resource-links`
- `DELETE /api/content-resource-links`

Payload fields:

- `parentId`, `childId`, `position`, `metadata`

### Property-owned typed write surfaces

Examples:

- `/api/posts` (create/update/delete)
- `/api/lessons` (update)
- `/api/lessons/:lessonId/solution` (CRUD)
- `/api/events` (property-defined)
- `/api/surveys` (property-defined)

### Capability and schema discovery

- `GET /api/content-model`

Response contains:

- supported resource types
- supported operations per type
- allowed parent-child edges
- per-type field schema references
- optional constraints (for example max depth, required fields, visibility
  rules)

## TypeScript Contract Strategy

Define a shared package-level contract (for example
`@coursebuilder/content-api-contract`) with:

- discriminated unions for write commands
- per-type Zod schema registry
- capability matrix and edge matrix types
- stable read model DTOs for generic query responses

The API layer should reject unvalidated `unknown` payloads at boundaries.

## Consequences

### Positive

- Maintains strong type safety and explicit behavior.
- Supports multi-property variation without copy/paste endpoint drift.
- Enables CLI and agent workflows via capability introspection.
- Aligns with observed real data model usage (graph + type-specific behavior).

### Negative

- More endpoint families than a single generic CRUD design.
- Requires discipline to keep capability metadata and endpoint behavior in sync.

### Risks

- Capability endpoint can become stale if not verified in CI.
- Divergence in property schemas can still become hard to manage without shared
  schema tooling.

## Implementation Plan

1. Create shared contract module:
   - `packages/content-api-contract/src/content-model.ts`
   - `packages/content-api-contract/src/content-resource-read.ts`
   - `packages/content-api-contract/src/content-resource-graph.ts`
2. Add shared read/graph routes in app adapters:
   - `apps/ai-hero/src/app/api/content-resources/*`
   - `apps/code-with-antonio/src/app/api/content-resources/*`
3. Add `GET /api/content-model` in each app, generated from local schema
   registry.
4. Keep existing typed write endpoints; incrementally align response envelopes.
5. Update `packages/aihero-cli` to:
   - use capability discovery
   - route writes to typed endpoints
   - use generic query endpoints for list/discovery
6. Add observability:
   - `content_model.read`
   - `content_resource.query`
   - `content_resource_link.create/delete`
   - per-type write events (`post.create`, `lesson.update`, etc.)

## Verification Criteria

- [ ] `GET /api/content-model` returns valid schema/capabilities in both apps.
- [ ] Generic query routes return stable typed DTOs for all active resource
      types.
- [ ] Link create/delete validates parent-child edge rules.
- [ ] Existing typed write routes continue to pass integration tests.
- [ ] CLI can discover capabilities and execute at least:
      - `post` CRUD
      - `lesson` update + solution CRUD
      - `survey` CRUD (where available)
- [ ] Logs and metrics include per-route and per-type operation identifiers.

## Rollout

1. Ship contract package and `content-model` endpoint first.
2. Migrate read/list clients to generic query surface.
3. Keep write paths unchanged until parity checks pass.
4. Gate any generic write proposals behind a new ADR with concrete schema proof.

## References

- ADR workflow and template guidance:
  [skillrecordings/adr-skill](https://github.com/skillrecordings/adr-skill)
