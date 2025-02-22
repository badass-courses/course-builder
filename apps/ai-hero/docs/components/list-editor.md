# List Editor Component

## Overview

The List Editor is a powerful component for managing ordered collections of resources with features like drag-and-drop reordering, tier-based organization, and resource selection.

## Core Components

### 1. `ListResourcesEdit`

The main component that orchestrates list editing functionality:

```typescript
export default function ListResourcesEdit({
  list: ContentResource,
  config?: Partial<ListEditorConfig>
})
```

### 2. Configuration Interface

```typescript
export interface ListEditorConfig {
  selection: {
    availableResourceTypes: PostType[]
    defaultResourceType: PostType
    createResourceTitle?: string
    showTierSelector?: boolean
    searchConfig?: React.ReactNode
  }
  title?: React.ReactNode
  onResourceAdd?: (resource: ContentResource) => Promise<void>
  onResourceRemove?: (resourceId: string) => Promise<void>
  onResourceReorder?: (resourceId: string, newPosition: number) => Promise<void>
}
```

## Features

### 1. Resource Selection

- Type-filtered resource search
- Custom search configuration
- Resource creation modal
- Instant search integration with Typesense

### 2. Resource Organization

- Drag-and-drop reordering
- Tier-based organization (standard/premium)
- Nested resource support
- Position tracking

### 3. UI Components

- Resource list with custom rendering
- Search modal
- Create resource modal
- Tier selector
- Custom title support

## Integration Examples

### 1. Basic List Editor

```typescript
<ListResourcesEdit
  list={resource}
  config={{
    selection: {
      availableResourceTypes: ['article'],
      defaultResourceType: 'article',
      showTierSelector: false
    }
  }}
/>
```

### 2. Advanced Configuration

```typescript
<ListResourcesEdit
  list={resource}
  config={{
    title: (
      <div>
        <span className="flex text-lg font-bold">Resources</span>
        <span className="text-muted-foreground mt-2 font-normal">
          Add and organize resources in this list.
        </span>
      </div>
    ),
    selection: {
      availableResourceTypes: ['article', 'tutorial'],
      defaultResourceType: 'article',
      showTierSelector: true,
      searchConfig: <CustomSearchConfig />
    },
    onResourceAdd: async (resource) => {
      // Custom add logic
    }
  }}
/>
```

## State Management

### 1. Tree State

The list editor uses a reducer pattern for managing the tree state:

```typescript
const [state, updateState] = useReducer(
  treeStateReducer,
  initialData,
  getInitialTreeState
)
```

### 2. Selection Context

A React context provides selection state across components:

```typescript
export function useSelection() {
  return useContext(SelectionContext)
}
```

## Event Handling

### 1. Resource Addition

```typescript
const handleResourceAdd = async (resource: ContentResource) => {
  // Analytics tracking
  track('post_created', {
    source: 'search_modal',
    resourceId: resource.id,
    resourceType: resource.type,
    listId: list.id
  })

  // Database update
  const result = await addPostToList({
    postId: resource.id,
    listId: list.id,
    metadata: { tier: 'standard' }
  })

  // UI update
  updateState({
    type: 'add-item',
    itemId: resource.id,
    item: {
      // Item configuration
    }
  })
}
```

### 2. Resource Reordering

- Drag-and-drop functionality
- Position updates
- Tree state management
- Database synchronization

## Search Integration

### 1. Typesense Configuration

```typescript
<InstantSearchNext
  searchClient={typesenseInstantsearchAdapter.searchClient}
  indexName={TYPESENSE_COLLECTION_NAME}
  routing={false}
  initialUiState={{
    [TYPESENSE_COLLECTION_NAME]: {
      query: '',
      refinementList: {
        type: ['post', 'lesson']
      }
    }
  }}
/>
```

### 2. Custom Search Config

```typescript
export default function SearchConfig() {
  const { excludedIds } = useSelection()
  return (
    <Configure
      hitsPerPage={20}
      filters={
        excludedIds.length
          ? `(type:post || type:lesson) && ${excludedIds
              .map((id) => `id:!=${id}`)
              .join(' && ')}`
          : '(type:post || type:lesson)'
      }
    />
  )
}
```

## Best Practices

1. **Performance**
   - Use virtualization for large lists
   - Implement proper memoization
   - Optimize drag-and-drop operations

2. **Error Handling**
   - Validate resource operations
   - Provide clear error messages
   - Handle network failures gracefully

3. **Accessibility**
   - Keyboard navigation support
   - ARIA attributes
   - Focus management

4. **Mobile Support**
   - Touch-friendly interactions
   - Responsive layouts
   - Mobile-specific UX considerations

## Testing

1. **Unit Tests**
   - Test state management
   - Test resource operations
   - Test search functionality

2. **Integration Tests**
   - Test drag-and-drop
   - Test search integration
   - Test modal interactions

3. **E2E Tests**
   - Test complete workflows
   - Test mobile interactions
   - Test error scenarios

## Common Use Cases

1. **Course Content Organization**
   ```typescript
   <ListResourcesEdit
     list={cohort}
     config={{
       selection: {
         availableResourceTypes: ['lesson'],
         showTierSelector: false
       }
     }}
   />
   ```

2. **Resource Collection**
   ```typescript
   <ListResourcesEdit
     list={collection}
     config={{
       selection: {
         availableResourceTypes: ['article', 'tutorial'],
         showTierSelector: true
       }
     }}
   />
   ```

## Future Enhancements

1. **Performance**
   - Virtual scrolling for large lists
   - Optimized drag-and-drop
   - Better state management

2. **Features**
   - Advanced filtering
   - Bulk operations
   - Enhanced search capabilities

3. **Developer Experience**
   - Better debugging tools
   - Configuration validation
   - Enhanced TypeScript support 