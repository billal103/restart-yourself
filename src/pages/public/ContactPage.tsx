import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { contactSchema, type ContactFormValues } from '@/schemas/contact'

const topics = [
  { value: 'general', label: 'General question' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'privacy', label: 'Privacy / data request' },
  { value: 'moderation', label: 'Moderation appeal' },
  { value: 'partnership', label: 'Partnership / professional verification' },
]

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: 'general' },
  })

  async function onSubmit(_values: ContactFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-24 text-center sm:px-6">
        <CheckCircle2 className="size-10 text-success-500" />
        <h1 className="text-2xl font-bold text-text-primary">Message sent</h1>
        <p className="text-text-secondary">
          Thank you for reaching out. This is a frontend prototype, so no message was actually
          sent — real delivery will be wired up once the backend is connected in Milestone 2.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary">Contact Us</h1>
      <p className="mt-3 text-text-secondary">
        For safety emergencies, do not use this form — contact your local emergency services
        instead. For everything else, we read every message.
      </p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Your name (can be a display name)" {...register('name')} />
          {errors.name && <p className="text-xs text-error-500">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-error-500">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="topic">Topic</Label>
          <Select value={watch('topic')} onValueChange={(v) => setValue('topic', v as ContactFormValues['topic'])}>
            <SelectTrigger id="topic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.value} value={topic.value}>
                  {topic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" rows={5} placeholder="How can we help?" {...register('message')} />
          {errors.message && <p className="text-xs text-error-500">{errors.message.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? 'Sending…' : 'Send Message'}
        </Button>
      </form>
    </div>
  )
}
