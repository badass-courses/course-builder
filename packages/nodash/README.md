# @coursebuilder/nodash

A lightweight, type-safe utility library for modern JavaScript/TypeScript projects. Built as a minimal alternative to Lodash, focusing on commonly used functions with full TypeScript support.

## Installation

```bash
pnpm add @coursebuilder/nodash
```

## Features

### Array Utilities

- `uniq<T>(arr: T[]): T[]` - Returns a new array with unique values
- `groupBy<T>(arr: T[], key: keyof T): Record<string | number, T[]>` - Groups array elements by a key
- `sortBy<T>(array: T[], iteratee: ((obj: T) => any) | string | number | symbol): T[]` - Sorts an array by a property path or iteratee function
- `first<T>(array: T[] | null | undefined): T | undefined` - Gets the first element of array
- `last<T>(array: T[] | null | undefined): T | undefined` - Gets the last element of array
- `find<T>(array: T[] | null | undefined, predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined` - Finds the first element matching a predicate
- `take<T>(array: T[] | null | undefined, n = 1): T[]` - Takes n elements from the beginning of an array
- `sum(arr: number[]): number` - Returns the sum of all numbers in an array
- `chunk<T>(arr: T[], size: number): T[][]` - Chunks array into groups of size n
- `compact<T>(arr: T[]): NonNullable<T>[]` - Returns array without falsy values
- `without<T>(arr: T[], ...values: T[]): T[]` - Returns array without specified values
- `intersection<T>(...arrays: T[][]): T[]` - Returns array with elements that appear in all arrays
- `shuffle<T>(arr: T[]): T[]` - Returns array shuffled randomly

### Object Utilities

- `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>` - Picks specified properties from an object
- `omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>` - Omits specified properties from an object
- `isEmpty(value: any): boolean` - Checks if a value is empty (null, undefined, empty string/array/object/map/set)
- `isNotEmpty<T>(value: T | null | undefined): value is T` - Type guard for non-empty values
- `isNil(value: unknown): value is null | undefined` - Checks if value is null or undefined
- `omitBy<T extends object>(object: T | null | undefined, predicate: (value: T[keyof T], key: string) => boolean): Partial<T>` - Creates an object omitting properties that satisfy the predicate

### String Utilities

- `camelCase(str: string): string` - Converts string to camelCase
- `kebabCase(str: string): string` - Converts string to kebab-case

### Function Utilities

- `debounce<T extends Function>(func: T, wait = 0): (...args: Parameters<T>) => void` - Creates a debounced function that delays invoking func until after wait milliseconds

### Type Guards

- `isString(value: unknown): value is string` - Type guard for string values

## Usage Examples

```typescript
import { 
  sortBy, 
  groupBy, 
  debounce, 
  isString, 
  pick 
} from '@coursebuilder/nodash'

// Sort users by age
const users = [
  { id: 1, name: 'Bob', age: 30 },
  { id: 2, name: 'Alice', age: 25 }
]
const sorted = sortBy(users, 'age')
// => [{ id: 2, name: 'Alice', age: 25 }, { id: 1, name: 'Bob', age: 30 }]

// Group users by age
const grouped = groupBy(users, 'age')
// => { '25': [{ id: 2, name: 'Alice', age: 25 }], '30': [{ id: 1, name: 'Bob', age: 30 }] }

// Debounce a function
const debouncedSave = debounce((data) => {
  // Save data
}, 300)

// Type guard usage
function processValue(value: unknown) {
  if (isString(value)) {
    return value.toUpperCase() // TypeScript knows value is string
  }
  return null
}

// Pick specific properties
const user = { id: 1, name: 'Bob', age: 30, email: 'bob@example.com' }
const basicInfo = pick(user, ['name', 'age'])
// => { name: 'Bob', age: 30 }
```

## Key Features

- 🎯 **Type-Safe**: Full TypeScript support with proper type inference
- 🪶 **Lightweight**: Minimal implementation focusing on commonly used utilities
- 🧪 **Well-Tested**: Comprehensive test suite ensuring reliability
- 📦 **Tree-Shakeable**: Import only what you need
- 🔒 **Null-Safe**: Handles null and undefined values gracefully

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build package
pnpm build

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm typecheck
```

## License

MIT 