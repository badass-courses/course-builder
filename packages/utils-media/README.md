# @coursebuilder/utils-media

Media utilities for the CourseBuilder monorepo.

## Installation

```bash
pnpm add @coursebuilder/utils-media
```

## Usage

### pollVideoResource

Polls a video resource by ID with exponential backoff until it exists or maximum attempts are reached.

This utility function helps handle scenarios where a video resource might not be immediately
available after creation (such as during processing). It repeatedly attempts to fetch the
resource with increasing delay between attempts until the resource is found or maximum attempts
are reached.

#### Parameters

- `resourceId` - The unique identifier of the video resource to poll for
- `getResource` - A function that retrieves the resource by ID (returns null/undefined if not found)
- `maxAttempts` - Maximum number of attempts before giving up (default: 30)
- `initialDelay` - Initial delay in milliseconds between attempts (default: 250ms)
- `delayIncrement` - Amount to increase delay by after each attempt (default: 250ms)

#### Returns

An async generator that yields the resource once found.

#### Throws

Error if the resource is not found after maximum attempts.

#### Example

```typescript
import { pollVideoResource } from '@coursebuilder/utils-media/video-resource'
import { getVideoResource } from '@/lib/video-resource-query'

// Basic usage with a getVideoResource function
async function fetchVideoWithPolling(videoId: string) {
  const generator = pollVideoResource(videoId, getVideoResource)
  const { value } = await generator.next()
  return value
}

// Generic usage with any resource type
import { getProduct } from '@/lib/products-query'

async function fetchProductWithPolling(productId: string) {
  const generator = pollVideoResource(productId, getProduct)
  const { value } = await generator.next()
  return value
}
```

## Contributing

To add a new utility to this package:

1. Create a new file in the `src` directory
2. Implement your utility with proper TSDoc comments
3. Export it from the package by updating `package.json`
4. Add tests in a corresponding `.test.ts` file
5. Build and test your changes:

```bash
cd packages/utils-media
pnpm build
pnpm test
```