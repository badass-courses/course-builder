# @coursebuilder/utils-search

Search utilities for the CourseBuilder monorepo.

## Installation

```bash
pnpm add @coursebuilder/utils-search
```

## Usage

### Typesense Adapter

This package provides utilities for working with Typesense search functionality.

#### createTypesenseAdapter

Creates a Typesense-InstantSearch adapter for search functionality, connecting Algolia InstantSearch to a Typesense search backend.

```typescript
import { createTypesenseAdapter } from '@coursebuilder/utils-search/typesense-adapter'

const adapter = createTypesenseAdapter({
  server: {
    apiKey: process.env.TYPESENSE_API_KEY,
    nodes: [
      {
        host: process.env.TYPESENSE_HOST,
        port: 8108,
        protocol: 'https',
      },
    ],
  },
  additionalSearchParameters: {
    query_by: 'title,description',
    preset: 'updated_at_timestamp',
  },
})
```

#### createDefaultConfig

Creates a default Typesense-InstantSearch adapter configuration.

```typescript
import { createDefaultConfig } from '@coursebuilder/utils-search/typesense-adapter'

const config = createDefaultConfig({
  apiKey: process.env.TYPESENSE_API_KEY,
  host: process.env.TYPESENSE_HOST,
  queryBy: 'title,description,summary',
  preset: 'updated_at_timestamp',
  sortBy: '_text_match:desc', // optional
})
```

#### getTypesenseCollectionName

Gets the collection name from environment variables with a fallback to a default value.

```typescript
import { getTypesenseCollectionName } from '@coursebuilder/utils-search/typesense-adapter'

const collectionName = getTypesenseCollectionName({
  envVar: 'NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME',
  defaultValue: 'content_production'
})
```

## Contributing

To add a new utility to this package:

1. Create a new file in the `src` directory
2. Implement your utility with proper TSDoc comments
3. Export it from the package by updating `package.json`
4. Add tests in a corresponding `.test.ts` file
5. Build and test your changes:

```bash
cd packages/utils-search
pnpm build
pnpm test
```