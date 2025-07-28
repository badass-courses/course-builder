import { expect, test } from '@playwright/test'

// Helper to seed test posts
async function seedTestPosts(page: any, count: number) {
	// This would typically be done through a test API or database seeding
	// For now, we'll use a placeholder approach
	console.log(`Seeding ${count} test posts`)
}

test.describe('Posts Pagination', () => {
	test.beforeEach(async ({ page }) => {
		// Seed database with test posts
		await seedTestPosts(page, 150)

		// Navigate to posts page
		await page.goto('/posts')
	})

	test('should navigate between pages maintaining search and filter state', async ({
		page,
	}) => {
		// Apply search filter
		await page.fill('[placeholder="Search posts..."]', 'typescript')
		await page.waitForTimeout(300) // Wait for debounce

		// Apply post type filter
		await page.selectOption('[name="postType"]', 'lesson')

		// Verify URL has search params
		await expect(page).toHaveURL(/search=typescript/)
		await expect(page).toHaveURL(/postType=lesson/)

		// Navigate to page 2
		await page.click('text=Next')

		// Verify URL maintains search params and adds page
		await expect(page).toHaveURL(/search=typescript/)
		await expect(page).toHaveURL(/postType=lesson/)
		await expect(page).toHaveURL(/page=2/)

		// Verify pagination state
		await expect(page.locator('[aria-current="page"]')).toContainText('2')
	})

	test('should reset to page 1 when changing page size', async ({ page }) => {
		// Navigate to page 3
		await page.click('text=3')
		await expect(page).toHaveURL(/page=3/)

		// Change page size
		await page.click('button:has-text("50")')
		await page.click('text=100')

		// Verify URL resets to page 1 with new page size
		await expect(page).not.toHaveURL(/page=/)
		await expect(page).toHaveURL(/pageSize=100/)

		// Verify showing correct number of posts
		await expect(page.locator('text=/Showing 1-100 of/')).toBeVisible()
	})

	test('should navigate directly via URL parameters', async ({ page }) => {
		// Navigate directly to page 2 with custom page size
		await page.goto('/posts?page=2&pageSize=100')

		// Verify pagination reflects URL state
		await expect(page.locator('[aria-current="page"]')).toContainText('2')
		await expect(page.locator('button:has-text("100")')).toBeVisible()
		await expect(page.locator('text=/Showing 101-200 of/')).toBeVisible()
	})

	test('should disable navigation controls at boundaries', async ({ page }) => {
		// On first page, Previous should be disabled
		await expect(page.locator('a:has-text("Previous")')).toHaveClass(
			/pointer-events-none/,
		)
		await expect(page.locator('a:has-text("Previous")')).toHaveClass(
			/opacity-50/,
		)

		// Navigate to last page
		const lastPageButton = page.locator('a[href="#"]').last()
		await lastPageButton.click()

		// On last page, Next should be disabled
		await expect(page.locator('a:has-text("Next")')).toHaveClass(
			/pointer-events-none/,
		)
		await expect(page.locator('a:has-text("Next")')).toHaveClass(/opacity-50/)
	})

	test('should work correctly for authenticated users with limited posts', async ({
		page,
	}) => {
		// Login as user with limited posts
		await page.goto('/login')
		await page.fill('[name="email"]', 'testuser@example.com')
		await page.fill('[name="password"]', 'password')
		await page.click('button[type="submit"]')

		// Navigate to posts
		await page.goto('/posts')

		// Toggle to "My Posts" view
		await page.click('text=My Posts')

		// Verify pagination works with user's posts
		await expect(page.locator('text=/Showing 1-50 of/')).toBeVisible()

		// Navigate pages
		await page.click('text=Next')
		await expect(page).toHaveURL(/page=2/)
	})

	test('should show appropriate empty state on invalid page', async ({
		page,
	}) => {
		// Navigate to a page beyond available posts
		await page.goto('/posts?page=999')

		// Should show empty state message
		await expect(page.locator('text=No posts found on page 999')).toBeVisible()

		// Pagination should still be visible to navigate back
		await expect(page.locator('text=Previous')).toBeVisible()
	})

	test('should handle concurrent search and pagination', async ({ page }) => {
		// Start on page 2
		await page.click('text=2')

		// Type in search while on page 2
		await page.fill('[placeholder="Search posts..."]', 'react')
		await page.waitForTimeout(300) // Wait for debounce

		// Should reset to page 1 with search
		await expect(page).not.toHaveURL(/page=/)
		await expect(page).toHaveURL(/search=react/)

		// Verify results show search term
		await expect(page.locator('h3').first()).toContainText(/react/i)
	})

	test('should log pagination events', async ({ page }) => {
		// Enable console logging
		const consoleLogs: string[] = []
		page.on('console', (msg) => {
			if (msg.type() === 'info') {
				consoleLogs.push(msg.text())
			}
		})

		// Navigate to page 2
		await page.click('text=2')

		// Verify logging occurred
		const paginationLog = consoleLogs.find(
			(log) =>
				log.includes('Pagination navigation') &&
				log.includes('fromPage: 1') &&
				log.includes('toPage: 2'),
		)
		expect(paginationLog).toBeTruthy()
	})
})

test.describe('Pagination Accessibility', () => {
	test('should have proper ARIA labels and navigation', async ({ page }) => {
		await page.goto('/posts')

		// Check navigation landmark
		await expect(page.locator('nav[aria-label="pagination"]')).toBeVisible()

		// Check current page indication
		await expect(page.locator('[aria-current="page"]')).toHaveText('1')

		// Check navigation links
		await expect(
			page.locator('a[aria-label="Go to previous page"]'),
		).toBeVisible()
		await expect(page.locator('a[aria-label="Go to next page"]')).toBeVisible()

		// Navigate with keyboard
		await page.keyboard.press('Tab') // Focus pagination
		await page.keyboard.press('Tab') // Focus next button
		await page.keyboard.press('Enter') // Activate

		// Verify navigation worked
		await expect(page).toHaveURL(/page=2/)
	})
})
