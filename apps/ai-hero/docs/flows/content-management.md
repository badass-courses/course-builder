# Content Resource Management Flow

## Overview

The ai-hero application uses a flexible content resource system built around the `ContentResource` entity. Resources represent all content types in the system and support hierarchical relationships, versioning, tagging, and search indexing via Typesense.

### Resource Types

**Top-Level Resource Types:**
- `post` - Articles, podcasts, tips, courses, playlists (with subtypes)
- `workshop` - Multi-lesson workshop content
- `tutorial` - Tutorial content
- `cohort` - Group learning sessions
- `list` - Curated collections
- `page` - Static pages
- `lesson` - Individual lesson content
- `solution` - Problem solutions
- `section` - Organizational sections

**Post Subtypes:**
- `article` - Written content (supports video)
- `podcast` - Audio content
- `tip` - Short-form tips
- `course` - Course content
- `playlist` - Content collections

**Video Support:**
- Lessons: Full video support
- Posts (article subtype): Video support

---

## Architecture Diagrams

### 1. Content Resource Schema (Class Diagram)

```mermaid
classDiagram
    class ContentResource {
        +String id
        +String type
        +String organizationId
        +String createdById
        +String createdByOrganizationMembershipId
        +JSON fields
        +String currentVersionId
        +DateTime createdAt
        +DateTime updatedAt
        +DateTime deletedAt
    }

    class ContentResourceFields {
        +String title
        +String slug
        +String description
        +String body
        +String state [draft|published]
        +String visibility [public|private|unlisted]
        +String postType [article|podcast|tip|course|playlist]
        +Integer duration
        +Integer timeToRead
        +String access [pro|free]
    }

    class ContentResourceResource {
        +String resourceOfId
        +String resourceId
        +Double position
        +JSON metadata
        +String organizationId
        +DateTime createdAt
        +DateTime updatedAt
        +DateTime deletedAt
    }

    class ContentResourceVersion {
        +String id
        +String resourceId
        +String parentVersionId
        +Integer versionNumber
        +JSON fields
        +DateTime createdAt
        +String createdById
        +String organizationId
    }

    class ContentResourceTag {
        +String contentResourceId
        +String tagId
        +Double position
        +String organizationId
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Tag {
        +String id
        +String type
        +String organizationId
        +JSON fields
        +DateTime createdAt
        +DateTime updatedAt
        +DateTime deletedAt
    }

    class ContentResourceProduct {
        +String resourceId
        +String productId
        +String organizationId
    }

    class Product {
        +String id
        +String name
        +String status
        +JSON fields
    }

    class User {
        +String id
        +String name
        +String email
    }

    class TypesenseResource {
        +String id
        +String title
        +String slug
        +String description
        +String summary
        +String type
        +String visibility
        +String state
        +Integer created_at_timestamp
        +Integer updated_at_timestamp
        +Integer published_at_timestamp
        +String[] tags
        +Float[] embedding
        +ParentResource[] parentResources
    }

    ContentResource "1" --> "0..1" ContentResourceFields : has
    ContentResource "1" --> "*" ContentResourceResource : resourceOf
    ContentResource "1" --> "*" ContentResourceResource : resources
    ContentResource "1" --> "*" ContentResourceVersion : versions
    ContentResource "1" --> "0..1" ContentResourceVersion : currentVersion
    ContentResource "1" --> "*" ContentResourceTag : tags
    ContentResourceTag "*" --> "1" Tag : references
    ContentResource "1" --> "*" ContentResourceProduct : resourceProducts
    ContentResourceProduct "*" --> "1" Product : product
    ContentResource "*" --> "1" User : createdBy
    ContentResourceVersion "*" --> "1" User : createdBy
    ContentResource "1" --> "0..1" TypesenseResource : indexed as
```

---

### 2. Resource Creation Pipeline (Sequence Diagram)

