# @coursebuilder/utils-string

String utilities for the CourseBuilder monorepo.

## Installation

```bash
pnpm add @coursebuilder/utils-string
```

## Usage

### toChicagoTitleCase

Converts a string to Chicago Manual of Style title case.

This follows Chicago Manual of Style guidelines for title capitalization, where:
- First and last words are always capitalized
- Major words (nouns, pronouns, verbs, adjectives, adverbs) are capitalized
- Articles (a, an, the), coordinating conjunctions (and, but, or, nor), and prepositions (at, by, to, etc.) are lowercase unless they are the first or last word
- Special cases like Roman numerals (I, II, III) are always uppercase
- Names with prefixes like "Mc" or "Mac" have special capitalization

#### Parameters

- `str` - The string to convert to Chicago title case

#### Returns

The string formatted according to Chicago title case rules.

#### Example

```typescript
import { toChicagoTitleCase } from '@coursebuilder/utils-string/chicagor-title'

toChicagoTitleCase("the lord of the rings")
// Returns "The Lord of the Rings"

toChicagoTitleCase("star wars episode iv a new hope")
// Returns "Star Wars Episode IV a New Hope"

toChicagoTitleCase("mcdonald and macintosh went to the store")
// Returns "McDonald and MacIntosh Went to the Store"
```

## Contributing

To add a new utility to this package:

1. Create a new file in the `src` directory
2. Implement your utility with proper TSDoc comments
3. Export it from the package by updating `package.json`
4. Add tests in a corresponding `.test.ts` file
5. Build and test your changes:

```bash
cd packages/utils-string
pnpm build
pnpm test
```