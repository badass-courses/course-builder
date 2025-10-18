# Plan: Convert OG Image Route to Dynamic Route

**Date:** 2025-10-16  
**Status:** Planning  
**Goal:** Convert `/api/og` route from query parameter-based to dynamic route
pattern

## Current State Analysis

### 1. Current Implementation

**Route:** `/src/app/api/og/route.tsx`

- **Current URL Pattern:** `/api/og?resource=[SLUG_OR_ID]&title=TITLE&image=URL`
- **Query Parameters:**
  - `resource` - Slug or ID of the resource
  - `title` - Custom title (fallback)
  - `image` - Custom image URL (optional)
  - `updatedAt` - Cache busting parameter (added by utility)

**Key Features:**

- Fetches resource from database by slug or ID
- Supports multiple resource types: post, list, event, workshop, tutorial,
  self-paced
- Fetches instructor information
- Generates lesson count for courses
- Handles Mux video thumbnails
- Includes CORS headers for cross-origin requests
- Edge runtime with 60s revalidation

### 2. Current Usage Locations

**Direct API Route Usage:**

1. **Homepage** (`src/app/page.tsx:14`)
   - Uses custom title:
     `/api/og?title=${encodeURIComponent('egghead Post Builder...')}`

**Utility Functions:**

1. **`getOGImageUrlForResourceAPI`**
   (`src/utils/get-og-image-url-for-resource.ts:30-36`)

   - Generates: `/api/og?resource=${slug}&updatedAt=${timestamp}`
   - Used in:
     - Post page metadata (`src/app/(content)/[post]/page.tsx:39-45`)
     - Post metadata form
       (`src/app/(content)/posts/_components/metadata-field-social-image.tsx:42-48`)

2. **`getOGImageUrlForResource`**
   (`src/utils/get-og-image-url-for-resource.ts:16-24`)
   - Uses path-based approach for dedicated opengraph-image.tsx files
   - Used in:
     - Prompts page (`src/app/(content)/prompts/[slug]/page.tsx:32`)
     - Admin events form
       (`src/app/admin/events/[slug]/edit/_components/edit-event-form.tsx:19`)

**Existing OpenGraph Image Files (Path-based):**

1. `src/app/(content)/[post]/opengraph-image.tsx` - Posts
2. `src/app/(content)/posts/[slug]/opengraph-image.tsx` - Posts (alternate path)
3. `src/app/(content)/prompts/[slug]/opengraph-image.tsx` - Prompts

### 3. External Dependencies

**Package:** `@coursebuilder/utils-seo/og-image`

- `getOGImageUrlForResource` - Generates query param URLs
- `getOGImageUrlForContentResource` - Generates path-based URLs

## Proposed Solution

### Option A: Simple Dynamic Route (Recommended)

**New Route:** `/api/og/[slug]/route.tsx`

**URL Pattern:** `/api/og/[slug]?updatedAt=...`

**Pros:**

- Clean, RESTful URLs
- Better SEO and caching
- Easier to understand and debug
- Maintains updatedAt query param for cache busting
- Backward compatible with additional query params if needed

**Cons:**

- Requires updating all usage locations
- Custom title/image cases need special handling

### Option B: Catch-all Dynamic Route

**New Route:** `/api/og/[...params]/route.tsx`

**URL Patterns:**

- `/api/og/[slug]` - Resource by slug
- `/api/og/custom/[title]` - Custom title
- `/api/og/image/[url]` - Custom image

**Pros:**

- More flexible routing options
- Can support multiple URL patterns
- Better organization for different use cases

**Cons:**

- More complex implementation
- Requires parsing params array
- May be over-engineered for current needs

### Option C: Hybrid Approach

Keep the API route but also support dynamic routes:

- `/api/og?resource=...` (legacy)
- `/api/og/[slug]` (new)

**Pros:**

- Backward compatible
- Gradual migration path

**Cons:**

- Maintains technical debt
- More complex codebase

## Recommended Approach: Option A

### Implementation Plan

#### Phase 1: Create New Dynamic Route Structure

1. **Create new route file:**

   ```
   /src/app/api/og/[slug]/route.tsx
   ```

2. **Route handler signature:**

   ```typescript
   export async function GET(
   	request: Request,
   	{ params }: { params: { slug: string } },
   )
   ```

3. **Handle special cases:**
   - Custom titles: Create `/api/og/custom/[title]/route.tsx` OR use query param
   - Homepage: Could use `/api/og/home` or keep query param
   - Custom images: Use query params `?image=...`

#### Phase 2: Update Utility Functions

1. **Update `@coursebuilder/utils-seo/og-image.ts`:**

   ```typescript
   export function getOGImageUrlForResource(
   	resource: {
   		fields?: { slug: string }
   		id: string
   		updatedAt?: Date | string | null
   	},
   	baseUrl: string,
   ): string {
   	const slug = resource?.fields?.slug || resource.id
   	const updatedAt =
   		typeof resource.updatedAt === 'string'
   			? resource.updatedAt
   			: resource.updatedAt?.toISOString()

   	return `${baseUrl}/api/og/${encodeURIComponent(slug)}${
   		updatedAt ? `?updatedAt=${encodeURIComponent(updatedAt)}` : ''
   	}`
   }
   ```

2. **Update local wrapper** (`src/utils/get-og-image-url-for-resource.ts`):
   - Keep same interface
   - May need to add local override if package update isn't desired

