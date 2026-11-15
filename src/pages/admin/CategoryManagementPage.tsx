import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { categories as mockCategories } from '@/lib/mockData'
import { isAdmin } from '@/lib/rbac'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { Category } from '@/types/domain'

interface CategoryDraft {
  id: string | null
  name: string
  slug: string
  description: string
  icon: string
}

const emptyDraft: CategoryDraft = { id: null, name: '', slug: '', description: '', icon: 'Heart' }

export default function CategoryManagementPage() {
  const currentUser = useAuthStore((state) => state.user)
  const canManage = isAdmin(currentUser)
  const [categories, setCategories] = useState<Category[]>(isSupabaseConfigured ? [] : mockCategories)
  const [draft, setDraft] = useState<CategoryDraft | null>(null)

  async function load() {
    if (!isSupabaseConfigured) return
    const { moderationService } = await import('@/services/moderation.service')
    setCategories(await moderationService.listCategoriesWithCounts())
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  function openCreate() {
    setDraft(emptyDraft)
  }

  function openEdit(category: Category) {
    setDraft({ id: category.id, name: category.name, slug: category.slug, description: category.description, icon: category.icon })
  }

  async function save() {
    if (!draft || !draft.name.trim() || !draft.slug.trim()) {
      toast({ title: 'Name and slug are required', variant: 'error' })
      return
    }
    const input = { name: draft.name.trim(), slug: draft.slug.trim(), description: draft.description || null, icon: draft.icon || null }
    if (isSupabaseConfigured) {
      try {
        const { moderationService } = await import('@/services/moderation.service')
        if (draft.id) await moderationService.updateCategory(draft.id, input)
        else await moderationService.createCategory(input)
        await load()
      } catch (error) {
        toast({ title: 'Could not save category', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
        return
      }
    } else if (draft.id) {
      setCategories((prev) => prev.map((c) => (c.id === draft.id ? { ...c, ...input, description: input.description ?? '', icon: input.icon ?? 'Heart' } : c)))
    } else {
      setCategories((prev) => [
        ...prev,
        { id: `category-${Date.now()}`, ...input, description: input.description ?? '', icon: input.icon ?? 'Heart', storyCount: 0 },
      ])
    }
    toast({ title: draft.id ? 'Category updated' : 'Category created', variant: 'success' })
    setDraft(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Category Management</h1>
        <Button size="sm" onClick={openCreate} disabled={!canManage}>
          <Plus className="size-4" /> New Category
        </Button>
      </div>
      {!canManage && (
        <p className="text-sm text-text-muted">
          You can view categories here, but creating and editing them is admin-only — enforced
          server-side by Row Level Security.
        </p>
      )}

      <div className="overflow-x-auto rounded-card border border-surface-muted">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs font-semibold uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Stories</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-muted">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-3 font-medium text-text-primary">{category.name}</td>
                <td className="px-4 py-3 text-text-muted">{category.slug}</td>
                <td className="px-4 py-3 text-text-secondary">{category.storyCount}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" disabled={!canManage} onClick={() => openEdit(category)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold text-text-primary">Tag Management</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage story tags from this same panel in a future iteration — merge duplicates, retire
            unused tags, and review tag usage across stories.
          </p>
        </CardContent>
      </Card>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>Categories are public and admin-managed, enforced server-side.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="category-name">Name</Label>
                <Input id="category-name" className="mt-1.5" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="category-slug">Slug</Label>
                <Input id="category-slug" className="mt-1.5" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="category-description">Description</Label>
                <Input
                  id="category-description"
                  className="mt-1.5"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category-icon">Icon name (Lucide)</Label>
                <Input id="category-icon" className="mt-1.5" value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={() => void save()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