```mermaid
sequenceDiagram
    actor User
    participant Auth as Authentication
    participant API as createResource
    participant DB as Database
    participant Version as Version Manager
    participant Typesense as Typesense Index
    participant Cache as Cache System

    User->>Auth: Create new resource request
    Auth->>Auth: Validate session & ability

    alt Unauthorized
        Auth-->>User: 401 Unauthorized
    end

    Auth->>API: Authorized request
    API->>API: Generate GUID
    API->>API: Create slugified ID (type~guid)

    Note over API: Resource structure:<br/>id: "post_abc123"<br/>type: "post"<br/>fields: {title, state: draft, visibility: unlisted}

    API->>DB: INSERT into ContentResource
    DB-->>API: Resource created

    API->>DB: Query with nested relations
    Note over DB: Includes resources,<br/>nested resources,<br/>tags
    DB-->>API: Full resource object

    API->>API: Validate with ContentResourceSchema

    alt Validation fails
        API-->>User: Error: Invalid resource data
    end

    API->>Typesense: upsertPostToTypeSense(resource, 'save')

    Note over Typesense: Index includes:<br/>- Basic fields<br/>- Tags<br/>- Parent resources<br/>- Timestamps<br/>- Embeddings

    Typesense-->>API: Indexed successfully

    API->>Cache: Revalidate tags
    Cache-->>API: Cache cleared

    API-->>User: Return created resource
```

---

### 3. Content Hierarchy Management (Flowchart)

```mermaid
flowchart TD
    Start([Create/Update Resource]) --> CheckType{Resource Type?}

    CheckType -->|Post| PostFlow[Post Resource]
    CheckType -->|Workshop| WorkshopFlow[Workshop Resource]
    CheckType -->|Lesson| LessonFlow[Lesson Resource]
    CheckType -->|Section| SectionFlow[Section Resource]
    CheckType -->|List| ListFlow[List Resource]

    PostFlow --> HasVideo{Has Video?}
    HasVideo -->|Yes| AttachVideo[Create ContentResourceResource<br/>link to videoResource]
    HasVideo -->|No| CheckTags
    AttachVideo --> CheckTags{Has Tags?}

    CheckTags -->|Yes| CreateTags[Create ContentResourceTag<br/>entries with position]
    CheckTags -->|No| CreateVersion
    CreateTags --> CreateVersion

    WorkshopFlow --> AddLessons{Add Lessons?}
    AddLessons -->|Yes| CreateHierarchy[Create hierarchy:<br/>Workshop → Section → Lessons]
    AddLessons -->|No| CheckProduct
    CreateHierarchy --> CheckProduct

    CheckProduct{Link to Product?} -->|Yes| LinkProduct[Create ContentResourceProduct]
    CheckProduct -->|No| CreateVersion
    LinkProduct --> CreateVersion

    LessonFlow --> InSection{Part of Section?}
    InSection -->|Yes| LinkToSection[Link via ContentResourceResource<br/>with position]
    InSection -->|No| DirectLink[Link directly to parent]
    LinkToSection --> CreateVersion
    DirectLink --> CreateVersion

    SectionFlow --> InWorkshop{Part of Workshop?}
    InWorkshop -->|Yes| LinkToWorkshop[Link to workshop<br/>with position]
    InWorkshop -->|No| Standalone[Standalone section]
    LinkToWorkshop --> CreateVersion
    Standalone --> CreateVersion

    ListFlow --> AddItems{Add Resources?}
    AddItems -->|Yes| LinkResources[Create ContentResourceResource<br/>links with positions]
    AddItems -->|No| CreateVersion
    LinkResources --> CreateVersion

    CreateVersion[Create ContentResourceVersion] --> CalculateHash[Calculate content hash]
    CalculateHash --> CheckExisting{Version exists?}

    CheckExisting -->|Yes| UpdatePointer[Update currentVersionId]
    CheckExisting -->|No| InsertVersion[INSERT ContentResourceVersion<br/>with versionNumber]

    UpdatePointer --> IndexTypesense
    InsertVersion --> IndexTypesense

    IndexTypesense[Index to Typesense] --> GetTags[Fetch tags]
    GetTags --> GetParents{Has parent resources?}

    GetParents -->|Lesson| FetchWorkshops[Fetch parent workshops]
    GetParents -->|Solution| FetchLesson[Fetch parent lesson<br/>and workshops]
    GetParents -->|No| BuildDocument

    FetchWorkshops --> BuildDocument
    FetchLesson --> BuildDocument

    BuildDocument[Build Typesense document] --> ValidateSchema{Schema valid?}
    ValidateSchema -->|No| SkipIndex[Skip indexing]
    ValidateSchema -->|Yes| UpsertDoc[Upsert document]

    UpsertDoc --> RevalidateCache[Revalidate cache tags]
    SkipIndex --> End([Complete])
    RevalidateCache --> End

    style Start fill:#e1f5ff
    style End fill:#d4edda
    style CheckType fill:#fff3cd
    style CreateVersion fill:#cfe2ff
    style IndexTypesense fill:#f8d7da
```