#### Phase 3: Update All Usage Locations

1. **Homepage** (`src/app/page.tsx`):

   ```typescript
   // Option 1: Keep query param for custom title
   url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent('...')}`

   // Option 2: Create special route
   url: `${env.NEXT_PUBLIC_URL}/api/og/home`
   ```

2. **Post pages** - No changes needed (uses utility function)

3. **Prompt pages** - No changes needed (uses utility function)

4. **Admin forms** - No changes needed (uses utility function)

#### Phase 4: Testing & Migration

1. **Test cases:**

   - Resource by slug
   - Resource by ID
   - Custom title
   - Custom image
   - Cache busting with updatedAt
   - CORS headers
   - Error cases (missing resource)

2. **Backward compatibility:**
   - Consider keeping old route temporarily
   - Add redirect from old to new
   - Monitor logs for old URL usage

#### Phase 5: Cleanup

1. Remove old `/api/og/route.tsx` (if backward compat not needed)
2. Update documentation
3. Update any external references

## Alternative: Enhanced Route Structure

```
/api/og/
  ├── [slug]/
  │   └── route.tsx          # Main resource handler
  ├── custom/
  │   └── [title]/
  │       └── route.tsx      # Custom title handler
  └── route.tsx              # Fallback/redirect to new routes
```

## Files to Modify

### Core Files (Required)

1. ✅ `/src/app/api/og/[slug]/route.tsx` - NEW: Dynamic route handler
2. ✅ `/src/app/api/og/route.tsx` - UPDATE or DELETE: Handle legacy/fallback

### Utility Files

3. ✅ `/packages/utils-seo/src/og-image.ts` - UPDATE: Change URL generation
4. ✅ `/src/utils/get-og-image-url-for-resource.ts` - UPDATE: May need local
   override

### Usage Files

5. ✅ `/src/app/page.tsx` - UPDATE: Homepage OG image
6. ⚠️ `/src/app/(content)/[post]/page.tsx` - VERIFY: Uses utility (should
   auto-update)
7. ⚠️ `/src/app/(content)/prompts/[slug]/page.tsx` - VERIFY: Uses utility
   (should auto-update)
8. ⚠️ `/src/app/(content)/posts/_components/metadata-field-social-image.tsx` -
   VERIFY
9. ⚠️ `/src/app/admin/events/[slug]/edit/_components/edit-event-form.tsx` -
   VERIFY

### Test Files

10. ✅ `/packages/utils-seo/src/og-image.test.ts` - UPDATE: Tests for new URL
    format

## URL Migration Examples

### Before (Current)

```
/api/og?resource=my-post-slug
/api/og?resource=my-post-slug&updatedAt=2025-10-16T...
/api/og?title=Custom+Title
/api/og?resource=abc-123&image=https://...
```

### After (Proposed)

```
/api/og/my-post-slug
/api/og/my-post-slug?updatedAt=2025-10-16T...
/api/og?title=Custom+Title              (keep as query param OR)
/api/og/custom/Custom+Title             (new route)
/api/og/abc-123?image=https://...
```

## Benefits of Migration

1. **SEO Improvements:**

   - Cleaner, more semantic URLs
   - Better link sharing
   - Improved cache key structure

2. **Developer Experience:**

   - More intuitive API
   - Easier debugging
   - RESTful patterns

3. **Performance:**

   - Better CDN caching potential
   - Clearer cache invalidation

4. **Maintainability:**
   - Easier to understand codebase
   - Better alignment with Next.js patterns
   - Reduced URL encoding issues

## Risks & Mitigations

### Risk 1: Breaking Changes

**Impact:** External links, cached OG images  
**Mitigation:**

- Keep legacy route with redirect
- Phased rollout
- Update social media caches

### Risk 2: Query Param Dependencies

**Impact:** Custom title/image functionality  
**Mitigation:**

- Keep query params for special cases
- Document mixed approach
- Consider separate routes for custom cases

### Risk 3: Monorepo Package Updates

**Impact:** Other apps using `@coursebuilder/utils-seo`  
**Mitigation:**

- Add version flag or separate function
- Update all apps simultaneously
- Maintain backward compatibility in package

## Timeline Estimate

- **Phase 1 - Create Route:** 2-4 hours
- **Phase 2 - Update Utilities:** 2-3 hours
- **Phase 3 - Update Usage:** 1-2 hours
- **Phase 4 - Testing:** 3-4 hours
- **Phase 5 - Cleanup:** 1 hour

**Total:** 9-14 hours

## Open Questions

1. Should we maintain backward compatibility with query param approach?
2. How to handle custom title case - separate route or query param?
3. Should this change be made in the shared package or just locally?
4. Do we need a migration period with both routes active?
5. Are there any external systems linking to these OG images?

## Next Steps

1. **Decision:** Choose between Option A, B, or C
2. **Package Strategy:** Decide if this should update shared package or stay
   local
3. **Custom Cases:** Decide how to handle custom title/image scenarios
4. **Testing Plan:** Create comprehensive test suite
5. **Rollout Plan:** Determine if gradual or full migration
6. **Implementation:** Begin with Phase 1

## Notes

- The existing path-based opengraph-image.tsx files can remain unchanged
- CORS headers must be maintained for external embedding
- Edge runtime and revalidation settings should be preserved
- Consider adding OpenAPI/TypeDoc documentation for new route
