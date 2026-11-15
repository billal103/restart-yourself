import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { generateAnonymousName } from '@/lib/mockData'
import { isAdmin } from '@/lib/rbac'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { AccountStatus, AdminUserRow, UserRole } from '@/types/domain'

const roleLabels: Record<UserRole, string> = {
  guest: 'Guest',
  registered: 'Registered',
  supporter: 'Community Supporter',
  group_moderator: 'Group Moderator',
  content_moderator: 'Content Moderator',
  verified_professional: 'Verified Professional',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

const grantableRoles: Exclude<UserRole, 'guest'>[] = [
  'registered',
  'supporter',
  'group_moderator',
  'content_moderator',
  'verified_professional',
  'admin',
  'super_admin',
]

function buildMockUsers(): AdminUserRow[] {
  return Array.from({ length: 10 }).map((_, i) => {
    const role = (['registered', 'registered', 'supporter', 'group_moderator', 'content_moderator'] as const)[i % 5] ?? 'registered'
    return {
      id: `admin-user-${i + 1}`,
      displayName: generateAnonymousName(i + 50),
      email: i % 3 === 0 ? null : `member${i + 1}@example.com`,
      role,
      roles: [role],
      status: i === 3 ? 'restricted' : i === 7 ? 'suspended' : 'active',
      joinedAt: new Date(Date.now() - i * 20 * 24 * 60 * 60 * 1000).toISOString(),
    }
  })
}

export default function UserManagementPage() {
  const currentUser = useAuthStore((state) => state.user)
  const canManage = isAdmin(currentUser)
  const [users, setUsers] = useState<AdminUserRow[]>(isSupabaseConfigured ? [] : buildMockUsers())
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [target, setTarget] = useState<AdminUserRow | null>(null)
  const [statusDraft, setStatusDraft] = useState<AccountStatus>('active')
  const [notesDraft, setNotesDraft] = useState('')
  const [roleToAdd, setRoleToAdd] = useState<Exclude<UserRole, 'guest'>>('supporter')

  async function load() {
    if (!isSupabaseConfigured) return
    const { moderationService } = await import('@/services/moderation.service')
    setUsers(await moderationService.listUsers())
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  function openManage(user: AdminUserRow) {
    setTarget(user)
    setStatusDraft(user.status)
    setNotesDraft('')
  }

  async function changeStatus() {
    if (!target) return
    if (isSupabaseConfigured) {
      try {
        const { moderationService } = await import('@/services/moderation.service')
        await moderationService.setUserStatus(target.id, statusDraft, notesDraft || null)
        await load()
      } catch (error) {
        toast({ title: 'Could not update status', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
        return
      }
    } else {
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, status: statusDraft } : u)))
    }
    toast({ title: 'Account status updated', variant: 'success' })
    setTarget((prev) => (prev ? { ...prev, status: statusDraft } : prev))
  }

  async function addRole() {
    if (!target) return
    if (isSupabaseConfigured) {
      try {
        const { moderationService } = await import('@/services/moderation.service')
        await moderationService.setUserRole(target.id, roleToAdd, true)
        await load()
      } catch (error) {
        toast({ title: 'Could not grant role', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
        return
      }
    } else {
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, roles: [...new Set([...u.roles, roleToAdd])] } : u)))
    }
    toast({ title: `Granted ${roleLabels[roleToAdd]}`, variant: 'success' })
    setTarget((prev) => (prev ? { ...prev, roles: [...new Set([...prev.roles, roleToAdd])] } : prev))
  }

  async function revokeRole(role: Exclude<UserRole, 'guest'>) {
    if (!target) return
    if (isSupabaseConfigured) {
      try {
        const { moderationService } = await import('@/services/moderation.service')
        await moderationService.setUserRole(target.id, role, false)
        await load()
      } catch (error) {
        toast({ title: 'Could not revoke role', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
        return
      }
    } else {
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, roles: u.roles.filter((r) => r !== role) } : u)))
    }
    toast({ title: `Revoked ${roleLabels[role]}` })
    setTarget((prev) => (prev ? { ...prev, roles: prev.roles.filter((r) => r !== role) } : prev))
  }

  const filtered = users.filter((user) => {
    const matchesQuery = user.displayName.toLowerCase().includes(query.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesQuery && matchesRole
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
      {!canManage && (
        <p className="text-sm text-text-muted">
          You can view members here, but granting roles and changing account status is admin-only
          — enforced server-side by Row Level Security, not just hidden in this UI.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by display name…"
          className="sm:max-w-xs"
        />
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | UserRole)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {Object.entries(roleLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-card border border-surface-muted">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs font-semibold uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-muted">
            {filtered.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-text-primary">{user.displayName}</p>
                  {!isSupabaseConfigured && <p className="text-xs text-text-muted">{user.email ?? 'Guest — no email'}</p>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{roleLabels[user.role]}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      user.status === 'active' ? 'success' : user.status === 'restricted' ? 'warning' : 'error'
                    }
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {new Date(user.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" disabled={!canManage} onClick={() => openManage(user)}>
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage {target?.displayName}</DialogTitle>
            <DialogDescription>
              Role grants and account status changes are recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          {target && (
            <div className="flex flex-col gap-5">
              <div>
                <Label>Roles</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {target.roles.length === 0 && (
                    <span className="text-sm text-text-muted">No roles granted — guest-level access.</span>
                  )}
                  {target.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {roleLabels[role]}
                      <button
                        type="button"
                        onClick={() => void revokeRole(role)}
                        className="ml-1.5 text-text-muted hover:text-error-700"
                        aria-label={`Revoke ${roleLabels[role]}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Select value={roleToAdd} onValueChange={(v) => setRoleToAdd(v as Exclude<UserRole, 'guest'>)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {grantableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => void addRole()}>
                    Grant
                  </Button>
                </div>
              </div>

              <div>
                <Label>Account status</Label>
                <Select value={statusDraft} onValueChange={(v) => setStatusDraft(v as AccountStatus)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  className="mt-2"
                  placeholder="Optional note for the audit log…"
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Close
            </Button>
            <Button onClick={() => void changeStatus()}>Save Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
