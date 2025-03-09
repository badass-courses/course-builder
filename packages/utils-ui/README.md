# @coursebuilder/utils-ui

UI utilities for the CourseBuilder monorepo.

## Installation

```bash
pnpm add @coursebuilder/utils-ui
```

## Usage

### cn

Combines and merges multiple class names or class name arrays into a single string.
Uses clsx to combine classes and tailwind-merge to handle Tailwind CSS class conflicts.

#### Parameters

- `...inputs` - Any number of class values (strings, objects, arrays)

#### Returns

A string of merged class names with Tailwind conflicts resolved.

#### Example

```typescript
import { cn } from '@coursebuilder/utils-ui/cn'

// Basic usage
cn('text-red-500', 'bg-blue-500') // 'text-red-500 bg-blue-500'

// With conditional classes
cn('text-red-500', isActive && 'bg-blue-500') // 'text-red-500 bg-blue-500' if isActive is true

// With Tailwind conflicts resolved
cn('text-red-500', 'text-blue-500') // 'text-blue-500' (last class wins)
```

## Contributing

To add a new utility to this package:

1. Create a new file in the `src` directory
2. Implement your utility with proper TSDoc comments
3. Export it from the package by updating `package.json`
4. Add tests in a corresponding `.test.ts` file
5. Build and test your changes:

```bash
cd packages/utils-ui
pnpm build
pnpm test
```