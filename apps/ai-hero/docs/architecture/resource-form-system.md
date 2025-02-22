# Resource Form System Architecture

## Overview

The resource form system is a flexible, type-safe architecture for managing different types of content resources (posts, lists, cohorts, etc.) with a standardized approach to form handling and list editing capabilities.

## Core Components

### 1. `withResourceForm` Higher-Order Component

The `withResourceForm` HOC is the foundation of our resource form system, providing:

- Type-safe form handling with Zod schema validation
- Consistent resource updating patterns
- Mobile/desktop responsive form rendering
- Standardized tool panel integration
- List editor integration
- Resource chat capabilities

```typescript
export interface ResourceFormConfig<T extends ContentResource, S extends z.ZodSchema> {
  resourceType: 'cohort' | 'list' | 'page' | 'post' | 'tutorial' | 'workshop'
  schema: S
  defaultValues: (resource?: T) => z.infer<S>
  updateResource: (resource: Partial<T>) => Promise<T>
  // ... other configuration options
}
```

### 2. List Editor System

The list editor provides a standardized way to manage ordered collections of resources:

```typescript
export interface ListEditorConfig {
  selection: ListResourceSelectionConfig
  title?: React.ReactNode
  onResourceAdd?: (resource: ContentResource) => Promise<void>
  onResourceRemove?: (resourceId: string) => Promise<void>
  onResourceReorder?: (resourceId: string, newPosition: number) => Promise<void>
}
```

Key features:
- Resource selection with type filtering
- Drag-and-drop reordering
- Tier-based organization
- Custom search configuration
- Resource creation integration

### 3. Form Configuration Pattern

Each resource type implements its configuration:

```typescript
export const resourceFormConfig: ResourceFormConfig<ResourceType, typeof ResourceSchema> = {
  resourceType: 'resource',
  schema: ResourceSchema,
  defaultValues: (resource) => ({
    // Type-safe default values
  }),
  updateResource: async (resource) => {
    // Resource-specific update logic
  }
}
```

## Usage Examples

### 1. Basic Resource Form

```typescript
const ResourceForm = withResourceForm(
  BaseResourceForm,
  resourceFormConfig
)
```

### 2. List Editor Integration

```typescript
bodyPanelConfig: {
  showListResources: true,
  listEditorConfig: {
    title: <CustomTitle />,
    showTierSelector: true,
    // ... other config options
  }
}
```

## Best Practices

1. **Type Safety**
   - Always use Zod schemas for form validation
   - Leverage TypeScript generics in form configurations
   - Define explicit interfaces for resource fields

2. **Configuration Organization**
   - Keep form configs in separate files (e.g., `post-form-config.ts`)
   - Use consistent naming patterns for config files
   - Document config options with JSDoc comments

3. **List Editor Integration**
   - Use standardized list editor configuration
   - Implement resource-specific search configs when needed
   - Handle resource ordering appropriately

4. **Mobile Responsiveness**
   - Forms automatically adapt to mobile/desktop
   - Use appropriate layouts for different screen sizes
   - Consider touch interactions for list editing

## Architecture Benefits

1. **Consistency**
   - Standardized form handling across resource types
   - Consistent user experience
   - Unified error handling

2. **Maintainability**
   - Centralized configuration
   - Reduced code duplication
   - Clear separation of concerns

3. **Extensibility**
   - Easy to add new resource types
   - Flexible tool panel system
   - Customizable list editor behavior

4. **Developer Experience**
   - Strong type safety
   - Clear patterns to follow
   - Reusable components

## Common Patterns

### Resource Type Configuration

```typescript
export interface BaseResourceFields {
  body?: string | null
  title?: string | null
  slug: string
  visibility?: string
  state?: string
  description?: string | null
}
```

### List Editor Integration

```typescript
const listEditorConfig = {
  selection: {
    availableResourceTypes: ['article'],
    defaultResourceType: 'article',
    showTierSelector: true
  },
  title: <CustomTitle />
}
```

## Testing Strategy

1. **Unit Tests**
   - Test form validation
   - Test resource updates
   - Test list editor operations

2. **Integration Tests**
   - Test form/list editor interaction
   - Test mobile/desktop rendering
   - Test resource type handling

3. **E2E Tests**
   - Test complete form workflows
   - Test list management
   - Test resource creation/editing

## Future Considerations

1. **Performance Optimization**
   - Lazy loading of resource components
   - Optimized list rendering
   - Caching strategies

2. **Feature Extensions**
   - Enhanced search capabilities
   - Additional resource types
   - Advanced list organization

3. **Developer Tools**
   - Debug mode improvements
   - Better error messages
   - Configuration validation 