# Workshop Forms Migration to withResourceForm HOC

## Current Structure Analysis

Currently, we have these primary workshop form components:
- `EditWorkshopForm` - For editing workshop resources
- `EditWorkshopLessonForm` - For editing workshop lessons
- `LessonMetadataFormFields` - For managing lesson metadata fields

These components have significant duplication with other resource forms in the application, including:
- Form setup with Zod validation 
- Mobile/desktop form responsiveness logic
- Common resource form fields (title, description, visibility, state)
- Tools panel configuration
- Resource update and save handling

## Migration Plan

### 1. Create Base Workshop Form Component (T+0)

Create a new component `WorkshopFormBase` in `_components/workshop-form-base.tsx` that will:
- Accept `resource` and `form` props from the HOC
- Contain only the workshop-specific form fields
- Not handle any form setup/validation logic (the HOC will handle this)

### 2. Define Workshop Form Config (T+0)

Create a config file `_components/workshop-form-config.ts` that exports:
- `workshopFormConfig`: Configuration object for the workshop form
  - Resource type: 'workshop'
  - Schema: ModuleSchema
  - Default values mapping
  - Update resource function
  - Resource path generation
  - Custom tools configuration
  - Save callback integration

### 3. Create Workshop HOC Implementation (T+1)

Create `_components/with-workshop-form.tsx` that:
- Imports `withResourceForm` and the base config
- Implements and exports `WithWorkshopForm` using the HOC
- Passes appropriate props to the base component

### 4. Update EditWorkshopForm (T+1)

Refactor `EditWorkshopForm`:
- Remove direct form handling
- Use the new HOC implementation
- Pass only workshop-specific fields to the form

### 5. Create Workshop Lesson Form Config (T+2)

Create `_components/workshop-lesson-form-config.ts` for lesson form config:
- Resource type: 'lesson'
- Schema: LessonSchema
- Default values mapping
- Update/save functions
- Custom tools for video upload

### 6. Create Base Lesson Form Component (T+2)

Create `_components/workshop-lesson-form-base.tsx` that:
- Accepts resource and form props
- Contains only lesson-specific form fields
- Uses the existing LessonMetadataFormFields component

### 7. Create Lesson Form HOC Implementation (T+3)

Create `_components/with-workshop-lesson-form.tsx` that:
- Uses withResourceForm HOC
- Applies the lesson form config
- Passes appropriate props to the base component

### 8. Update EditWorkshopLessonForm (T+3)

Refactor `EditWorkshopLessonForm`:
- Remove direct form handling
- Use the new HOC implementation
- Pass only lesson-specific props

## Benefits

- **Reduced Duplication**: Eliminates repeated form setup code
- **Consistent UX**: Ensures UI consistency across all resource forms
- **Simplified Maintenance**: Changes to form behavior need only be made once
- **Enhanced Features**: Automatically gets new form features (auto-save, etc.)
- **Better Type Safety**: Through consistent use of TypeScript generics

## Testing Plan

1. Test both workshop and lesson form rendering
2. Verify all form fields work correctly
3. Test form validation
4. Test form submission and resource updates
5. Test tools panel functionality
6. Verify mobile/desktop responsiveness

## Timeline

This migration can be completed incrementally, with each component refactored separately. Estimated total time: 1-2 developer days. 