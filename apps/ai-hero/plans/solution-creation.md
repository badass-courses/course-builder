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

## Technical Details

### New Resource Type
- Add `solution` to the `PostType` enum in the posts schema
- Solutions will inherit most metadata fields from lessons
- Solutions cannot have nested solutions (prevent infinite nesting)
- Initially limit to one solution per lesson
- Solutions are deleted when parent lesson is deleted

### File Changes Required

#### 1. Posts Schema
- Update `PostType` to include `solution`
- Add relationship field for `parentLessonId` in solution schema
- Add validation to prevent solutions from having solutions
- Add validation to enforce one solution per lesson limit

#### 2. New: `@/lib/solutions/solution.ts`
- Create solution schema extending base post schema
- Add fields:
  - `parentLessonId: string` - required reference to parent lesson
  - `type: 'solution'` - constant type field
- Add zod validation:
  - Ensure parentLessonId exists
  - Prevent nested solutions
  - Validate one-to-one relationship
- Export types:
  - `Solution` - the full solution type
  - `SolutionSchema` - zod schema for validation
  - `CreateSolutionInput` - input type for creating solutions

#### 3. New: `@/lib/solutions/solution-query.ts`
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

### Implementation Steps

1. Schema Updates
   - [ ] Create `solution.ts`:
     - [ ] Define solution schema (using base post schema)
     - [ ] Add parentLessonId field
     - [ ] Add cascade delete trigger
     - [ ] Create types and interfaces
   - [ ] Create `solution-query.ts`:
     - [ ] Implement CRUD operations
     - [ ] Add relationship queries
     - [ ] Add one-to-one validation
     - [ ] Exclude from general post queries
   - [ ] Update `PostType` enum
   - [ ] Add parent lesson reference
   - [ ] Ensure parent lesson data is included in solution queries

2. UI Components
   - [ ] Create `SolutionMetadataFormFields` component with:
     - [ ] Parent lesson navigation section
     - [ ] External link to parent lesson
     - [ ] Visual solution indicator
   - [ ] Create solution section in lesson metadata with:
     - [ ] Solution preview component
     - [ ] External link and trash icons from tree-item
     - [ ] Confirmation dialog for deletion
   - [ ] Modify `CreatePostModal` to handle solutions in lesson context only
   - [ ] Add solution preview/edit capabilities in lesson view

3. API/Backend
   - [ ] Add solution relationship handling
   - [ ] Add solution deletion/replacement logic
   - [ ] Update post queries to include solution data
   - [ ] Add validation for one-to-one relationship
   - [ ] Add solution-specific validation

4. Testing
   - [ ] Test solution creation flow from lesson context
   - [ ] Test solution deletion/replacement flow
   - [ ] Verify one-to-one relationship constraint
   - [ ] Test UI interactions
   - [ ] Verify solution type is not available outside lesson context

## Acceptance Criteria

- [ ] Users can create ONE solution from lesson metadata
- [ ] Solutions can ONLY be created from within a lesson
- [ ] Solutions inherit appropriate metadata fields from lessons (no custom fields)
- [ ] Solutions cannot have nested solutions
- [ ] Solutions are properly associated with parent lessons
- [ ] Solutions are automatically deleted when parent lesson is deleted
- [ ] Solutions do not appear in general post listings
- [ ] UI clearly shows solution relationship with:
  - [ ] Solution preview
  - [ ] External link to edit
  - [ ] Remove/Replace functionality
- [ ] All validation rules are enforced
- [ ] Solution creation is not available from general post creation flow
- [ ] Solution deletion has confirmation dialog
- [ ] Solutions have clear navigation back to parent lesson
- [ ] Parent lesson relationship is visually prominent in solution view

## Technical Constraints

- Solutions must be tied to exactly one lesson
- Solutions cannot have their own solutions
- Only one solution per lesson (initially)
- Solution type is only available in lesson context
- Maintain existing metadata field structure where appropriate
- Use existing UI components and patterns
- Reuse tree-item icons for consistency
- Follow existing schema patterns from posts/lessons
- Use zod for schema validation
- Cascade deletes from lesson to solution

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
- Schema and data model implementation
- Basic CRUD operations
- Core validation rules

Week 2:
- UI implementation
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