import { expect, test } from '@playwright/test'

test('landing page loads and links to explore stories', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Your Story Matters/i })).toBeVisible()
  await page.getByRole('link', { name: 'Explore Stories' }).first().click()
  await expect(page).toHaveURL(/\/explore/)
  await expect(page.getByRole('heading', { name: 'Explore Stories' })).toBeVisible()
})
