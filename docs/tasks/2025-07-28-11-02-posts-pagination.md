# Task: Implement Pagination for Posts Page with Search and Filter Support

## Commit 1: feat(egh): add pagination support to posts query functions [docs/tasks/2025-07-28-11-02-posts-pagination.md]
**Description:**
Update the posts query functions to support pagination parameters. This commit will modify the `getAllMinimalPosts` and `getAllMinimalPostsForUser` functions in `/apps/egghead/src/lib/posts/read.ts` to accept limit and offset parameters. The functions will use Drizzle ORM's `.limit()` and `.offset()` methods to implement database-level pagination. Additionally, we'll create new functions `countAllMinimalPosts` and `countAllMinimalPostsForUser` to get total post counts for pagination calculations. The logger configuration will be checked in `/apps/egghead/src/lib/utils/logger.ts` (or created if it doesn't exist).

**Verification:**
1. **Automated Test(s):**
   * **Command:** `cd apps/egghead && pnpm test src/lib/posts/__tests__/read.test.ts`
   * **Expected Outcome:** Tests assert that getAllMinimalPosts with limit=10 and offset=0 returns exactly 10 posts (when more than 10 exist), and that countAllMinimalPosts returns the correct total count
2. **Logging Check:**
   * **Action:** Call getAllMinimalPosts with pagination params through the API
   * **Expected Log:** `INFO: Fetching posts with pagination - limit: 50, offset: 0, search: null, postType: null`
   * **Toggle Mechanism:** `LOG_LEVEL=info` environment variable

---

## Commit 2: feat(egh): add pagination URL params handling to posts page [docs/tasks/2025-07-28-11-02-posts-pagination.md]
**Description:**
Update the posts page component at `/apps/egghead/src/app/(content)/posts/page.tsx` to handle pagination URL search parameters (`page` and `pageSize`). Add default values of `page=1` and `pageSize=50` with support for 100 and 250 options. Calculate the appropriate offset based on page number and pass these parameters to the PostList component. Update the PostList component props interface in `/apps/egghead/src/app/(content)/posts/_components/post-list.tsx` to accept the new pagination parameters. Also update the re-export in `/apps/egghead/src/lib/posts-query.ts` to include the new count functions.

**Verification:**
1. **Automated Test(s):**
   * **Command:** `cd apps/egghead && pnpm test src/app/(content)/posts/__tests__/page.test.tsx`
   * **Expected Outcome:** Tests verify that URL params ?page=2&pageSize=50 correctly pass offset=50 and limit=50 to PostList component
2. **Logging Check:**
   * **Action:** Navigate to /posts?page=2&pageSize=100
   * **Expected Log:** `INFO: Posts page loaded - page: 2, pageSize: 100, calculated offset: 100`
   * **Toggle Mechanism:** `LOG_LEVEL=info` environment variable

---

## Commit 3: feat(egh): create pagination controls component with search param integration [docs/tasks/2025-07-28-11-02-posts-pagination.md]
**Description:**
Create a new `PostsPagination` component at `/apps/egghead/src/app/(content)/posts/_components/posts-pagination.tsx` that uses the shared UI pagination primitives from `@coursebuilder/ui`. This component will handle page navigation while preserving existing search and filter parameters. It will calculate the total number of pages based on total posts count and page size, display page numbers with ellipsis for large page counts, and update URL search params when navigating. The component will also include a page size selector dropdown with options for 50, 100, and 250 items per page.

**Verification:**
1. **Automated Test(s):**
   * **Command:** `cd apps/egghead && pnpm test src/app/(content)/posts/_components/__tests__/posts-pagination.test.tsx`
   * **Expected Outcome:** Tests verify that clicking "Next" with current page=1 updates URL to page=2 while preserving search and postType params
2. **Logging Check:**
   * **Action:** Click on page navigation controls
   * **Expected Log:** `INFO: Pagination navigation - from page: 1 to page: 2, pageSize: 50`
   * **Toggle Mechanism:** `LOG_LEVEL=info` environment variable

---

## Commit 4: feat(egh): integrate pagination into PostList with loading states [docs/tasks/2025-07-28-11-02-posts-pagination.md]
**Description:**
Update the `PostList` component at `/apps/egghead/src/app/(content)/posts/_components/post-list.tsx` to fetch paginated data using the updated query functions. Add the total post count fetch in parallel with the posts data fetch. Integrate the new `PostsPagination` component at the bottom of the post list. Add proper loading and empty states for pagination. Update the component to show "Showing X-Y of Z posts" information. Ensure the pagination controls are hidden when there's only one page of results.

**Verification:**
1. **Automated Test(s):**
   * **Command:** `cd apps/egghead && pnpm test src/app/(content)/posts/_components/__tests__/post-list.test.tsx`
   * **Expected Outcome:** Integration test verifies that PostList renders pagination controls when total posts > pageSize and hides them when total posts <= pageSize
2. **Logging Check:**
   * **Action:** Load posts page with more than 50 posts in database
   * **Expected Log:** `INFO: PostList rendered - showing posts 1-50 of 142 total, pages: 3`
   * **Toggle Mechanism:** `LOG_LEVEL=info` environment variable

---

## Commit 5: test(egh): add comprehensive E2E tests for posts pagination feature [docs/tasks/2025-07-28-11-02-posts-pagination.md]
**Description:**
Create end-to-end tests at `/apps/egghead/tests/e2e/posts-pagination.spec.ts` to verify the complete pagination feature. Tests will cover: navigation between pages maintains search/filter state, page size changes reset to page 1, direct URL navigation with page params works correctly, pagination controls are properly disabled at boundaries (first/last page), and the feature works correctly for both authenticated and unauthenticated users. Add test utilities to seed the database with a sufficient number of test posts (at least 150) to properly test pagination.

**Verification:**
1. **Automated Test(s):**
   * **Command:** `cd apps/egghead && pnpm test:e2e tests/e2e/posts-pagination.spec.ts`
   * **Expected Outcome:** All E2E tests pass, verifying pagination works with search, filters, and direct URL navigation
2. **Logging Check:**
   * **Action:** Run the E2E test suite
   * **Expected Log:** `INFO: E2E test - posts pagination - all scenarios passed (navigation, filters, boundaries)`
   * **Toggle Mechanism:** `TEST_LOG_LEVEL=info` environment variable