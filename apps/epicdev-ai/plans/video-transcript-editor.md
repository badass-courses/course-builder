# Plan: Video Transcript Editor Route

**Owner:** @joelhooks
**Status:** ✅ **COMPLETED**

## Goal

Expose the existing transcript-editing UI (currently lives under `apps/egghead`) at a video-centric URL inside the **epicdev-ai** Next.js app.

```
📄  Route: apps/epicdev-ai/src/app/(content)/videos/[id]/page.tsx
```

When a user with the correct permissions navigates to `/videos/[videoResourceId]`, they should see the same transcript editor used for posts, driven solely by a `videoResourceId` (no post slug required).

---

## Tasks / TODO

1. **Route Skeleton**
   - [x] Create `apps/epicdev-ai/src/app/(content)/videos/[id]/page.tsx`.
   - [x] Accept `id` param (`videoResourceId`).
   - [x] Perform auth/ability check (`getServerAuthSession`).

2. **Data Fetching (Server Component)**
   - [x] Fetch the *raw* Deepgram transcript from `contentResource` with id `raw-transcript-${videoResourceId}` (`db.query.contentResource.findFirst`).
   - [x] If not found ➜ `notFound()`.
   - [x] Run the `transformTranscriptData` normalisation (copy from egghead route).
   - [x] Validate with `DeepgramResponseSchema` (import from `@/transcript-editor/transcript-deepgram-response`).

3. **Client Component Wrapper**
   - [x] Create a _client_ component `transcript-editor-page.tsx` (reuse logic from egghead `transcript-editor.tsx`).
   - [x] Pass `transcriptData`, `videoResourceId` to the client component.
   - [x] Remove slug-based navigation/breadcrumbs, replace with video-centric UI.

4. **Shared Transcript Editor Module**
   - [x] Create `apps/epicdev-ai/src/transcript-editor` directory that acts as a self-contained module.
       - UI components: `transcript-editor.tsx`, `word-editor.tsx` (kebab-case only)
       - Supporting helpers: `merge-words.ts`, `transform-transcript-data.ts`, `transcript-deepgram-utils.ts`
       - Types & Zod schemas: `transcript-deepgram-response.ts`
       - Server actions: `actions.ts` containing `updateTranscript` function
   - [x] Copy all necessary utilities from egghead:
       - `mergeWords`, `updateTranscriptData`, `replaceAllWords` from `transcript-deepgram-utils.ts`
       - Full `DeepgramResponseSchema` and types
       - `transformTranscriptData` function from the page component
   - [x] Remove any egghead-specific dependencies/imports while porting.
   - [x] Update imports to use relative paths within the module.

5. **Update/Save Logic**
   - [x] Port `updateTranscript` server action from `apps/egghead/src/lib/transcript-query.ts`
   - [x] Update imports for epicdev-ai paths (db, inngest, etc.)
   - [x] Ensure revalidation works for epicdev-ai routes

6. **Permissions & Navigation**
   - [x] Check ability to manage video resources (not posts)
   - [x] Add appropriate error handling for unauthorized access
   - [x] Consider adding a link back to video management or wherever users come from

7. **Testing & Cleanup**
   - [x] Test with a real video resource ID
   - [x] Verify transcript loads, edits save correctly
   - [x] Check that word merging, replace-all functionality works
   - [x] Ensure no console errors or missing dependencies

## Implementation Summary

✅ **Route Created**: `/videos/[id]` route successfully implemented
✅ **Module Structure**: Self-contained `transcript-editor` module with all utilities
✅ **UI Components**: Word editor, transcript editor, and page components
✅ **Data Flow**: Server component fetches → transforms → validates → renders client component
✅ **TypeScript**: All components properly typed with no compilation errors

## Usage

Navigate to `/videos/{videoResourceId}` where `{videoResourceId}` is a valid video resource ID that has an associated raw transcript in the database.

## Notes

- All files use kebab-case naming convention
- No barrel files (index.ts) - import directly from each file
- The transcript editor module is self-contained with minimal external dependencies
- Consider future enhancement: ability to create new transcript if none exists
