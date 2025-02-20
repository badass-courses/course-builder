# Add Solution Resource Type to Lessons

## Overview
Add the ability to create and associate solution resources with lesson posts. Solutions will have similar metadata to lessons but with specific constraints and relationships. Solutions can only be created from within a lesson context, with a limit of one solution per lesson.

## Scope Decisions

### In Scope (v1)
- One solution per lesson
- Solutions inherit base post schema (no custom fields)
- Solutions are only created/accessed via parent lesson
- Cascading deletion (deleting lesson deletes solution)
- Solutions excluded from general post listings
- Basic CRUD with parent-child validation
- Simple UI using existing components
- Clear bidirectional navigation

### Out of Scope (v1)
- Multiple solutions per lesson
- Solution versioning/history
- Solution templates
- Draft states (use existing post visibility)
- Solution-specific metadata fields
- Advanced validation rules
- Custom visibility rules

## Current Status

### ✅ Completed
1. Schema Updates
   - [x] Create `solution.ts`:
     - [x] Define solution schema
     - [x] Add validation rules
     - [x] Create types and interfaces
     - [x] Fix schema field inheritance
   - [x] Create `solution-query.ts`:
     - [x] Implement CRUD operations
     - [x] Add relationship queries
     - [x] Add one-to-one validation
     - [x] Add proper zod validation
     - [x] Add server-side logging
   - [x] Update analytics rules to clarify tracking vs logging

2. UI Components
   - [x] Create `solution-metadata-form-fields.tsx`:
     - [x] Base form structure from lesson metadata
     - [x] Parent lesson navigation section
     - [x] External link to parent lesson
     - [x] Visual solution indicator
   - [x] Add solution section to lesson metadata:
     - [x] Solution preview component
     - [x] External link and trash icons
     - [x] Confirmation dialog for deletion
   - [x] Modify `create-post-modal.tsx`:
     - [x] Remove solution from default types
     - [x] Add lesson context handling
     - [x] Pass parent lesson ID

### 🎉 Week 2 Complete!
All planned UI components have been implemented with:
- Clean parent-child relationship display
- Easy navigation between lessons and solutions
- Intuitive solution management
- Proper error messaging
- Confirmation for destructive actions

### Next Steps
1. Testing and Refinement
   - [ ] Add integration tests for solution creation
   - [ ] Add integration tests for solution deletion
   - [ ] Test parent-child relationship constraints
   - [ ] Test validation rules
   - [ ] Test UI flows and error states

2. Documentation
   - [ ] Update API documentation
   - [ ] Add usage examples
   - [ ] Document validation rules
   - [ ] Document UI components

## Technical Details

### File Changes Required

#### 1. Posts Schema
- [x] Update `PostType` to include `solution`
- [x] Add relationship field for `parentLessonId` in solution schema
- [x] Add validation to prevent solutions from having solutions
- [x] Add validation to enforce one solution per lesson limit

#### 2. `@/lib/solutions/solution.ts`
- [x] Create solution schema extending base post schema
- [x] Add fields:
  - [x] `parentLessonId: string` - required reference to parent lesson
  - [x] `type: 'solution'` - constant type field
  - [x] All inherited post fields properly merged
- [x] Add zod validation:
  - [x] Ensure parentLessonId exists
  - [x] Prevent nested solutions
  - [x] Validate one-to-one relationship
- [x] Export types:
  - [x] `Solution` - the full solution type
  - [x] `SolutionSchema` - zod schema for validation
  - [x] `CreateSolutionInput` - input type for creating solutions

#### 3. `@/lib/solutions/solution-query.ts`
- Add query functions:
  - `getSolution(id: string)` - get solution by ID with parent lesson data
  - `getSolutionForLesson(lessonId: string)` - get solution for a lesson
  - `createSolution(input: CreateSolutionInput)` - create new solution
  - `deleteSolution(id: string)` - delete solution
  - `updateSolution(id: string, data: Partial<Solution>)` - update solution
- Add validation:
  - Check for existing solution when creating
  - Validate parent lesson exists
  - Handle cascading deletion

#### 4. `@/app/(content)/posts/_components/create-post-modal.tsx`
- Remove `solution` from default `availableResourceTypes`
- Ensure `solution` type is only available when modal is opened from lesson context
- Pass parent lesson ID when creating solutions