---

### 4. Typesense Indexing Pipeline (Sequence Diagram)

```mermaid
sequenceDiagram
    participant App as Application
    participant Index as upsertPostToTypeSense
    participant Validate as Schema Validator
    participant TagQuery as Tag Query
    participant ParentQuery as Parent Query
    participant Typesense as Typesense Client
    participant Cache as Cache Layer

    App->>Index: Post resource update

    Index->>Index: Check environment config
    alt Missing credentials
        Index-->>App: Skip indexing (log warning)
    end

    Index->>Index: Check indexing eligibility
    Note over Index: Published + Public or<br/>List type

    alt Not eligible
        Index->>Typesense: Delete document (if exists)
        Typesense-->>Index: Deleted
        Index-->>App: Complete
    end

    Index->>TagQuery: getPostTags(resourceId)
    TagQuery->>TagQuery: Query ContentResourceTag
    TagQuery-->>Index: Return tag array

    alt Resource is Lesson
        Index->>ParentQuery: getWorkshopsForLesson(lessonId)
        ParentQuery->>ParentQuery: Query workshops containing lesson
        Note over ParentQuery: Checks direct links and<br/>section-based links
        ParentQuery-->>Index: Return workshops
    end

    alt Resource is Solution
        Index->>ParentQuery: getLessonForSolution(solutionId)
        ParentQuery-->>Index: Return parent lesson
        Index->>ParentQuery: getWorkshopsForLesson(lessonId)
        ParentQuery-->>Index: Return workshops
    end

    Index->>Validate: Build document object
    Note over Validate: Fields:<br/>id, title, slug<br/>description, summary<br/>type, visibility, state<br/>timestamps, tags<br/>parentResources, embedding

    Validate->>Validate: TypesenseResourceSchema.safeParse()

    alt Validation fails
        Validate-->>Index: Parse error
        Index-->>App: Skip indexing (log error)
    end

    Validate-->>Index: Valid document

    Index->>Typesense: documents().upsert(document)
    Note over Typesense: Action: upsert<br/>Collection: ai-hero-content<br/>Update timestamps

    alt Publish action
        Index->>Typesense: Update published_at_timestamp
    end

    Typesense-->>Index: Document upserted

    Index->>Cache: Revalidate resource tags
    Cache-->>Index: Cache cleared

    Index-->>App: Indexing complete
```

---

### 5. Content Database Schema (Entity Relationship Diagram)

