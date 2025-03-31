# Tree Component Technical Specification

## Overview

This document provides the technical specification for the unified `Tree` component that will replace multiple implementations across the codebase. This unified component will be designed with flexibility, performance, and maintainability in mind.

## Directory Structure

```
/apps/ai-hero/src/components/shared/tree/
├── index.ts                  # Re-exports
├── tree.tsx                  # Main component
├── utils/
│   ├── debounce.ts           # Utility functions
│   ├── performance.ts        # Performance monitoring
│   └── registry.ts           # Tree item registry
├── context/
│   ├── tree-context.tsx      # Tree context
│   └── dependency-context.tsx # Dependency injection context
├── hooks/
│   ├── use-tree-data.ts      # Tree data management
│   └── use-save.ts           # Save operations
└── pieces/
    ├── tree-item.tsx         # Tree item component
    ├── resource-list.tsx     # Resource list wrapper
    └── constants.ts          # Shared constants
```

## Core Interfaces

```typescript
// Main Tree component props
interface TreeProps {
  // Core props
  state: TreeState;
  updateState: React.Dispatch<TreeAction>;
  rootResourceId: string;
  rootResource: ContentResource | Product;
  
  // Optional features
  showTierSelector?: boolean;
  onRefresh?: () => void;
  onItemDelete?: ({ itemId }: { itemId: string }) => Promise<void>;
  
  // Rendering options
  useResourceList?: boolean;
  customItemRenderer?: (item: TreeItemType, index: number) => React.ReactNode;
  
  // Performance options
  enablePerformanceMetrics?: boolean;
  saveDebounceMs?: number;
  
  // Style customization
  className?: string;
  itemClassName?: string;
}

// Tree state structure
interface TreeState {
  data: TreeItemType[];
  lastAction: TreeAction | null;
}

// Tree action types
type TreeAction =
  | { type: 'toggle'; itemId: string }
  | { type: 'instruction'; instruction: Instruction; itemId: string; targetId: string }
  | { type: 'modal-move'; itemId: string; targetId: string; index: number }
  | { type: 'remove-item'; itemId: string }
  | { type: 'update-tier'; itemId: string; tier: string };

// Tree context value
interface TreeContextValue {
  dispatch: React.Dispatch<TreeAction>;
  uniqueContextId: symbol;
  getPathToItem: (targetId: string) => string[];
  getMoveTargets: ({ itemId }: { itemId: string }) => TreeItemType[];
  getChildrenOfItem: (itemId: string) => TreeItemType[];
  registerTreeItem: RegisterTreeItemFn;
  rootResourceId: string;
  rootResource: ContentResource | Product;
  onRefresh?: () => void;
}
```

## Key Components

### 1. Tree Component

The main `Tree` component will be responsible for:
- Rendering the tree structure
- Handling drag and drop operations
- Managing state updates
- Coordinating save operations

```typescript
export default function Tree({
  state,
  updateState,
  rootResourceId,
  rootResource,
  showTierSelector = false,
  onRefresh,
  onItemDelete,
  useResourceList = false,
  customItemRenderer,
  enablePerformanceMetrics = false,
  saveDebounceMs = 500,
  className,
  itemClassName,
}: TreeProps) {
  // Component implementation
}
```

### 2. Save Operations

The save mechanism will be abstracted into a custom hook:

```typescript
export function useSaveTreeData({
  treeData,
  rootResourceId,
  debounceMs = 500,
  enableMetrics = false,
}) {
  // Implementation that handles both immediate and debounced saves
}
```

### 3. Rendering Strategy

The component will support multiple rendering strategies:

```typescript
function renderTreeItems({
  data,
  useResourceList,
  customItemRenderer,
  showTierSelector,
  onItemDelete,
}) {
  if (useResourceList) {
    return (
      <ResourceList
        resources={data}
        onRemove={(id) => /* handle removal */}
        itemRenderer={customItemRenderer || defaultItemRenderer}
      />
    );
  }
  
  return data.map((item, index, array) => {
    // Default rendering logic
  });
}
```

## Performance Optimizations

1. **Memoization**
   - Use `useMemo` for expensive computations
   - Implement `memoizeOne` for path calculations

2. **Debounced Saves**
   - Implement configurable debouncing for save operations
   - Batch updates for efficiency

3. **Performance Monitoring**
   - Optional metrics collection
   - Debug view for development environments

```typescript
function usePerformanceMonitoring(enabled: boolean) {
  // Performance monitoring implementation
}
```

## Migration Guide

### Migrating from Standard Implementation

```typescript
// Before
import Tree from '@/components/lesson-list/tree';

<Tree
  state={state}
  updateState={updateState}
  rootResourceId={resourceId}
  rootResource={resource}
/>

// After
import Tree from '@/components/shared/tree';

<Tree
  state={state}
  updateState={updateState}
  rootResourceId={resourceId}
  rootResource={resource}
  useResourceList={false}
/>
```

### Migrating from List Editor Implementation

```typescript
// Before
import Tree from '@/components/list-editor/lesson-list/tree';

<Tree
  state={state}
  updateState={updateState}
  rootResourceId={resourceId}
  rootResource={resource}
  onRefresh={handleRefresh}
  showTierSelector={true}
/>

// After
import Tree from '@/components/shared/tree';

<Tree
  state={state}
  updateState={updateState}
  rootResourceId={resourceId}
  rootResource={resource}
  onRefresh={handleRefresh}
  showTierSelector={true}
  useResourceList={true}
  enablePerformanceMetrics={true}
/>
```

## Testing Strategy

1. **Unit Tests**
   - Test core functions in isolation
   - Mock dependencies

2. **Integration Tests**
   - Test component interactions
   - Verify drag and drop functionality

3. **Snapshot Tests**
   - Ensure consistent rendering

4. **Performance Tests**
   - Benchmark save operations
   - Measure render performance

## Backward Compatibility

For a smooth transition, we'll maintain backward compatibility:

1. Create adapter components if needed
2. Document breaking changes
3. Provide migration scripts for complex cases

## Future Enhancements

1. **Virtualization** - Add support for virtualized lists for larger trees
2. **Accessibility** - Enhance keyboard navigation
3. **Animation** - Add configurable animations for tree operations

## Implementation Schedule

| Task | Time Estimate | Dependencies |
|------|--------------|--------------|
| Set up component structure | 4 hours | None |
| Implement core Tree | 8 hours | Structure |
| Abstract save mechanism | 4 hours | Core Tree |
| Add rendering strategies | 6 hours | Core Tree |
| Performance optimizations | 4 hours | Save mechanism |
| Testing | 8 hours | All implementations |
| Documentation | 4 hours | All implementations |
| Migration guide | 2 hours | Documentation |

Total: ~40 hours (5 days) 