#### 5. `@/app/(content)/posts/_components/lesson-metadata-form-fields.tsx`
- Add "Solution" section with:
  - Title/heading for the section
  - When no solution exists:
    - "Add Solution" button that opens CreatePostModal
  - When solution exists:
    - Solution title/preview
    - External link button (using ExternalLink icon) to edit solution
    - Remove/Replace button (using Trash icon) to delete current solution
    - Confirmation dialog for solution removal
- Solution section should be visually distinct (possibly using a border or background)
- Implement solution creation flow using `CreatePostModal` with restricted resource types
- Add ability to manage solution relationship

#### 6. New: `@/app/(content)/posts/_components/solution-metadata-form-fields.tsx`
- Create new component for solution-specific metadata fields
- Inherit base structure from lesson metadata fields
- Remove solution-specific fields/capabilities (no nested solutions)
- Add reference back to parent lesson
- Add visual indicator that this is a solution (possibly in header/title)
- Add prominent "Parent Lesson" section at the top with:
  - Lesson title
  - External link button to navigate to parent lesson
  - Visual distinction to make it clear this is a solution view

### UI Component Structure

#### 1. `solution-metadata-form-fields.tsx`
```tsx
export const SolutionMetadataFormFields: React.FC<{
  form: UseFormReturn<Solution>
  post: Solution
  parentLesson: Post
}> = ({ form, post, parentLesson }) => {
  return (
    <>
      {/* Parent Lesson Section */}
      <div className="border-muted bg-muted mb-4 rounded-lg border p-4">
        <h3>Parent Lesson</h3>
        <div className="flex items-center gap-2">
          <span>{parentLesson.fields.title}</span>
          <ExternalLink />
        </div>
      </div>

      {/* Solution Fields */}
      <FormField name="title" />
      <FormField name="description" />
      {/* ... other fields ... */}
    </>
  )
}
```

#### 2. Lesson Solution Section
```tsx
{/* In lesson-metadata-form-fields.tsx */}
<div className="border-muted bg-muted rounded-lg border p-4">
  <h3>Solution</h3>
  {solution ? (
    <div className="flex items-center justify-between">
      <div>{solution.fields.title}</div>
      <div className="flex gap-2">
        <ExternalLink />
        <Trash onClick={handleDelete} />
      </div>
    </div>
  ) : (
    <Button onClick={() => setShowCreateModal(true)}>
      Add Solution
    </Button>
  )}
</div>
```

## Acceptance Criteria

### Core Functionality
- [x] Solutions can ONLY be created from within a lesson
- [x] One solution per lesson (enforced in schema)
- [x] Solutions inherit base post schema
- [x] Proper validation and error handling
- [x] Server-side logging for operations

### UI/UX Requirements
- [x] Clear parent-child relationship display
- [x] Easy navigation between lesson and solution
- [x] Intuitive solution management
- [x] Proper error messaging
- [x] Confirmation for destructive actions

## Technical Constraints

- [x] Solutions tied to exactly one lesson
- [x] Solutions cannot have nested solutions
- [x] Solution type only available in lesson context
- [x] Follow existing schema patterns
- [x] Use zod for validation
- [x] Cascade deletes from lesson to solution
- [x] Reuse existing UI components
- [x] Follow existing form patterns

## Future Considerations (v2+)

- Multiple solutions per lesson
- Solution versioning/history
- Solution templates
- Solution-specific metadata fields
- Advanced visibility rules
- Draft states
- Solution ordering/sorting

## Timeline
This is structured as a 2-week bet with clear boundaries:

Week 1:
- Schema and data model implementation ✅
- Basic CRUD operations ✅
- Core validation rules ✅

Week 2:
- UI implementation 🏗️
- Navigation and relationship management
- Testing and refinement

## Questions/Considerations

- How should we handle solution deletion? (cascade vs orphan)
- Should solutions have different visibility rules?
- What's the upgrade path when we want to support multiple solutions?
- Do we need to add solution-specific metadata fields?
- Should we add a "draft" state for solutions?
- Should we add solution-specific validation rules beyond the base post schema?
- Do we need to track solution versions or history? 