```mermaid
erDiagram
    ContentResource ||--o{ ContentResourceResource : "has children"
    ContentResource ||--o{ ContentResourceResource : "is child of"
    ContentResource ||--o{ ContentResourceVersion : "has versions"
    ContentResource ||--o| ContentResourceVersion : "current version"
    ContentResource ||--o{ ContentResourceTag : "has tags"
    ContentResource ||--o{ ContentResourceProduct : "linked to products"
    ContentResource }o--|| User : "created by"
    ContentResource }o--o| OrganizationMembership : "created by membership"

    ContentResourceTag }o--|| Tag : "references"
    Tag ||--o{ TagTag : "parent tags"
    Tag ||--o{ TagTag : "child tags"

    ContentResourceProduct }o--|| Product : "references"
    Product ||--|| Price : "has price"

    ContentResourceVersion }o--|| User : "created by"
    ContentResourceVersion }o--o| ContentResourceVersion : "parent version"

    ContentResource ||--o{ ContentContributions : "has contributions"
    ContentContributions }o--|| User : "contributor"
    ContentContributions }o--|| ContributionType : "contribution type"

    ContentResource {
        varchar id PK "e.g., post_abc123"
        varchar type "post|workshop|lesson|tutorial|cohort|list|page|section|solution"
        varchar organizationId FK
        varchar createdById FK
        varchar createdByOrganizationMembershipId FK
        json fields "Flexible field storage"
        varchar currentVersionId FK
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    ContentResourceResource {
        varchar resourceOfId PK,FK "Parent resource"
        varchar resourceId PK,FK "Child resource"
        double position "Ordering within parent"
        json metadata "Additional metadata"
        varchar organizationId FK
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    ContentResourceVersion {
        varchar id PK "version~{hash}"
        varchar resourceId FK
        varchar parentVersionId FK
        int versionNumber "Sequential version number"
        json fields "Snapshot of fields at version"
        varchar createdById FK
        varchar organizationId FK
        timestamp createdAt
    }

    ContentResourceTag {
        varchar contentResourceId PK,FK
        varchar tagId PK,FK
        double position "Tag ordering"
        varchar organizationId FK
        timestamp createdAt
        timestamp updatedAt
    }

    Tag {
        varchar id PK
        varchar type "Tag type/category"
        varchar organizationId FK
        json fields "Tag metadata"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    TagTag {
        varchar parentTagId PK,FK
        varchar childTagId PK,FK
        timestamp createdAt
        timestamp updatedAt
    }

    ContentResourceProduct {
        varchar resourceId PK,FK
        varchar productId PK,FK
        varchar organizationId FK
    }

    Product {
        varchar id PK
        varchar name
        varchar status
        json fields
    }

    Price {
        varchar id PK
        varchar productId FK
        varchar nickname
    }

    User {
        varchar id PK
        varchar name
        varchar email
    }

    OrganizationMembership {
        varchar id PK
        varchar organizationId FK
        varchar userId FK
    }

    ContentContributions {
        varchar id PK
        varchar userId FK
        varchar contentId FK
        varchar contributionTypeId FK
        timestamp createdAt
    }

    ContributionType {
        varchar id PK
        varchar slug "e.g., author, editor"
        varchar name
    }
```

---

### 6. Content Hierarchy Examples (Flowchart)

```mermaid
flowchart TB
    subgraph "Example 1: Workshop with Sections"
        W1[Workshop: Advanced React<br/>type: workshop] --> S1[Section: Fundamentals<br/>type: section]
        W1 --> S2[Section: Advanced Topics<br/>type: section]

        S1 --> L1[Lesson: Hooks Intro<br/>type: lesson<br/>position: 0]
        S1 --> L2[Lesson: useEffect<br/>type: lesson<br/>position: 1]

        S2 --> L3[Lesson: Performance<br/>type: lesson<br/>position: 0]
        S2 --> L4[Lesson: Suspense<br/>type: lesson<br/>position: 1]
    end

    subgraph "Example 2: Workshop with Direct Lessons"
        W2[Workshop: Quick Tips<br/>type: workshop] --> L5[Lesson: Tip 1<br/>type: lesson<br/>position: 0]
        W2 --> L6[Lesson: Tip 2<br/>type: lesson<br/>position: 1]
    end

    subgraph "Example 3: Post with Video"
        P1[Post: React Tutorial<br/>type: post<br/>postType: article] --> V1[Video Resource<br/>type: videoResource]
        P1 --> T1[Tag: React]
        P1 --> T2[Tag: Tutorial]
    end

    subgraph "Example 4: List Collection"
        LIST[List: Best Practices<br/>type: list] --> P2[Post: Item 1<br/>position: 0]
        LIST --> P3[Post: Item 2<br/>position: 1]
        LIST --> W3[Workshop: Item 3<br/>position: 2]
    end

    subgraph "Example 5: Cohort with Workshops"
        C1[Cohort: Spring 2024<br/>type: cohort] --> W4[Workshop: Week 1<br/>type: workshop<br/>position: 0]
        C1 --> W5[Workshop: Week 2<br/>type: workshop<br/>position: 1]
        C1 --> PROD[Product<br/>via ContentResourceProduct]
    end

    style W1 fill:#e1f5ff
    style W2 fill:#e1f5ff
    style C1 fill:#fff3cd
    style LIST fill:#d4edda
    style P1 fill:#f8d7da
```

---

## Key Workflows

### Resource Creation Flow

1. **Authentication & Authorization**
   - Validate user session
   - Check ability to create content
   - Throw error if unauthorized

2. **ID & Slug Generation**
   - Generate GUID using `guid()` utility
   - Create resource ID: `{type}_{guid}` (e.g., `post_abc123`)
   - Generate slug: `{slugified-title}~{guid}`

3. **Resource Insertion**
   - Insert into `ContentResource` table
   - Default state: `draft`
   - Default visibility: `unlisted`
   - Store flexible fields in JSON `fields` column

