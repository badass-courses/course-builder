# @coursebuilder/utils-auth

Authentication and authorization utilities for the CourseBuilder monorepo.

## Installation

```bash
pnpm add @coursebuilder/utils-auth
```

## Usage

### Current Ability Rules

This package provides interfaces and types for handling user permission rules within the application. Since these functions are highly dependent on application-specific implementations, they're designed to be overridden by the consuming application.

#### getCurrentAbilityRules

Gets the current ability rules for a user based on lesson, module, and other contextual information.

```typescript
import { getCurrentAbilityRules } from '@coursebuilder/utils-auth/current-ability-rules'

// In your application, implement this function:
Object.defineProperty(exports, 'getCurrentAbilityRules', {
  value: async function({
    lessonId,
    moduleId,
    organizationId,
  }: {
    lessonId?: string
    moduleId?: string
    organizationId?: string
  }) {
    // Your application-specific implementation
    // ...
    return rules
  }
})

// Then use it in your code:
const rules = await getCurrentAbilityRules({ 
  lessonId: '123', 
  moduleId: '456' 
})
const ability = createAppAbility(rules)
const canView = ability.can('read', 'Content')
```

#### getViewingAbilityForResource

Checks if a user can view a specific resource.

```typescript
import { getViewingAbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

// Use after implementing in your application:
const canView = await getViewingAbilityForResource('lesson123', 'module456')
if (canView) {
  // Show the resource
}
```

#### getAbilityForResource

Gets detailed ability information for a resource.

```typescript
import { getAbilityForResource, type AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

// Use after implementing in your application:
const ability = await getAbilityForResource('lesson123', 'module456')
if (ability.canView && !ability.isRegionRestricted) {
  // Show the resource
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
cd packages/utils-auth
pnpm build
pnpm test
```