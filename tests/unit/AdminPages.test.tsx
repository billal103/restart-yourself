import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AuditLogsPage from '@/pages/admin/AuditLogsPage'
import CallReportsPage from '@/pages/admin/CallReportsPage'
import CategoryManagementPage from '@/pages/admin/CategoryManagementPage'
import CommentModerationPage from '@/pages/admin/CommentModerationPage'
import MessageReportsPage from '@/pages/admin/MessageReportsPage'
import StoryModerationPage from '@/pages/admin/StoryModerationPage'
import UserManagementPage from '@/pages/admin/UserManagementPage'
import { useAuthStore } from '@/stores/authStore'
import type { CurrentUser } from '@/types/domain'

// These render the admin pages directly in mock mode (no Supabase configured
// in the test env), bypassing AdminLayout's route guard — the guard itself is
// a one-line role check already covered by reading it; these tests instead
// prove the pages that guard protects actually render and respond to clicks
// without crashing, which `tsc` and `oxlint` cannot check.

const adminUser: CurrentUser = {
  id: 'admin-1',
  anonymousDisplayName: 'AdminAnon',
  email: 'admin@example.com',
  role: 'super_admin',
  isGuest: false,
  joinedAt: new Date().toISOString(),
}

const moderatorUser: CurrentUser = { ...adminUser, id: 'mod-1', role: 'content_moderator' }

function renderWithRouter(node: React.ReactElement) {
  return render(<MemoryRouter>{node}</MemoryRouter>)
}

afterEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false })
})

describe('AdminDashboardPage', () => {
  it('renders demo stats and recent activity', () => {
    renderWithRouter(<AdminDashboardPage />)
    expect(screen.getByText('Admin Overview')).toBeInTheDocument()
    expect(screen.getByText('Registered Users')).toBeInTheDocument()
    expect(screen.getByText('Recent Moderation Activity')).toBeInTheDocument()
  })
})

describe('StoryModerationPage', () => {
  it('approving a pending story moves it out of the pending queue', () => {
    renderWithRouter(<StoryModerationPage />)
    const approveButtons = screen.getAllByRole('button', { name: 'Approve' })
    expect(approveButtons.length).toBeGreaterThan(0)
    const countBefore = approveButtons.length
    fireEvent.click(approveButtons[0]!)
    const approveButtonsAfter = screen.queryAllByRole('button', { name: 'Approve' })
    expect(approveButtonsAfter.length).toBe(countBefore - 1)
  })
})

describe('CommentModerationPage', () => {
  it('removing a reported comment clears it from the list', () => {
    renderWithRouter(<CommentModerationPage />)
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' })
    expect(removeButtons.length).toBeGreaterThan(0)
    const countBefore = removeButtons.length
    fireEvent.click(removeButtons[0]!)
    const removeButtonsAfter = screen.queryAllByRole('button', { name: 'Remove' })
    expect(removeButtonsAfter.length).toBe(countBefore - 1)
  })
})

describe('MessageReportsPage', () => {
  it('resolving an open report marks it resolved', () => {
    renderWithRouter(<MessageReportsPage />)
    const resolveButtons = screen.getAllByRole('button', { name: 'Mark Resolved' })
    fireEvent.click(resolveButtons[0]!)
    expect(screen.getAllByText('resolved').length).toBeGreaterThan(0)
  })
})

describe('CallReportsPage', () => {
  it('renders the call report and can resolve it', () => {
    renderWithRouter(<CallReportsPage />)
    expect(screen.getByText(/Repeated unsolicited call attempts/)).toBeInTheDocument()
    const resolveButton = screen.getByRole('button', { name: 'Mark Resolved' })
    fireEvent.click(resolveButton)
    expect(screen.getByText('resolved')).toBeInTheDocument()
  })
})

describe('AuditLogsPage', () => {
  it('renders the audit log table', () => {
    renderWithRouter(<AuditLogsPage />)
    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
    expect(screen.getByText('Removed story')).toBeInTheDocument()
  })
})

describe('UserManagementPage', () => {
  it('disables Manage for a non-admin moderator', () => {
    useAuthStore.setState({ user: moderatorUser, isAuthenticated: true })
    renderWithRouter(<UserManagementPage />)
    const manageButtons = screen.getAllByRole('button', { name: 'Manage' })
    expect(manageButtons[0]).toBeDisabled()
  })

  it('lets an admin open the manage dialog and see role/status controls', () => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true })
    renderWithRouter(<UserManagementPage />)
    const manageButtons = screen.getAllByRole('button', { name: 'Manage' })
    expect(manageButtons[0]).not.toBeDisabled()
    fireEvent.click(manageButtons[0]!)
    expect(screen.getByText('Account status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Status' })).toBeInTheDocument()
  })
})

describe('CategoryManagementPage', () => {
  it('disables category creation for a non-admin moderator', () => {
    useAuthStore.setState({ user: moderatorUser, isAuthenticated: true })
    renderWithRouter(<CategoryManagementPage />)
    expect(screen.getByRole('button', { name: /New Category/ })).toBeDisabled()
  })

  it('lets an admin open the new-category dialog', () => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true })
    renderWithRouter(<CategoryManagementPage />)
    const newCategoryButton = screen.getByRole('button', { name: /New Category/ })
    expect(newCategoryButton).not.toBeDisabled()
    fireEvent.click(newCategoryButton)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('New Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })
})
