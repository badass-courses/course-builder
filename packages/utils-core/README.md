# @coursebuilder/utils-core

Core utilities for the CourseBuilder monorepo.

## Installation

```bash
pnpm add @coursebuilder/utils-core
```

## Usage

### guid

Generates a random alphanumeric identifier with 5 characters.
Uses lowercase letters (a-z) and numbers (0-9).

#### Returns
A unique 5-character string identifier.

#### Example
```typescript
import { guid } from '@coursebuilder/utils-core/guid'

const id = guid() // Returns something like "a7b2x"
```

## Contributing

To add a new utility to this package:

1. Create a new file in the `src` directory
2. Implement your utility with proper TSDoc comments
3. Export it from the package by updating `package.json`
4. Add tests in a corresponding `.test.ts` file
5. Build and test your changes:

```bash
cd packages/utils-core
pnpm build
pnpm test
```