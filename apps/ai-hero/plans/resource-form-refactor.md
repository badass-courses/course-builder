# Updated Resource Form Refactor Plan

## ✅ Completed
1. Base HOC pattern established with `withResourceForm`
2. Configuration interface proven with cohort form
3. Common metadata fields component working
4. Mobile/desktop form handling abstracted
5. Post form migrated to new pattern

## Next Steps

### 1. Migrate Remaining Forms
- Port `EditListForm` to use `withResourceForm`
- Port `EditPagesForm` to use `withResourceForm`
- Port `EditTutorialForm` to use `withResourceForm`
- Port `EditWorkshopForm` to use `withResourceForm`

### 2. Standardize List Editor Integration
- Review `ListResourcesEdit` integration points
- Create consistent pattern for resource selection
- Standardize search modal behavior

### 3. Clean Up Tech Debt
1. ✅ Remove console.log from `cohort-form-config.ts`
2. Add proper JSDoc to all exported components
3. Ensure consistent error handling
4. Add type safety to resource chat message handling

### 4. Testing Strategy
1. Create test helpers for form configurations
2. Add integration tests for form/list editor interaction
3. Unit tests for common behaviors

## Breaking Changes Addressed
1. ✅ Mobile/desktop rendering strategy
2. Resource chat message handling
3. Tool configuration patterns
4. Workflow configuration

## Current Issues
1. ✅ Duplicate boilerplate across form components
2. ✅ Similar tool configurations repeated
3. ✅ Common patterns in form setup and validation
4. Similar resource type handling

## Next Immediate Actions
1. Port `EditListForm` to new pattern
2. Add JSDoc comments to all form components
3. Create test helpers for form configurations

## Questions Resolved
1. ✅ Should we maintain separate mobile/desktop versions? - Yes, with separate HOCs
2. ✅ How to handle resource-specific workflow configurations? - Through form config
3. ✅ Should we extract common metadata fields? - Yes, using EditResourcesMetadataFields
4. ✅ How to handle custom tool configurations? - Through form config customTools

## Benefits Realized
1. Reduced code duplication through HOCs
2. Centralized configuration
3. Type-safe resource handling
4. Easier maintenance
5. Consistent behavior across resource types
6. Mobile/desktop consistency

## Proposed Solutions

### 1. Create Base Resource Form HOC
```typescript
function withResourceForm<T extends ContentResource>(
  Component: React.ComponentType<ResourceFormProps<T>>,
  config: ResourceFormConfig<T>
) {
  // Common form setup
  // Common tool setup
  // Common workflow setup
  return FormWithCommonBehavior
}
```

### 2. Create Common Resource Form Configuration
```typescript
interface ResourceFormConfig<T extends ContentResource> {
  resourceType: 'cohort' | 'list' | 'page'
  schema: z.ZodSchema
  defaultValues: (resource: T) => DefaultValues
  allowedPostTypes: PostType[]
  createPostConfig: CreatePostConfig
  customTools?: Tool[]
}
```

### 3. Standardize ListResourcesEdit Configuration
```typescript
interface ResourceListConfig {
  title?: React.ReactNode
  allowedPostTypes: PostType[]
  defaultPostType: PostType
  showTierSelector?: boolean
}
```

## Implementation Steps

1. **Phase 1: Create Base Components**
   - Create withResourceForm HOC
   - Create common configuration interfaces
   - Create shared tool configurations

2. **Phase 2: Resource-Specific Components**
   - Create CohortFormConfig
   - Create ListFormConfig
   - Create PageFormConfig

3. **Phase 3: Migration**
   - Migrate EditCohortForm
   - Migrate EditListForm
   - Migrate EditPagesForm

## Example Usage After Refactor

```typescript
// Cohort Form
const CohortForm = withResourceForm(CohortFormFields, {
  resourceType: 'cohort',
  schema: CohortSchema,
  defaultValues: getCohortDefaultValues,
  allowedPostTypes: ['cohort-lesson'],
  createPostConfig: {
    title: 'Create a Lesson',
    defaultResourceType: 'cohort-lesson',
    availableResourceTypes: ['cohort-lesson']
  }
})

// List Form
const ListForm = withResourceForm(ListFormFields, {
  resourceType: 'list',
  schema: ListSchema,
  defaultValues: getListDefaultValues,
  allowedPostTypes: ['article', 'cohort-lesson', 'tip', 'podcast'],
  createPostConfig: {
    title: 'Create a Resource',
    defaultResourceType: 'article',
    availableResourceTypes: ['article', 'cohort-lesson', 'tip', 'podcast']
  }
})
```

## Benefits
1. Reduced code duplication
2. Centralized configuration
3. Type-safe resource handling
4. Easier maintenance
5. Consistent behavior across resource types
6. Simplified testing

## Risks & Considerations
1. Migration complexity
2. Potential edge cases in specific forms
3. Need to maintain backward compatibility
4. Need to handle resource-specific features

## Questions for Discussion
1. Should we maintain separate mobile/desktop versions?
2. How to handle resource-specific workflow configurations?
3. Should we extract common metadata fields?
4. How to handle custom tool configurations?

## Next Steps
1. Create proof of concept with one form type (suggest starting with List form as it's simplest)
2. Review and adjust patterns
3. Create shared tool configurations
4. Implement remaining forms
5. Add tests for common behaviors
6. Document patterns and usage 