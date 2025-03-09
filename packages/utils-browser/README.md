# @coursebuilder/utils-browser

Browser-specific utilities for the CourseBuilder monorepo.

## Installation

```bash
pnpm add @coursebuilder/utils-browser
```

## Usage

### cookieUtil

Browser cookie utility for managing client-side cookies. Provides methods to get, set, and remove cookies with a consistent interface. Handles JSON serialization and deserialization automatically.

#### Methods

##### set(name, value, options)

Sets a cookie with the given name, value, and options.

- `name` - The name of the cookie
- `value` - The value to store (can be any JSON-serializable value)
- `options` - Optional configuration for the cookie
- Returns: The value that was set (after any transformation)

##### get(name)

Gets a cookie value by name. Automatically attempts to parse JSON values.

- `name` - The name of the cookie to retrieve
- Returns: The cookie value (parsed from JSON if possible)

##### remove(name, options)

Removes a cookie.

- `name` - The name of the cookie to remove
- `options` - Optional configuration for removal

#### Example

```typescript
import cookieUtil from '@coursebuilder/utils-browser/cookies'

// Set a simple string cookie
cookieUtil.set('name', 'John')

// Set a complex object (automatically serialized to JSON)
cookieUtil.set('user', { id: 123, name: 'John' })

// Set with custom options
cookieUtil.set('preferences', { theme: 'dark' }, { expires: 7 })

// Get a string cookie
const name = cookieUtil.get('name') // 'John'

// Get a JSON cookie (automatically parsed)
const user = cookieUtil.get('user') // { id: 123, name: 'John' }

// Remove a cookie
cookieUtil.remove('name')
```

## Contributing

To add a new utility to this package:

1. Create a new file in the `src` directory
2. Implement your utility with proper TSDoc comments
3. Export it from the package by updating `package.json`
4. Add tests in a corresponding `.test.ts` file
5. Build and test your changes:

```bash
cd packages/utils-browser
pnpm build
pnpm test
```