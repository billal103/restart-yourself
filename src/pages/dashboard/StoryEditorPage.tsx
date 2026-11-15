import { zodResolver } from '@hookform/resolvers/zod'
import { Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { CategoryBadge } from '@/components/stories/CategoryBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { categories, getStoryById, tags as allTags } from '@/lib/mockData'
import { storySchema, type StoryFormValues } from '@/schemas/story'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'

export default function StoryEditorPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const mockExistingStory = storyId ? getStoryById(storyId) : undefined
  const [preview, setPreview] = useState(false)
  const [guestToken, setGuestToken] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: mockExistingStory?.title ?? '',
      content: mockExistingStory?.content ?? '',
      categoryId: mockExistingStory?.category.id ?? '',
      tags: mockExistingStory?.tags.map((t) => t.id) ?? [],
      contentWarning: mockExistingStory?.contentWarnings[0] ?? '',
      publishAnonymously: true,
      agreeToGuidelines: Boolean(mockExistingStory),
    },
  })

  useEffect(() => {
    if (!isSupabaseConfigured || !storyId) return
    void (async () => {
      const { storiesService } = await import('@/services/stories.service')
      const story = await storiesService.getById(storyId)
      if (story) {
        reset({
          title: story.title,
          content: story.content,
          categoryId: story.category.id,
          tags: story.tags.map((t) => t.id),
          contentWarning: story.contentWarnings[0] ?? '',
          publishAnonymously: true,
          agreeToGuidelines: true,
        })
      }
    })()
  }, [storyId, reset])

  const values = watch()
  const selectedCategory = categories.find((c) => c.id === values.categoryId)

  function toggleTag(tagId: string) {
    const current = values.tags ?? []
    setValue(
      'tags',
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    )
  }

  async function onSubmit(formValues: StoryFormValues, publish: boolean) {
    if (!isSupabaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      toast({
        title: publish ? 'Story submitted for review' : 'Draft saved',
        description: publish
          ? 'Your story will appear once it passes moderation review.'
          : formValues.title,
        variant: 'success',
      })
      navigate('/dashboard/stories')
      return
    }

    if (!user) return
    try {
      const { storiesService } = await import('@/services/stories.service')
      const input = {
        title: formValues.title,
        content: formValues.content,
        categoryId: formValues.categoryId,
        tagIds: formValues.tags,
        contentWarnings: formValues.contentWarning ? [formValues.contentWarning] : [],
        publishAnonymously: formValues.publishAnonymously,
        isGuestAuthored: user.isGuest,
        status: (publish ? 'pending' : 'draft') as 'draft' | 'pending',
      }

      if (storyId) {
        await storiesService.update(storyId, input)
      } else {
        const created = await storiesService.create(user.id, input)
        if (user.isGuest) {
          const token = await storiesService.issueGuestToken(created.id)
          setGuestToken(token)
          return
        }
      }

      toast({
        title: publish ? 'Story submitted for review' : 'Draft saved',
        description: publish ? 'Your story will appear once it passes moderation review.' : formValues.title,
        variant: 'success',
      })
      navigate('/dashboard/stories')
    } catch (error) {
      toast({
        title: 'Could not save story',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      })
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-text-primary">
        {storyId ? 'Edit Story' : 'Share Your Story'}
      </h1>
      <p className="mt-1 text-text-secondary">
        Your story is published anonymously by default. Take your time — you can always save a
        draft and come back later.
      </p>

      {preview ? (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-text-primary">{values.title || 'Untitled story'}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCategory && <CategoryBadge category={selectedCategory} />}
              {values.contentWarning && <Badge variant="warning">Content warning</Badge>}
            </div>
            <p className="mt-4 whitespace-pre-line text-text-primary">
              {values.content || 'Your story content will appear here.'}
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setPreview(false)}>
              Back to editing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form className="mt-6 flex flex-col gap-5" onSubmit={(e) => e.preventDefault()} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Give your story a title" {...register('title')} />
            {errors.title && <p className="text-xs text-error-500">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Category</Label>
            <Select value={values.categoryId} onValueChange={(v) => setValue('categoryId', v)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-xs text-error-500">{errors.categoryId.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tags (up to 5)</Label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const selected = values.tags?.includes(tag.id)
                return (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}>
                    <Badge variant={selected ? 'default' : 'secondary'} className="cursor-pointer">
                      #{tag.name}
                    </Badge>
                  </button>
                )
              })}
            </div>
            {errors.tags && <p className="text-xs text-error-500">{errors.tags.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">Your Story</Label>
            <Textarea
              id="content"
              rows={10}
              placeholder="Share what you're going through, at your own pace…"
              {...register('content')}
            />
            {errors.content && <p className="text-xs text-error-500">{errors.content.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contentWarning">Content warning (optional)</Label>
            <Input
              id="contentWarning"
              placeholder="e.g. Discussion of self-harm"
              {...register('contentWarning')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Publish anonymously</p>
              <p className="text-xs text-text-secondary">
                Your real identity is never attached to published stories.
              </p>
            </div>
            <Switch
              checked={values.publishAnonymously}
              onCheckedChange={(checked) => setValue('publishAnonymously', checked)}
            />
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="agreeToGuidelines"
              checked={values.agreeToGuidelines}
              onCheckedChange={(checked) => setValue('agreeToGuidelines', checked === true)}
            />
            <Label htmlFor="agreeToGuidelines" className="text-sm font-normal text-text-secondary">
              I agree to follow the Community Guidelines when sharing this story.
            </Label>
          </div>
          {errors.agreeToGuidelines && (
            <p className="text-xs text-error-500">{errors.agreeToGuidelines.message}</p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setPreview(true)}>
              Preview
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={handleSubmit((v) => onSubmit(v, false))}
            >
              Save Draft
            </Button>
            <Button type="button" disabled={isSubmitting} onClick={handleSubmit((v) => onSubmit(v, true))}>
              Publish
            </Button>
          </div>
        </form>
      )}

      <Dialog open={guestToken !== null} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your recovery code</DialogTitle>
            <DialogDescription>
              You published as a guest. If you lose access to this browser or session, this is the
              only way to manage this story again — we cannot recover it for you without it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
            <code className="flex-1 overflow-x-auto text-sm">{guestToken}</code>
            <Button
              variant="outline"
              size="icon"
              aria-label="Copy recovery code"
              onClick={() => {
                void navigator.clipboard.writeText(guestToken ?? '')
                toast({ title: 'Copied to clipboard', variant: 'success' })
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setGuestToken(null)
                navigate('/dashboard/stories')
              }}
            >
              I've saved it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
