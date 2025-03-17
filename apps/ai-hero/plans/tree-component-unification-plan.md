# Tree Component Unification Plan

## Current Situation Analysis

We currently have multiple implementations of the Tree component across our codebase:

1. **Standard Tree Component** - `apps/ai-hero/src/components/lesson-list/tree.tsx`
   - Basic implementation with core drag and drop functionality
   - Simple saving mechanism using `updateResourcePosition`/`updateResourcePositions`
   - No performance optimizations

2. **Enhanced List Editor Tree** - `apps/ai-hero/src/components/list-editor/lesson-list/tree.tsx`
   - Advanced implementation with performance debugging
   - Uses debounced saves via `batchUpdateResourcePositions`
   - Has error handling and feedback for saving operations
   - Uses ResourceList component for rendering
   - Includes performance metrics in development mode

3. **Other App Implementations** - Several other implementations across apps like egghead, go-local-first, astro-party, and course-builder-web with slight variations

## Key Differences Identified

1. **Save Mechanism**:
   - Standard: Direct save after each action
   - List Editor: Debounced batch saves with error handling

2. **Rendering Logic**:
   - Standard: Direct rendering within the component
   - List Editor: Uses ResourceList for structured rendering

3. **Performance Features**:
   - List Editor: Includes detailed performance metrics and debugging tools
   - Standard: No performance monitoring

4. **UI/Styling**:
   - Each implementation has slightly different styles/layouts
   - List Editor includes tier selector options

5. **Event Handling**:
   - List Editor includes refresh callback support
   - Standard implementation has more basic callbacks

## Unified Component Requirements

The unified Tree component should:

1. Support all current use cases across implementations
2. Use the most efficient and robust saving mechanism (batch updates)
3. Include performance optimization and monitoring (configurable)
4. Maintain flexibility for different rendering needs
5. Have comprehensive error handling
6. Support tier selection where needed

## Implementation Plan

### Phase 1: Create Unified Component

1. Create a new component at `apps/ai-hero/src/components/shared/tree/tree.tsx`
2. Merge the enhanced functionality from the list-editor version as the base
3. Abstract the rendering to support both direct rendering and ResourceList
4. Ensure all props from both implementations are supported
5. Add TypeScript interfaces for all configuration options

### Phase 2: Add Compatibility Layer

1. Create backwards compatibility wrappers for existing usages
2. Test all current implementations with the new component
3. Document migration path for consumers

### Phase 3: Migration

1. Update one consumer at a time to use the new unified component
2. Verify functionality matches existing behavior
3. Add any missing features identified during migration

### Phase 4: Cleanup

1. Remove deprecated implementations after all consumers migrate
2. Add comprehensive documentation for the unified component
3. Add unit tests to ensure stability

## Unified Component Structure

```typescript
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
```

## Migration Steps (Detailed)

### For each consumer:

1. **apps/ai-hero/src/components/lesson-list/tree.tsx**:
   - Replace import with new unified component
   - Map existing props to new component props
   - Test thoroughly before committing

2. **apps/ai-hero/src/components/list-editor/lesson-list/tree.tsx**:
   - Replace with new component
   - Set `useResourceList: true`
   - Enable performance metrics
   - Verify saving behavior matches

3. **Other app implementations**:
   - Create migration plan for each app
   - Update imports and prop mappings
   - Test with existing use cases

## Timeline

1. Phase 1 (Create Unified Component): 2 days
2. Phase 2 (Compatibility): 1 day
3. Phase 3 (Migration): 3 days (1 day per implementation)
4. Phase 4 (Cleanup): 1 day

Total: ~7 days

## Risk Assessment

1. **Behavioral Changes**: Risk of subtle differences in behavior after migration
   - Mitigation: Thorough testing of each migration

2. **Performance Regression**: Risk of slower performance in previously optimized areas
   - Mitigation: Carry forward all performance optimizations, benchmark before/after

3. **Missing Edge Cases**: Specialized features in some implementations may be missed
   - Mitigation: Code review by original implementers, thorough testing

## Success Criteria

1. All current functionality is preserved across implementations
2. Performance is equal or better than the previous implementations 
3. Code is more maintainable with a single source of truth
4. New component is well documented and extensible 