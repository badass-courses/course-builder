# Shared Utilities in Course Builder

This document provides an overview of all shared utility packages in the Course Builder monorepo.

## Overview

Course Builder maintains a collection of shared utility packages under the `/packages` directory. These packages help reduce code duplication and ensure consistent behavior across applications.

## Available Utility Packages

| Package | Purpose | Key Utilities |
|---------|---------|---------------|
| `@coursebuilder/utils-ai` | AI-related utilities | `openai` |
| `@coursebuilder/utils-auth` | Authentication utilities | `current-ability-rules` |
| `@coursebuilder/utils-aws` | AWS service utilities | `aws` |
| `@coursebuilder/utils-browser` | Browser utilities | `cookies` |
| `@coursebuilder/utils-core` | Core utilities | `guid` |
| `@coursebuilder/utils-email` | Email utilities | `send-an-email` |
| `@coursebuilder/utils-file` | File handling | `get-unique-filename` |
| `@coursebuilder/utils-media` | Media processing | `poll-video-resource` |
| `@coursebuilder/utils-resource` | Resource utilities | `filter-resources` |
| `@coursebuilder/utils-search` | Search utilities | `typesense-adapter` |
| `@coursebuilder/utils-seo` | SEO utilities | `get-og-image-url-for-resource` |
| `@coursebuilder/utils-string` | String utilities | `chicagor-title` |
| `@coursebuilder/utils-ui` | UI utilities | `cn` |

## Using Shared Utilities

Import utilities as follows:

```typescript
// Import from a specific utility file
import { guid } from '@coursebuilder/utils-core/guid'
import { cn } from '@coursebuilder/utils-ui/cn'
import cookieUtil from '@coursebuilder/utils-browser/cookies'
```

## Core Utilities

### guid

```typescript
import { guid } from '@coursebuilder/utils-core/guid'

const id = guid() // Returns something like "a7b2x"
```

### cn (className)

```typescript
import { cn } from '@coursebuilder/utils-ui/cn'

// Basic usage
cn('text-red-500', 'bg-blue-500') // 'text-red-500 bg-blue-500'

// With conditional classes
cn('text-red-500', isActive && 'bg-blue-500')

// With Tailwind conflicts resolved
cn('text-red-500', 'text-blue-500') // 'text-blue-500'
```

## File Utilities

### getUniqueFilename

```typescript
import { getUniqueFilename } from '@coursebuilder/utils-file/get-unique-filename'

// Returns something like "my-image-a1b2c3.jpg"
getUniqueFilename('my image.jpg')
```

## Browser Utilities

### cookieUtil

```typescript
import cookieUtil from '@coursebuilder/utils-browser/cookies'

// Set a cookie
cookieUtil.set('user', { id: 123, name: 'John' })

// Get a cookie
const user = cookieUtil.get('user') // { id: 123, name: 'John' }

// Remove a cookie
cookieUtil.remove('user')
```

## String Utilities

### toChicagoTitleCase

```typescript
import { toChicagoTitleCase } from '@coursebuilder/utils-string/chicagor-title'

toChicagoTitleCase("the lord of the rings")
// Returns "The Lord of the Rings"
```

## Media Utilities

### pollVideoResource

```typescript
import { pollVideoResource } from '@coursebuilder/utils-media/video-resource'
import { getVideoResource } from '@/lib/video-resource-query'

async function fetchVideoWithPolling(videoId: string) {
  const generator = pollVideoResource(videoId, getVideoResource)
  const { value } = await generator.next()
  return value
}
```

## Search Utilities

### Typesense Adapter

```typescript
import { 
  createTypesenseAdapter, 
  createDefaultConfig, 
  getTypesenseCollectionName 
} from '@coursebuilder/utils-search/typesense-adapter'

// Create config
const config = createDefaultConfig({
  apiKey: process.env.TYPESENSE_API_KEY,
  host: process.env.TYPESENSE_HOST,
  queryBy: 'title,description',
})

// Create adapter
const adapter = createTypesenseAdapter(config)

// Get collection name
const collectionName = getTypesenseCollectionName({
  envVar: 'TYPESENSE_COLLECTION_NAME',
})
```

## Auth Utilities

### Current Ability Rules

```typescript
import { 
  getCurrentAbilityRules,
  getAbilityForResource 
} from '@coursebuilder/utils-auth/current-ability-rules'

// Note: These functions need to be implemented by the application
const ability = await getAbilityForResource('lesson123', 'module456')
if (ability.canView && !ability.isRegionRestricted) {
  // Show the resource
}
```

## Contributing

See the [CONTRIBUTING.md](../CONTRIBUTING.md) guide for information on adding new utilities.