4. **Nested Relations**
   - Query with nested relations:
     - `resources` (children via `ContentResourceResource`)
     - Nested `resource.resources` (grandchildren)
     - `tags` via `ContentResourceTag`

5. **Schema Validation**
   - Parse with `ContentResourceSchema`
   - Validate all required fields
   - Return error if validation fails

6. **Typesense Indexing**
   - Call `upsertPostToTypeSense(resource, 'save')`
   - Include tags and parent resources
   - Generate embeddings for vector search
   - Update timestamps

7. **Cache Revalidation**
   - Revalidate affected cache tags
   - Clear related queries

### Version Management Flow

1. **Content Hash Calculation**
   - Generate hash from resource fields
   - Version ID format: `version~{hash}`

2. **Check Existing Version**
   - Query `ContentResourceVersion` by version ID
   - If exists, just update `currentVersionId` pointer
   - If new, proceed to create

3. **Create New Version**
   - Insert into `ContentResourceVersion`
   - Increment `versionNumber`
   - Reference `parentVersionId`
   - Snapshot current `fields` JSON
   - Record `createdById`

4. **Update Current Pointer**
   - Update `ContentResource.currentVersionId`
   - Maintain version chain via `parentVersionId`

### Tag Management Flow

1. **Adding Tags**
   - Insert into `ContentResourceTag`
   - Specify `position` for ordering
   - Link to existing `Tag` via `tagId`

2. **Updating Tags**
   - Delete all existing tags for resource
   - Insert new tag associations
   - Preserve order via position values

3. **Removing Tags**
   - Delete from `ContentResourceTag`
   - Match both `contentResourceId` and `tagId`

### Typesense Indexing Flow

1. **Eligibility Check**
   - Published and Public, OR
   - Type is 'list'
   - If ineligible, attempt deletion from index

2. **Fetch Related Data**
   - Query tags via `getPostTags()`
   - For lessons: Query parent workshops via `getWorkshopsForLesson()`
   - For solutions: Query lesson, then workshops

3. **Document Construction**
   - Map resource fields to Typesense schema
   - Include tags array
   - Include parentResources array with metadata
   - Set timestamps (created, updated, published)
   - Include embedding vector for similarity search

4. **Schema Validation**
   - Validate against `TypesenseResourceSchema`
   - Skip indexing if validation fails
   - Log error for debugging

5. **Upsert to Typesense**
   - Use `documents().upsert()` for atomic operation
   - Update `updated_at_timestamp`
   - Set `published_at_timestamp` if action is 'publish'
   - Handle errors gracefully (non-fatal)

6. **Vector Search Support**
   - Documents include `embedding` field
   - Used for nearest neighbor queries
   - Filter by distance threshold
   - Exclude completed items for users

---

## Important Implementation Details

### Resource Types with Video

Only specific resource types support video attachments:
- **Lessons**: Full video support
- **Posts (article subtype)**: Video support

### Hierarchical Queries

Workshops can contain lessons in two ways:
1. **Direct attachment**: Workshop → Lesson
2. **Via sections**: Workshop → Section → Lesson

Queries must handle both patterns using UNION:

```sql
-- Direct lesson in workshop
SELECT FROM workshop w
JOIN contentResourceResource crr ON w.id = crr.resourceOfId
WHERE crr.resourceId = {lessonId}

UNION

-- Lesson in section in workshop
SELECT FROM workshop w
JOIN contentResourceResource crr_section ON w.id = crr_section.resourceOfId
JOIN contentResource section ON section.id = crr_section.resourceId
JOIN contentResourceResource crr_lesson ON section.id = crr_lesson.resourceOfId
WHERE section.type = 'section' AND crr_lesson.resourceId = {lessonId}
```

### Product Association

Products can be linked to resources via:
1. **Direct**: Resource → Product (via `ContentResourceProduct`)
2. **Via Cohort**: Workshop → Cohort → Product (priority 2)

Priority is given to direct associations.

### Slug Management

Slugs maintain format: `{slugified-title}~{guid}`
- GUID persists across title changes
- Enables title updates without breaking URLs
- Can be manually overridden

### State & Visibility

**State:**
- `draft`: Work in progress
- `published`: Ready for consumption

