# Form Configuration Patterns

## Overview

Our form configuration system provides a standardized way to define form behavior, validation, and resource management across different content types.

## Configuration Structure

### 1. Base Resource Fields

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

### 2. Resource Form Configuration

```typescript
export interface ResourceFormConfig<T extends ContentResource, S extends z.ZodSchema> {
  resourceType: 'cohort' | 'list' | 'page' | 'post' | 'tutorial' | 'workshop'
  schema: S
  defaultValues: (resource?: T) => z.infer<S>
  updateResource: (resource: Partial<T>) => Promise<T>
  autoUpdateResource?: (resource: Partial<T>) => Promise<T>
  onSave?: (resource: ContentResource) => Promise<void>
  createPostConfig?: {
    title: string
    defaultResourceType: PostType
    availableResourceTypes: PostType[]
  }
  bodyPanelConfig?: {
    showListResources?: boolean
    listEditorConfig?: ListEditorConfig
  }
  customTools?: BaseTool[]
  getResourcePath: (slug?: string) => string
}
```

## Implementation Examples

### 1. Post Form Configuration

```typescript
export const postFormConfig: ResourceFormConfig<Post, typeof PostSchema> = {
  resourceType: 'post',
  schema: PostSchema,
  defaultValues: (resource) => ({
    id: resource?.id ?? '',
    type: 'post',
    fields: {
      title: resource?.fields?.title ?? '',
      body: resource?.fields?.body ?? '',
      // ... other fields
    }
  }),
  updateResource: async (resource) => {
    // Update logic
  },
  createPostConfig: {
    title: 'Create a Resource',
    defaultResourceType: 'article',
    availableResourceTypes: ['article', 'tip', 'podcast']
  }
}
```

### 2. List Form Configuration

```typescript
export const listFormConfig: ResourceFormConfig<List, typeof ListSchema> = {
  resourceType: 'list',
  schema: ListSchema,
  bodyPanelConfig: {
    showListResources: true,
    listEditorConfig: {
      title: <CustomTitle />,
      showTierSelector: true
    }
  },
  // ... other config options
}
```

## Common Patterns

### 1. Schema Definition

```typescript
const ResourceSchema = z.object({
  id: z.string(),
  type: z.string(),
  fields: z.object({
    title: z.string(),
    body: z.string().nullable(),
    // ... other fields
  })
})
```

### 2. Default Values

```typescript
const getDefaultValues = (resource?: Resource) => ({
  id: resource?.id ?? '',
  type: resource?.type ?? 'resource',
  fields: {
    title: resource?.fields?.title ?? '',
    body: resource?.fields?.body ?? null,
    // ... other fields with defaults
  }
})
```

### 3. Update Functions

```typescript
const updateResource = async (resource: Partial<Resource>) => {
  if (!resource.id || !resource.fields) {
    throw new Error('Invalid resource data')
  }

  const result = await updateResourceInDb({
    id: resource.id,
    fields: resource.fields,
    // ... other update data
  })

  return result
}
```

## Best Practices

### 1. Type Safety

```typescript
// Use generics for type safety
function withResourceForm<T extends ContentResource, S extends z.ZodSchema>(
  Component: React.ComponentType<ResourceFormProps<T, S>>,
  config: ResourceFormConfig<T, S>
) {
  // Implementation
}
```

### 2. Error Handling

```typescript
const handleUpdate = async (resource: Partial<Resource>) => {
  try {
    const result = await updateResource(resource)
    return result
  } catch (error) {
    // Handle specific error cases
    throw new Error(`Failed to update resource: ${error.message}`)
  }
}
```

### 3. Validation

```typescript
const validateResource = (resource: Resource) => {
  if (!resource.id) {
    throw new Error('Resource ID is required')
  }
  if (!resource.fields?.title) {
    throw new Error('Resource title is required')
  }
  // ... other validation
}
```

## Form Integration

### 1. Basic Form

```typescript
const ResourceForm = withResourceForm(
  BaseResourceForm,
  resourceFormConfig
)
```

### 2. With Custom Tools

```typescript
const ResourceForm = withResourceForm(
  BaseResourceForm,
  {
    ...resourceFormConfig,
    customTools: [
      {
        id: 'media',
        icon: () => <ImageIcon />,
        toolComponent: <ImageUploader />
      }
    ]
  }
)
```

## Mobile Considerations

### 1. Responsive Configuration

```typescript
const ResourceForm = withResourceForm(
  isMobile ? MobileResourceForm : DesktopResourceForm,
  resourceFormConfig
)
```

### 2. Mobile-Specific Tools

```typescript
const mobileTools = [
  {
    id: 'quickActions',
    icon: () => <ActionsIcon />,
    toolComponent: <MobileQuickActions />
  }
]
```

## Testing Strategy

### 1. Configuration Tests

```typescript
describe('Resource Form Config', () => {
  it('validates required fields', () => {
    const config = createResourceConfig()
    expect(config.schema.parse(testData)).toBeDefined()
  })
})
```

### 2. Integration Tests

```typescript
describe('Form Integration', () => {
  it('handles resource updates', async () => {
    const result = await updateResource(testResource)
    expect(result).toMatchObject(expectedResource)
  })
})
```

## Future Considerations

1. **Enhanced Validation**
   - Custom validation rules
   - Async validation
   - Field-level validation

2. **Performance**
   - Form state optimization
   - Lazy loading
   - Caching strategies

3. **Developer Experience**
   - Configuration generators
   - Better error messages
   - Development tools 