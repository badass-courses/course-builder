# @coursebuilder/utils-file

File utilities for the CourseBuilder monorepo.

## Installation

```bash
pnpm add @coursebuilder/utils-file
```

## Usage

### getUniqueFilename

Generates a unique filename by adding a random ID and cleaning the string for compatibility with services like S3.

#### Parameters

- `fullFilename` - The original filename including extension

#### Returns

A unique filename with the same extension, cleaned for S3 compatibility.

#### Example

```typescript
import { getUniqueFilename } from '@coursebuilder/utils-file/get-unique-filename'

// Returns something like "my-image-a1b2c3.jpg"
getUniqueFilename('my image.jpg')
```

## Contributing

To add a new utility to this package:

1. Create a new file in the `src` directory
2. Implement your utility with proper TSDoc comments
3. Export it from the package by updating `package.json`
4. Add tests in a corresponding `.test.ts` file
5. Build and test your changes:

```bash
cd packages/utils-file
pnpm build
pnpm test
```