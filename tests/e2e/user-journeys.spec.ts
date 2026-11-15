import { expect, test, type Page } from '@playwright/test'

/**
 * Seven of the platform's most critical user journeys, run against the
 * mock-data path (no Supabase project configured in this environment — same
 * path tests/e2e/landing.spec.ts already exercises). Each test performs
 * every navigation by clicking real in-app links/buttons rather than
 * `page.goto()` after the initial load: this app's mock-mode auth state
 * lives only in memory (no localStorage persistence, unlike a real Supabase
 * session), so a hard navigation would silently drop the logged-in guest
 * session and the test would start failing for the wrong reason.
 *
 * Not covered here: the guest recovery-token dialog shown after publishing
 * (src/pages/dashboard/StoryEditorPage.tsx) only appears on the real-Supabase
 * code path — the mock-mode submit branch returns before reaching it, so
 * there is nothing to click in this environment. The real-Supabase path for
 * that dialog is still exercised indirectly by tests/db/run.mjs's
 * issue_guest_token/claim_guest_story assertions.
 */

async function loginAsGuestOnLandingPage(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continue as Guest' }).click()
  await page.waitForURL('**/')
}

test('1. anonymous visitor browses stories, reacts, and comments', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Explore Stories' }).first().click()
  await expect(page).toHaveURL(/\/explore/)
  await expect(page.getByRole('heading', { name: 'Explore Stories' })).toBeVisible()

  await page.goto('/stories/story-1')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const reactionButton = page.getByRole('button', { name: /^I understand/ })
  const before = await reactionButton.textContent()
  await reactionButton.click()
  await expect(reactionButton).not.toHaveText(before ?? '')

  await page.getByPlaceholder('Share a supportive comment…').fill('Sending you strength today.')
  await page.getByRole('button', { name: 'Post Comment' }).click()
  await expect(page.getByText('Sending you strength today.')).toBeVisible()
})

test('2. a guest publishes a story anonymously', async ({ page }) => {
  await loginAsGuestOnLandingPage(page)
  await page.getByRole('link', { name: 'Share Your Story' }).first().click()
  await expect(page).toHaveURL(/\/dashboard\/stories\/new/)

  await page.locator('#title').fill('Finding my footing again')
  await page.locator('#category').click()
  await page.getByRole('option', { name: 'Relationships & Marriage' }).click()
  await page.locator('#content').fill('A '.repeat(30))
  await page.getByRole('checkbox', { name: /I agree to follow the Community Guidelines/ }).check()

  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page).toHaveURL(/\/dashboard\/stories$/)
})

test('3. a new user registers an account', async ({ page }) => {
  await page.goto('/register')
  await page.locator('#email').fill(`newuser-${Date.now()}@example.com`)
  await page.locator('#password').fill('SecurePass123')
  await page.locator('#confirmPassword').fill('SecurePass123')
  await page.getByRole('checkbox', { name: /I agree to the Terms/ }).check()
  await page.getByRole('button', { name: 'Create Account' }).click()
  await page.waitForURL('**/dashboard')
})

test('4. a guest uses the personal recovery tools (journal, mood, goals)', async ({ page }) => {
  await loginAsGuestOnLandingPage(page)
  await page.getByRole('link', { name: 'Dashboard' }).first().click()
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.getByRole('link', { name: 'Private Journal' }).click()
  await page.getByRole('button', { name: 'New Entry' }).click()
  await page.locator('#journal-title').fill('A hard but hopeful day')
  await page.locator('#journal-content').fill('Today I took one small step forward.')
  await page.getByRole('button', { name: 'Save Entry' }).click()
  await expect(page.getByText('A hard but hopeful day')).toBeVisible()

  await page.getByRole('link', { name: 'Mood Tracker' }).click()
  await page.getByRole('button', { name: 'Very good', exact: false }).click()

  await page.getByRole('link', { name: 'Recovery Goals' }).click()
  await page.getByRole('button', { name: 'New Goal' }).click()
  await page.locator('#goal-title').fill('Journal three times a week')
  await page.getByRole('button', { name: 'Create Goal' }).click()
  await expect(page.getByText('Journal three times a week')).toBeVisible()
})

test('5. a guest accepts a message request and sends a private message', async ({ page }) => {
  await loginAsGuestOnLandingPage(page)
  await page.getByRole('link', { name: 'Dashboard' }).first().click()
  await page.getByRole('link', { name: 'Conversations' }).click()
  await expect(page).toHaveURL(/\/dashboard\/messages$/)

  await page.getByRole('tab', { name: /Requests/ }).click()
  await page.getByRole('button', { name: 'Accept' }).first().click()

  await page.getByRole('tab', { name: /Active/ }).click()
  await page.locator('a[href^="/dashboard/messages/"]').first().click()
  await page.getByPlaceholder('Write a message…').fill('Thank you for listening.')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Thank you for listening.')).toBeVisible()
})

test('6. a guest joins a community group and posts in its chat', async ({ page }) => {
  await loginAsGuestOnLandingPage(page)
  await page.getByRole('link', { name: 'Groups' }).first().click()
  await expect(page).toHaveURL(/\/groups$/)

  await page.getByRole('link', { name: 'Learn More' }).first().click()
  await expect(page).toHaveURL(/\/groups\/group-/)
  await page.getByRole('button', { name: 'Join Group' }).click()

  await page.getByRole('link', { name: 'Open Group Chat' }).click()
  await expect(page).toHaveURL(/\/dashboard\/groups\/.+\/chat/)
  await page.getByPlaceholder('Message the group…').fill('Glad to be here, everyone.')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('Glad to be here, everyone.')).toBeVisible()
})

test('7. a guest starts a call from a conversation, connects, and ends it', async ({ page }) => {
  await loginAsGuestOnLandingPage(page)
  await page.getByRole('link', { name: 'Dashboard' }).first().click()
  await page.getByRole('link', { name: 'Conversations' }).click()
  await page.locator('a[href^="/dashboard/messages/"]').first().click()

  await page.getByRole('button', { name: 'Start voice call' }).click()
  await expect(page).toHaveURL(/\/dashboard\/call\//)

  await page.getByRole('button', { name: 'Simulate Accept' }).click()
  await expect(page.getByRole('button', { name: /Mute microphone|Unmute microphone/ })).toBeVisible()

  await page.getByRole('button', { name: 'End call' }).click()
  await expect(page.getByRole('heading', { name: 'Call ended' })).toBeVisible()

  await page.getByRole('button', { name: 'Back to Conversations' }).click()
  await expect(page).toHaveURL(/\/dashboard\/messages$/)
})
