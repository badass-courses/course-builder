# Posts Module Refactoring Plan - February 2025

## Current Assessment

After examining the codebase, the following issues need to be addressed:

- `posts-query.ts` is a massive 1,000+ line file with mixed responsibilities
- External service calls to Egghead, Sanity, and TypeSense are scattered
  throughout
- Redundant validation logic exists in multiple places
- Function naming is inconsistent, making the codebase hard to navigate
- Post operations like updates involve 16+ function calls, making debugging
  difficult

## Important Notes

- We use multiple databases, be sure to use the correct one

## Conservative Refactoring Strategy

Instead of attempting a comprehensive refactor all at once, we'll take an
incremental approach with clearly defined phases. Each phase will deliver
immediate benefits while reducing risk.

### Phase 1: Extract Types and Schemas (1-2 weeks)

**Goal:** Separate type definitions and validation logic without changing
functionality.

**Directory Structure:**

```
src/lib/
├── posts/
│   ├── index.ts        # Re-exports everything
│   ├── types.ts        # All TypeScript interfaces/types
│   └── schemas.ts      # All Zod schemas
```

**Key Steps:**

1. Create new files but keep posts-query.ts intact
2. Move types to types.ts, schemas to schemas.ts
3. Update imports in posts-query.ts
4. Create index.ts that re-exports everything

**Success Criteria:**

- No functional changes
- All tests pass
- Improved type/schema discoverability

### Phase 2: Extract TypeSense Integration (1-2 weeks)

**Goal:** Establish pattern for external service isolation with lowest-risk
service first.

**Directory Structure:**

```
src/lib/
├── posts/ (from Phase 1)
├── external/
│   └── typesense/
│       ├── index.ts    # Public API
│       └── post.ts     # Post indexing operations
```

**Key Steps:**

1. Extract TypeSense operations to dedicated module
2. Update posts-query.ts to use new TypeSense module
3. Focus only on TypeSense, not other external services

**Success Criteria:**

- All TypeSense operations isolated
- Pattern established for future service extraction
- No regression in functionality

### Phase 3: Extract Read Operations (1-2 weeks)

**Goal:** Separate read/query operations from write operations.

**Directory Structure:**

```
src/lib/
├── posts/
│   ├── ... (from Phase 1)
│   └── read.ts         # All read-only operations
├── external/ (from Phase 2)
```

**Key Steps:**

1. Move simplest read operations first (getPost, getAllPosts)
2. Keep write operations in posts-query.ts for now
3. Update imports and references

**Success Criteria:**

- Clean separation between read and write operations
- Improved code organization
- Reduced file size of posts-query.ts

### Phase 4: Evaluation & Planning (1 week)

After the first three phases, we'll pause to evaluate progress and plan the next
steps:

1. Has the codebase improved? How much?
2. What patterns worked well? What didn't?
3. Which parts of posts-query.ts still need refactoring?

**Plan Next Phases Based On:**

- Complexity of remaining external services
- Interdependencies between functions
- Team capacity and priorities

## Implementation Examples

### Type/Schema Extraction:

```typescript
// posts/types.ts
export type Post = {
	id: string
	title: string
	// ...other properties
}

export type PostUpdate = {
	id: string
	// ...other properties
}

export type PostAction = 'save' | 'publish' | 'unpublish'
```

```typescript
// posts/schemas.ts
import { z } from 'zod'

export const PostSchema = z.object({
	id: z.string(),
	title: z.string(),
	// ...other validations
})

export const PostUpdateSchema = z.object({
	id: z.string(),
	// ...other validations
})
```

```typescript
// posts/index.ts
export * from './types'
export * from './schemas'
export * from '../posts-query' // Still exporting from original file
```

### TypeSense Extraction:

```typescript
// external/typesense/post.ts
import { TypesenseClient } from '../../config/typesense-client'
import type { Post } from '../../posts/types'

export async function indexPostInTypesense(post: Post): Promise<void> {
	// Implementation moved from posts-query.ts
}

export async function removePostFromTypesense(postId: string): Promise<void> {
	// Implementation moved from posts-query.ts
}
```

```typescript
// external/typesense/index.ts
export * from './post'
```

```typescript
// posts-query.ts updated to use new module
import {
	indexPostInTypesense,
	removePostFromTypesense,
} from '../external/typesense'

// Later in the file where indexing was happening
await indexPostInTypesense(updatedPost)
```

## Risk Mitigation

1. **Incremental Changes:** Each phase is small and isolated
2. **Thorough Testing:** Test after each change, not just at phase completion
3. **Easy Rollback:** Small PRs can be reverted if issues arise
4. **Flexible Timeline:** Each phase can be extended if needed

## Future Considerations (Post-Phase 4)

Depending on the success of initial phases, we may continue with:

1. **Extract Remaining External Services:**

   - Egghead API integration
   - Sanity integration

2. **Extract Write Operations:**

   - Create operations
   - Update operations
   - Delete operations

3. **Advanced Refactoring:**
   - Version management
   - Authorization logic
   - Cache management

Each of these would follow the same pattern of small, focused changes with clear
success criteria.