**Visibility:**
- `public`: Visible to all users
- `private`: Visible only to authorized users
- `unlisted`: Accessible via direct link

### Cache Strategy

The system uses Next.js cache tags:
- `posts`: All posts
- `workshop`: Workshop content
- `workshop-navigation`: Workshop nav data
- Resource-specific: `{resourceId}`

Revalidation occurs on:
- Create
- Update
- Delete
- Publish

### Error Handling in Typesense

Typesense operations are non-fatal:
- Indexing errors are logged but don't fail the main operation
- Deletion errors for non-existent documents are ignored (404)
- Validation errors skip indexing but allow resource creation

---

## API Endpoints

### tRPC Routers

**contentResourceRouter:**
- `getList(slugOrId)`: Fetch list resource
- `getAll(contentTypes)`: Fetch all resources by type (protected)
- `getPublishedResourcesLength()`: Count published resources
- `getWorkshop(id)`: Fetch workshop with nested structure
- `getNextWorkshopInCohort(cohortId, currentWorkshopId)`: Navigation

### Server Actions

**create-resources.ts:**
- `createResource(type, title)`: Create new resource

**posts-query.ts:**
- `createPost(input)`: Create post with video
- `updatePost(input, action)`: Update post
- `deletePost(id)`: Delete post
- `addTagToPost(postId, tagId)`: Add tag
- `updatePostTags(postId, tags)`: Replace tags
- `writeNewPostToDatabase(input)`: Low-level post creation
- `writePostUpdateToDatabase(input)`: Low-level post update

**workshops-query.ts:**
- `getWorkshop(slugOrId)`: Fetch workshop
- `getAllWorkshops()`: List all workshops
- `updateWorkshop(input)`: Update workshop
- `addResourceToWorkshop(resource, workshopId)`: Add child
- `updateResourcePosition(...)`: Reorder children

**typesense-query.ts:**
- `upsertPostToTypeSense(post, action)`: Index resource
- `deletePostInTypeSense(postId)`: Remove from index
- `indexAllContentToTypeSense(resources)`: Bulk index
- `getNearestNeighbour(documentId, k, threshold)`: Vector search

---

## Search & Discovery

### Typesense Collection Schema

The `ai-hero-content` collection stores:
- **Text Fields**: `title`, `slug`, `description`, `summary`, `type`, `visibility`, `state`
- **Timestamps**: `created_at_timestamp`, `updated_at_timestamp`, `published_at_timestamp`
- **Arrays**: `tags[]`, `parentResources[]`
- **Vector**: `embedding[]` (for semantic search)

### Vector Search

Nearest neighbor queries:
- Use document embeddings for similarity
- Filter by `published` state and content type
- Exclude user's completed items
- Apply distance threshold
- Return top K results

### Faceted Search

Supports filtering by:
- `type`: Resource type
- `visibility`: Public/private/unlisted
- `state`: Draft/published
- `tags[]`: Associated tags

---

## Best Practices

1. **Always validate with schemas** before database operations
2. **Use transactions** for multi-table operations (tags, versions)
3. **Handle Typesense errors gracefully** - they should never block main operations
4. **Revalidate cache** after mutations
5. **Generate slugs with GUID suffix** for stable URLs
6. **Check authorization** via CASL abilities before operations
7. **Use nested queries** to fetch full resource trees efficiently
8. **Version on content changes** to maintain history
9. **Index to Typesense asynchronously** after database operations
10. **Support both direct and section-based hierarchies** in queries

---

## Troubleshooting

### Common Issues

**Resource not found after creation:**
- Check schema validation
- Verify all required fields are present
- Ensure visibility/state filters allow access

**Typesense indexing fails:**
- Verify environment variables (`TYPESENSE_WRITE_API_KEY`, `NEXT_PUBLIC_TYPESENSE_HOST`)
- Check resource eligibility (published + public, or list type)
- Validate document against `TypesenseResourceSchema`
- Review logs for specific errors

**Hierarchy queries return incomplete results:**
- Ensure queries handle both direct and section-based patterns
- Check `position` ordering
- Verify `ContentResourceResource` links exist

**Version creation fails:**
- Confirm content hash uniqueness
- Check `versionNumber` sequence
- Verify `parentVersionId` references valid version

**Cache not updating:**
- Ensure `revalidateTag()` is called
- Check cache key consistency
- Verify Next.js cache configuration
