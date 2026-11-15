import { Lock, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { journalEntries as initialEntries } from '@/lib/mockData'
import { formatRelativeDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { JournalEntry } from '@/types/domain'
import { toast } from '@/stores/toastStore'

export default function PrivateJournalPage() {
  const user = useAuthStore((state) => state.user)
  const [entries, setEntries] = useState<JournalEntry[]>(isSupabaseConfigured ? [] : initialEntries)
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null)

  async function loadEntries() {
    if (!isSupabaseConfigured || !user) return
    const { recoveryService } = await import('@/services/recovery.service')
    const rows = await recoveryService.listJournalEntries(user.id)
    setEntries(
      rows.map((r) => ({ id: r.id, title: r.title, content: r.content, createdAt: r.created_at, updatedAt: r.updated_at })),
    )
    setLoaded(true)
  }

  useEffect(() => {
    void loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const filtered = entries.filter((entry) =>
    `${entry.title} ${entry.content}`.toLowerCase().includes(query.toLowerCase()),
  )

  function openNew() {
    setEditing(null)
    setDraftTitle('')
    setDraftContent('')
    setEditorOpen(true)
  }

  function openEdit(entry: JournalEntry) {
    setEditing(entry)
    setDraftTitle(entry.title)
    setDraftContent(entry.content)
    setEditorOpen(true)
  }

  async function saveEntry() {
    if (isSupabaseConfigured && user) {
      try {
        const { recoveryService } = await import('@/services/recovery.service')
        if (editing) {
          await recoveryService.updateJournalEntry(editing.id, draftTitle, draftContent)
        } else {
          await recoveryService.createJournalEntry(user.id, draftTitle, draftContent)
        }
        await loadEntries()
      } catch (error) {
        toast({
          title: 'Could not save entry',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    } else {
      const now = new Date().toISOString()
      if (editing) {
        setEntries((prev) =>
          prev.map((e) => (e.id === editing.id ? { ...e, title: draftTitle, content: draftContent, updatedAt: now } : e)),
        )
      } else {
        setEntries((prev) => [
          { id: crypto.randomUUID(), title: draftTitle, content: draftContent, createdAt: now, updatedAt: now },
          ...prev,
        ])
      }
    }
    setEditorOpen(false)
    toast({ title: 'Journal entry saved', variant: 'success' })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    if (isSupabaseConfigured) {
      try {
        const { recoveryService } = await import('@/services/recovery.service')
        await recoveryService.deleteJournalEntry(deleteTarget.id)
        await loadEntries()
      } catch (error) {
        toast({
          title: 'Could not delete entry',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Lock className="size-5 text-primary-500" /> Private Journal
          </h1>
          <p className="mt-1 text-text-secondary">Only you can see these entries.</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> New Entry
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your entries…"
          className="pl-9"
        />
      </div>

      {!loaded ? (
        <p className="text-sm text-text-muted">Loading your journal…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Lock} title="No entries yet" description="Write your first private journal entry." />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <Card key={entry.id} className="cursor-pointer" onClick={() => openEdit(entry)}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <h3 className="font-medium text-text-primary">{entry.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{entry.content}</p>
                  <p className="mt-2 text-xs text-text-muted">{formatRelativeDate(entry.updatedAt)}</p>
                </div>
                <button
                  type="button"
                  aria-label="Delete entry"
                  className="focus-ring shrink-0 rounded-full p-2 text-text-muted hover:bg-error-50 hover:text-error-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(entry)
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Entry' : 'New Journal Entry'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="journal-title">Title</Label>
              <Input id="journal-title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="journal-content">Entry</Label>
              <Textarea
                id="journal-content"
                rows={8}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!draftTitle.trim() || !draftContent.trim()} onClick={() => void saveEntry()}>
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete journal entry?"
        description="This cannot be undone. This entry will be permanently deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
