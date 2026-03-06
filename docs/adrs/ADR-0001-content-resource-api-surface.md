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

## Package and Contract Strategy

Use a single shared package: `@coursebuilder/content-api`.

That package contains:

- Zod schemas for read DTOs, graph payloads, envelopes, and capability metadata
- a per-app schema registry builder for resource types and edge rules
- framework-agnostic handlers that return plain `{ status, body, headers }`
- small Next.js route wrappers in each app that parse requests and call handlers

The shared package must not depend on app-local auth types such as `AppAbility`.
Instead, each app injects authorization callbacks or a small policy object into
the handlers.

The API layer rejects unvalidated `unknown` payloads at the boundary, then
exposes validated typed data internally. Avoid `any` in the shared contract
surface.

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

1. Create `packages/content-api` with:
   - `src/schemas/content-model.ts`
   - `src/schemas/content-resource-read.ts`
   - `src/schemas/content-resource-graph.ts`
   - `src/schemas/envelope.ts`
   - `src/handlers/*`
2. Add app-level schema registries and ship `GET /api/content-model` first:
   - `apps/ai-hero/src/lib/content-model/registry.ts`
   - `apps/code-with-antonio/src/lib/content-model/registry.ts`
   - `apps/*/src/app/api/content-model/route.ts`
3. Extend `CourseBuilderAdapter` for generic reads and explicit graph writes:
   - `queryContentResources`
   - `getResourceChildren`
   - `getResourceParents`
   - `addResourceToResource` accepts `position` and `metadata`
4. Add shared read routes in both apps:
   - `apps/ai-hero/src/app/api/content-resources/*`
   - `apps/code-with-antonio/src/app/api/content-resources/*`
5. Add shared graph mutation routes in both apps:
   - `apps/*/src/app/api/content-resource-links/route.ts`
6. Keep existing typed write endpoints; incrementally align response envelopes.
7. Update `packages/aihero-cli` to:
   - use capability discovery first
   - route writes to typed endpoints
   - use generic query endpoints for list/discovery
8. Add observability:
   - `content_model.read`
   - `content_resource.query`
   - `content_resource_link.create`
   - `content_resource_link.delete`
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

1. Ship `@coursebuilder/content-api` and `content-model` first.
2. Add automated package and adapter tests before external smoke tests.
3. Migrate read/list clients to the generic query surface.
4. Add graph mutations after registry-driven edge validation is proven.
5. Keep typed write paths unchanged until parity checks pass.
6. Gate any generic write proposals behind a new ADR with concrete schema proof.

## References

- ADR workflow and template guidance:
  [skillrecordings/adr-skill](https://github.com/skillrecordings/adr-skill)
