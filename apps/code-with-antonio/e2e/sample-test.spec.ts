import { expect, test } from '@playwright/test'

test('home page shows main heading and subscribe button', async ({ page }) => {
	await page.goto('/')

	await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible()
})
